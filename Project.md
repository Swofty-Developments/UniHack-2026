AccessAtlas Mobile – React Native Edition
The global map of accessible indoor spaces.
See which buildings, floors, and paths have been scanned for accessibility – all on one map.
Tap any highlighted area to explore its 3D model, view AI‑detected hazards, and get a personalised route.
Scan new spaces with your iPhone’s LiDAR to grow the map and claim territories.

How It Works
Open the map – a global view (like Google Maps) shows all scanned territories highlighted in colour.

Explore – tap any highlighted area to see its name, scanned date, and who claimed it.

View details – enter the 3D viewer to see the indoor model with colour‑coded hazard pins.

Get a route – select your accessibility profile (wheelchair, low vision, etc.) and the app draws a safe path through the space.

Scan a new area – point your iPhone (with LiDAR) at a building entrance, corridor, or room. The app captures 3D geometry and images.

AI analysis happens in the cloud: Gemini Vision detects hazards (stairs, narrow doors, poor lighting, etc.).

Claim the territory – the new area is added to the global map and credited to you. Your total coverage appears on a leaderboard.

The global map is the heart of the app – you’re never forced to scan; you can simply use the existing data to navigate safely.

Gamification & Map Features
Global Map

Built with react-native-maps (Apple Maps / Google Maps).

Scanned territories are displayed as coloured polygons or heatmap overlays.

Each territory shows a preview icon (e.g., building type) and its claimant.

Users can zoom/pan to discover accessible spaces anywhere.

Territories

A territory is a distinct scanned location (e.g., a building floor, a park path).

The first user to scan an area claims it – their name appears on the map and leaderboard.

Boundaries are stored as GeoJSON polygons for precise map rendering.

Leaderboard

Tracks total area scanned (square meters) and number of unique territories.

Encourages friendly competition to expand the accessible map.

3D Indoor Viewer

When a user taps a territory, they enter a detailed view:

The LiDAR‑captured .gltf/.glb model rendered in 3D.

Hazard pins placed at exact locations (e.g., stairs, narrow doorways).

Profile‑based routing: the app calculates a safe path through the model and highlights it.

Accessibility Profiles
Profile	AI Flags
Wheelchair Users	Stairs w/o ramps, narrow doorways, steep gradients, high thresholds
Low Vision	Poor lighting, low-contrast edges, unmarked glass, missing tactile
Limited Mobility	Long distances w/o rest points, no seating, heavy doors, missing elevators
Hearing Impaired	Audio-only alerts, no visual signage, intercom-only entry
Neurodivergent	Overwhelming environments, no quiet spaces, confusing wayfinding
Elderly / Aging	Trip hazards, missing handrails, poor signage, slippery surfaces
Parents w/ Prams	Same physical barriers as wheelchair
Tech Stack
Frontend (Mobile App)
Framework: React Native (Expo managed workflow)

Language: TypeScript

Map & 3D:

react-native-maps + Apple Maps / Google Maps – global map with polygon overlays.

Indoor model viewer: WebView with Three.js (loads .gltf), or expo-three + expo-gl for native rendering.

react-native-vision-camera with frame processors for capturing images + depth data.

ARKit integration: react-native-arkit or custom native module for LiDAR scanning.

State Management: Redux Toolkit or Zustand.

Navigation: React Navigation.

Backend
API: Node.js + Express (or Python Flask).

AI: Gemini Vision API (multimodal, receives images + depth data, returns structured JSON of hazards).

Database: Firebase Firestore – stores territory metadata (GeoJSON boundaries, claimant, scan date, hazard list, model URL).

File Storage: Firebase Storage or AWS S3 for 3D models and scan assets.

3D Processing: Python + trimesh for optional model optimisation.

Hardware
iOS only (for LiDAR): iPhone 12 Pro / iPad Pro or newer.

Android fallback: standard camera + depth estimation (via ARCore) – but LiDAR is preferred for accuracy.

Pitch Structure (for Demo)
Hook
"Imagine arriving at a building in a wheelchair with no idea if you can even get through the front door."

Problem
4.4 million Australians with disabilities – no way to preview indoor accessibility before arriving.

Solution
AccessAtlas Mobile: a global map of accessible indoor spaces, built by the community. See what’s been scanned, explore 3D models with AI‑detected hazards, and get personalised routes. Plus, gamification turns data collection into a fun competition.

Live Demo

Open the app → show the global map with several highlighted territories (e.g., a university building, a shopping centre).

Tap a territory → enter the 3D viewer, see hazard pins (stairs, narrow doors).

Switch profiles → the safe route changes in real time.

Scan a new area (e.g., a room in the venue) → watch AI analyse and add it to the map.

Check the leaderboard – the scanner’s total area increases.

What’s Next

Build a community database of accessible spaces.

Partner with disability organisations for validation.

Add council partnerships to prioritise public buildings.

Expand to Android with ARCore depth API.

UNIHACK Scorecard
Theme	Status	How
AI/ML Core	✓	Gemini vision analyses scans – impossible without AI
Hardware	✓	iPhone LiDAR capture (ARKit)
Accessibility	✓	Entire project IS accessibility. 7 profiles.
Relatable Problem	✓	Everyone’s been lost or worried about access in unfamiliar buildings
Polished UI	!	Global map + 3D viewer is inherently impressive; invest in branding
Social Impact	✓	Disability inclusion, public data, community scanning
Live Demo	✓	Scan the venue, show results live, interactive profiles
What’s Next	✓	Community database, gamification, council partnerships
Future Plans (for DevPost)
Partner with disability organisations:

People with Disability Australia – help prioritise locations

Physical Disability Australia – verify hazard accuracy

Centre for Accessibility Australia – refine accessibility standards

Gamification expansion: badges, team territories, weekly challenges

Crowdsourced verification: users can confirm/flag hazards

Public API for researchers and city planners to access anonymised accessibility data