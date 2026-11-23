# EKO – Open World (GTA-style browser game)

Open-world city game built with Three.js. Runs fully in the browser.

## Play
- **GitHub Pages:** Settings → Pages → deploy from `main` branch (root). Open the link.
- **Locally:** open `index.html` (or run `python3 -m http.server` and visit `localhost:8000`).

Needs internet on first load (Three.js is loaded from a CDN).

## Controls
WASD move · Shift sprint · Space jump · E climb · F enter/exit car · Mouse look · Click shoot · R reload · C/Tab change view · H horn · B radio · M mute

## Structure
- `index.html` – page markup
- `css/style.css` – styles
- `js/game.js` – game code
- `js/sound.js` – procedural sound system
- `js/loader.js`, `js/error-handler.js` – engine loader and error display
- `data/*.js` – embedded city, car, character and texture data (large)
