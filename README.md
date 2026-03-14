# AccessAtlas

Upload a 3D LiDAR scan (GLB/glTF from Polycam) of any indoor space → Claude Sonnet 4 detects accessibility hazards → users browse colour-coded hazard pins in a first-person 3D viewer and filter by their accessibility profiles. Scanned spaces appear as territories on a live Mapbox map with gamified leaderboards. Built for UNIHACK 2026.

## Project Structure

- `frontend/`: Expo (React Native 0.81.5) app with TypeScript
- `backend/`: Express 5 + tRPC + Prisma API with MongoDB
- `docker-compose.yml`: Docker setup for backend and MongoDB

## Quick Start

### 1. Backend

The fastest local setup is to run MongoDB locally and run the backend on your host machine.

1. Create `backend/.env` from `backend/.env.example`.
2. Set `MONGO_URI=mongodb://localhost:27017/accessatlas`.
3. Set your real `ANTHROPIC_API_KEY` (Claude Sonnet 4 vision API).
4. Install dependencies and seed the database:

```powershell
cd backend
npm install
npm run seed
```

5. Start the backend:

```powershell
cd backend
npm run dev
```

The API should be available at http://localhost:3001/health.

### 2. Frontend

Expo will read `frontend/.env` automatically. This repo now supports a device-specific API URL through `EXPO_PUBLIC_API_URL`.

```powershell
cd frontend
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to point at your backend (see examples below). Restart Expo after changing it.

## Running On Devices

### Android Emulator

Use this API URL in `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api
```

Then start Expo and launch Android:

```powershell
cd frontend
npm start
```

Press `a` in the Expo terminal, or run:

```powershell
cd frontend
npm run android
```

### Physical iPhone

Windows cannot run the iOS Simulator, so the supported iPhone flow here is a physical device with Expo Go.

1. Make sure the iPhone and this PC are on the same Wi-Fi network.
2. Set `frontend/.env` to your machine's LAN IP (e.g. `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:3001/api`).
3. Install Expo Go on the iPhone.
4. Start the backend and frontend.
5. Scan the QR code from the Expo terminal.

## Docker Notes

`docker-compose.yml` includes both `mongodb` and `backend`. If port `27017` is already in use because MongoDB is running locally, either stop the local MongoDB service before using Docker Compose, or keep MongoDB local and run the backend on the host as described above.

## Troubleshooting

- If the iPhone can load Expo Go but the app cannot reach the API, confirm port `3001` is allowed through Windows Firewall.
- If you switch between emulator, web, and phone testing, update `frontend/.env` and restart Expo each time.
- If Docker Compose warns that port `27017` is in use, use the host-based backend flow instead of the Docker MongoDB container.
- iOS Simulator requires macOS, so on this Windows setup use either Android Emulator or a physical iPhone.
