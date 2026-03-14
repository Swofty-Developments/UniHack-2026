

**AccessAtlas**

*AI-powered accessibility intelligence for real-world spaces*

Upload a 3D scan of any space (Polycam LiDAR) → AI detects accessibility hazards → users get personalised hazard maps based on their needs. All mapped on a live territory system with gamification.

**UNIHACK 2026**

Team: Swofty | PenguinDevs | bok | Cherry | EmertyLover

**How It Works**

1. Open the app, name the space, pick building type

2. Select a GLB/glTF file from a LiDAR scanning app (e.g. Polycam)

3. File uploaded to backend → textures extracted → Claude Sonnet 4 analyses for hazards (structured JSON)

4. Backend renders 8 panoramic views of the 3D model → Claude analyses each angle for additional hazards with estimated 3D positions

5. Territory appears on the global Mapbox map with 3D polygon extrusions

6. Tap a territory → see colour-coded hazard pins in the 3D viewer

7. Select your accessibility profiles (stack multiple) to filter relevant hazards

**Accessibility Profiles**

*Users can activate multiple profiles simultaneously — hazard filtering reflects the union of all active needs.*

| Profile | AI Flags |
| :---- | :---- |
| **Wheelchair Users** | Stairs w/o ramps, narrow doorways, steep gradients, high thresholds, inaccessible surfaces |
| **Low Vision** | Poor lighting, low-contrast edges, unmarked glass, missing tactile indicators |
| **Limited Mobility** | Long distances w/o rest points, no seating, heavy doors, missing elevators |
| **Hearing Impaired** | Audio-only alerts, no visual signage, intercom-only entry |
| **Neurodivergent** | Overwhelming environments, no quiet spaces, confusing wayfinding, flickering lights |
| **Elderly / Aging** | Trip hazards, missing handrails, poor signage, slippery surfaces |
| **Parents w/ Prams** | Same physical barriers as wheelchair; stairs, narrow passages, heavy doors |

**Tech Stack**

| Layer | Technology |
| :---- | :---- |
| **Mobile App** | Expo ~54.0 (React Native 0.81.5) \+ TypeScript |
| **Maps** | @rnmapbox/maps — native Mapbox SDK with 3D territory extrusions |
| **3D Viewer** | WebView loading backend-served Three.js HTML — first-person navigation, hazard pins, D-pad controls |
| **Scanning** | expo-document-picker (GLB/glTF/ZIP file selection from Polycam LiDAR scans) |
| **State** | Zustand (persisted to AsyncStorage) \+ TanStack React Query |
| **Navigation** | React Navigation (native-stack \+ bottom-tabs \+ floating tab bar) |
| **Backend** | Express 5 \+ tRPC (type-safe RPC) |
| **Database** | MongoDB via Prisma ORM |
| **AI** | Anthropic Claude Sonnet 4 — multimodal vision analysis → structured hazard JSON |
| **3D Processing** | @gltf-transform/core — GLB texture extraction for AI analysis |
| **Auth** | JWT (jsonwebtoken) \+ bcryptjs |
| **Dev Tooling** | Bun (backend runtime), tmux-based TUI dev runner, Docker (local MongoDB) |

**App Structure**

**Tabs**

* **Map —** Live Mapbox map with 3D extruded territory polygons, user location tracking, territory selection sheet

* **Discover —** Browse and explore scanned spaces

* **Scan —** Multi-step flow: setup (name, building type) → file picker → upload GLB → panoramic capture in hidden WebView → Claude analysis → results

* **Leaderboard —** Community rankings by total area scanned, top-3 podium, pull-to-refresh

* **Profile —** Identity card, active accessibility modes summary, navigation to settings/modes/onboarding

**Stack Screens**

* **Territory Detail —** Hero card, metrics grid, 3D viewer CTA, profile selector, filtered hazard list

* **Territory Hazards —** Full hazard breakdown for a territory

* **Wayfinding —** First-person 3D viewer via WebView (Three.js rendered on backend, loaded in react-native-webview)

* **Settings —** Name editing, app version/build info, sign out

* **Accessibility Modes —** Full profile management with toggle cards, haptic feedback, animated transitions

* **Onboarding —** Scanner identity creation (modal)

**Architecture**

