# anthonydeguzman.com

Anthony De Guzman's portfolio, served by GitHub Pages with no build step.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A local HTTP server is required because the site uses native ES modules.

## How the page works

The opening pairs a large typographic nameplate with a short introduction and a direct link to selected work. Toronto is identified in a simple location label. Selected projects have original SVG and CSS cover illustrations. The biography and career sections use solid reading surfaces; native `<details>` elements keep the career overview compact while making every role's full description available. The blue contact section has direct email and LinkedIn links, plus a clipboard button with an announced success or failure message.

The page uses HTML and CSS for all visuals. JavaScript only sets the footer year and enables the clipboard button; no terrain, WebGL renderer, or animation loop is loaded. The earlier terrain experiment remains in `js/relief.js`, `js/shaders.js`, `js/terrain.js`, and `assets/terrain/` as unused source material.

With `prefers-reduced-motion`, smooth scrolling and hover motion are disabled. Dark appearance follows the system preference. Without JavaScript, the layout, project artwork, navigation, career disclosures, and contact links remain available.

`REDESIGN_PLAN.md` is the historical specification for the original full-page terrain treatment. The owner subsequently gave full creative freedom for the portfolio design and rejected the circular terrain illustration.

## Asset provenance

- `fonts/bricolage-grotesque-latin.woff2` is the variable latin subset (`opsz` 12–96, `wght` 200–800) served by Google Fonts. Bricolage Grotesque is © Mathieu Triay, SIL Open Font License 1.1.
- The unused `assets/terrain/toronto-1024.png` and `toronto-512.png` hold the earlier elevation model. They were baked once from the Mapzen Terrarium tiles on the AWS Open Data Registry (`elevation-tiles-prod`, zoom 12, x 1141–1148, y 1490–1496; the imagery source for this area is the USGS National Elevation Dataset at 1/3 arc-second, public domain). The crop covers longitude −79.70 to −79.07 and latitude 43.55 to 43.95, north up, about 50 m per texel. Channel R × 256 + B is the elevation, quantised to 9 bits and gamma-encoded as `((elev − 70 m) / 280 m) ^ 0.85`; channel G is the Lake Ontario mask; the last 24 rows fade to lake so the model continues as water below its edge. Parameters are recorded in `assets/terrain/toronto.json`.
- Bake procedure, if the terrain ever needs regenerating: fetch the tiles, decode elevation as `R × 256 + G + B / 256 − 32768` metres, stitch, flood-fill the lake from open water at or below 75.3 m and flatten it to 74.5 m, crop to the box, smooth with a Gaussian of about 1.2 texels, resample, quantise, and write an RGB PNG without colour-management chunks.
- `js/terrain.js` is the earlier renderer's procedural fallback heightfield; it is no longer loaded.
- `assets/og/og.jpg` is a 1200 × 630 capture of the current typographic opening in light appearance, with the navigation hidden for the social crop. The project illustrations are inline SVG/CSS and scale without separate image assets.

The site has no package manager, compilation, analytics, runtime API calls, or external requests.
