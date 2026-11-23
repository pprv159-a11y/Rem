# PARTICULATE · BMW M5 CS

> An interactive, real-time 3D exhibition of the BMW M5 CS (F90) — scroll to take the most powerful M5 ever built apart, then watch it reassemble. Drag to orbit. All in the browser, no build step.

A cinematic single-page experience that loads a real textured 3D model of the M5, stages it in a dark studio with aggressive M-accent lighting, and drives a true **mechanical exploded view** entirely from your scroll position.

![BMW M5 CS](assets/frames/01.jpeg)

---

## ✨ Features

- **Real-time 3D model** — the actual textured car (`assets/m5.glb`, 52 meshes) rendered with PBR materials, studio environment reflections, and bloom. Not a video, not a sprite.
- **Mechanical exploded view** — on scroll, every one of the 52 meshes separates outward along its own centroid vector into a floating anatomy (wheels, brakes, roof, glass, exhaust, panels…), then reassembles.
- **Drag to orbit** — grab the car and spin it; it auto-rotates with inertia when released.
- **Scroll choreography** — a smooth state machine (`THE CAR → SUBTRACTION → EXPLODE → ANATOMY → REASSEMBLY → finale`) driven by [Lenis](https://github.com/darkroomengineering/lenis) smooth scrolling.
- **Bold, aggressive art direction** — dark studio, red + blue M-accent rim lights, fog, a low dramatic camera, and an M-gradient progress rail.
- **Animated spec counters** — 627 hp · 750 Nm · 0–100 in 3.0 s · 305 km/h.
- **Optional WebAudio engine bed** — a synthesised low ambience that revs with the explosion (off by default, built on first click — autoplay-safe).
- **Honest loader** — progress is tied to the real GLB byte-load + font readiness, not a fake timer.
- **Accessible & resilient** — skip link, `:focus-visible`, `prefers-reduced-motion` handling, and a no-WebGL static fallback.
- **Zero build step** — vanilla ES modules + an import map; Three.js and Lenis load from CDN.

## 🎮 Controls

| Action | Effect |
|---|---|
| **Scroll** | Deconstruct → explode → reassemble the car |
| **Drag** (click + move / touch) | Orbit the car freely |
| **🔊 button** (bottom-right) | Toggle the ambient engine sound |

## 🛠 Tech stack

- **[Three.js](https://threejs.org/) r160** (via CDN import map) — WebGL rendering
  - `GLTFLoader`, `RoomEnvironment` (procedural studio IBL), `EffectComposer` + `UnrealBloomPass` + `OutputPass`
- **GLSL / ACES** filmic tone-mapping pipeline
- **[Lenis](https://github.com/darkroomengineering/lenis)** — smooth scroll
- **Vanilla JS / HTML / CSS** — no framework, no bundler
- **Node.js** — a tiny static server with HTTP Range support (needed for streaming the model)
- **Fonts** — Bodoni Moda · Inter · Space Mono

## ⚙️ How it works

1. **Load** — `GLTFLoader` streams `assets/m5.glb` (byte progress feeds the loader bar).
2. **Flatten** — every mesh's world transform is baked into a clone and re-parented to a single rig, so each part can be moved independently.
3. **Explode** — each part is assigned a direction = `centroid − model centre`; scrolling lerps every part along that vector, the camera dollies back, and the anatomy catalog + spec counters fade in.
4. **Light** — a procedural `RoomEnvironment` provides reflections; a white key light plus red/blue M-accent spotlights and a front fill make the dark body read; ACES tone mapping + bloom finish it.
5. **Reassemble** — scrolling back collapses every part to its origin. The top of the page always shows the whole car.

## 🚀 Run locally

```bash
git clone https://github.com/Don-Gabriel/bmw-web.git
cd bmw-web
node serve.js          # tiny static server with Range support
# → open http://localhost:5566
```

> `npm install` is **optional** — the server uses only Node built-ins. Dependencies exist only for offline tooling (ffmpeg frame extraction).

Any static server with HTTP **Range** support works; range support is required so the browser can stream the `.glb` model.

## 📁 Project structure

```
bmw-web/
├─ index.html      # shell: import map, canvas, editorial chapter overlay
├─ styles.css      # editorial type, loader, HUD, reduced-motion fallback
├─ main.js         # the engine (GLTF load → flatten → exploded view → lighting)
├─ serve.js        # static file server with HTTP Range support
└─ assets/
   ├─ m5.glb       # the 3D model
   └─ frames/      # stills (poster / OG image / no-WebGL fallback)
```

## ⚠️ Disclaimer & credits

Unofficial, fan-made design demonstration. **Not affiliated with, endorsed by, or sponsored by BMW AG.** "BMW", "M" and the roundel are trademarks of their respective owner; the mark shown is an original roundel-inspired homage. Performance figures are representative of the BMW M5 CS (F90) and shown for design purposes only. *Top speed with optional M Driver's Package.*

- **3D model:** `assets/m5.glb` — _please add the original model's author and license here._
- For personal / educational / portfolio use.

## 📄 License

MIT for the original code in this repository (`index.html`, `styles.css`, `main.js`, `serve.js`). Third-party assets and the 3D model retain their own licenses.