* Per-screen error boundaries (crash in one tab doesn't nuke the app)

* tRPC end-to-end type safety (shared types between frontend and backend)

* GeoJSON conversion utilities for Mapbox polygon/marker rendering

* Custom location tracking hook with heading support

**Backend**

**tRPC Routers**

* **auth —** register/login, JWT generation

* **territory —** getAll, getById, create, update

* **hazard —** getByTerritory, getByProfile filtering

* **scan —** analyze (images → Claude), completeFromUpload (territory from uploaded file), status

* **leaderboard —** ranked by totalAreaScanned

* **user —** get, updateProfile (sync selected accessibility modes)

**REST Endpoints**

* **GET /api/viewer/{filename} —** Serves Three.js 3D viewer HTML with first-person controls and hazard pins

* **GET /api/capture/{filename} —** Panoramic capture page (renders 8 views at 45-degree intervals)

* **POST /api/upload-scan —** Upload GLB, extract textures, analyse with Claude, create territory

* **POST /api/analyze-panoramic —** Analyse 8 panoramic screenshots with Claude for 3D-positioned hazards

* **POST /api/update-territory-hazards —** Update territory with panoramic hazard results

* **GET /api/model/{filename} —** Convert GLB to glTF with texture URLs

**AI Pipeline (Claude Sonnet 4)**

* **Texture analysis:** Extracts up to 8 textures from the uploaded GLB file, sends to Claude's vision API with a structured prompt

* **Panoramic analysis:** Backend renders the 3D model from 8 camera angles (0° through 315°), sends screenshots to Claude with camera position/direction metadata

* Claude detects 16 hazard types across 7 accessibility profiles

* Returns structured JSON: hazard type, severity, description, affected profiles, confidence score, normalised position coordinates

* Fallback hazards generated if API fails

**Data Model (Prisma \+ MongoDB)**

* **User —** displayName, email, selectedProfiles\[\], totalAreaScanned, territoriesCount

* **Territory —** name, buildingType, polygon (GeoJSON), center, hazards\[\], hazardSummary, claimedBy, fillColor, status, modelUrl

**Team & Tasks**

| Who | Role | Tasks | Priority |
| :---- | :---- | :---- | :---- |
| **Swofty** | Lead Dev | GLB upload \+ processing, AI pipeline (Claude), tRPC backend, Mapbox integration, panoramic capture | **P0** |
| **PenguinDevs** | Frontend Dev | 3D viewer (WebView \+ Three.js), territory detail UI, hazard pins, profile selector, scan flow UI | **P0** |
| **bok** | Dev \+ Flex | Support dev, QA, research, whatever needs doing | **P1** |
| **Cherry** | Lead Design | Logo, visual identity, branding, UI polish, pitch deck design | **P0** |
| **EmertyLover** | Media | UI polish support, demo video, DevPost screenshots \+ writeup | **P1** |

**Pitch Structure**

**Hook:** "Imagine arriving at a building in a wheelchair with no idea if you can get through the front door."

**Problem:** 4.4M Australians with disabilities, no way to preview indoor accessibility before arriving.

**Solution:** AccessAtlas — upload a 3D scan of any space, AI detects hazards, everyone gets personalised accessibility insights.

**Live demo:** Upload a scan of the venue, show territory appear on map, toggle accessibility profiles, explore hazards in the 3D viewer.

**What's next:** Community scan database, council partnerships, gamified scanning incentives.

**UNIHACK Scorecard**

| Theme | Status | How |
| :---- | ----- | :---- |
| **AI/ML Core** | **Done** | Claude Sonnet 4 vision — impossible without AI |
| **Hardware** | **Done** | Polycam LiDAR scans (GLB files) as spatial input |
| **Accessibility** | **Done** | Entire project IS accessibility. 7 stackable profiles. |
| **Relatable Problem** | **Done** | Everyone's been lost in an unfamiliar building |
| **Polished UI** | **Done** | Native Mapbox 3D map, Three.js first-person viewer, dark theme, haptic feedback, animated transitions |
| **Social Impact** | **Done** | Disability inclusion, public data, community scanning |
| **Live Demo** | **Done** | Upload a scan, show results live, interactive profiles |
| **What's Next** | **Done** | Community database, gamification, council partnerships |

**DevPost Writeup**

**Inspiration**

4.4 million Australians live with a disability. Every day, they arrive at buildings with no idea whether they can physically navigate them — is there a ramp? Are the doors wide enough? Is there an elevator? This information simply doesn't exist for most indoor spaces. We built AccessAtlas to change that.

**What it does**

AccessAtlas lets anyone upload a 3D scan of a real-world space (captured with LiDAR scanning apps like Polycam). The app sends the GLB file to the backend, which extracts textures and renders panoramic views, then uses Anthropic's Claude Sonnet 4 vision API to detect accessibility hazards — stairs without ramps, narrow doorways, poor lighting, missing tactile indicators, and 13 other hazard types across 7 accessibility profiles. Scanned spaces become "territories" on a live Mapbox map with 3D polygon extrusions. Users can stack multiple accessibility profiles (e.g., wheelchair \+ low vision) to filter hazards relevant to their combined needs. A first-person 3D viewer lets users explore the space with colour-coded hazard pins. A community leaderboard gamifies scanning to grow the database.

**How we built it**

The mobile app is built with Expo (React Native 0.81.5) and TypeScript. We use @rnmapbox/maps for the native 3D territory map and react-native-webview to load a backend-served Three.js page for the first-person indoor viewer with hazard pins and D-pad navigation. File selection uses expo-document-picker for GLB/glTF files from LiDAR scanning apps. State management uses Zustand with AsyncStorage persistence and TanStack React Query for server state.

The backend runs on Express 5 with tRPC for end-to-end type safety. MongoDB stores territories and user data via Prisma ORM. The AI pipeline works in two stages: first, @gltf-transform/core extracts textures from the uploaded GLB file and sends them to Claude's multimodal vision API; then, the backend renders 8 panoramic views of the 3D model and sends those screenshots to Claude with camera metadata, which returns hazard detections as typed JSON — including hazard type, severity, affected profiles, confidence score, and estimated 3D position coordinates.

A custom tmux-based TUI dev runner orchestrates the full stack (backend, frontend, local MongoDB via Docker) with single-key navigation.

**Challenges we ran into**

Getting reliable hazard detection with accurate 3D positioning was the biggest challenge. We developed a two-stage pipeline: first analysing extracted textures for initial hazard detection, then rendering panoramic views from the 3D model to let Claude estimate world-space coordinates using camera position and viewing angle metadata.

Migrating from a WebView-based Mapbox map to the native @rnmapbox/maps SDK required rethinking the entire data pipeline — converting territory polygons to GeoJSON, implementing FillExtrusionLayer for 3D rendering, and handling touch events through Mapbox's expression-based filtering system.

Making Claude reliably return structured hazard JSON required careful prompt engineering with explicit schema definitions and fallback handling when the API returns unexpected formats.

**Accomplishments that we're proud of**

* Multi-profile accessibility filtering that actually works — you can stack "wheelchair \+ low vision \+ elderly" and the hazard list updates in real-time to reflect the union of all constraints

* The two-stage AI analysis pipeline (texture extraction \+ panoramic rendering) that gives Claude multiple perspectives on each space

* First-person 3D viewer with hazard pins rendered in a WebView, controlled via D-pad overlay

* Per-screen error boundaries so a crash in the map doesn't take down the scanner

* The territory gamification system that incentivises community scanning

**What we learned**

* Mapbox's native SDK for React Native is significantly more capable (and faster) than a WebView approach, but the setup complexity with Expo config plugins and download tokens is real

* Claude Sonnet 4 is remarkably good at identifying accessibility hazards from images when given a well-structured prompt with specific hazard type definitions

* Multi-profile accessibility systems are more useful than single-profile — real people don't fit into one category

* Using LiDAR scans (GLB files) as input gives much richer spatial data than phone camera photos alone

**What's next for AccessAtlas**

* Partner with disability advocacy organisations to prioritise high-traffic locations for scanning

* Council partnerships to make scan data available as public accessibility infrastructure

* Community-contributed scans with verification and quality scoring

* Integration with navigation apps to provide accessible routing for the last mile

**Future Plans**

Partner with disability-focused organisations to scale the scan database:

* **People with Disability Australia —** National community to prioritise which locations to scan first and validate detected hazards

* **Physical Disability Australia —** Verify wheelchair-related hazards (stairs without ramps, narrow doorways, inaccessible surfaces)

* **Disability Advocacy Network Australia —** Dozens of local advocacy groups to scale scanning initiatives nationally

* **Centre for Accessibility Australia —** Accessibility auditing expertise to refine hazard detection models

* **Multicultural Disability Advocacy Australia —** Ensure dataset covers diverse environments and accessibility needs

#
