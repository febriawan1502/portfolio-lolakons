# Power Up the Island — Playable 3D Voxel Portfolio

An interactive, playable portfolio disguised as a small voxel island. You control a blocky
PLN field officer (`petugas PLN`) in a white K3 helmet and blue hi-vis vest. Four substations
are offline — walk to each one, repair it, and it unlocks a portfolio section.

Everything is generated procedurally in code: no external models, textures, or CDN links.

## Quick start

```bash
npm install      # or: bun install / pnpm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle -> dist/
npm run preview  # serve the built bundle
```

Requires Node 18+ and a browser with WebGL 2.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | `W` `A` `S` `D` / arrow keys | virtual joystick (bottom-left) |
| Jump | `Space` | `JUMP` button |
| Look / orbit | drag the canvas | drag anywhere on the world |
| Zoom | mouse wheel | — |
| Repair / inspect | `E` or click a station | `E` button |
| Close panel | `Esc` or the ✕ button | tap ✕ |

Sprint is available on `Shift` while moving.

## Folder structure

```
portfolio/
├── index.html          # HUD markup: topbar, mission card, prompt, intro, panel shell
├── package.json
└── src/
    ├── main.js         # bootstrap: renderer, TPS camera, input, game loop, game state
    ├── world.js        # island terrain, trees, poles, cables, substations, lighting
    ├── character.js    # procedural voxel PLN officer + walk/repair animation
    ├── effects.js      # current-pulse particles along the cables, repair spark burst
    ├── ui.js           # HUD wiring, portfolio panel content + GSAP transitions
    ├── data.js         # ← YOUR CONTENT: bio, projects, experience, contact
    └── style.css       # retro/cyberpunk HUD, panel, responsive + touch styling
```

## Making it yours

All personal content lives in `src/data.js`. Nothing else needs editing:

- `portfolio` — name, role, bio, location, skills, projects, experience, email, socials.
- `stations` — the four station positions (`x`, `z`) and titles. Moves the buildings and the
  portfolio sections together.

Entries with an empty `url` intentionally render as a greyed-out `LINK PENDING` chip, so the
site is presentable before you have every link.

## How it works

**World** (`world.js`) — The island is a blob tested with a superellipse falloff, rendered as
two `InstancedMesh` layers (grass on top, dirt below) with per-instance colour variation for a
hand-placed voxel feel. Poles, trees, paths and substations are plain box meshes. Power cables
are `CatmullRomCurve3` sag curves extruded to `TubeGeometry`; the same curves drive the current
particles, so the cables and the electricity can never drift apart.

**Character** (`character.js`) — Built from scaled `BoxGeometry` blocks in a hip/limb hierarchy.
The PLN logo is drawn to a `<canvas>` at runtime (lightning bolt + water waves) and applied as a
`CanvasTexture` on the chest and back. Walk cycle is procedural: opposite-phase sine rotation on
arms and legs plus a subtle body bob, all interpolated so it can start and stop smoothly. The
repair animation overrides the arms with a fast oscillation.

**Camera** (`main.js`) — Third-person orbit-follow: spherical offset from the character, damped
with `1 - exp(-delta * k)` so it stays frame-rate independent. A raycast from the character's
head to the desired camera position pulls the camera in when terrain or structures would block
the view.

**Power states** — `setStationPower()` swaps the lamp and screen materials from pulsing red to
steady green; `updateWorld()` drives the blink, and `effects.js` progressively enables current
particles per repaired station.

## Notes

- Frame-rate independence relies on a `delta` clamp (max 50 ms/frame), which also prevents
  tunnelling through the world on a frame hitch.
- Overlay transitions use GSAP, but **game state never depends on an animation callback** —
  the intro and panel teardown both fall back to a timer so a starved frame cannot lock input.
- Touch controls appear on `(hover: none)` or narrow viewports, and the HUD moves out of the
  thumb zones on those devices.
- Deploy as a static site: `dist/` works on Netlify, Vercel, GitHub Pages or any file host.
  If you serve from a subpath, set `base` in a `vite.config.js`.
