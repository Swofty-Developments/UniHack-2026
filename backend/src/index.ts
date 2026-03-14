import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as trpcExpress from '@trpc/server/adapters/express';
import { connectDB, prisma } from './config/database';
import { appRouter } from './trpc/appRouter';
import { createContext } from './trpc/context';
import { extractTextures } from './services/glbService';
import { analyzeImages, summarizeHazards } from './services/geminiService';
import {
  buildRectanglePolygon,
  clamp,
  getFillColor,
  resolveScanCenter,
} from './utils/territoryGeometry';
import {
  getPrimaryProfile,
  normalizeSelectedProfiles,
} from './utils/profileSelection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.zip';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.glb', '.gltf', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype === 'model/gltf-binary' || file.mimetype === 'application/zip' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── GLB Upload + Scan endpoint ──────────────────────────────────────────
app.post('/api/upload-scan', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const {
      name,
      buildingType,
      latitude,
      longitude,
      userId: rawUserId,
      displayName: rawDisplayName,
      selectedProfiles: rawSelectedProfiles,
      areaSqMeters: rawArea,
    } = req.body;

    if (!name || !buildingType) {
      res.status(400).json({ error: 'name and buildingType are required' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const areaSqMeters = rawArea ? clamp(parseFloat(rawArea), 8, 5000) : 25;

    // Build location
    const location =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { latitude: lat, longitude: lng }
        : null;

    const center = resolveScanCenter(location);

    // Read the uploaded file and extract textures
    const textures = await extractTextures(file.path);

    // Analyse extracted textures with Gemini
    const imageSources = textures.slice(0, 8).map((t) => ({
      base64: t.base64,
      mimeType: t.mimeType,
    }));

    const hazards = await analyzeImages(imageSources);
    const summary = summarizeHazards(hazards);

    // Parse selected profiles
    let parsedProfiles: string[] | undefined;
    if (rawSelectedProfiles) {
      try {
        parsedProfiles =
          typeof rawSelectedProfiles === 'string'
            ? JSON.parse(rawSelectedProfiles)
            : rawSelectedProfiles;
      } catch {
        parsedProfiles = undefined;
      }
    }

    const requestedDisplayName =
      (typeof rawDisplayName === 'string' && rawDisplayName.trim()) || 'Explorer';
    const requestedProfiles = normalizeSelectedProfiles(parsedProfiles, undefined);

    // Find or create user
    let user;
    if (rawUserId) {
      user = await prisma.user
        .findUnique({ where: { id: rawUserId } })
        .catch(() => null);
    }

    if (user) {
      if (parsedProfiles) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            selectedProfiles: requestedProfiles,
            selectedProfile: getPrimaryProfile(requestedProfiles),
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          displayName: requestedDisplayName,
          selectedProfile: getPrimaryProfile(requestedProfiles),
          selectedProfiles: requestedProfiles,
        },
      });
    }

    const userId = user.id;
    const displayName = user.displayName;
    const selectedProfiles = normalizeSelectedProfiles(
      user.selectedProfiles,
      user.selectedProfile
    );

    // Build territory polygon
    const side = Math.sqrt(areaSqMeters);
    const polygon = buildRectanglePolygon({
      center,
      widthMeters: side,
      depthMeters: side,
      headingDegrees: 0,
    });

    const modelUrl = `/uploads/${path.basename(file.path)}`;

    // Create territory
    const territory = await prisma.territory.create({
      data: {
        name: name.trim(),
        description: `LiDAR scan uploaded on ${new Date().toLocaleString()}.`,
        buildingType,
        claimedBy: { userId, displayName },
        scanDate: new Date(),
        areaSqMeters,
        polygon: { coordinates: polygon.coordinates },
        center,
        modelUrl,
        hazards: hazards as any,
        hazardSummary: summary as any,
        fillColor: getFillColor(buildingType as any),
        status: 'active',
      },
    });

    // Update user stats
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        totalAreaScanned: { increment: areaSqMeters },
        territoriesCount: { increment: 1 },
      },
    });

    const persistedProfiles = normalizeSelectedProfiles(
      user.selectedProfiles,
      user.selectedProfile
    );

    res.json({
      status: 'complete',
      territory,
      hazards,
      summary,
      scanner: {
        id: userId,
        displayName,
        selectedProfile: getPrimaryProfile(persistedProfiles),
        selectedProfiles: persistedProfiles,
      },
      measurement: {
        estimatedAreaSqMeters: areaSqMeters,
      },
    });
  } catch (error: any) {
    console.error('Upload scan failed:', error);
    res.status(500).json({ error: error.message || 'Upload scan failed' });
  }
});

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  })
);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`AccessAtlas backend running on port ${PORT}`);
  });
});

export default app;
