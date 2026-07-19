import * as THREE from "three";
import { makeTerrain } from "./terrain.js";

const GLYPHS = ["0", "1", "a", "d", "g", "3", "·", ":", "+", "-", "/", "=", "%", "*", "."];
const TRAIL_LENGTH = 140;
const MAGMA = [
  [59 / 255, 15 / 255, 112 / 255],
  [140 / 255, 41 / 255, 129 / 255],
  [222 / 255, 73 / 255, 104 / 255],
  [254 / 255, 159 / 255, 109 / 255],
  [252 / 255, 253 / 255, 191 / 255]
];

function waitForFont() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.race([
    document.fonts.load('16px "Martian Mono"'),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]).catch(() => undefined);
}

function makeGlyphAtlas() {
  const atlas = document.createElement("canvas");
  atlas.width = 512;
  atlas.height = 128;
  const context = atlas.getContext("2d");
  context.clearRect(0, 0, atlas.width, atlas.height);
  context.fillStyle = "white";
  context.font = '42px "Martian Mono", Menlo, monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  GLYPHS.forEach((glyph, index) => {
    const column = index % 8;
    const row = Math.floor(index / 8);
    context.fillText(glyph, column * 64 + 32, row * 64 + 34);
  });
  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function makeMarkerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(252,253,191,1)");
  gradient.addColorStop(0.12, "rgba(254,159,109,1)");
  gradient.addColorStop(0.34, "rgba(222,73,104,.68)");
  gradient.addColorStop(1, "rgba(222,73,104,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function deterministic(index, salt = 0) {
  const value = Math.sin(index * 91.731 + salt * 47.11) * 43758.5453;
  return value - Math.floor(value);
}

