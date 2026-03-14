# AccessAtlas

**AI-powered accessibility intelligence for real-world spaces**

Scan any space with your phone's camera → AI detects accessibility hazards → users get personalised 3D routes based on their needs. All mapped on a live territory system with gamification.

---

## How It Works

1. Open the app, name the space, pick building type
2. Multi-angle camera sweep with live motion telemetry (gyroscope + accelerometer estimate depth)
3. Frames sent to backend → Gemini Vision analyses images for hazards (structured JSON)
4. Territory appears on the global Mapbox map with 3D polygon extrusions
5. Tap a territory → see colour-coded hazard pins in the 3D viewer
6. Select your accessibility profiles (stack multiple), get a personalised safe route

---

## Accessibility Profiles

| Profile | AI Flags |
|---------|----------|
| Wheelchair Users | Stairs w/o ramps, narrow doorways, steep gradients, high thresholds, inaccessible surfaces |
| Low Vision | Poor lighting, low-contrast edges, unmarked glass, missing tactile indicators |
| Limited Mobility | Long distances w/o rest points, no seating, heavy doors, missing elevators |
| Hearing Impaired | Audio-only alerts, no visual signage, intercom-only entry |
| Neurodivergent | Overwhelming environments, no quiet spaces, confusing wayfinding, flickering lights |
| Elderly / Aging | Trip hazards, missing handrails, poor signage, slippery surfaces |
| Parents w/ Prams | Same physical barriers as wheelchair; stairs, narrow passages, heavy doors |

Users can activate **multiple profiles simultaneously** — hazard filtering and route generation reflect the union of all active needs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Expo (React Native 0.83) + TypeScript |
| **Maps** | @rnmapbox/maps — native Mapbox SDK with 3D territory extrusions |
| **3D Viewer** | expo-gl + expo-three (Three.js) — hazard pins, safe-route tubes, demo rooms |
| **Camera** | expo-camera + expo-sensors (gyroscope/accelerometer for depth estimation) |
| **State** | Zustand (persisted to AsyncStorage) + TanStack React Query |
| **Navigation** | React Navigation (native-stack + bottom-tabs + floating tab bar) |
| **Backend** | Express 5 + tRPC (type-safe RPC) |
| **Database** | MongoDB via Prisma ORM |
| **AI** | Google Gemini Vision API — multimodal image analysis → structured hazard JSON |
| **Auth** | JWT (jsonwebtoken) |
| **Dev Tooling** | Bun (backend runtime), tmux-based TUI dev runner, Docker (local MongoDB) |

---

## App Structure

### Tabs
- **Map** — Live Mapbox map with 3D extruded territory polygons, user location tracking, territory selection sheet
- **Discover** — Browse and explore scanned spaces
- **Scan** — 4-step capture flow: setup → camera (with motion telemetry overlay) → AI analysis → results
- **Leaderboard** — Community rankings by total area scanned, top-3 podium, pull-to-refresh
- **Profile** — Identity card, active accessibility modes summary, navigation to settings/modes/onboarding

### Stack Screens
- **Territory Detail** — Hero card, metrics grid, 3D viewer CTA, profile selector, filtered hazard list
- **Territory Hazards** — Full hazard breakdown for a territory
- **Wayfinding** — 3D safe-route viewer with expo-gl (Three.js native rendering)
- **Settings** — App configuration, name editing, privacy
- **Accessibility Modes** — Full profile management with toggle cards, haptic feedback, animated transitions
- **Onboarding** — Scanner identity creation (modal)

