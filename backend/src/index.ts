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
import { extractTextures, convertGLBtoGLTF } from './services/glbService';
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

// ── 3D Viewer HTML page (served to WebView) ────────────────────────────
app.get('/api/viewer/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const glbUrl = `/uploads/${filename}`;
  const hazardsParam = req.query.hazards ? decodeURIComponent(req.query.hazards as string) : '[]';
  const panelHeight = parseInt(req.query.panelHeight as string, 10) || 200;

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0}
  body{background:#0f172a;overflow:hidden;touch-action:none}
  canvas{display:block;width:100vw;height:100vh}
  #loading{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8B8BA7;font-family:system-ui;font-size:14px;background:#0f172a;z-index:10}
  #loading .spin{width:32px;height:32px;border:3px solid #222238;border-top-color:#00D4AA;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:12px}
  @keyframes spin{to{transform:rotate(360deg)}}
  #err{color:#FF4757;margin-top:8px;font-size:12px;display:none}
  #info{position:fixed;bottom:${panelHeight + 110}px;left:12px;right:80px;background:rgba(22,22,37,0.95);border-radius:12px;padding:12px 16px;color:#EEEDF5;font-family:system-ui;font-size:13px;display:none;z-index:20;border:1px solid rgba(255,255,255,0.06)}
  #dpad{position:fixed;bottom:${panelHeight + 12}px;right:16px;z-index:15;display:grid;grid-template-columns:44px 44px 44px;grid-template-rows:44px 44px;gap:4px;opacity:0.75}
  #dpad button{background:rgba(0,212,170,0.2);border:1px solid rgba(0,212,170,0.3);border-radius:10px;color:#00D4AA;font-size:18px;font-weight:800;font-family:system-ui;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;cursor:pointer}
  #dpad button:active{background:rgba(0,212,170,0.5)}
  #dpad .empty{background:none;border:none}
  #info .type{font-weight:700;font-size:14px;text-transform:capitalize}
  #info .sev{font-size:11px;font-weight:800;text-transform:uppercase;margin-left:8px}
  #info .desc{color:#8B8BA7;margin-top:4px;font-size:12px}
</style>
</head>
<body>
<div id="loading"><div class="spin"></div>Loading 3D scan...<div id="err"></div></div>
<div id="info"></div>
<div id="dpad">
  <div class="empty"></div><button id="btnW">&uarr;</button><div class="empty"></div>
  <button id="btnA">&larr;</button><button id="btnS">&darr;</button><button id="btnD">&rarr;</button>
</div>
<script type="importmap">
{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const errEl = document.getElementById('err');
try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.05, 100);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  document.body.appendChild(renderer.domElement);

  // First-person controls state
  let yaw = 0, pitch = 0;
  const moveSpeed = 2.5;
  const lookSpeed = 0.003;
  const keys = { w:false, a:false, s:false, d:false };
  let eyeHeight = 1.6;

  // WASD keyboard
  addEventListener('keydown', e => { const k = e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = true; });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = false; });

  // On-screen D-pad buttons
  function bindBtn(id, key) {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; }, {passive:false});
    el.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; }, {passive:false});
    el.addEventListener('mousedown', () => keys[key] = true);
    el.addEventListener('mouseup', () => keys[key] = false);
    el.addEventListener('mouseleave', () => keys[key] = false);
  }
  bindBtn('btnW','w'); bindBtn('btnA','a'); bindBtn('btnS','s'); bindBtn('btnD','d');

  // Touch drag to look around
  let lastTouch = null;
  renderer.domElement.addEventListener('touchstart', e => {
    if(e.touches.length === 1) lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, {passive:true});
  renderer.domElement.addEventListener('touchmove', e => {
    if(e.touches.length === 1 && lastTouch) {
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      yaw -= dx * lookSpeed;
      pitch = Math.max(-1.2, Math.min(1.2, pitch - dy * lookSpeed));
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, {passive:true});
  renderer.domElement.addEventListener('touchend', () => lastTouch = null, {passive:true});

  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const pt = new THREE.PointLight(0xffffff, 0.8, 20);
  pt.position.set(0,3,0);
  scene.add(pt);
  scene.add(new THREE.DirectionalLight(0xffffff, 0.8).translateZ(3).translateY(5));

  const pins = ${hazardsParam};
  const pinMeshes = [];
  const pinGroups = []; // stored to place after model loads

  function createPin(p, i, worldX, worldZ, groundY) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.5,6), new THREE.MeshStandardMaterial({color:0x666666}));
    pole.position.y = .25;
    g.add(pole);
    const mat = new THREE.MeshStandardMaterial({color:p.color,emissive:p.color,emissiveIntensity:.4});
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(.12,16,16), mat);
    sphere.position.y = .55;
    sphere.userData = {idx:i};
    g.add(sphere);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.1,.18,24), new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.4,side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2;
    ring.position.y = .02;
    g.add(ring);
    g.position.set(worldX, groundY, worldZ);
    scene.add(g);
    pinMeshes.push(sphere);
  }

  const loader = new GLTFLoader();
  loader.load('${glbUrl}', gltf => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m);
    const sz = box.getSize(new THREE.Vector3());
    const maxH = Math.max(sz.x, sz.z);
    if(maxH>0) m.scale.setScalar(10/maxH);
    const b2 = new THREE.Box3().setFromObject(m);
    const c = b2.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -b2.min.y, -c.z);
    m.traverse(ch => { if(ch.isMesh && ch.material) ch.material.side = THREE.FrontSide; });
    scene.add(m);
    const b3 = new THREE.Box3().setFromObject(m);
    const cn = b3.getCenter(new THREE.Vector3());
    const modelHeight = b3.max.y - b3.min.y;
    const h = Math.min(modelHeight * 0.4, 1.6);
    eyeHeight = h;
    camera.position.set(cn.x, h, cn.z);
    yaw = 0; pitch = 0;

    // Place hazard pins using normalized coords mapped to model bounds
    // Then raycast down to find the actual surface
    const rc = new THREE.Raycaster();
    const modelMeshes = [];
    m.traverse(ch => { if(ch.isMesh) modelMeshes.push(ch); });

    // Place pins - coordinates are world coords from panoramic analysis
    pins.forEach((p, i) => {
      // Use coordinates directly and clamp to model bounds
      let worldX = Math.max(b3.min.x + 0.5, Math.min(b3.max.x - 0.5, p.x));
      let worldZ = Math.max(b3.min.z + 0.5, Math.min(b3.max.z - 0.5, p.z));

      // Raycast downward from above to find the actual surface
      rc.set(new THREE.Vector3(worldX, b3.max.y + 1, worldZ), new THREE.Vector3(0, -1, 0));
      const hits = rc.intersectObjects(modelMeshes);
      const groundY = hits.length > 0 ? hits[0].point.y : b3.min.y;

      createPin(p, i, worldX, worldZ, groundY);
    });

    // Debug: log pin placement info to RN
    if(window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'debug',
        bounds: {minX:b3.min.x.toFixed(1),maxX:b3.max.x.toFixed(1),minZ:b3.min.z.toFixed(1),maxZ:b3.max.z.toFixed(1)},
        pinCoords: pins.map(p => ({x:p.x,z:p.z})),
        pinCount: pins.length,
      }));
    }

    document.getElementById('loading').style.display='none';
  }, undefined, e => {
    errEl.textContent = 'Error: ' + (e.message||e);
    errEl.style.display = 'block';
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', e => {
    mouse.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinMeshes);
    const info = document.getElementById('info');
    if(hits.length>0){
      const p = pins[hits[0].object.userData.idx];
      info.innerHTML='<span class="type">'+p.type.replace(/_/g,' ')+'</span><span class="sev" style="color:'+p.color+'">'+p.severity+'</span><div class="desc">'+p.description+'</div>';
      info.style.display='block';
    } else info.style.display='none';
  });

  const clock = new THREE.Clock();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  (function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // First-person camera rotation
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement relative to camera facing direction
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

    const speed = moveSpeed * dt;
    if(keys.w) camera.position.addScaledVector(forward, speed);
    if(keys.s) camera.position.addScaledVector(forward, -speed);
    if(keys.a) camera.position.addScaledVector(right, -speed);
    if(keys.d) camera.position.addScaledVector(right, speed);
    camera.position.y = eyeHeight; // Lock to eye height

    // Animate pins
    pinMeshes.forEach((s,i) => { s.position.y = .55 + Math.sin(t*2+i)*.03; });
    renderer.render(scene, camera);
  })();

  addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
} catch(e) {
  errEl.textContent = 'Error: ' + e.message;
  errEl.style.display = 'block';
}
</script>
</body>
</html>`);
});

// ── Panoramic analysis endpoint ─────────────────────────────────────────
app.post('/api/analyze-panoramic', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { screenshots, selectedProfiles: profiles } = req.body;
    // screenshots: [{ base64, cameraPosition: {x,y,z}, cameraDirection: {x,y,z}, yaw, label }]
    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      res.status(400).json({ error: 'No screenshots provided' });
      return;
    }

    console.log(`[Panoramic] Analyzing ${screenshots.length} views...`);

    const imageParts = screenshots.map((s: any, i: number) => ({
      base64: s.base64.replace(/^data:image\/\w+;base64,/, ''),
      mimeType: 'image/jpeg',
    }));

    const viewDescriptions = screenshots.map((s: any) =>
      `View "${s.label}": Camera at (${s.cameraPosition.x.toFixed(2)}, ${s.cameraPosition.y.toFixed(2)}, ${s.cameraPosition.z.toFixed(2)}) looking toward (${s.cameraDirection.x.toFixed(2)}, ${s.cameraDirection.y.toFixed(2)}, ${s.cameraDirection.z.toFixed(2)}), yaw=${s.yaw.toFixed(2)}rad`
    ).join('\n');

    const prompt = `You are analyzing panoramic views rendered from INSIDE a 3D LiDAR scan of an indoor space.
