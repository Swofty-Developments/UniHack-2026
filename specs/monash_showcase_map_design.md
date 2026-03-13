# Monash Showcase Map Design

## Goal

Turn the map experience into a reliable Monash Clayton showcase where:

- the bottom navigation keeps Scan as a real tab action
- the map loads into a bounded Monash campus scene quickly
- scanned territories render on top of the campus in 3D
- demo and fallback scan data stay inside the showcase footprint

## Frontend

- Use the custom floating tab bar as the single home for Scan, instead of rendering a detached scan action over the shell.
- Replace the generic world viewer with a campus-bounded WebView map powered by the provided Mapbox Monash style.
- Add Mapbox building extrusion for campus geometry, then layer scanned territory footprints, markers, and user location on top.
- Keep only lightweight map chrome: attribution, a locate button, and a territory sheet that appears only after selection.
- Clamp device and fallback map focus to Monash bounds so the showcase remains coherent even off-campus.

## Backend

- Move default scan geometry fallback coordinates from Melbourne CBD to Monash Clayton.
- Reduce fallback jitter so generated demo or location-less scans still land within campus bounds.
- Refresh seeded territories so local demo data matches the Monash showcase instead of Melbourne landmarks.

## Security And Reliability

- Use the public Mapbox token supplied for the showcase style only inside the static viewer where it is already intended for client-side use.
- Keep the territory overlay data local to the app bridge; do not expose any new backend endpoints.
- Fail gracefully if the remote map style cannot load by surfacing a renderer error back to React Native.