### Architecture
- Per-screen error boundaries (crash in one tab doesn't nuke the app)
- tRPC end-to-end type safety (shared types between frontend and backend)
- GeoJSON conversion utilities for Mapbox polygon/marker rendering
- Custom location tracking hook with heading support

---

## Backend

### tRPC Routers
- `auth` — register/login, JWT generation
- `territory` — getAll, getById, create, update
- `hazard` — getByTerritory, getByProfile filtering
- `scan` — complete scan pipeline (capture → Gemini analysis → territory creation → user stats update)
- `leaderboard` — ranked by totalAreaScanned
- `user` — createUser, getUser, updateProfile (sync selected accessibility modes)

### AI Pipeline (Gemini Vision)
- Receives captured camera frames (base64 JPEG, quality 0.35)
- Prompt instructs Gemini to detect 16 hazard types across 7 accessibility profiles
- Returns structured JSON: hazard type, severity (high/medium/low), description, affected profiles, confidence score, 3D position estimate
- Fallback hazards generated if API fails

### Data Model (Prisma + MongoDB)
- **User** — displayName, email, selectedProfiles[], totalAreaScanned, territoriesCount
- **Territory** — name, buildingType, polygon (GeoJSON), center, hazards[], hazardSummary, claimedBy, fillColor, status, modelUrl

---

## Running the Project

```bash
# From project root — starts MongoDB container + backend + frontend in a tmux TUI
./dev.sh

# Keybinds (no prefix needed):
# 1 = backend logs
# 2 = frontend logs
# 3 = mongo logs
# 5 = restart backend
# 0 = quit
```

Or manually:
```bash
# Backend
cd backend && bun --watch src/index.ts

# Frontend
cd frontend && npx expo start
```

Requires: Docker (for local MongoDB), Bun, Node.js, Expo CLI

---

## Team & Tasks

| Who | Role | Tasks | Priority |
|-----|------|-------|----------|
| Swofty | Lead Dev | Camera scan + depth estimation, AI pipeline (Gemini), tRPC backend, Mapbox integration, route generation | P0 |
| PenguinDevs | Frontend Dev | 3D viewer (expo-three), territory detail UI, hazard pins, profile selector, scan flow UI | P0 |
| bok | Dev + Flex | Support dev, QA, research, whatever needs doing | P1 |
| Cherry | Lead Design | Logo, visual identity, branding, UI polish, pitch deck design | P0 |
| EmertyLover | Media | UI polish support, demo video, DevPost screenshots + writeup | P1 |

---

## Pitch Structure

**Hook**: "Imagine arriving at a building in a wheelchair with no idea if you can get through the front door."

**Problem**: 4.4M Australians with disabilities, no way to preview indoor accessibility before arriving.

**Solution**: AccessAtlas — scan any space, AI detects hazards, everyone gets personalised safe routes.

**Live demo**: Scan the venue, show territory appear on map, toggle accessibility profiles, watch the route change in 3D.

**What's next**: Community scan database, council partnerships, gamified scanning incentives.

---

## UNIHACK Scorecard

| Theme | Status | How |
|-------|--------|-----|
| AI/ML Core | Done | Gemini Vision — impossible without AI |
| Hardware | Done | Phone camera + motion sensors for depth estimation |
| Accessibility | Done | Entire project IS accessibility. 7 stackable profiles. |
| Relatable Problem | Done | Everyone's been lost in an unfamiliar building |
| Polished UI | Done | Native Mapbox 3D map, Three.js viewer, dark theme, haptic feedback, animated transitions |
| Social Impact | Done | Disability inclusion, public data, community scanning |
| Live Demo | Done | Scan the venue, show results live, interactive profiles |
| What's Next | Done | Community database, gamification, council partnerships |

---

## Future Plans (DevPost)

Partner with disability-focused organisations to scale the scan database:

- **People with Disability Australia** — national community to prioritise which locations to scan first and validate detected hazards
- **Physical Disability Australia** — verify wheelchair-related hazards (stairs without ramps, narrow doorways, inaccessible surfaces)
- **Disability Advocacy Network Australia** — dozens of local advocacy groups to scale scanning initiatives nationally
- **Centre for Accessibility Australia** — accessibility auditing expertise to refine hazard detection models
- **Multicultural Disability Advocacy Australia** — ensure dataset covers diverse environments and accessibility needs

---

## DevPost Writeup

### Inspiration

4.4 million Australians live with a disability. Every day, they arrive at buildings with no idea whether they can physically navigate them — is there a ramp? Are the doors wide enough? Is there an elevator? This information simply doesn't exist for most indoor spaces. We built AccessAtlas to change that.

### What it does

AccessAtlas lets anyone scan a real-world space using their phone's camera. The app uses motion sensors to estimate depth and spatial dimensions, then sends captured frames to Google's Gemini Vision API, which detects accessibility hazards — stairs without ramps, narrow doorways, poor lighting, missing tactile indicators, and 13 other hazard types across 7 accessibility profiles. Scanned spaces become "territories" on a live Mapbox map with 3D polygon extrusions. Users can stack multiple accessibility profiles (e.g., wheelchair + low vision) and get a personalised safe route through the 3D model that respects all their combined needs. A community leaderboard gamifies scanning to grow the database.

### How we built it

The mobile app is built with Expo (React Native) and TypeScript. We use @rnmapbox/maps for the native 3D territory map, expo-gl with expo-three for the Three.js-based indoor viewer, and expo-camera with expo-sensors (gyroscope + accelerometer) for the multi-angle scanning flow with depth estimation. State management uses Zustand with AsyncStorage persistence and TanStack React Query for server state.

The backend runs on Express with tRPC for end-to-end type safety. MongoDB stores territories and user data via Prisma ORM. The AI pipeline sends captured frames to Google Gemini's multimodal vision API with a structured prompt that returns hazard detections as typed JSON — including hazard type, severity, affected profiles, confidence score, and estimated 3D position.

A custom tmux-based TUI dev runner orchestrates the full stack (backend, frontend, local MongoDB via Docker) with single-key navigation.

### Challenges we ran into

Getting depth estimation from a standard phone camera without LiDAR was the biggest challenge. We ended up using motion sensor data (gyroscope sweep angles + accelerometer energy) combined with multi-angle capture to estimate spatial dimensions — it's not perfect, but it gives usable area and depth confidence metrics.

Migrating from a WebView-based Mapbox map to the native @rnmapbox/maps SDK required rethinking the entire data pipeline — converting territory polygons to GeoJSON, implementing FillExtrusionLayer for 3D rendering, and handling touch events through Mapbox's expression-based filtering system.

Making Gemini reliably return structured hazard JSON required careful prompt engineering with explicit schema definitions and fallback handling when the API returns unexpected formats.

### Accomplishments that we're proud of

- Multi-profile accessibility filtering that actually works — you can stack "wheelchair + low vision + elderly" and the hazard list and 3D route update in real-time to reflect the union of all constraints
- The scanning flow feels native — haptic feedback on capture, live motion telemetry overlay, depth confidence meter
- Per-screen error boundaries so a crash in the map doesn't take down the scanner
- The territory gamification system that incentivises community scanning

### What we learned

- Mapbox's native SDK for React Native is significantly more capable (and faster) than a WebView approach, but the setup complexity with Expo config plugins and download tokens is real
- Gemini Vision is remarkably good at identifying accessibility hazards from photos when given a well-structured prompt with specific hazard type definitions
- Multi-profile accessibility systems are more useful than single-profile — real people don't fit into one category

### What's next for AccessAtlas

- Partner with disability advocacy organisations to prioritise high-traffic locations for scanning
- Council partnerships to make scan data available as public accessibility infrastructure
- Community-contributed scans with verification and quality scoring
- Integration with navigation apps to provide accessible routing for the last mile