function createField(terrain, atlas, columns, rows, pixelRatio) {
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  let pointer = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const jitterX = (deterministic(index, 1) - 0.5) * (terrain.worldWidth / columns) * 0.48;
      const jitterZ = (deterministic(index, 2) - 0.5) * (terrain.worldDepth / rows) * 0.48;
      const x = (column / (columns - 1) - 0.5) * terrain.worldWidth + jitterX;
      const z = (row / (rows - 1) - 0.5) * terrain.worldDepth + jitterZ;
      positions[pointer] = x;
      positions[pointer + 1] = terrain.heightAt(x, z);
      positions[pointer + 2] = z;
      randoms[index] = Math.floor(deterministic(index, 3) * GLYPHS.length) + deterministic(index, 4) * 0.98;
      pointer += 3;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRand", new THREE.BufferAttribute(randoms, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAttention: { value: new THREE.Vector2(0, 0) },
      uMarker: { value: new THREE.Vector3(0, 0, 0) },
      uPixelRatio: { value: pixelRatio },
      uAtlas: { value: atlas },
      uFade: { value: 0 },
      uMinHeight: { value: terrain.minimum },
      uHeightRange: { value: Math.max(1, terrain.maximum - terrain.minimum) }
    },
    vertexShader: `
      attribute float aRand;
      uniform float uTime;
      uniform vec2 uAttention;
      uniform vec3 uMarker;
      uniform float uPixelRatio;
      uniform float uFade;
      uniform float uMinHeight;
      uniform float uHeightRange;
      varying float vGlyph;
      varying float vLight;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float attention = exp(-0.105 * distance(position.xz, uAttention));
        float markerGlow = exp(-0.16 * distance(position.xz, uMarker.xz));
        float phase = fract(aRand) * 6.2831853;
        float twinkle = sin(uTime * 1.25 + phase) * 0.5 + 0.5;
        float heightTone = clamp((position.y - uMinHeight) / uHeightRange, 0.0, 1.0);
        float pointSize = 4.0 * (1.0 + 0.9 * attention + 0.15 * twinkle + 0.28 * markerGlow);
        gl_PointSize = min(24.0 * uPixelRatio, pointSize * uPixelRatio * (30.0 / -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
        vGlyph = floor(aRand);
        vLight = clamp(0.18 + heightTone * 0.4 + attention * 0.42 + markerGlow * 0.28 + twinkle * 0.05, 0.0, 1.0) * uFade;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      varying float vGlyph;
      varying float vLight;

      vec3 magma(float t) {
        vec3 c1 = vec3(0.231, 0.059, 0.439);
        vec3 c2 = vec3(0.549, 0.161, 0.506);
        vec3 c3 = vec3(0.871, 0.286, 0.408);
        vec3 c4 = vec3(0.996, 0.624, 0.427);
        vec3 c5 = vec3(0.988, 0.992, 0.749);
        if (t < 0.25) return mix(c1, c2, smoothstep(0.0, 0.25, t));
        if (t < 0.5) return mix(c2, c3, smoothstep(0.25, 0.5, t));
        if (t < 0.75) return mix(c3, c4, smoothstep(0.5, 0.75, t));
        return mix(c4, c5, smoothstep(0.75, 1.0, t));
      }

      void main() {
        float column = mod(vGlyph, 8.0);
        float row = floor(vGlyph / 8.0);
        vec2 cell = vec2(column, 1.0 - row);
        vec2 uv = (cell + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)) / vec2(8.0, 2.0);
        float glyphAlpha = texture2D(uAtlas, uv).a;
        if (glyphAlpha < 0.04) discard;
        gl_FragColor = vec4(magma(vLight), glyphAlpha * (0.22 + vLight * 0.78));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function mixMagma(value) {
  const scaled = Math.max(0, Math.min(0.999, value)) * (MAGMA.length - 1);
  const index = Math.floor(scaled);
  const amount = scaled - index;
  const a = MAGMA[index];
  const b = MAGMA[Math.min(index + 1, MAGMA.length - 1)];
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount
  ];
}

export async function initHero(canvas, { tier = "D", staticMode = false } = {}) {
  await waitForFont();
  const poster = canvas.closest(".hero-poster");
  const hero = canvas.closest(".hero");
  const terrain = makeTerrain(3032014);
  const path = terrain.descentPath();
  const atlas = makeGlyphAtlas();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x161310, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 90);
  const dimensions = tier === "M" ? { columns: 96, rows: 60, maxDpr: 1.5 } : { columns: 176, rows: 110, maxDpr: 2 };
  let pixelRatio = Math.min(devicePixelRatio || 1, dimensions.maxDpr);
  renderer.setPixelRatio(pixelRatio);

  let field = createField(terrain, atlas, dimensions.columns, dimensions.rows, pixelRatio);
  scene.add(field);

  const markerTexture = makeMarkerTexture();
  const markerMaterial = new THREE.SpriteMaterial({
    map: markerTexture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const marker = new THREE.Sprite(markerMaterial);
  marker.scale.set(1.35, 1.35, 1.35);
  scene.add(marker);

  const trailPositions = new Float32Array(TRAIL_LENGTH * 3);
  const trailColors = new Float32Array(TRAIL_LENGTH * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
  trailGeometry.setDrawRange(0, 0);
  const trailMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  trail.frustumCulled = false;
  scene.add(trail);

  const raycaster = new THREE.Raycaster();
  const attentionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -terrain.mean);
  const pointerNdc = new THREE.Vector2(0, 0);
  const attentionTarget = new THREE.Vector2(path[0].x, path[0].z);
  const rayHit = new THREE.Vector3();
  const trailHistory = [];
  const lookTarget = new THREE.Vector3(0, terrain.mean - 0.8, 0);
  let pointerParallaxX = 0;
  let pointerParallaxY = 0;
  let lastPointerAt = -Infinity;
  let width = 1;
  let height = 1;
  let frameHandle = 0;
  let startTime = performance.now();
  let previousFrame = startTime;
  let visible = !document.hidden;
  let intersecting = true;
  let disposed = false;
  let frozen = false;
  let degraded = false;
  let warmup = 0;
  let fpsSamples = [];
  let fade = 0;
  let restoreAttempts = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(bounds.width));
    height = Math.max(1, Math.floor(bounds.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function samplePath(elapsed) {
    const progress = staticMode ? 0.34 : (0.3 + Math.max(0, elapsed) * 0.000018) % 1;
    const position = progress * (path.length - 1);
    const index = Math.floor(position);
    const next = Math.min(index + 1, path.length - 1);
    const amount = position - index;
    return {
      x: path[index].x + (path[next].x - path[index].x) * amount,
      y: path[index].y + (path[next].y - path[index].y) * amount,
      z: path[index].z + (path[next].z - path[index].z) * amount
    };
  }

  function updateTrail(point) {
    const previous = trailHistory[trailHistory.length - 1];
    if (!previous || previous.distanceToSquared(point) > 0.006) {
      trailHistory.push(point.clone());
      if (trailHistory.length > TRAIL_LENGTH) trailHistory.shift();
    }
    const count = trailHistory.length;
    for (let index = 0; index < count; index += 1) {
      const pointAtIndex = trailHistory[index];
      const offset = index * 3;
      trailPositions[offset] = pointAtIndex.x;
      trailPositions[offset + 1] = pointAtIndex.y;
      trailPositions[offset + 2] = pointAtIndex.z;
      const color = mixMagma(0.18 + (index / Math.max(1, count - 1)) * 0.82);
      trailColors[offset] = color[0];
      trailColors[offset + 1] = color[1];
      trailColors[offset + 2] = color[2];
    }
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    trailGeometry.setDrawRange(0, count);
  }

  function update(now) {
    const elapsed = now - startTime;
    const phase = (elapsed / 45000) * Math.PI * 2;
    const point = samplePath(elapsed);
    marker.position.set(point.x, point.y + 0.16, point.z);
    field.material.uniforms.uMarker.value.copy(marker.position);

    if (now - lastPointerAt > 2600) attentionTarget.set(point.x, point.z);
    field.material.uniforms.uAttention.value.lerp(attentionTarget, 0.08);
    field.material.uniforms.uTime.value = elapsed / 1000;
    fade += (1 - fade) * 0.035;
    field.material.uniforms.uFade.value = fade;

    camera.position.set(
      Math.sin(phase) * 1.45 + pointerParallaxX * 0.42,
      16.8 + Math.sin(phase * 1.71) * 0.38 - pointerParallaxY * 0.22,
      21.5 + Math.cos(phase * 0.82) * 0.52
    );
    camera.lookAt(lookTarget);
    updateTrail(marker.position);
  }

  function degradePerformance() {
    if (!degraded) {
      degraded = true;
      renderer.setPixelRatio(1);
      pixelRatio = 1;
      const oldField = field;
      field = createField(
        terrain,
        atlas,
        Math.max(48, Math.floor(dimensions.columns / 2)),
        Math.max(30, Math.floor(dimensions.rows / 2)),
        1
      );
      field.material.uniforms.uAttention.value.copy(oldField.material.uniforms.uAttention.value);
      scene.add(field);
      scene.remove(oldField);
      oldField.geometry.dispose();
      oldField.material.dispose();
      resize();
      warmup = 0;
      fpsSamples = [];
      previousFrame = performance.now();
      return;
    }
    frozen = true;
  }

  function assessFrameTime(now) {
    const delta = now - previousFrame;
    previousFrame = now;
    if (warmup < 60) {
      warmup += 1;
      return;
    }
    fpsSamples.push(delta);
    if (fpsSamples.length < 60) return;
    const average = fpsSamples.reduce((sum, value) => sum + value, 0) / fpsSamples.length;
    fpsSamples = [];
    if (average > 24) degradePerformance();
  }

  function shouldRun() {
    return !staticMode && !disposed && !frozen && visible && intersecting;
  }

  function frame(now) {
    frameHandle = 0;
    if (!shouldRun()) return;
    update(now);
    renderer.render(scene, camera);
    assessFrameTime(now);
    if (shouldRun()) frameHandle = requestAnimationFrame(frame);
  }

  function schedule() {
    if (shouldRun() && !frameHandle) frameHandle = requestAnimationFrame(frame);
  }

  function renderOnce() {
    if (disposed) return;
    resize();
    update(performance.now());
    renderer.render(scene, camera);
    poster?.classList.add("is-webgl");
  }

  function onPointerMove(event) {
    const bounds = canvas.getBoundingClientRect();
    pointerNdc.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
    raycaster.setFromCamera(pointerNdc, camera);
    if (raycaster.ray.intersectPlane(attentionPlane, rayHit)) attentionTarget.set(rayHit.x, rayHit.z);
    if (matchMedia("(pointer: fine)").matches) {
      pointerParallaxX = pointerNdc.x;
      pointerParallaxY = pointerNdc.y;
    }
    lastPointerAt = performance.now();
  }

  function onVisibilityChange() {
    visible = !document.hidden;
    previousFrame = performance.now();
    schedule();
  }

  function onContextLost(event) {
    event.preventDefault();
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    restoreAttempts += 1;
    poster?.classList.remove("is-webgl");
    if (restoreAttempts > 1) dispose();
  }

  function onContextRestored() {
    if (restoreAttempts > 1 || disposed) return;
    renderOnce();
    schedule();
  }

  const intersectionObserver = "IntersectionObserver" in window && !staticMode
    ? new IntersectionObserver(([entry]) => {
        intersecting = entry.isIntersecting;
        if (!intersecting) {
          cancelAnimationFrame(frameHandle);
          frameHandle = 0;
        } else {
          previousFrame = performance.now();
          schedule();
        }
      }, { rootMargin: "120px" })
    : null;

  let resizeFrame = 0;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resize();
      if (staticMode || frozen) renderOnce();
    });
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameHandle);
    cancelAnimationFrame(resizeFrame);
    intersectionObserver?.disconnect();
    resizeObserver.disconnect();
    hero?.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    field.geometry.dispose();
    field.material.dispose();
    trailGeometry.dispose();
    trailMaterial.dispose();
    markerMaterial.dispose();
    markerTexture.dispose();
    atlas.dispose();
    renderer.dispose();
    poster?.classList.remove("is-webgl");
  }

  hero?.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("webglcontextlost", onContextLost, false);
  canvas.addEventListener("webglcontextrestored", onContextRestored, false);
  intersectionObserver?.observe(canvas);
  resizeObserver.observe(canvas);

  renderOnce();
  schedule();
  return { dispose };
}
