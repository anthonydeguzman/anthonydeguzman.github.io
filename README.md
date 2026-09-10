# anthonydeguzman.com

Anthony De Guzman's portfolio, served by GitHub Pages with no build step.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A local HTTP server is required because the site uses native ES modules.

## How the page works

The page sits on a plaster relief of Toronto's real terrain, rendered straight down in WebGL2 (`js/relief.js` and `js/shaders.js`, no libraries). The display type stands on the model: each glyph's footprint is baked into a document-space mask and raised as a block, so the letters cast shadows on the relief. Scrolling moves the sun through a day, dawn at the top and dusk at the bottom; on a desktop the pointer holds the sun while it is over the hero; on touch devices the sun drifts slowly and a horizontal drag across the hero moves it. The light plays a short sunrise on load.

Without WebGL2 the page shows the same layout on flat plaster. With `prefers-reduced-motion` the light is fixed and nothing animates. `prefers-color-scheme: dark` switches to a charcoal model under a warm lamp.

Query parameters for development and screenshots: `relief=off|force|debug` (skip the renderer, accept software GL, or show the mask overlay and expose `window.__relief`), `scroll=0..1` (scroll after the first frame and pin the sun to that point of the day), `sun=az,alt` (pin the sun, degrees), `og` (hide the header and hero meta for the social image).

## Asset provenance

- `fonts/bricolage-grotesque-latin.woff2` is the variable latin subset (`opsz` 12–96, `wght` 200–800) served by Google Fonts. Bricolage Grotesque is © Mathieu Triay, SIL Open Font License 1.1.
- `assets/terrain/toronto-1024.png` and `toronto-512.png` hold the elevation model. They were baked once from the Mapzen Terrarium tiles on the AWS Open Data Registry (`elevation-tiles-prod`, zoom 12, x 1141–1148, y 1490–1496; the imagery source for this area is the USGS National Elevation Dataset at 1/3 arc-second, public domain). The crop covers longitude −79.70 to −79.07 and latitude 43.55 to 43.95, north up, about 50 m per texel. Channel R × 256 + B is the elevation, quantised to 9 bits and gamma-encoded as `((elev − 70 m) / 280 m) ^ 0.85`; channel G is the Lake Ontario mask; the last 24 rows fade to lake so the model continues as water below its edge. Parameters are recorded in `assets/terrain/toronto.json`.
- Bake procedure, if the terrain ever needs regenerating: fetch the tiles, decode elevation as `R × 256 + G + B / 256 − 32768` metres, stitch, flood-fill the lake from open water at or below 75.3 m and flatten it to 74.5 m, crop to the box, smooth with a Gaussian of about 1.2 texels, resample, quantise, and write an RGB PNG without colour-management chunks.
- `js/terrain.js` is a procedural fallback heightfield used only if the terrain image fails to load.

The site has no package manager, compilation, analytics, runtime API calls, or external requests.
