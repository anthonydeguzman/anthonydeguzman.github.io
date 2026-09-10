// A plaster relief of Toronto, used as a contained hero illustration. Full-page mode also supports raised display type.
// Raw WebGL2, one program, one full-screen triangle. See js/shaders.js for the coordinate conventions.
import { VERT, FRAG } from "./shaders.js";

const META = {
  anchors: { harbourV: 0.776, islandsV: 0.825, bluffsV: 0.626, downtownU: 0.506 },
  elevation: { minM: 70, maxM: 350, gamma: 0.85, lakeM: 74.5 }
};
const LAKE_LEVEL = ((META.elevation.lakeM - META.elevation.minM) / (META.elevation.maxM - META.elevation.minM)) ** META.elevation.gamma;
const DEG = Math.PI / 180;
const TIERS = {
  D: { near: 16, far: 8, maxDist: 240, shadowSoft: 3, plateau: 6, parallax: 0.12 },
  M: { near: 12, far: 6, maxDist: 160, shadowSoft: 3, plateau: 4, parallax: 0.06 }
};
const PLASTER = { light: srgbToLinear("#e4e3de"), dark: srgbToLinear("#2e2f33") };
const WATER = { light: srgbToLinear("#d5dadb"), dark: srgbToLinear("#262b30") };

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const shortest = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function srgbToLinear(hex) {
  return [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}

function parsePin(value) {
  if (!value) return null;
  const [az, alt] = String(value).split(",").map(Number);
  if (!Number.isFinite(az) || !Number.isFinite(alt)) return null;
  return { az: az * DEG, alt: alt * DEG };
}

export async function init(canvas, options = {}) {
  const {
    tier = "D", reducedMotionQuery = null, darkQuery = null, hero = null, terrainUrl = "/assets/terrain/toronto-1024.png",
    allowSoftwareGL = false, debug = false, pinSun = null, scrollTo = null, og = false, contained = false, sunControl = null
  } = options;
  const cfg = TIERS[tier] || TIERS.D;
  const wrapper = canvas.parentElement;
  const root = document.documentElement;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const raisedContent = !!document.querySelector("[data-relief], [data-engrave]");

  const gl = canvas.getContext("webgl2", {
    alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
    preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: !allowSoftwareGL
  });
  if (!gl) throw new Error("WebGL2 unavailable");
  const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if (maxTexture < 2048) throw new Error("Texture limit too small");

  const state = {
    tier, near: cfg.near, far: cfg.far, renderScale: 1, viewport: { w: 1, h: 1 }, docH: 1,
    scroll: { x: 0, y: 0, progress: 0 },
    terrain: { tex: null, image: null, data: null, width: 1, height: 1, originX: 0, originY: 0, cssW: 1, cssH: 1, heightPx: 50, isFallback: false },
    mask: { tex: null, canvas: document.createElement("canvas"), scale: 0.5, docW: 1, docH: 1, baked: false, timer: 0 },
    sun: { az: 90 * DEG, alt: 40 * DEG },
    pointer: { active: false, weight: 0, az: 0, alt: 0 },
    touch: { dragging: false, startX: 0, startY: 0, lastX: 0, axis: null, azOffset: 0, id: null },
    sunrise: { active: false, t0: 0, dur: 1800, fromAlt: 16 * DEG, fromAz: 0 },
    drift: coarse,
    dark: !!(darkQuery && darkQuery.matches),
    reduced: !!(reducedMotionQuery && reducedMotionQuery.matches),
    pinned: parsePin(pinSun),
    manualSun: null,
    animTime: 0, rafId: 0, timerId: 0, lastNow: 0, heroVisible: true, frames: 0, lastFrameMs: 0,
    frameTimes: [], qualityDropped: false, lost: false, disposed: false
  };
  if (og) root.classList.add("og");

  // ---- program ----
  let program = null;
  let uniforms = {};
  function compile(near, far) {
    const frag = FRAG.replace("__NEAR__", String(near)).replace("__FAR__", String(far)).replace("__MAX_DIST__", String(cfg.maxDist));
    const make = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader: " + gl.getShaderInfoLog(shader));
      return shader;
    };
    const next = gl.createProgram();
    gl.attachShader(next, make(gl.VERTEX_SHADER, VERT));
    gl.attachShader(next, make(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(next);
    if (!gl.getProgramParameter(next, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(next));
    if (program) gl.deleteProgram(program);
    program = next;
    uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    gl.useProgram(program);
    gl.uniform1i(uniforms.u_terrain, 0);
    gl.uniform1i(uniforms.u_mask, 1);
    state.near = near;
    state.far = far;
  }

  // ---- textures ----
  function createTexture() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  function uploadTerrain() {
    const t = state.terrain;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (t.image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, t.image);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, t.width, t.height, 0, gl.RGB, gl.UNSIGNED_BYTE, t.data);
  }

  async function loadTerrain() {
    const t = state.terrain;
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = terrainUrl;
      await image.decode();
      t.image = image;
      t.width = image.naturalWidth;
      t.height = image.naturalHeight;
    } catch (error) {
      const { makeTerrain } = await import("./terrain.js");
      const terrain = makeTerrain();
      const range = terrain.maximum - terrain.minimum || 1;
      const data = new Uint8Array(terrain.width * terrain.depth * 3);
      for (let i = 0; i < terrain.heights.length; i += 1) {
        const h = (terrain.heights[i] - terrain.minimum) / range;
        const value = Math.round(h * 65535);
        data[i * 3] = value >> 8;
        data[i * 3 + 1] = h < 0.22 ? 255 : 0;
        data[i * 3 + 2] = value & 255;
      }
      t.data = data;
      t.width = terrain.width;
      t.height = terrain.depth;
      t.isFallback = true;
      console.warn("Terrain image unavailable; using the procedural fallback.", error);
    }
    uploadTerrain();
  }

  // ---- layout ----
  function layout() {
    const vw = contained ? wrapper.clientWidth : root.clientWidth;
    const vh = contained ? wrapper.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let scale = tier === "D" ? clamp(0.6 * dpr, 0.75, 1.2) : clamp(0.5 * dpr, 0.6, 1.0);
    if (state.qualityDropped) scale = Math.min(scale, 0.5 * dpr, 0.9);
    state.renderScale = scale;
    canvas.width = Math.max(1, Math.round(vw * scale));
    canvas.height = Math.max(1, Math.round(vh * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    state.viewport = { w: vw, h: vh };
    state.docH = Math.max(root.scrollHeight, vh);
    layoutTerrain();
  }

  function layoutTerrain() {
    const t = state.terrain;
    const vw = state.viewport.w;
    const heroH = contained ? state.viewport.h : hero ? hero.getBoundingClientRect().height || state.viewport.h : state.viewport.h;
    if (contained) t.texelCss = Math.max(vw * 1.18 / t.width, heroH * 1.32 / t.height);
    else if (tier === "D") t.texelCss = clamp((vw * 1.08) / t.width, 1.0, t.isFallback ? 12 : 4);   // 4% overscan each side
    else t.texelCss = t.isFallback ? 4 : (t.width >= 1024 ? 1.0 : 2.0);
    t.cssW = t.width * t.texelCss;
    t.cssH = t.height * t.texelCss;
    t.originX = contained || tier === "D" ? (vw - t.cssW) / 2 : vw / 2 - META.anchors.downtownU * t.cssW;
    t.originY = Math.min(0, heroH * 0.68 - META.anchors.harbourV * t.cssH);
    t.heightPx = 22 * t.texelCss;
  }

  // ---- text mask ----
  async function waitForFonts() {
    if (!document.fonts) return;
    const loading = document.fonts.load('620 96px "Bricolage Grotesque"').then(() => document.fonts.ready).catch(() => {});
    await Promise.race([loading, sleep(2500)]);
  }

  function bakeMask() {
    const m = state.mask;
    const docW = root.clientWidth;
    const docH = Math.max(root.scrollHeight, window.innerHeight);
    if (!raisedContent) {
      // The contained model is an illustration, so it needs no document-sized text texture.
      gl.bindTexture(gl.TEXTURE_2D, m.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      Object.assign(m, { scale: 1, docW, docH, baked: true });
      state.docH = docH;
      requestRender();
      return;
    }
    const limit = Math.min(maxTexture, 8192);
    let scale = 0.75;
    if (docH * scale > limit) scale = limit / docH;
    if (docW * scale > limit) scale = Math.min(scale, limit / docW);
    if (docW * docH * scale * scale > 16e6) scale = Math.sqrt(16e6 / (docW * docH));
    const w = Math.max(1, Math.ceil(docW * scale));
    const h = Math.max(1, Math.ceil(docH * scale));
    const c = m.canvas;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, docW, docH);
    ctx.globalCompositeOperation = "lighter";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const sx = window.scrollX;
    const sy = window.scrollY;
    const range = document.createRange();

    for (const el of document.querySelectorAll("[data-relief]")) {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.fillStyle = "#f00";
      const size = parseFloat(cs.fontSize);
      const metrics = ctx.measureText("Hg");
      const ascent = metrics.fontBoundingBoxAscent ?? size * 0.9;
      const descent = metrics.fontBoundingBoxDescent ?? size * 0.25;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        const re = /\S+/g;
        let match;
        while ((match = re.exec(node.data))) {
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rects = range.getClientRects();
          if (rects.length !== 1 || rects[0].width === 0) continue;
          const r = rects[0];
          const baseline = r.top + sy + (r.height - (ascent + descent)) / 2 + ascent;
          const measured = ctx.measureText(match[0]).width;
          const kx = measured > 0 ? r.width / measured : 1;
          ctx.save();
          ctx.translate(r.left + sx, baseline);
          if (Math.abs(kx - 1) > 0.003) ctx.scale(kx, 1);
          ctx.fillText(match[0], 0, 0);
          ctx.restore();
        }
      }
    }

    ctx.fillStyle = "#0f0";
    for (const el of document.querySelectorAll("[data-engrave]")) {
      const r = el.getBoundingClientRect();
      ctx.fillRect(r.left + sx, r.top + sy - 1, r.width, 2);
    }

    gl.bindTexture(gl.TEXTURE_2D, m.tex);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    Object.assign(m, { scale, docW, docH, baked: true });
    state.docH = docH;
    if (debug) showDebugOverlay();
    requestRender();
  }

  function scheduleRebake() {
    clearTimeout(state.mask.timer);
    state.mask.timer = setTimeout(() => {
      if (state.disposed || state.lost) return;
      const docW = root.clientWidth;
      const docH = Math.max(root.scrollHeight, window.innerHeight);
      if (Math.abs(docW - state.mask.docW) > 1 || Math.abs(docH - state.mask.docH) > 1 || !state.mask.baked) bakeMask();
    }, 150);
  }

  let overlay = null;
  function showDebugOverlay() {
    if (!overlay) {
      overlay = state.mask.canvas;
      Object.assign(overlay.style, {
        position: "absolute", top: "0", left: "0", opacity: "0.5", pointerEvents: "none", zIndex: "9999", imageRendering: "pixelated"
      });
      document.body.appendChild(overlay);
    }
    overlay.style.width = state.mask.docW + "px";
    overlay.style.height = state.mask.docH + "px";
  }

  // ---- sun ----
  function arcSun(s) {
    return { az: (40 + 100 * s) * DEG, alt: (24 + 34 * Math.pow(Math.sin(Math.PI * s), 0.9)) * DEG };
  }

  function readScroll() {
    state.scroll.x = window.scrollX;
    state.scroll.y = window.scrollY;
    state.scroll.progress = clamp(state.scroll.y / Math.max(1, state.docH - window.innerHeight), 0, 1);
  }

  function updateSun(now, dt) {
    const k = (tau) => 1 - Math.exp(-dt / tau);
    const sun = state.sun;
    if (state.pinned) { sun.az = state.pinned.az; sun.alt = state.pinned.alt; return false; }
    if (state.reduced) { sun.az = 120 * DEG; sun.alt = 40 * DEG; return false; }
    const base = state.manualSun ? { ...state.manualSun } : arcSun(state.scroll.progress);
    const driftOn = state.drift && state.heroVisible && !state.manualSun;
    if (driftOn && !state.sunrise.active) {
      const t = state.animTime;
      base.az += 4 * DEG * Math.sin((t * 2 * Math.PI) / 38);
      base.alt += 1.5 * DEG * Math.sin((t * 2 * Math.PI) / 51);
    }
    const touch = state.touch;
    base.az = clamp(base.az + touch.azOffset, 15 * DEG, 165 * DEG);
    if (!touch.dragging) {
      touch.azOffset *= 1 - k(4);
      if (Math.abs(touch.azOffset) < 2e-3) touch.azOffset = 0;
    }
    const p = state.pointer;
    const targetW = p.active && !state.sunrise.active ? 1 : 0;
    p.weight += (targetW - p.weight) * k(targetW ? 0.22 : 0.55);
    if (Math.abs(p.weight - targetW) < 0.02) p.weight = targetW;
    const goalAz = base.az + shortest(base.az, p.az) * p.weight;
    const goalAlt = lerp(base.alt, p.alt, p.weight);
    sun.az += shortest(sun.az, goalAz) * k(0.26);
    sun.alt += (goalAlt - sun.alt) * k(0.26);
    if (state.sunrise.active) {
      const u = Math.min(1, (now - state.sunrise.t0) / state.sunrise.dur);
      const ease = u * u * (3 - 2 * u);
      sun.az = state.sunrise.fromAz + shortest(state.sunrise.fromAz, goalAz) * ease;
      sun.alt = state.sunrise.fromAlt + (goalAlt - state.sunrise.fromAlt) * ease;
      if (u >= 1) state.sunrise.active = false;
    }
    // Keep touch drift alive after the opening sweep, at a capped cadence even while the sun is easing.
    if (driftOn && !state.sunrise.active && !p.active && p.weight === 0 && !touch.dragging) return "drift";
    const settled = !state.sunrise.active
      && Math.abs(shortest(sun.az, goalAz)) < 3e-4
      && Math.abs(goalAlt - sun.alt) < 3e-4
      && (p.weight === 0 || p.weight === 1)
      && touch.azOffset === 0
      && !touch.dragging;
    if (!settled) return true;
    return driftOn ? "drift" : false;
  }

  function lightUniforms() {
    const { az, alt } = state.sun;
    const sAlt = Math.max(Math.sin(alt), 0.22);
    const on = smoothstep(-2 * DEG, 5 * DEG, alt);
    const warmth = smoothstep(16 * DEG, 50 * DEG, alt);
    const mix3 = (a, b, t) => a.map((x, i) => lerp(x, b[i], t));
    const scale3 = (a, s) => a.map((x) => x * s);
    let key; let ambient; let albedo; let water; let grain; let glint; let sheen;
    if (!state.dark) {
      albedo = PLASTER.light; water = WATER.light; grain = 0.55; glint = 0.22; sheen = 0.035;
      ambient = mix3([0.65, 0.67, 0.71], [0.68, 0.69, 0.71], warmth);
      key = scale3(mix3([1.0, 0.89, 0.76], [1.0, 0.97, 0.91], warmth), (lerp(0.35, 0.32, warmth) / sAlt) * on);
    } else {
      albedo = PLASTER.dark; water = WATER.dark; grain = 0.4; glint = 0.018; sheen = 0.002;
      ambient = [0.48, 0.52, 0.60];
      key = scale3([1.0, 0.88, 0.72], (0.50 / sAlt) * on);
    }
    const light = [Math.cos(alt) * Math.cos(az), Math.cos(alt) * Math.sin(az), Math.sin(alt)];
    return { light, key, ambient, albedo, water, grain, glint, sheen };
  }

  // ---- draw ----
  function draw() {
    const t = state.terrain;
    const m = state.mask;
    const lt = lightUniforms();
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, m.tex);
    gl.uniform2f(uniforms.u_viewport, state.viewport.w, state.viewport.h);
    gl.uniform1f(uniforms.u_renderScale, state.renderScale);
    gl.uniform2f(uniforms.u_scroll, contained ? 0 : state.scroll.x, contained ? 0 : state.scroll.y);
    gl.uniform1f(uniforms.u_parallax, contained ? 0 : state.reduced ? 1.0 : cfg.parallax);
    gl.uniform2f(uniforms.u_terrainOrigin, t.originX, t.originY);
    gl.uniform2f(uniforms.u_terrainSize, t.cssW, t.cssH);
    gl.uniform2f(uniforms.u_docSize, m.docW, m.docH);
    gl.uniform1f(uniforms.u_maskScale, m.scale);
    gl.uniform1f(uniforms.u_terrainHeight, t.heightPx);
    gl.uniform1f(uniforms.u_normalStep, t.texelCss * 2.0);
    gl.uniform1f(uniforms.u_plateau, raisedContent && m.baked ? cfg.plateau : 0);
    gl.uniform1f(uniforms.u_groove, raisedContent && m.baked ? 0.8 : 0);
    gl.uniform3fv(uniforms.u_light, lt.light);
    gl.uniform3fv(uniforms.u_keyColor, lt.key);
    gl.uniform3fv(uniforms.u_ambientColor, lt.ambient);
    gl.uniform3fv(uniforms.u_albedo, lt.albedo);
    gl.uniform3fv(uniforms.u_waterAlbedo, lt.water);
    gl.uniform1f(uniforms.u_time, state.animTime);
    gl.uniform1f(uniforms.u_grain, lt.grain);
    gl.uniform1f(uniforms.u_shadowSoft, cfg.shadowSoft);
    gl.uniform1f(uniforms.u_sidePx, 1.0);
    gl.uniform1f(uniforms.u_glint, lt.glint);
    gl.uniform1f(uniforms.u_sheen, lt.sheen);
    gl.uniform1f(uniforms.u_lakeLevel, LAKE_LEVEL);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (sunControl && document.activeElement !== sunControl) sunControl.value = String(Math.round(state.sun.az / DEG));
  }

  function requestRender() {
    if (state.disposed || state.lost || state.rafId || document.hidden || (contained && !state.heroVisible)) return;
    state.rafId = requestAnimationFrame(frame);
  }

  function frame(now) {
    state.rafId = 0;
    clearTimeout(state.timerId);
    state.timerId = 0;
    const elapsed = (now - state.lastNow) / 1000 || 0;
    const dt = Math.min(0.1, elapsed);
    state.lastNow = now;
    readScroll();
    const status = updateSun(now, dt);
    if (!state.reduced) state.animTime += dt;
    const started = performance.now();
    draw();
    state.lastFrameMs = performance.now() - started;
    state.frames += 1;
    // Frame cadence during the sunrise is the honest GPU-pressure signal (submit time is always tiny).
    if (state.sunrise.active && elapsed > 0) state.frameTimes.push(elapsed * 1000);
    else if (state.frameTimes.length) adaptQuality();
    if (status === "drift") state.timerId = setTimeout(requestRender, 1000 / 24);
    else if (status) requestRender();
  }

  function adaptQuality() {
    const times = state.frameTimes;
    state.frameTimes = [];
    if (times.length < 6 || state.qualityDropped) return;
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    if (mean > 40) {
      state.qualityDropped = true;
      compile(10, 6);
      layout();
      requestRender();
    }
  }

  // ---- events ----
  const listeners = [];
  function on(target, type, handler, opts = { passive: true }) {
    target.addEventListener(type, handler, opts);
    listeners.push(() => target.removeEventListener(type, handler, opts));
  }

  function heroPointer(event) {
    state.manualSun = null;
    const rect = hero.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    // A broad overhead light: crossing the centre never flips the terrain inside out.
    const az = lerp(150, 30, x) * DEG;
    const alt = (lerp(48, 22, y) + 6 * Math.sin(Math.PI * x)) * DEG;
    Object.assign(state.pointer, { az, alt, active: true });
  }

  if (hero && !state.pinned) {
    on(hero, "pointermove", (event) => {
      if (state.reduced || event.target.closest("input, label, a")) return;
      if (event.pointerType === "touch") {
        const touch = state.touch;
        if (!touch.dragging || event.pointerId !== touch.id) return;
        const dx = Math.abs(event.clientX - touch.startX);
        const dy = Math.abs(event.clientY - touch.startY);
        if (!touch.axis && Math.max(dx, dy) > 8) touch.axis = dx > dy * 1.2 ? "x" : "y";
        if (touch.axis === "x") {
          state.manualSun = null;
          touch.azOffset = clamp(touch.azOffset + (event.clientX - touch.lastX) * -0.22 * DEG, -50 * DEG, 50 * DEG);
        }
        touch.lastX = event.clientX;
      } else {
        heroPointer(event);
      }
      requestRender();
    });
    on(hero, "pointerleave", (event) => {
      if (state.reduced || event.pointerType === "touch") return;
      state.pointer.active = false;
      requestRender();
    });
    on(hero, "pointerdown", (event) => {
      if (state.reduced || event.pointerType !== "touch") return;
      Object.assign(state.touch, { dragging: true, startX: event.clientX, startY: event.clientY, lastX: event.clientX, axis: null, id: event.pointerId });
    });
    const endTouch = () => {
      if (!state.touch.dragging) return;
      state.touch.dragging = false;
      state.touch.id = null;
      requestRender();
    };
    on(hero, "pointerup", endTouch);
    on(hero, "pointercancel", endTouch);
    on(window, "pointerup", endTouch);
  }

  if (sunControl && !state.pinned) on(sunControl, "input", () => {
    if (state.reduced) return;
    state.manualSun = { az: clamp(Number(sunControl.value), 25, 155) * DEG, alt: 32 * DEG };
    state.sunrise.active = false;
    Object.assign(state.pointer, { active: false, weight: 0 });
    state.touch.azOffset = 0;
    requestRender();
  });

  on(window, "scroll", requestRender);
  on(document, "visibilitychange", () => {
    if (document.hidden) {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      clearTimeout(state.timerId);
      state.rafId = 0;
      state.timerId = 0;
    } else {
      state.lastNow = performance.now();
      requestRender();
    }
  });
  if (darkQuery) on(darkQuery, "change", (event) => { state.dark = event.matches; requestRender(); });
  if (reducedMotionQuery) on(reducedMotionQuery, "change", (event) => {
    state.reduced = event.matches;
    state.sunrise.active = false;
    state.manualSun = null;
    Object.assign(state.pointer, { active: false, weight: 0 });
    Object.assign(state.touch, { dragging: false, azOffset: 0, id: null });
    requestRender();
  });
  if (document.fonts) on(document.fonts, "loadingdone", scheduleRebake);

  function resize() {
    if (state.disposed || state.lost) return;
    layout();
    requestRender();
    scheduleRebake();
  }
  const resizeObserver = new ResizeObserver(resize);
  on(window, "resize", resize);
  let heroObserver = null;
  if (hero) {
    heroObserver = new IntersectionObserver(([entry]) => {
      state.heroVisible = entry.isIntersecting;
      if (state.heroVisible) requestRender();
    }, { rootMargin: "80px" });
  }

  on(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    state.lost = true;
    // Context loss invalidates every GL handle; compile() must not delete the old program after restoration.
    program = null;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    clearTimeout(state.timerId);
    state.rafId = 0;
    state.timerId = 0;
    wrapper.classList.remove("is-rendered");
    root.classList.remove("relief-on");
  }, { passive: false });
  on(canvas, "webglcontextrestored", () => {
    state.lost = false;
    compile(state.near, state.far);
    state.terrain.tex = createTexture();
    uploadTerrain();
    state.mask.tex = createTexture();
    layout();
    bakeMask();
    wrapper.classList.add("is-rendered");
    root.classList.add("relief-on");
    requestRender();
  });

  // ---- boot ----
  compile(cfg.near, cfg.far);
  state.terrain.tex = createTexture();
  state.mask.tex = createTexture();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  await loadTerrain();
  if (state.disposed) return dispose;
  layout();
  await waitForFonts();
  if (state.disposed) return dispose;
  layout();
  bakeMask();
  readScroll();
  const start = arcSun(state.scroll.progress);
  state.sun.az = start.az;
  state.sun.alt = start.alt;
  state.lastNow = performance.now();
  if (!state.reduced && !state.pinned) {
    state.sunrise.active = true;
    state.sunrise.t0 = performance.now();
    state.sunrise.fromAz = start.az - 18 * DEG;
    state.sun.az = state.sunrise.fromAz;
    state.sun.alt = state.sunrise.fromAlt;
  } else updateSun(state.lastNow, 0);
  draw();
  state.frames += 1;
  wrapper.classList.add("is-rendered");
  root.classList.add("relief-on");
  resizeObserver.observe(root);
  if (contained) resizeObserver.observe(wrapper);
  if (heroObserver) heroObserver.observe(hero);
  if (scrollTo !== null && scrollTo !== undefined && scrollTo !== "") {
    const fraction = clamp(Number(scrollTo) || 0, 0, 1);
    window.scrollTo(0, Math.round(fraction * Math.max(0, state.docH - window.innerHeight)));
    state.sunrise.active = false;
    readScroll();
    const pinnedArc = arcSun(state.scroll.progress);
    state.sun.az = pinnedArc.az;
    state.sun.alt = pinnedArc.alt;
  }
  setTimeout(() => { if (!state.disposed && !state.lost) scheduleRebake(); }, 1000);
  requestRender();
  if (debug) window.__relief = state;

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    clearTimeout(state.timerId);
    clearTimeout(state.mask.timer);
    listeners.forEach((off) => off());
    resizeObserver.disconnect();
    if (heroObserver) heroObserver.disconnect();
    if (overlay) overlay.remove();
    gl.deleteTexture(state.terrain.tex);
    gl.deleteTexture(state.mask.tex);
    gl.deleteProgram(program);
    wrapper.classList.remove("is-rendered");
    root.classList.remove("relief-on", "og");
  }
  return dispose;
}