Each image is taken from the same position but looking in a different direction.
The camera metadata tells you exactly where the camera is and which direction each view faces.

${viewDescriptions}

Identify ALL accessibility hazards visible in these views. For each hazard, estimate its 3D position
relative to the camera. Use the camera direction to calculate world coordinates.

For position estimation:
- Objects in the CENTER of an image are along the camera's forward direction
- Objects on the LEFT are roughly 45 degrees left of forward
- Objects on the RIGHT are roughly 45 degrees right of forward
- Estimate distance: nearby objects (1-2m), medium (3-5m), far (5-10m)

Return a JSON array where each hazard has:
- type: one of ["stairs", "narrow_doorway", "poor_lighting", "steep_gradient", "high_threshold", "no_ramp", "heavy_door", "no_elevator", "slippery_surface", "missing_handrail", "no_tactile", "audio_only_alert", "confusing_wayfinding", "trip_hazard", "no_seating", "unmarked_glass"]
- severity: "high", "medium", or "low"
- description: brief description
- affectsProfiles: array from ["wheelchair", "low_vision", "limited_mobility", "hearing_impaired", "neurodivergent", "elderly", "parents_with_prams"]
- confidence: 0-1
- viewIndex: which screenshot image (0-indexed) this hazard is most visible in
- estimatedDistance: distance from camera in meters (1-10)
- horizontalAngle: angle in degrees from center of that view (-45 to 45, negative=left, positive=right)

