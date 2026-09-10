# anthonydeguzman.com redesign — "Site model"

Self-contained implementation spec. An agent with no other context should be able to build this end to end from this file alone. Read it fully before touching anything; the decisions in section 2 and the constraints in section 3 are settled.

Repository: `/Users/anthonydeguzman/Development/anthonydeguzman.github.io` (branch `master`, deployed by GitHub Pages at https://anthonydeguzman.com via `CNAME`). Work on a branch (e.g. `redesign/site-model`); the owner merges to `master`, which is what Pages deploys. If this file is copied into the repo for the handoff (e.g. as `REDESIGN_PLAN.md`), delete it before merging.

> **Status (2026-09-10):** implemented on branch `redesign/site-model` by the planning agent. What remains for whoever picks this up: review in Safari and on a real phone (touch drift, horizontal drag, vertical scroll never captured), merge to `master`, then delete this file. Everything below is the original spec; the settled decisions in section 2 still hold. Two implementation notes that differ from the text: elevation is quantised to 9 bits (R × 256 + B) because the 16-bit low byte was incompressible, and the shadow march uses a uniform near field against a blurred, thresholded mip level of the mask (see `js/shaders.js`).

## 1. Context

The site is a one-page portfolio for Anthony De Guzman (developer, co-founder of Breezeful, Toronto). The current version is a dark, monospace "AI model card" leftover that the owner has already simplified twice (see `git log`: "Redesign portfolio as adg-3 model card" → "Simplify portfolio copy and positioning" → "Simplify portfolio presentation"). Those simplifications say what the owner wants:

- **Copy stays plain and honest.** He deleted the conceit from every label ("Training run" → "Experience", "Evals" → "Work"), deleted joke copy, deleted invented specifics, compressed résumé bullets. Do not add cleverness to the words. Do not invent facts.
- **The visual layer can be bold.** He kept a generative terrain hero while stripping everything else, and now asks for a site that is "unique, beautiful and sleek", interactive, flagship-quality, Three.js welcome but optional.
- **It must not read as AI-generated or templated.** The current site has every tell: tracked-out uppercase eyebrow labels, "01 / ABOUT — background" kickers, monospace data labels, arrows on links, hairline rule grids, fade-up-on-scroll on every block, tinted near-black on dark. All of that goes.

Outcome: one hard concept grounded in his real world, executed with restraint, boldness spent in exactly one place. The concept carries the whole site; everything else is disciplined typography on a quiet ground.

## 2. The concept and the settled decisions

**The page is an architect's site model of Toronto, and the type stands on it.**

A white plaster relief of Toronto's real terrain (Lake Ontario, the harbour and the Toronto Islands, the Humber and Don ravines, the Scarborough Bluffs, rising north past the 401) fills the whole page as a fixed WebGL layer, seen straight down like a model photographed on a studio table. One low sun rakes across it and casts soft shadows. The page's display type (his name, the section titles, the project names, the email address) is *part of the model*: every glyph is a letter cut from the same thin sheet and set on the plaster, so the letters throw long shadows across the ravines. The real DOM text is drawn crisply on top in graphite ink; the tops of the letter blocks share the plaster colour, so only their shadows and a thin dark side edge are visible.

Time is the interaction:

- **Scrolling moves the sun through one day.** Dawn at the top (long shadows, warm light from the upper right), noon mid-page (high sun, the relief calms into a faint texture so the content reads easily), dusk at the bottom (long shadows from the upper left; the last light hits the email address and glints on the lake).
- **On desktop the pointer holds the sun while it is over the hero.** Move the mouse and the shadows of "Anthony / De Guzman" sweep across the lakeshore. Leave the hero and the sun eases back to the scroll-driven position.
- **On touch the sun drifts slowly on its own,** and a horizontal drag across the hero moves it.
- **One orchestrated moment on load: a sunrise** (1.6 s). Nothing else animates on its own.
- **Dark scheme = the studio at night.** Charcoal model, warm desk-lamp key light, cool ambient.

Why this is his: he builds the technology behind a mortgage platform (homes, land, the city), every role on the page happened in Toronto, and he already chose to keep a terrain when he cut everything else. The site never explains the metaphor; the footer credit for the elevation data is the only acknowledgement. A visitor who recognises the shoreline gets the reward.

Why it is not a template: no dark-mode developer palette, no cards, no rules, no labels, no gradients. The only colour on the page is light. The single accent (blueprint blue) appears in three places.

Three.js is not used. The renderer is one full-screen fragment shader in raw WebGL2 (about 250 lines of GLSL and 450 lines of JS), keeping the repo at zero dependencies and zero build step.

**Settled decisions (do not re-open):**

1. Light scheme by default; dark scheme only via `prefers-color-scheme: dark`. No toggle.
2. One typeface (Bricolage Grotesque). The current Martian Mono and Newsreader files are removed. No italics, no monospace.
3. The header is not fixed; it sits at the top of the hero and scrolls away. No header background, no blur.
4. No scroll-reveal animations, no hover transforms, no sticky section titles (sticky elements would desynchronise the baked relief mask).
5. All letter blocks are the same height (10 px desktop, 8 px mobile), like letters cut from one sheet.
6. The day arc keeps the sun in the **upper half of the screen** (azimuth 35° → 90° → 145°). Light from the bottom of a north-up relief makes valleys read as ridges. The pointer may put the sun anywhere; that is deliberate.
7. Terrain parallax: the model scrolls slower than the page (factor 0.12 desktop, 0.06 mobile); under reduced motion it is locked to the page.
8. Copy is fixed (section 6). No legends, coordinates, compass marks, or captions in the hero.
9. No external requests at runtime. Terrain, font and scripts are committed to the repo.

## 3. Hard constraints

- **GitHub Pages, static only.** No build step, no package manager in the repo, no server code. Keep `.nojekyll`, `CNAME`, `robots.txt`, `sitemap.xml`, `google8231d8c64647170e.html`, `pinterest-1ac16.html` and the whole `blog/` directory byte-identical. Root-relative URLs (`/css/main.css`) are correct because the site is served from the domain root. Pages infers MIME types from extensions (`.js` → `application/javascript`, `.woff2` → `font/woff2`, `.png`, `.svg`, `.json` all fine); do not rely on custom headers.
- **Native ES modules** (`<script type="module">`), so local testing needs an HTTP server: `python3 -m http.server 8000` from the repo root.
- **Copy is fixed.** Use section 6 verbatim. New words are allowed only for UI (nav, link labels, footer credit, 404).
- **Accessibility floor:** real text in the DOM, canvas `aria-hidden`, visible keyboard focus, WCAG AA contrast (rules in 4.3), `prefers-reduced-motion` respected, `forced-colors` handled, skip link retained.
- **Performance floor:** first paint is plain HTML on flat plaster; the WebGL layer boots after idle and fades in; when the sun is settled the page does zero work. New assets: one font (~100 KB), terrain PNGs (≤ 400 KB desktop, ≤ 120 KB mobile), JS ≤ 30 KB unminified.
- **Do not use** (the tells): uppercase tracked labels, numbered section markers, "WORD — fragment" kickers, middle-dot separators, arrows or "↗" on links, monospace for data, hairline rule grids, cards with shadows, glass blur, gradient washes, scroll-triggered fade-ups, hover lifts, emoji, Inter/Space Grotesk/Geist, cream-and-terracotta, black-and-acid-green.

## 4. Design system

### 4.1 Typeface

One family: **Bricolage Grotesque** (variable; `opsz` 12–96, `wght` 200–800; SIL OFL 1.1, © Mathieu Triay). A grotesque with drawn, slightly hand-cut terminals, which suits graphite lettering on a model; the optical-size axis gives a refined display cut at 170 px and a sturdy text cut at 14 px from one file.

Vendor once (the README already documents this approach for the current fonts):

```
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
```

Take the `src` URL of the block whose `unicode-range` starts with `U+0000-00FF` (the latin subset) and save it as `fonts/bricolage-grotesque-latin.woff2`. Delete `fonts/martian-mono-wght-latin.woff2` and `fonts/newsreader-italic-wght-latin.woff2`.

```css
@font-face {
  font-family: "Bricolage Grotesque";
  src: url("/fonts/bricolage-grotesque-latin.woff2") format("woff2");
  font-weight: 200 800;
  font-display: swap;
}
@font-face {                     /* metric-matched fallback, same technique as the current CSS */
  font-family: "Bricolage Fallback";
  src: local("Helvetica Neue"), local("Helvetica"), local("Arial");
  size-adjust: 96%; ascent-override: 92%; descent-override: 24%; line-gap-override: 0%;
}
```

Global: `font-family: "Bricolage Grotesque", "Bricolage Fallback", system-ui, sans-serif; font-optical-sizing: auto; font-synthesis: none; -webkit-font-smoothing: antialiased`. Dates use `font-variant-numeric: tabular-nums`. Preload the woff2 in `<head>`.

### 4.2 Type scale

| Role | Size | Weight | Leading | Notes |
|---|---|---|---|---|
| Name (h1), two lines | `clamp(56px, 11.5vw, 172px)` | 620 | 0.92 | `data-relief`. "Anthony" / "De Guzman" on two lines via `<br>`. `letter-spacing: 0`. |
| Tagline | `clamp(22px, 2.4vw, 36px)` | 300 | 1.22 | max-width 24ch, colour `--ink` |
| Section title (h2) | `clamp(26px, 2.2vw, 34px)` | 520 | 1.1 | `data-relief`; plain words: About, Experience, Work, Contact |
| Project name (h3) | `clamp(32px, 4vw, 56px)` | 560 | 1.0 | `data-relief` |
| Email (contact) | `clamp(22px, 3vw, 40px)` | 400 | 1.1 | `data-relief` |
| Body | 17px | 400 | 1.55 | max-width 62ch |
| Body, secondary | 16px | 400 | 1.55 | colour `--ink-2`, mid-page only (see 4.3) |
| Small (dates, nav, hero meta, footer) | 14px | 450 | 1.5 | sentence case, no tracking |

Relief elements (`data-relief`) must have `letter-spacing: 0`, `font-stretch: 100%`, no `text-transform`, no `font-feature-settings`, and must not sit inside a transformed or sticky ancestor. No uppercase or tracking anywhere on the page.

### 4.3 Colour

The page has no brand colour. The plaster is neutral; colour comes from the light. One accent for interactive state. The CSS `--plaster` token is defined as **the colour of flat, lit plaster at noon**, and the renderer is calibrated so its flat ground at noon equals that token exactly (8.7), which keeps the CSS fallback and the WebGL layer identical.

Light scheme ("day"):

| Token | Value | Use |
|---|---|---|
| `--plaster` | `#E4E3DE` | page background, poster fallback, model albedo |
| `--plaster-lit` | `#F4F3EF` | selection background |
| `--plaster-shade` | `#B8BCC2` | disabled/placeholder only |
| `--ink` | `#1C1D20` | text |
| `--ink-2` | `#5A5D62` | secondary text (5.0:1 on `--plaster`) |
| `--accent` | `#2038C8` | link hover underline, current-role marker, focus ring (7.4:1) |

Dark scheme ("studio at night"), via `@media (prefers-color-scheme: dark)` on the same tokens:

| Token | Value |
|---|---|
| `--plaster` | `#2E2F33` |
| `--plaster-lit` | `#5A5B60` |
| `--plaster-shade` | `#0A0A0C` |
| `--ink` | `#ECEBE6` |
| `--ink-2` | `#9C9EA4` |
| `--accent` | `#8391FF` |

Shader light colours are in 8.7. Two `<meta name="theme-color">` tags with `media` attributes: `#E4E3DE` light, `#2E2F33` dark. `::selection`: `--ink` on `--plaster-lit`.

**Contrast rule.** Fully shadowed plaster renders near `#9B9B9B` (light scheme); `--ink` keeps ≥ 5.9:1 there, `--ink-2` does not. Therefore `--ink-2` is used only in the About, Experience and Work bodies (mid-page, high sun, 5 px shadows). The hero meta cluster, the Contact section and the footer use `--ink`.

### 4.4 Layout

- Page column `--page-max: 1280px`, gutter `clamp(20px, 5vw, 72px)`. Everything left-aligned. Nothing centred.
- **Header:** `position: absolute; top: 0` inside the hero, 64 px tall, no background, no border. Left: "Anthony De Guzman" (14 px, weight 500, link to `#top`). Right: About / Experience / Work / Contact (14 px, weight 450, `--ink`). Under 720 px the header wraps to two rows (name, then the links).
- **Hero:** `min-height: 100svh`, `touch-action: pan-y`. The name block starts at about 36% of the viewport height, tagline below it, and a small bottom-left cluster holds "Toronto, Canada" and the link "Get in touch". At desktop widths the lake occupies roughly the bottom third of the hero (8.6).
- **Sections:** two columns from 900 px: `grid-template-columns: minmax(180px, 280px) minmax(0, 62ch); column-gap: 48px`; the title sits in the left column (not sticky). Under 900 px: one column. Section padding `clamp(96px, 14vh, 176px)` block, 80 px on mobile.
- **Dividers** between sections are grooves engraved in the model (`<hr class="groove" data-engrave>`, full viewport width, 1 px tall), drawn by the shader (8.4) and lit by the same sun as everything else. While the relief is rendering, the hr's own line is transparent (`html.relief-on .groove { border-color: transparent }`); in the fallback it is a 1 px line at 8% ink.
- **Footer:** three items on one row (© year name | elevation credit | Back to top), 14 px `--ink`; stacks on mobile.

Desktop wireframe:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Anthony De Guzman                    About  Experience  Work  Contact │
│                                                                      │
│                                                                      │
│   Anthony                    ← standing letters, long shadows        │
│   De Guzman                     sweeping over the ravines            │
│                                                                      │
│   Co-founder of Breezeful. I lead                                    │
│   technology and build digital products.                             │
│                                                                      │
│                                                                      │
│   Toronto, Canada                harbour line, the Islands           │
│   Get in touch                        ~ lake with a moving glint ~   │
└──────────────────────────────────────────────────────────────────────┘
──────────────────────────── engraved groove ───────────────────────────

  About              I'm a developer and co-founder of Breezeful. I lead
                     technology and stay involved in the day-to-day work
                     of building the company.

                     Based in Toronto, Canada. I work in English and French.
                     BA, University of Waterloo, 2014.

                     Areas of experience
                     TypeScript / JavaScript   SQL / PostgreSQL   Product engineering
                     React / Next.js           Python             Analytics / data visualization
                     Node.js                   Ruby on Rails      Growth / SEO

──────────────────────────── engraved groove ───────────────────────────

  Experience         ● 2020 to now  Co-founder, Breezeful
                                    Lead all technology initiatives at ...
                       2017 to 2019 Head of Growth, Cover Financial
                       2017         SEO Specialist, Shopify
                       2014 to 2017 Earlier experience

──────────────────────────── engraved groove ───────────────────────────

  Work               Breezeful                               breezeful.com
                     A Y Combinator-backed digital mortgage platform
                     serving the U.S. and Canada.
                     Role. Co-founder. I lead technology initiatives ...
                     Build. Full-stack TypeScript with React, Node.js ...

                     Page Outil                              pageoutil.com
                     ...

──────────────────────────── engraved groove ───────────────────────────

  Contact            email@anthonydeguzman.com      ← last light of the day
                     LinkedIn

  © 2026 Anthony De Guzman   Elevation data: USGS, via Mapzen terrain tiles   Back to top
```

### 4.5 Components

- **Links:** `--ink`, 1 px underline, `text-underline-offset: 0.18em`, `text-decoration-color: color-mix(in srgb, var(--ink) 35%, transparent)`; on hover the underline colour becomes `--accent` (120 ms). External links open in a new tab with `rel="noopener noreferrer"`; no arrow glyphs. Focus: `outline: 2px solid var(--accent); outline-offset: 3px`.
- **Nav:** the links above without underline.
- **Experience entry:** `grid-template-columns: 120px 1fr` (stacks on mobile). Date in `--ink-2`, tabular ("2020 to now", "2017 to 2019", "2017", "2014 to 2017"), inside `<time>`. Role and organisation on one line at 17 px weight 500 ("Co-founder, Breezeful"). Description as short paragraphs at 16 px `--ink-2`, not a bulleted list. The current role gets a 6 px `--accent` disc before its date (the one marker that is information: it says "now").
- **Work entry:** heading row with the project name (h3, `data-relief`) on the left and the plain domain as a link on the right ("breezeful.com", "pageoutil.com"); summary at 20 px weight 350; then run-in paragraphs with a bold lead word ("**Role.** …", "**Build.** …" / "**Focus.** …"). 64 px between entries, no borders.
- **Contact:** the email as a large link (`data-relief` on its inner span), then "LinkedIn" as a normal link on the next line.
- **Poster (no-WebGL fallback):** body background `--plaster` plus one soft radial at the bottom of the hero (`radial-gradient(60% 40% at 70% 85%, color-mix(in srgb, var(--plaster-shade) 30%, transparent), transparent)`) so the page still has a horizon-like weight. Nothing else.

### 4.6 Motion

- Sunrise on load (8.7), once, 1600 ms, ease-out cubic. Reduced motion: none.
- Sun follows pointer/scroll with exponential smoothing (time constant 140 ms).
- Idle drift on touch devices only, while the hero is on screen: azimuth ± 6° on a 38 s sine, altitude ± 2.5° on a 51 s sine, at most 24 fps. Fine-pointer devices rest (zero work when idle).
- Link underline colour 120 ms. Nothing else transitions. No scroll reveals, no hover transforms.

## 5. Page structure (HTML outline)

Rewrite `index.html`. Keep the `<head>` metadata (title, description, canonical, Open Graph, Twitter, icons, JSON-LD Person) with the copy from section 6; update `theme-color`, font preload, `modulepreload` for `/js/main.js` and `/js/relief.js`. Do not preload the terrain image (it loads after idle on purpose).

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="model" aria-hidden="true"><canvas id="relief"></canvas></div>   <!-- fixed, inset 0, z-index -1 -->
  <main id="main">
    <section class="hero" id="top" aria-labelledby="name">
      <header class="site-header">
        <a class="site-name" href="#top">Anthony De Guzman</a>
        <nav aria-label="Primary"><a href="#about">About</a><a href="#experience">Experience</a><a href="#work">Work</a><a href="#contact">Contact</a></nav>
      </header>
      <h1 id="name" data-relief>Anthony<br>De Guzman</h1>
      <p class="tagline">Co-founder of Breezeful. I lead technology and build digital products.</p>
      <p class="hero-meta"><span>Toronto, Canada</span><a href="#contact">Get in touch</a></p>
    </section>
    <hr class="groove" data-engrave>
    <section id="about" aria-labelledby="about-title"><span id="skills" class="anchor-alias"></span>
      <h2 id="about-title" data-relief>About</h2>
      <div> <p>…</p> <p>…</p> <h3>Areas of experience</h3> <ul class="areas">…</ul> </div>
    </section>
    <hr class="groove" data-engrave>
    <section id="experience" aria-labelledby="experience-title"> <h2 data-relief>Experience</h2> <ol class="roles" reversed>…</ol> </section>
    <hr class="groove" data-engrave>
    <section id="work" aria-labelledby="work-title"><span id="projects" class="anchor-alias"></span>
      <h2 data-relief>Work</h2> <article>…<h3 data-relief>Breezeful</h3>…</article> <article>…<h3 data-relief>Page Outil</h3>…</article>
    </section>
    <hr class="groove" data-engrave>
    <section id="contact" aria-labelledby="contact-title"> <h2 data-relief>Contact</h2>
      <a class="email" href="mailto:email@anthonydeguzman.com"><span data-relief>email@anthonydeguzman.com</span></a>
      <a href="https://www.linkedin.com/in/anthonydeguzman" target="_blank" rel="me noopener noreferrer">LinkedIn</a>
    </section>
  </main>
  <footer class="site-footer"> <p>© <span id="year">2026</span> Anthony De Guzman</p> <p>Elevation data: USGS, via Mapzen terrain tiles</p> <a href="#top">Back to top</a> </footer>
  <script type="module" src="/js/main.js"></script>
</body>
```

`id="projects"` and `id="skills"` alias spans keep old links working. `data-relief` elements are raised on the model; `data-engrave` elements are cut into it.

## 6. Copy inventory (verbatim; do not rewrite)

Head:
- `<title>`: Anthony De Guzman — Developer &amp; Co-founder, Breezeful
- description: Anthony De Guzman is a Toronto-based developer and co-founder of Breezeful. He leads technology and builds digital products.
- og/twitter title: Anthony De Guzman — Developer &amp; Co-founder
- og/twitter description: Co-founder of Breezeful. I lead technology and build digital products.
- JSON-LD: keep the current Person block exactly (name, url, email, jobTitle "Developer and Co-founder", worksFor Breezeful https://breezeful.com, alumniOf University of Waterloo, knowsLanguage en/fr, knowsAbout list, sameAs LinkedIn).

Hero: h1 "Anthony" / "De Guzman". Tagline: Co-founder of Breezeful. I lead technology and build digital products. Meta: Toronto, Canada. Link: Get in touch.

About:
- I’m a developer and co-founder of Breezeful. I lead technology and stay involved in the day-to-day work of building the company.
- Based in Toronto, Canada. I work in English and French. BA, University of Waterloo, 2014.
- Subheading: Areas of experience. List: TypeScript / JavaScript; React / Next.js; Node.js; SQL / PostgreSQL; Python; Ruby on Rails; Product engineering; Analytics / data visualization; Growth / SEO

Experience (reverse chronological):
1. 2020 to now (current) — Co-founder, Breezeful — Lead all technology initiatives at a Y Combinator-backed mortgage-tech startup serving U.S. and Canadian markets. / Build the full-stack TypeScript platform with React, Node.js, Redis, PostgreSQL, and infrastructure across AWS, GCP, and Heroku. / Work across architecture, data, visualization, and company operations. (`<time datetime="2020-01">`)
2. 2017 to 2019 — Head of Growth, Cover Financial — Led growth and marketing and built the six-person team from scratch. / Owned acquisition, retention, analytics, new channels, and the referral program. (`datetime="2017-12/2019-12"`)
3. 2017 — SEO Specialist, Shopify — Led SEO and growth initiatives across reporting, automation, and scaling. / Implemented audits in Ruby on Rails and worked on Shopify Brochure, Exchange, Burst, and Shopify Plus. (`datetime="2017-03/2017-12"`)
4. 2014 to 2017 — Earlier experience — **SEO Manager / SEO Specialist, Saatchi & Saatchi.** Led bilingual organic search work for Toyota Canada, Lexus, Scion, and TJX Canada. / **SEO & Marketing Analyst, Stylekick.** Joined as an intern, was promoted to analyst, and worked across app-store discovery, acquisition, and analytics. (`datetime="2014-05/2017-02"`)

Work:
1. Breezeful — breezeful.com (https://breezeful.com) — A Y Combinator-backed digital mortgage platform serving the U.S. and Canada. — Role. Co-founder. I lead technology initiatives and work across engineering and company operations. — Build. Full-stack TypeScript with React, Node.js, Redis, PostgreSQL, and infrastructure across AWS, GCP, and Heroku.
2. Page Outil — pageoutil.com (https://pageoutil.com) — A focused tool for practical, page-level SEO insights. — Role. Independent creator. — Focus. Making on-page optimization easier to understand and act on.

Contact: email@anthonydeguzman.com (mailto). LinkedIn → https://www.linkedin.com/in/anthonydeguzman.

Footer: © 2026 Anthony De Guzman (year set by JS). Elevation data: USGS, via Mapzen terrain tiles. Back to top.

404 page: Page not found. / The page you’re looking for doesn’t exist. / Return home (link to `/`). Same plaster and type, poster only, no JS, no nav.

## 7. Assets

### 7.1 Terrain heightmap (baked once, committed as PNG)

Files: `assets/terrain/toronto-1024.png` (1024 × 896, RGB8), `assets/terrain/toronto-512.png` (512 × 448), `assets/terrain/toronto.json` (provenance, not fetched at runtime). Channels: **R = elevation** with a gamma that lifts the lakeshore and ravine band, `R = 255 · ((elev_m − 70) / 280) ^ 0.75`; **G = water mask** (255 on Lake Ontario and the connected harbour); B = 0. Row 0 is north. No `gAMA`/`sRGB`/`iCCP` chunks.

Source: Mapzen Terrarium elevation tiles on the AWS Open Data Registry (public, no key): `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, 256 px 8-bit RGB non-interlaced PNG, `elev_m = R × 256 + G + B / 256 − 32768`. Verified live; for this bounding box the imagery source header is `ned13` (USGS National Elevation Dataset, 1/3 arc-second, public domain), hence the footer credit.

Parameters:

```
Z = 12; TX = 1141..1148; TY = 1490..1496          # 56 tiles, mosaic 2048 × 1792 px, ~27.6 m per px, ~5.6 MB download once
WEST, NORTH, SOUTH = -79.70, 43.95, 43.55          # 8:7 crop anchored west/north/south; east edge derives to -79.0672
lon2px(lon) = (lon + 180) / 360 · 2^Z · 256
lat2px(lat) = (1 − ln(tan φ + sec φ) / π) / 2 · 2^Z · 256
x0 = lon2px(WEST) = 292144.9;  y0 = lat2px(NORTH) = 381485.3;  y1 = lat2px(SOUTH) = 383098.2
H = y1 − y0 = 1612.9;  W = H · 8 / 7 = 1843.3     # crop size in mosaic px; crop origin inside the mosaic = (48.9, 45.3)
ELEV_MIN, ELEV_MAX, GAMMA = 70, 350, 0.75
LAKE_LEVEL, LAKE_THRESH = 74.5, 75.3               # metres
LAKE_SEED = (-79.30, 43.58)                        # open water south of the Islands
SOUTH_APRON = 24                                   # bottom rows blended to lake so CLAMP_TO_EDGE continues the lake southward
```

Bake script (scratchpad, not committed; describe the procedure in README):

1. Fetch the 56 tiles, cache on disk.
2. Decode PNG. No Pillow is installed; either `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install pillow numpy`, or a ~40-line pure-Python reader (parse chunks, zlib-decompress IDAT, undo filters 0–4 per row; colour type 2 or 6). numpy 2.5 is available system-wide.
3. Stitch, convert to metres, prefilter with a [1,2,1]/4 kernel in both axes, crop to the box above (fractional edges are fine), and resample by bilinear sampling of pixel centres to 1024 × 896 and 512 × 448.
4. Water: scan-line flood fill from the seed over pixels ≤ 75.3 m; that region is water; set its elevation to 74.5 m so the surface is perfectly flat. Unconnected flat patches stay land. Check that the Toronto Islands survive (75–80 m); if they dissolve, lower the threshold to 75.0 or bake from z13 (224 tiles) and downsample.
5. Encode R with the gamma mapping (water pixels get the exact lake value, R ≈ 11); G = water × 255.
6. South apron: over the last 24 rows blend R to the lake value and G to 255 so the final row is 100% lake.
7. Write RGB8 PNGs (pure Python: per-row Sub/Up adaptive filter, zlib level 9, IHDR/IDAT/IEND with CRC32). Also write a hillshade preview PNG to the scratchpad and look at it with the Read tool: the harbour, the Islands, the Bluffs and the Don/Humber ravines must be recognisable, and the bottom row must be all lake.
8. Expected sizes: 200–350 KB and 60–100 KB. If the large file exceeds 400 KB, raise the prefilter radius.

`toronto.json` (also mirrored as a `META` constant in `relief.js`):

```json
{ "source": "Mapzen Terrain Tiles on AWS Open Data, terrarium z12 x1141-1148 y1490-1496; imagery source ned13 (USGS NED 1/3 arc-second)",
  "bbox": { "west": -79.70, "east": -79.0672, "south": 43.55, "north": 43.95 },
  "size": [1024, 896], "metersPerTexel": 49.7,
  "elevation": { "minM": 70, "maxM": 350, "gamma": 0.75 },
  "lake": { "levelM": 74.5, "thresholdM": 75.3 },
  "anchors": { "harbourV": 0.776, "islandsV": 0.825, "bluffsV": 0.626, "downtownU": 0.506, "humberU": 0.363, "donU": 0.553 },
  "southApronRows": 24 }
```

### 7.2 Icons and social image

- `favicon.svg`: plaster square `#E4E3DE` (rx 14), the existing "A" path in ink `#1C1D20`, a 5 px sun disc `#FFB27A` top-right.
- `apple-touch-icon.png` (180 × 180) and a 32 × 32 PNG for the `.ico`: render the SVG with headless Chrome (`--screenshot`, `--window-size=180,180`, a tiny HTML page showing the SVG full-bleed). Wrap the 32 × 32 PNG in a minimal ICO container (6-byte header, one 16-byte directory entry, then the PNG bytes). If headless rendering fails, keep the current `favicon.ico` and note it as a follow-up.
- `assets/og/og.png` (1200 × 630): headless screenshot of `http://localhost:8000/?og&relief=force&scroll=0` (`og` hides the header and the hero meta cluster). Fallback: a static composition in the poster style.

## 8. Renderer (`js/relief.js` + `js/shaders.js`)

Raw WebGL2, one program, one full-screen triangle, no library.

### 8.1 Boot and API

```js
// js/relief.js
export async function init(canvas, options) → Promise<dispose>
// options: { tier: "D"|"M", reducedMotionQuery, darkQuery, hero, terrainUrl, allowSoftwareGL, debug, pinSun, scrollTo }
```

`js/main.js` (rewrite, keeping the current file's shape):

```js
const params = new URLSearchParams(location.search);          // dev switches, harmless in production
initYear(); scheduleRelief();
function scheduleRelief() {
  if (params.get("relief") === "off") return;
  if ("requestIdleCallback" in window) requestIdleCallback(() => void initRelief(), { timeout: 1200 });
  else setTimeout(() => void initRelief(), 32);
}
async function initRelief() {
  const canvas = document.querySelector("#relief");
  const force = params.get("relief") === "force";
  if (!canvas || (navigator.connection?.saveData && !force)) return;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;
  const tier = coarse || innerWidth < 900 || lowMemory ? "M" : "D";
  try {
    const { init } = await import("/js/relief.js");
    await init(canvas, {
      tier,
      reducedMotionQuery: matchMedia("(prefers-reduced-motion: reduce)"),
      darkQuery: matchMedia("(prefers-color-scheme: dark)"),
      hero: document.querySelector(".hero"),
      terrainUrl: tier === "D" ? "/assets/terrain/toronto-1024.png" : "/assets/terrain/toronto-512.png",
      allowSoftwareGL: force,                       // failIfMajorPerformanceCaveat: !force
      debug: params.get("relief") === "debug",      // mask overlay + window.__relief counters
      pinSun: params.get("sun"),                    // "az,alt" in degrees → static sun, no sunrise/drift/pointer
      scrollTo: params.get("scroll")                // "0".."1" → scroll after the first frame (screenshots)
    });
  } catch (error) { console.warn("Relief unavailable; keeping the CSS poster.", error); }
}
```

Inside `init`:

1. `gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: !allowSoftwareGL })`. If null or `MAX_TEXTURE_SIZE < 2048`, throw (the poster stays).
2. Compile the program; inject `STEPS`/`MAX_DIST` (24/320 for D, 12/200 for M) via placeholder replacement. Cache uniform locations.
3. Load the terrain: `img.src = terrainUrl; await img.decode()`. On failure, `import("./terrain.js")` and build a 256 × 160 RGB fallback from `makeTerrain()` (R = normalised height, G = 255 where height < min + 0.22 × range).
4. Create the mask texture, bake once fonts are ready (8.8) with a 2.5 s cap.
5. `layout()` → first `draw()` with the sun below the horizon → add `is-rendered` to `.model` and `relief-on` to `<html>` → start the sunrise (unless reduced motion or `pinSun`).
6. Listeners (all passive): window `scroll`; `ResizeObserver` on `documentElement` (canvas resize + `layout()` immediately, mask rebake debounced 150 ms when doc width/height changed by more than 1 px); `pointermove/pointerleave/pointerdown/pointerup/pointercancel` on the hero; `visibilitychange`; `IntersectionObserver` on the hero (`heroVisible`); `document.fonts` `loadingdone`; `darkQuery.change`; `reducedMotionQuery.change`; `webglcontextlost` (preventDefault, remove `is-rendered`) / `webglcontextrestored` (rebuild textures and program, rebake, redraw).

`dispose()` removes everything and deletes GL resources.

### 8.2 Coordinate conventions (put these as comments at the top of the shader)

- **JS / sun-controller space:** `+x` right, `+y` up the page (north), `+z` out of the screen. `u_light` is the unit vector toward the sun in this space.
- **Shader space:** CSS px with **y down** (matches the DOM, the mask canvas rows, and PNG row 0 = north = v 0). `gl_FragCoord` is y-up in render px; the first line of `main` converts it. The light vector is flipped **exactly once**: `L = normalize(vec3(u_light.x, −u_light.y, u_light.z))`. Normals, marches and mask offsets then all live in y-down space.
- Sanity test: a sun at the upper right (`u_light ≈ (0.7, 0.7, 0.17)`) must produce shadows toward the lower left of the screen.

### 8.3 Uniforms

| Uniform | Type | Meaning |
|---|---|---|
| `u_terrain` | sampler2D (unit 0) | RGB8, R elevation 0..1, G water 0..1 |
| `u_mask` | sampler2D (unit 1) | RGBA8 document-space mask, R = letter coverage, G = engraved lines |
| `u_viewport` | vec2 | CSS px (w, h) |
| `u_renderScale` | float | render px per CSS px |
| `u_scroll` | vec2 | (scrollX, scrollY) CSS px |
| `u_parallax` | float | 0.12 (D), 0.06 (M), 1.0 under reduced motion |
| `u_terrainOrigin`, `u_terrainSize` | vec2, vec2 | terrain rect in layer space, CSS px (8.6) |
| `u_docSize` | vec2 | document size in CSS px at bake time |
| `u_terrainHeight` | float | px for R = 1.0 (8.6) |
| `u_plateau` | float | letter block height, 10 px (D) / 8 px (M) |
| `u_groove` | float | engraved line depth, 3 px |
| `u_light` | vec3 | unit vector toward the sun, y-up space |
| `u_keyColor` | vec3 | linear RGB × intensity (altitude-adjusted in JS) |
| `u_ambientColor` | vec3 | linear RGB |
| `u_albedo`, `u_waterAlbedo` | vec3 | linear RGB |
| `u_time` | float | seconds, advanced only by rendered frames |
| `u_grain` | float | plaster grain amount (1.0 light, 0.6 dark) |
| `u_shadowSoft` | float | penumbra factor (10 D, 8 M) |
| `u_sidePx` | float | side-face offset, 2.5 px |
| `u_glint` | float | water specular strength (0.5 light, 0.9 dark) |

### 8.4 Shaders (GLSL ES 3.00)

Vertex shader: a full-screen triangle from `gl_VertexID` (no buffers).

```glsl
#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
```

Fragment shader (write directly from this; placeholders `__STEPS__` / `__MAX_DIST__` are replaced at compile time):

```glsl
#version 300 es
precision highp float;            // highp is mandatory: document-space uv over 10k+ px
precision highp sampler2D;
#define STEPS __STEPS__
#define MAX_DIST __MAX_DIST__
uniform sampler2D u_terrain, u_mask;
uniform vec2 u_viewport, u_scroll, u_terrainOrigin, u_terrainSize, u_docSize;
uniform float u_renderScale, u_parallax, u_terrainHeight, u_plateau, u_groove, u_time, u_grain, u_shadowSoft, u_sidePx, u_glint;
uniform vec3 u_light, u_keyColor, u_ambientColor, u_albedo, u_waterAlbedo;
out vec4 fragColor;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec3 toSrgb(vec3 c) { return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

// gl_FragCoord → viewport CSS px (y down) → terrain uv (parallax layer) / mask uv (document)
vec2 fragToCss(vec2 fc) { vec2 css = fc / u_renderScale; return vec2(css.x, u_viewport.y - css.y); }
vec2 layerOf(vec2 v)    { return vec2(v.x, v.y + u_scroll.y * u_parallax); }     // the model moves up at parallax speed
vec2 terrainUv(vec2 v)  { return (layerOf(v) - u_terrainOrigin) / u_terrainSize; }
vec2 maskUv(vec2 v)     { return (v + u_scroll) / u_docSize; }                    // document coords, factor 1.0

vec2  maskAt(vec2 v)    { return texture(u_mask, maskUv(v)).rg; }                 // (letters, grooves)
vec2  terrainAt(vec2 v) { return texture(u_terrain, terrainUv(v)).rg; }           // (elev01, water01)
float heightAt(vec2 v)  { vec2 m = maskAt(v); return terrainAt(v).r * u_terrainHeight + m.r * u_plateau - m.g * u_groove; }

vec3 normalAt(vec2 v, float e) {                              // central differences, y-down space
  float hx = heightAt(v + vec2(e, 0.0)) - heightAt(v - vec2(e, 0.0));
  float hy = heightAt(v + vec2(0.0, e)) - heightAt(v - vec2(0.0, e));
  return normalize(vec3(-hx, -hy, 2.0 * e));
}

float softShadow(vec2 v, float h0, vec3 L) {                  // march toward the sun, geometric step growth, penumbra estimate
  float horiz = length(L.xy);
  if (horiz < 1e-3) return 1.0;                               // sun overhead
  float slope = L.z / horiz;                                  // px climbed per px travelled
  if (slope <= 0.0) return 0.0;                               // sun below the horizon (start of the sunrise)
  vec2 dir = L.xy / horiz;
  float maxH = u_terrainHeight + u_plateau;
  float t = 1.5;                                              // first step 1.5 px: contact shadows at letter bases
  float grow = pow(float(MAX_DIST) / 1.5, 1.0 / float(STEPS - 1));
  float res = 1.0;
  for (int i = 0; i < STEPS; i++) {
    float rayH = h0 + 0.35 + t * slope;                       // small bias against acne
    if (rayH > maxH) break;                                   // nothing can occlude above the tallest point
    float d = rayH - heightAt(v + dir * t);
    if (d < 0.0) return 0.0;
    res = min(res, u_shadowSoft * d / t);
    t *= grow;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

vec3 shadeWater(vec2 layerPx, vec3 L, float shadow) {         // flat Blinn-Phong, faint animated ripple for glint texture
  vec2 q = layerPx * 0.35;
  vec2 rip = vec2(vnoise(q + u_time * 0.15), vnoise(q * 1.7 - u_time * 0.11)) - 0.5;
  vec3 N = normalize(vec3(rip * 0.10, 1.0));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));                // orthographic top-down: view vector is +z
  float spec = pow(max(dot(N, H), 0.0), 48.0) * (0.35 + 0.65 * smoothstep(0.1, 0.6, L.z));
  vec3 col = u_waterAlbedo * (u_ambientColor + u_keyColor * max(L.z, 0.0) * shadow);
  return col + u_keyColor * spec * shadow * u_glint;
}

void main() {
  vec2 v = fragToCss(gl_FragCoord.xy);
  vec3 L = normalize(vec3(u_light.x, -u_light.y, u_light.z)); // the single y flip
  vec2 t = terrainAt(v);
  vec2 m0 = maskAt(v);
  float water = t.g * (1.0 - m0.r);                           // letters are plaster even when they stand in the lake
  float h0 = t.r * u_terrainHeight + m0.r * u_plateau - m0.g * u_groove;
  float e = max(1.0, 1.0 / u_renderScale);
  vec3 N = normalAt(v, e);
  float sh = softShadow(v, h0, L);
  float lambert = max(dot(N, L), 0.0);
  float sky = 0.55 + 0.45 * N.z;                              // steep faces see less sky
  vec2 layerPx = layerOf(v);

  // plaster grain: smooth value noise in layer space (moves with the model, never shimmers)
  float g = (vnoise(layerPx * 0.33) - 0.5) * 0.06 + (vnoise(layerPx * 0.045 + 7.0) - 0.5) * 0.04;
  vec3 albedo = u_albedo * (1.0 + u_grain * g);
  vec3 land = albedo * (u_ambientColor * sky * (1.0 - 0.35 * m0.g) + u_keyColor * lambert * sh);
  vec3 lake = shadeWater(layerPx, L, sh);
  vec3 col = mix(land, lake, smoothstep(0.35, 0.65, water));

  // letter side face: sample the mask toward the sun; where the letter is there but not here, this fragment
  // is on the letter's far side → darken. Fades toward noon.
  float horiz = max(length(L.xy), 1e-3);
  float m1 = texture(u_mask, maskUv(v + (L.xy / horiz) * u_sidePx)).r;
  float side = clamp(m1 - m0.r, 0.0, 1.0);
  col *= 1.0 - 0.5 * side * (1.0 - 0.5 * L.z);

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(toSrgb(col) + (hash21(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);   // 1-bit dither kills banding on plaster
}
```

Optional after everything works: a scribed shoreline (`col *= 1.0 − 0.10 × shorelineBand × (1 − m0.r)`). Keep it subtle or leave it out.

Per-pixel cost on desktop is about 2 + 8 + 24 × 2 + 1 = 59 texture samples worst case, with early exits at high sun. At a 1728 × 1080 backing store this is fine on Apple and Intel Xe integrated GPUs for on-demand rendering.

### 8.5 Texture and canvas settings

```js
gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);   // data PNG, no colour management
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);                    // row 0 (north) ↦ v = 0 (top)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, terrainImage);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);
// both textures: LINEAR / LINEAR, CLAMP_TO_EDGE / CLAMP_TO_EDGE, no mipmaps
```

Canvas: `.model { position: fixed; inset: 0; z-index: -1 } .model canvas { width: 100%; height: 100%; opacity: 0; transition: opacity 600ms ease } .model.is-rendered canvas { opacity: 1 }`. Backing store: `dpr = min(devicePixelRatio, 2)`; `renderScale = clamp(0.6 × dpr, 0.75, 1.2)` (D) or `clamp(0.5 × dpr, 0.6, 1.0)` (M); `canvas.width = round(vw × renderScale)`, `canvas.height = round(vh × renderScale)`; `gl.viewport` to match. The browser's upscale is wanted (plaster is soft; text is DOM).

### 8.6 Terrain placement (`layout()`, on resize)

```js
const t = state.terrain;                                    // { width, height } of the loaded image
const vw = document.documentElement.clientWidth, vh = innerHeight;
const heroH = hero.getBoundingClientRect().height || vh;
t.texelCss = tier === "D" ? clamp(vw / t.width, 1.0, 2.6)   // cover the viewport width (1440 → 1.41 px per texel)
                          : (t.width >= 1024 ? 1.0 : 2.0);   // mobile: the model is ~1024 CSS px wide
t.cssW = t.width * t.texelCss;  t.cssH = t.height * t.texelCss;
t.originX = tier === "D" ? (vw - t.cssW) / 2 : vw / 2 - META.anchors.downtownU * t.cssW;   // centre downtown on mobile
t.originY = Math.min(0, heroH * 0.68 - META.anchors.harbourV * t.cssH);                    // harbour line at 68% of the hero
t.heightPx = 50 * t.texelCss;                               // px for R = 1.0 (≈70 px at 1440); tune 40–60
t.plateauPx = tier === "D" ? 10 : 8;
```

`u_terrainOrigin = (originX, originY)`, `u_terrainSize = (cssW, cssH)`. Consequences at 1440 × 900: the hero shows roughly the 401 corridor down to the Islands, the harbour line at 68% of the hero, the lake in the bottom third; `parallax 0.12` moves the model about 500 px up over a ~4500 px page, so the shoreline crosses the viewport during Experience and Work and the Contact section sits over the lake, where the dusk glint appears. The south apron plus `CLAMP_TO_EDGE` continues the lake below the image; the negative `originY` hides the top edge; cover scaling keeps the side edges off-screen on desktop. Tune the parallax between 0.10 and 0.20 so that the harbour line reaches the top third of the viewport during Contact, not before Work. Under reduced motion `u_parallax = 1.0` (the model is locked to the page).

### 8.7 Sun controller and light

Convention: `az` counter-clockwise from +x (east) in the y-up page space, `alt` above the horizon; `u_light = (cos alt · cos az, cos alt · sin az, sin alt)`.

- **Scroll arc.** `s = clamp(scrollY / max(1, docH − vh), 0, 1)`; `az = 35° + 110° · s` (upper right → top → upper left); `alt = 10° + 52° · sin(π s) ^ 0.8`. With a 10 px plateau the letter shadows are 57 px at 10° and 5 px at 62°; the terrain (≈70 px crest) casts about 400 px at dawn, hence `MAX_DIST` 320.
- **Pointer (mouse/pen only, over the hero).** With the hero centre (cx, cy): `dx = x − cx`, `dy = −(y − cy)`, `d = hypot(dx, dy) / (0.5 · hypot(w, h))`; `az = atan2(dy, dx)` (hold the last value inside a 5% dead zone); `alt = lerp(70°, 8°, smoothstep(0.05, 1, d))` (centre = overhead, edge = raking). Blend weight eases toward 1 on entry (τ 120 ms) and toward 0 on leave (τ 350 ms). Ignored while the sunrise runs.
- **Touch (coarse pointer).** Hero has `touch-action: pan-y`. `pointerdown` records `lastX`; `pointermove` adds `(x − lastX) × 0.35°` to an azimuth offset; after release the offset decays with τ 8 s. Vertical scrolling is never captured.
- **Idle drift** (touch only, hero on screen, page visible): `az += 6° · sin(2π t / 38 s)`, `alt += 2.5° · sin(2π t / 51 s + 1.3)`, rendered via a 24 fps timer.
- **Smoothing.** `sun += (goal − sun) × (1 − exp(−dt / 0.14 s))` with shortest-arc azimuth. "Settled" = all deltas < 3e-4 rad and blend weights at 0 or 1; when settled and not drifting, no frames are scheduled.
- **Sunrise.** After the first frame: over 1600 ms with ease-out cubic, `alt` goes from −8° to the goal; the shader returns full shadow below the horizon, so the first frame is ambient-only and the light sweeps in.
- **Reduced motion.** Sun fixed at (120°, 40°), no sunrise, no drift, pointer and touch ignored, `u_time` frozen, `u_parallax = 1.0`; renders only on scroll, resize and scheme change.
- **`pinSun`** ("az,alt" degrees): static sun, no sunrise/drift/pointer. Used for screenshots and debugging.

Light colour (JS, linear RGB; `srgbToLinear()` converts the 4.3 tokens):

```js
const sAlt = Math.max(Math.sin(alt), 0.35);                 // exposure normalisation: flat ground stays readable at any altitude
const on = smoothstep(-2°, 5°, alt);                        // fades to black below the horizon
const warmth = smoothstep(2°, 30°, alt);
// light scheme: calibrated so flat ground at noon = --plaster exactly (ambient + key·sin(alt) = 1.0)
albedo  = linear(#E4E3DE);  water = linear(#CDD2D4);  grain = 1.0;  glint = 0.5;
ambient = [0.42, 0.44, 0.48] * (0.85 + 0.15 * warmth);
key     = mix([1.0, 0.62, 0.38], [1.0, 0.97, 0.92], warmth) * (0.58 / sAlt) * on;
// dark scheme: charcoal model, warm lamp; flat ground at noon = --plaster (#2E2F33)
albedo  = linear(#2E2F33);  water = linear(#14161A);  grain = 0.6;  glint = 0.9;
ambient = [0.12, 0.13, 0.16];
key     = [1.0, 0.80, 0.58] * (0.88 / sAlt) * on;
```

Checks: light scheme flats render ≈ `#C3C2BD` at dawn/dusk and `#E4E3DE` at noon; full shadow ≈ `#9B9B9B` (ink ≥ 5.9:1). Dark scheme flats ≈ `#2E2F33`, lamp-facing slopes up to ≈ `#5A5A5A`, shadow ≈ `#0A0A0C` (ink ≥ 11:1).

### 8.8 Text-mask baking

- Wait: `Promise.race([document.fonts.load('620 96px "Bricolage Grotesque"').then(() => document.fonts.ready), sleep(2500)])`; bake; re-bake on `document.fonts` `loadingdone`, on resize (debounced 150 ms, only when the document width or height changed by > 1 px), and once 1 s after `load`.
- Mask canvas: `docW = documentElement.clientWidth`, `docH = documentElement.scrollHeight`, `scale = 0.5`, reduced so that `docH × scale ≤ min(MAX_TEXTURE_SIZE, 8192)`, `docW × scale ≤` the same, and `docW × docH × scale² ≤ 16e6` (iOS canvas limit). Fill black. `ctx.setTransform(scale, 0, 0, scale, 0, 0)` so all drawing is in CSS px. `globalCompositeOperation = "lighter"`.
- Letters (red channel): for each `[data-relief]`, `ctx.font = \`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}\``, `textBaseline = "alphabetic"`, `fillStyle = "#f00"`. Walk its text nodes; for each word (`/\S+/g`) create a `Range`, take `getClientRects()`, skip if not exactly one rect; `baseline = rect.top + scrollY + (rect.height − (asc + desc)) / 2 + asc` with `asc/desc` from `measureText("Hg").fontBoundingBoxAscent/Descent` (fallback 0.9 / 0.25 × font size); draw the word at `rect.left + scrollX`, scaling x by `rect.width / measureText(word).width` when they differ by more than 0.3% (absorbs optical-size and kerning drift). Per-word ranges handle line wrapping and need no DOM changes. Because relief text uses `letter-spacing: 0` and `font-stretch: 100%`, the canvas `letterSpacing`/`fontStretch` APIs are not needed.
- Grooves (green channel): for each `[data-engrave]`, `fillStyle = "#0f0"`, fill a 2 px-tall rect across its document rect.
- Upload the canvas as RGBA8 (8.5). `u_docSize = (docW, docH)` from bake time, so a pending resize cannot stretch it before the rebake lands.
- `relief=debug`: draw the mask canvas as a fixed overlay at 50% opacity (plus the terrain rect outline) to check alignment; expose `window.__relief = { frames, lastFrameMs, maskScale, tier }`. Small misalignment is harmless by design (block tops share the ground albedo), but the red glyphs must sit under the ink glyphs within about 1 px.

### 8.9 Render-on-demand loop

```js
function requestRender() { if (state.rafId || document.hidden) return; state.rafId = requestAnimationFrame(frame); }
function frame(now) {
  state.rafId = 0;
  const dt = Math.min(0.05, (now - state.lastNow) / 1000 || 0); state.lastNow = now;
  readScroll();                                   // one read of scrollX/Y per frame; never read layout elsewhere in the loop
  const status = updateSun(now, dt);              // true while unsettled, "drift" while only drifting, false when settled
  if (!state.reducedMotion) state.animTime += dt;
  draw();
  if (status === "drift") state.timer = setTimeout(requestRender, 1000 / 24);
  else if (status) requestRender();
}
```

Triggers: scroll, resize, pointer move/leave, touch drag, fonts loaded (after rebake), scheme change, visibility → visible, hero enters view, context restored. On `hidden`: cancel the frame and the timer. When settled: zero work. Adaptive quality: if the mean frame time during the sunrise exceeds 40 ms, recompile with 12 steps and drop `renderScale` to 0.5.

### 8.10 Failure paths

- No WebGL2, software GL (without `relief=force`), shader compile error, or `MAX_TEXTURE_SIZE < 2048` → the poster stays; the page is complete without the relief.
- Terrain PNG fails → procedural `makeTerrain()` heightfield (8.1).
- `document.fonts` missing → bake with what the browser has, rebake on `load`.
- Very tall documents → mask scale reduction (8.8).
- Context lost → stop, remove `is-rendered`; restored → rebuild.

## 9. Files

| Path | Action |
|---|---|
| `index.html` | Rewrite per sections 5–6 (keep head metadata, JSON-LD, ids). |
| `404.html` | Restyle with the new tokens and font, poster only, no JS, no nav. |
| `css/main.css` | Rewrite. Keep from the current file: skip link, `.sr-only`, `:focus-visible`, reduced-motion block, `forced-colors` block, the metric-override fallback technique. |
| `js/main.js` | Rewrite per 8.1 (keep `initYear`; drop the reveal and nav observers). |
| `js/relief.js` | New: renderer, sun controller, mask baker, loop. |
| `js/shaders.js` | New: `VERT`, `FRAG` sources as template strings. |
| `js/terrain.js` | Keep unchanged; imported lazily only when the PNG fails. |
| `js/hero.js` | Delete. |
| `fonts/` | Add `bricolage-grotesque-latin.woff2`; delete the Martian Mono and Newsreader files. |
| `assets/terrain/toronto-1024.png`, `toronto-512.png`, `toronto.json` | New (7.1). |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `assets/og/og.png` | Regenerate (7.2). |
| `README.md` | Update: run locally (unchanged); asset provenance: font URL and licence, terrain source/tiles/bbox/parameters/attribution and the bake procedure; the no-external-requests statement. |
| `vendor/` | Remove the empty directory. |

## 10. Build order with checkpoints

1. **Assets.** Vendor the font. Write and run the bake script in the scratchpad. Checkpoint: decode the output with the scratchpad reader (shape 896 × 1024 × 3, water fraction 25–40%, last row G = 255 everywhere, R range ≈ 11..240); hillshade preview reviewed (Islands present, Bluffs and ravines visible); sizes within budget.
2. **Static redesign.** `index.html`, `css/main.css`, `404.html`, `main.js` calling the not-yet-existing module gracefully. Delete `js/hero.js` and the old fonts. Checkpoint: poster-only screenshots (light, dark, 1440 and 390 wide, 404) look finished on their own; no console errors; copy matches section 6; none of the section 3 tells.
3. **Renderer skeleton.** `relief.js` + `shaders.js`: context, program, terrain texture (and the `terrain.js` fallback path), Lambert only, parallax mapping, `is-rendered`. Checkpoint: terrain visible under the page; `?relief=off` and a renamed PNG both degrade correctly.
4. **Full shading.** Soft shadows, water and glint, grain, side faces, grooves, sRGB and dither, scheme uniforms. Checkpoint: `?sun=35,10` long shadows toward the lower left; `?sun=90,62` short shadows downward; `?sun=145,10` toward the lower right; dark scheme reviewed.
5. **Mask baker.** Fonts wait, per-word ranges, grooves, upload, rebake triggers, debug overlay. Checkpoint: overlay aligned within 1 px at 1440 and 390 widths, after a resize, and after a forced late font load.
6. **Sun controller.** Scroll arc, pointer override with blend-out, touch drag, drift, sunrise, reduced motion, live scheme/motion query changes, visibility pause, `pinSun`/`scrollTo`. Checkpoint: headless captures at scroll 0 / 0.5 / 1, reduced motion, dark; manual pointer and touch test; the settled loop schedules no frames.
7. **Performance pass.** Adaptive quality, DPR/render-scale table, mobile Safari check. Checkpoint: frame time < 8 ms on Apple silicon and < 20 ms on an Intel iGPU at 1440 × 900; no memory growth across rebakes.
8. **Ship.** Icons and OG image, README, remove `vendor/`, external-URL grep, GitHub Pages checklist, commit on the branch.

## 11. Verification

- Serve: `python3 -m http.server 8000` from the repo root. Review in Chrome and Safari (Safari is the WebGL2 outlier worth checking) and on a real phone.
- Headless captures. Verified on this machine: Chrome 152 at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` in `--headless=new` mode exposes WebGL2 on the real GPU (ANGLE Metal, `MAX_TEXTURE_SIZE` 16384) with default GL flags, and canvas 2D reports `letterSpacing` and `fontStretch`. Shell gotchas: macOS has no `timeout` binary (use Chrome's `--timeout`), and the user's zsh has `noclobber` set (write to fresh file names or use `>|`).

  ```sh
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  shot() {  # name WxH url [extra flags]
    "$CHROME" --headless=new --no-first-run --user-data-dir=/tmp/adg-chrome --hide-scrollbars \
      --timeout=20000 --virtual-time-budget=8000 --window-size="$2" --screenshot="/tmp/adg-$1.png" "${@:4}" "$3"
  }
  for s in 0 0.5 1; do
    shot "desk-$s" 1440,900 "http://localhost:8000/?relief=force&scroll=$s"
    shot "mob-$s"  390,844  "http://localhost:8000/?relief=force&scroll=$s" --force-device-scale-factor=2
  done
  shot desk-dark 1440,900 "http://localhost:8000/?relief=force&scroll=0"   --force-dark-mode
  shot desk-rm   1440,900 "http://localhost:8000/?relief=force&scroll=0.5" --force-prefers-reduced-motion
  shot poster    1440,900 "http://localhost:8000/?relief=off"
  shot debug     1440,900 "http://localhost:8000/?relief=debug&sun=35,10"
  ```

  Read every PNG with the Read tool and critique it against section 4 before moving on. If a capture shows only the poster, retry with `--use-angle=swiftshader --enable-unsafe-swiftshader`; if `--force-dark-mode` does not flip the scheme in headless, drive Chrome with `puppeteer-core` installed in the scratchpad (never in the repo) and `page.emulateMediaFeatures`.
- Rendering: `.model` gets `is-rendered`; no console errors; `window.__relief.frames > 0` in debug; scrolling stays smooth (passive listeners, one render per frame, no layout reads in the loop).
- `?relief=debug`: red glyphs under the ink glyphs for the name, section titles, project names and the email; green lines on the grooves.
- Reduced motion and dark scheme as above. Keyboard: Tab through the header, hero link and every link; the focus ring is visible on plaster.
- Contrast: ink on plaster ≥ 12:1 at noon; `--ink-2` only in the mid-page bodies; sample the plaster behind the footer at scroll 1 and confirm `--ink` ≥ 4.5:1 there.
- No external requests: `grep -nE "https?://" index.html 404.html css/main.css js/*.js` returns only the owner's outbound links (breezeful.com, pageoutil.com, linkedin.com) and schema.org/og URLs; the DevTools Network panel shows same-origin requests only.
- Copy diff: the visible text matches section 6 exactly.
- GitHub Pages after merge: `curl -sI https://anthonydeguzman.com/js/relief.js` → `content-type: application/javascript`; `.../fonts/bricolage-grotesque-latin.woff2` → `font/woff2`; the terrain PNG and `/blog/` still return 200.
- Real phone: drift runs, a horizontal drag moves the sun, vertical scrolling over the hero is never captured.

## 12. GitHub Pages checklist

- Static files only, root-relative paths, no build step, no `package.json` in the repo (scratchpad installs stay outside; `.gitignore` already lists `node_modules`), no service worker.
- `.nojekyll`, `CNAME`, `robots.txt`, `sitemap.xml`, `google8231d8c64647170e.html`, `pinterest-1ac16.html`, `blog/` untouched.
- Every file well under 1 MB; no Git LFS. Total new payload under 600 KB.
- Same-origin everything, so no CORS concerns for image → WebGL uploads.
- Merge to `master` deploys.

## 13. Definition of done

- The page reads as one continuous plaster model with the type standing on it; dawn, noon and dusk change with scroll; the pointer holds the sun in the hero; the sunrise plays once on load; the lake glints at dusk under the Contact section.
- With WebGL disabled the page is still a finished, calm typographic site.
- Zero external requests, zero dependencies, zero build step; GitHub Pages serves it unchanged.
- Copy matches section 6 exactly; none of the section 3 tells appear; the settled decisions in section 2 hold.
- `git status` shows only the intended files. Suggested commit message: `Redesign site as a lit plaster model of Toronto`.

## 14. Optional refinements (only after section 13 is met and reviewed)

- A year ruler in Experience (2014 → now) with four thin spans; hovering or focusing an entry thickens its span. Graphite, 1–2 px, only the year numerals as labels.
- Small matte screenshots of breezeful.com and pageoutil.com in the Work entries (his own products).
- A keyboard-accessible sun control (`role="slider"`, visually hidden until focused) so keyboard users can move the light too.
- The scribed shoreline line in the shader (8.4).
