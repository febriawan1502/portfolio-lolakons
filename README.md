# Power Up the Island — Playable 3D Voxel Portfolio

Explore a voxel island as a PLN field officer. Four renewable power plants are offline: a wind turbine, solar panels, a hydro plant, and a geothermal plant. Repairing each plant starts its own animation and sends visible electricity toward the house at the center of the island. The first repair turns on the lamp, the second the TV, the third the laptop, and the fourth the fan. Each plant still opens one portfolio section. Once all four are online, interact with the house to open About, Projects, Experience, and Contact in one scrollable overview.

Everything in the world is generated in code, with no external models or textures.

## Run locally

```bash
bun install
bun run dev
```

`bun run build` creates the production site in `dist/`. Node 18+ with npm is also supported.

## Deploy with Docker

On a server with Docker and the Compose plugin installed, clone this repository and run:

```bash
docker compose up -d --build
```

Open `http://SERVER_IP:8080`. Set `PORT` to use a different host port, for example:

```bash
PORT=3000 docker compose up -d --build
```

After pulling updates, run `docker compose up -d --build` again. View logs with `docker compose logs -f portfolio` and stop the site with `docker compose down`.

For a public domain, point DNS at the server and put an HTTPS reverse proxy in front of port 8080. The container serves the built static site through Nginx; no runtime environment variables are required.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | `W` `A` `S` `D` / arrow keys | Joystick |
| Jump | `Space` | JUMP button |
| Look | Drag the canvas | Drag the world |
| Repair or inspect | `E` or click a plant | E button |
| Open complete overview | After four repairs, `E` near the house, click the house, or use the mission button | E near the house or mission button |
| Close portfolio panel | `Esc` or ✕ | ✕ |

Hold `Shift` while moving to sprint.

## Edit the portfolio

Febriawan Ramadhan's portfolio content and the plant positions live in `src/data.js`. The four station IDs continue to map to About, Projects, Experience, and Contact. The house devices always turn on in repair order, regardless of which plant the player visits first.

`src/powerPlants.js` builds the four plants and the open house. `src/world.js` builds the terrain and connects each plant to the house. `src/effects.js` moves current along repaired plants' cables.

The supplied background track loops while sound is on. Sound starts enabled and playback begins when the visitor presses Start, as required by browser autoplay rules. The Sound control pauses or resumes the music and effects.

This is a static Vite site. WebGL 2 is required to render the world.
