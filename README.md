# AccessAtlas

AccessAtlas is a React Native + Express prototype for mapping accessible indoor spaces, viewing hazard-tagged 3D scans, and demoing AI-assisted accessibility analysis for UNIHACK 2026.

## Project Structure

- `frontend/`: Expo React Native app
- `backend/`: Express + TypeScript API with MongoDB
- `docker-compose.yml`: Docker setup for backend and MongoDB

## Quick Start

### 1. Backend

The fastest local setup is to run MongoDB locally and run the backend on your host machine.

1. Create `backend/.env` from `backend/.env.example`.
2. Set `MONGO_URI=mongodb://localhost:27017/accessatlas`.
3. Set your real `GEMINI_API_KEY`.
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

The checked-in example is `frontend/.env.example`. Your local ignored `frontend/.env` is currently set to:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.103:3001/api
```

After changing `frontend/.env`, restart Expo so the new API URL is picked up.

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
2. Keep `frontend/.env` pointed at your LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.103:3001/api
```

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
