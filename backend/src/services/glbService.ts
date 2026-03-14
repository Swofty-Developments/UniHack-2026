/**
 * Texture extraction from 3D scan exports.
 *
 * Supports:
 *   - ZIP archives containing glTF + texture images (Polycam export)
 *   - Standalone glTF JSON files with base64-embedded images
 *   - GLB binary files with embedded textures (legacy)
 */

import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_TYPE_JSON = 0x4e4f534a;
const CHUNK_TYPE_BIN = 0x004e4942;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export interface ExtractedTexture {
  base64: string;
  mimeType: string;
}

/**
 * Top-level extraction: detects format and delegates.
 */
export async function extractTextures(
  filePath: string
): Promise<ExtractedTexture[]> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  // ZIP archive (Polycam glTF export)
  if (ext === '.zip' || isZipBuffer(buffer)) {
    return extractTexturesFromZip(buffer);
  }

  // GLB binary
  if (ext === '.glb' || isGLBBuffer(buffer)) {
    return extractTexturesFromGLB(buffer);
  }

  // Standalone glTF JSON
  if (ext === '.gltf') {
    return extractTexturesFromGLTFJson(buffer, path.dirname(filePath));
  }

  // Try GLB as fallback
  return extractTexturesFromGLB(buffer);
}

// ── ZIP (Polycam glTF export) ───────────────────────────────────────────

function extractTexturesFromZip(buffer: Buffer): ExtractedTexture[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const textures: ExtractedTexture[] = [];

  // First pass: grab all image files directly from the zip
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryExt = path.extname(entry.entryName).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(entryExt)) continue;

    const imageBytes = entry.getData();
    if (imageBytes.length === 0) continue;

    const mimeType = detectMimeType(imageBytes) ?? extensionToMime(entryExt);
    textures.push({
      base64: imageBytes.toString('base64'),
      mimeType,
    });
  }

  // If no loose images found, check for embedded glTF with base64 data URIs
  if (textures.length === 0) {
    const gltfEntry = entries.find(
      (e) => path.extname(e.entryName).toLowerCase() === '.gltf'
    );
    if (gltfEntry) {
      const gltfJson = JSON.parse(gltfEntry.getData().toString('utf-8'));
      textures.push(...extractBase64ImagesFromGLTF(gltfJson));
    }
  }

  return textures;
}

// ── Standalone glTF JSON ────────────────────────────────────────────────

function extractTexturesFromGLTFJson(
  buffer: Buffer,
  baseDir: string
): ExtractedTexture[] {
  const gltf = JSON.parse(buffer.toString('utf-8'));
  const textures: ExtractedTexture[] = [];

  // Try base64 data URIs first
  textures.push(...extractBase64ImagesFromGLTF(gltf));

  // Then try external file references
  if (textures.length === 0 && gltf.images) {
    for (const image of gltf.images) {
      if (!image.uri || image.uri.startsWith('data:')) continue;

      const imagePath = path.resolve(baseDir, image.uri);
      if (!fs.existsSync(imagePath)) continue;

      const imageBytes = fs.readFileSync(imagePath);
      const mimeType =
        image.mimeType ??
        detectMimeType(imageBytes) ??
        extensionToMime(path.extname(image.uri).toLowerCase());

      textures.push({
        base64: imageBytes.toString('base64'),
        mimeType,
      });
    }
  }

  return textures;
}

function extractBase64ImagesFromGLTF(gltf: any): ExtractedTexture[] {
  const textures: ExtractedTexture[] = [];
  if (!gltf.images) return textures;

  for (const image of gltf.images) {
    if (!image.uri || !image.uri.startsWith('data:')) continue;

    // data:image/png;base64,iVBOR...
    const match = image.uri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) continue;

    textures.push({
      mimeType: match[1],
      base64: match[2],
    });
  }

  return textures;
}

// ── GLB binary ──────────────────────────────────────────────────────────

export async function extractTexturesFromGLB(
  glbBuffer: Buffer
): Promise<ExtractedTexture[]> {
  if (glbBuffer.length < 12) {
    throw new Error('GLB buffer too small to contain a valid header');
  }

  const magic = glbBuffer.readUInt32LE(0);
  if (magic !== GLB_MAGIC) {
    throw new Error(
      `Invalid GLB magic: expected 0x${GLB_MAGIC.toString(16)}, got 0x${magic.toString(16)}`
    );
  }

  let jsonChunkData: Buffer | null = null;
  let binChunkData: Buffer | null = null;
  let offset = 12;

  while (offset < glbBuffer.length) {
    if (offset + 8 > glbBuffer.length) break;

    const chunkLength = glbBuffer.readUInt32LE(offset);
    const chunkType = glbBuffer.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;

    if (chunkDataStart + chunkLength > glbBuffer.length) break;

    const chunkData = glbBuffer.subarray(chunkDataStart, chunkDataStart + chunkLength);

    if (chunkType === CHUNK_TYPE_JSON) {
      jsonChunkData = chunkData;
    } else if (chunkType === CHUNK_TYPE_BIN) {
      binChunkData = chunkData;
    }

    offset = chunkDataStart + chunkLength;
  }

  if (!jsonChunkData) {
    throw new Error('GLB file does not contain a JSON chunk');
  }

  const gltf = JSON.parse(jsonChunkData.toString('utf-8'));

  if (!gltf.images || gltf.images.length === 0) {
    console.warn('GLB contains no embedded images');
    return [];
  }

  if (!gltf.bufferViews) {
    console.warn('GLB contains no bufferViews');
    return [];
  }

  const textures: ExtractedTexture[] = [];

  for (const image of gltf.images) {
    if (image.bufferView === undefined || image.bufferView === null) continue;

    const bufferView = gltf.bufferViews[image.bufferView];
    if (!bufferView || !binChunkData) continue;

    const byteOffset = bufferView.byteOffset ?? 0;
    const byteLength = bufferView.byteLength;

    if (byteOffset + byteLength > binChunkData.length) continue;

    const imageBytes = binChunkData.subarray(byteOffset, byteOffset + byteLength);
    const mimeType = image.mimeType || detectMimeType(imageBytes) || 'image/png';

    textures.push({
      base64: imageBytes.toString('base64'),
      mimeType,
    });
  }

  return textures;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function isGLBBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.readUInt32LE(0) === GLB_MAGIC;
}

function extensionToMime(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

function detectMimeType(bytes: Buffer): string | null {
  if (bytes.length < 4) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}
