# Crime & Punishment — A Dostoevsky Experience

A 3D atmospheric narrative adventure built with Three.js, set in 19th-century St. Petersburg. Play as Rodion Raskolnikov through six chapters mirroring the structure of Fyodor Dostoevsky's novel.

## Play

Open `index.html` in a modern browser. No build step required — Three.js (r128) loads from CDN.

Because it loads local JS files, serve it over HTTP rather than `file://`:

```bash
cd crime-and-punishment
python3 -m http.server 8000
# visit http://localhost:8000
```

## Controls

| Input | Action |
|-------|--------|
| WASD | Move |
| Mouse | Look (pointer lock — click the canvas) |
| Click / E | Interact with highlighted object |
| I | Toggle inventory labels |
| ESC | Menu |

## Chapters

1. **The Plan** — The garret, the streets, a rehearsal visit to the pawnbroker.
2. **The Crime** — The axe, the deed.
3. **The Fever** — Delirium in the streets, the police summons.
4. **The Investigation** — Porfiry Petrovich's office.
5. **Sonya** — Confession in Sonya's warm, humble room.
6. **The Punishment** — Kneeling at the Haymarket crossroads.

## Locations

Garret · St. Petersburg Streets · Pawnbroker's Apartment · Haymarket Square · Porfiry's Office · Sonya's Room — each hand-built from Three.js primitives with bespoke lighting, fog, rain, stars, and particle effects.

## File Structure

```
crime-and-punishment/
  index.html        entry point
  js/world.js       scene, lighting, renderer, movement, atmosphere
  js/locations.js   3D geometry for each location
  js/characters.js  NPC humanoids + dialogue
  js/story.js       chapter/scene state machine
  js/ui.js          HUD, dialogue, inventory, menus, minimap
  css/style.css     gothic UI styling
```

## Tech

- Three.js r128 (CDN), pure HTML/CSS/JS
- FogExp2, PCFSoftShadowMap, procedural starfield, rain & fountain particle systems
- Google Fonts: Playfair Display (headings), Crimson Text (body)