Return ONLY valid JSON array.`;

    const { analyzeImages } = await import('./services/geminiService');

    // Use Claude via the existing service
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

    const content: any[] = imageParts.map((img: any) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));
    content.push({ type: 'text', text: prompt });

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    const responseText = result.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    console.log(`[Panoramic] Claude detected ${parsed.length} hazards`);

    // Convert view-relative positions to world 3D coordinates
    const hazards = parsed.map((h: any, index: number) => {
      const viewIdx = h.viewIndex ?? 0;
      const shot = screenshots[viewIdx] || screenshots[0];
      const dist = h.estimatedDistance ?? 3;
      const hAngle = (h.horizontalAngle ?? 0) * Math.PI / 180;
      const viewYaw = shot.yaw ?? 0;

      // Calculate world position from camera + direction + offset
      const totalAngle = viewYaw + hAngle;
      const worldX = shot.cameraPosition.x + Math.sin(totalAngle) * dist;
      const worldZ = shot.cameraPosition.z + Math.cos(totalAngle) * dist;

      return {
        type: h.type,
        severity: h.severity,
        description: h.description,
        affectsProfiles: h.affectsProfiles,
        position3D: { x: worldX, y: 0, z: worldZ },
        position2D: { latitude: 0, longitude: 0 },
        confidence: h.confidence,
        detectedBy: 'ai',
        createdAt: new Date().toISOString(),
      };
    });

    res.json({ hazards });
  } catch (error: any) {
    console.error('Panoramic analysis failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Update territory hazards after panoramic analysis ────────────────────
app.post('/api/update-territory-hazards', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { territoryId, hazards } = req.body;
    if (!territoryId || !hazards) {
      res.status(400).json({ error: 'territoryId and hazards required' });
      return;
    }

    const summary = {
      total: hazards.length,
      bySeverity: {
        high: hazards.filter((h: any) => h.severity === 'high').length,
        medium: hazards.filter((h: any) => h.severity === 'medium').length,
        low: hazards.filter((h: any) => h.severity === 'low').length,
      },
    };

    await prisma.territory.update({
      where: { id: territoryId },
      data: {
        hazards: hazards as any,
        hazardSummary: summary as any,
      },
    });

    console.log(`[Territory] Updated ${territoryId} with ${hazards.length} panoramic hazards`);
    res.json({ ok: true, summary });
  } catch (error: any) {
    console.error('Update territory hazards failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Panoramic capture page (loads model, takes screenshots, posts back) ──
app.get('/api/capture/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) { res.status(404).send('Not found'); return; }
  const glbUrl = `/uploads/${filename}`;

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0}body{background:#0f172a}canvas{display:none}
#status{color:#8B8BA7;font-family:system-ui;font-size:14px;padding:20px;text-align:center}</style>
</head><body>
<div id="status">Preparing panoramic scan...</div>
<script type="importmap">
{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const status = document.getElementById('status');
const W = 512, H = 512;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(90, 1, 0.05, 100);
const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 2.0));
scene.add(new THREE.DirectionalLight(0xffffff, 1.0));
const pt = new THREE.PointLight(0xffffff, 1.0, 20);
pt.position.set(0,3,0); scene.add(pt);

status.textContent = 'Loading 3D model...';
const loader = new GLTFLoader();
loader.load('${glbUrl}', async gltf => {
  const m = gltf.scene;
  const box = new THREE.Box3().setFromObject(m);
  const sz = box.getSize(new THREE.Vector3());
  const maxH = Math.max(sz.x, sz.z);
  if(maxH>0) m.scale.setScalar(10/maxH);
  const b2 = new THREE.Box3().setFromObject(m);
  const c = b2.getCenter(new THREE.Vector3());
  m.position.set(-c.x, -b2.min.y, -c.z);
  scene.add(m);

  const b3 = new THREE.Box3().setFromObject(m);
  const cn = b3.getCenter(new THREE.Vector3());
  const eyeH = Math.min((b3.max.y-b3.min.y)*0.4, 1.6);
  camera.position.set(cn.x, eyeH, cn.z);

  // Take 8 panoramic screenshots (every 45 degrees)
  const directions = ['N','NE','E','SE','S','SW','W','NW'];
  const shots = [];
  for(let i=0; i<8; i++){
    const yaw = i * Math.PI/4;
    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    camera.lookAt(cn.x+dir.x*5, eyeH*0.9, cn.z+dir.z*5);
    renderer.render(scene, camera);
    const base64 = renderer.domElement.toDataURL('image/jpeg', 0.85);
    shots.push({
      base64,
      cameraPosition: {x:cn.x, y:eyeH, z:cn.z},
      cameraDirection: {x:dir.x, y:0, z:dir.z},
      yaw,
      label: directions[i],
    });
    status.textContent = 'Capturing view ' + (i+1) + '/8 (' + directions[i] + ')...';
    await new Promise(r => setTimeout(r, 50)); // let UI update
  }

  status.textContent = 'Sending to AI for analysis...';
  // Post screenshots back to React Native
  if(window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'panoramic', shots}));
  } else {
    status.textContent = 'Captured ' + shots.length + ' views (no RN bridge)';
  }
}, undefined, e => {
  status.textContent = 'Failed: ' + (e.message||e);
  if(window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message: e.message||'Load failed'}));
  }
});
</script></body></html>`);
});

// ── GLB → glTF conversion endpoint (splits textures for React Native) ───
app.get('/api/model/:filename', async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const result = convertGLBtoGLTF(filePath, `/api/model-texture/${req.params.filename}`);
    res.json(result);
  } catch (error: any) {
    console.error('Model conversion failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve individual textures extracted from a GLB
app.get('/api/model-texture/:filename/:index', async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const index = parseInt(req.params.index, 10);
    const buffer = fs.readFileSync(filePath);
    const textures = await extractTextures(filePath);

    if (index < 0 || index >= textures.length) {
      res.status(404).json({ error: 'Texture index out of range' });
      return;
    }

    const tex = textures[index];
    const imageBuffer = Buffer.from(tex.base64, 'base64');
    res.setHeader('Content-Type', tex.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Texture serving failed:', error);
    res.status(500).json({ error: error.message });
  }
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
