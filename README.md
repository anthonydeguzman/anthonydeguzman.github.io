# anthonydeguzman.com

Anthony De Guzman's static portfolio, served by GitHub Pages with no build step.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A local HTTP server is required because the site uses native ES modules and an import map.

## Asset provenance

- `vendor/three/` contains the three.js r185 module build, core module, and license from jsDelivr/npm.
- `fonts/martian-mono-wght-latin.woff2` is the variable Latin subset served by Google Fonts.
- `fonts/newsreader-italic-wght-latin.woff2` is the variable 400–600 italic Latin subset served by Google Fonts.

The site has no package manager, compilation, analytics, runtime API calls, or external font requests.
