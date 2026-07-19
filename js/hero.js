import { makeTerrain } from "./terrain.js";

const COLORS = [
  "rgba(59, 15, 112, 0.22)",
  "rgba(140, 41, 129, 0.28)",
  "rgba(222, 73, 104, 0.36)",
  "rgba(254, 159, 109, 0.46)",
  "rgba(252, 253, 191, 0.58)"
];

function deterministic(index, salt = 0) {
  const value = Math.sin(index * 91.731 + salt * 47.11) * 43758.5453;
  return value - Math.floor(value);
}

function createField(terrain, columns, rows) {
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const jitterX = (deterministic(index, 1) - 0.5) * (terrain.worldWidth / columns) * 0.58;
      const jitterZ = (deterministic(index, 2) - 0.5) * (terrain.worldDepth / rows) * 0.58;
      const x = (column / (columns - 1) - 0.5) * terrain.worldWidth + jitterX;
      const z = (row / (rows - 1) - 0.5) * terrain.worldDepth + jitterZ;
      points.push({ x, y: terrain.heightAt(x, z), z, random: deterministic(index, 3) });
    }
  }
  return points;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export async function initHero(canvas, { tier = "D", staticMode = false } = {}) {
  const context = canvas.getContext("2d", { alpha: true });
  const poster = canvas.closest(".hero-poster");
  const hero = canvas.closest(".hero");
  if (!context || !poster || !hero) return;

  const terrain = makeTerrain(3032014);
  const dimensions = tier === "M"
    ? { columns: 64, rows: 40, maxDpr: 1.4 }
    : { columns: 124, rows: 76, maxDpr: 1.8 };
  const points = createField(terrain, dimensions.columns, dimensions.rows);
  const attention = { x: 5, z: -2 };
  const attentionTarget = { ...attention };
  const startTime = performance.now();
  let lastPointerAt = startTime;
  let lastDrawAt = 0;
  let frameId = 0;
  let visible = true;
  let disposed = false;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    pixelRatio = Math.min(devicePixelRatio || 1, dimensions.maxDpr);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (staticMode) draw(startTime, true);
  }

  function draw(now, force = false) {
    if (!force && now - lastDrawAt < 32) return;
    lastDrawAt = now;
    const elapsed = now - startTime;

    if (!staticMode && now - lastPointerAt > 2600) {
      attentionTarget.x = Math.sin(elapsed * 0.00011) * 8;
      attentionTarget.z = Math.cos(elapsed * 0.00009) * 4;
    }

    const ease = staticMode ? 1 : 0.055;
    attention.x += (attentionTarget.x - attention.x) * ease;
    attention.z += (attentionTarget.z - attention.z) * ease;

    const driftX = staticMode ? 0 : Math.sin(elapsed * 0.000055) * 0.6;
    const driftY = staticMode ? 0 : Math.cos(elapsed * 0.00007) * height * 0.008;
    const fade = staticMode ? 0.72 : Math.min(0.72, elapsed / 1300);
    const paths = COLORS.map(() => new Path2D());

    context.clearRect(0, 0, width, height);
    for (const point of points) {
      const depth = point.z / terrain.worldDepth + 0.5;
      const perspective = 0.74 + depth * 0.34;
      const screenX = width * 0.57 + (point.x + driftX) * (width / 43) * perspective;
      const screenY = height * 0.48 + point.z * (height / 25) * 0.56 - point.y * (height / 19) + driftY;
      if (screenX < -4 || screenX > width + 4 || screenY < -4 || screenY > height + 4) continue;

      const distance = Math.hypot(point.x - attention.x, point.z - attention.z);
      const focus = Math.exp(-distance * 0.13);
      const heightTone = clamp((point.y - terrain.minimum) / (terrain.maximum - terrain.minimum), 0, 1);
      const twinkle = Math.sin(elapsed * 0.00055 + point.random * Math.PI * 2) * 0.5 + 0.5;
      const light = clamp(0.1 + heightTone * 0.5 + focus * 0.32 + twinkle * 0.04, 0, 0.999);
      const size = 0.55 + focus * 1.25 + twinkle * 0.16;
      const band = Math.floor(light * COLORS.length);
      paths[band].rect(screenX - size * 0.5, screenY - size * 0.5, size, size);
    }

    context.globalAlpha = fade;
    paths.forEach((path, index) => {
      context.fillStyle = COLORS[index];
      context.fill(path);
    });
    context.globalAlpha = 1;
    poster.classList.add("is-rendered");
  }

  function animate(now) {
    frameId = 0;
    if (disposed || !visible || document.hidden) return;
    draw(now);
    frameId = requestAnimationFrame(animate);
  }

  function start() {
    if (disposed || staticMode || frameId || !visible || document.hidden) return;
    frameId = requestAnimationFrame(animate);
  }

  function stop() {
    if (!frameId) return;
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function onPointerMove(event) {
    const rect = hero.getBoundingClientRect();
    attentionTarget.x = clamp(
      ((event.clientX - rect.left) / rect.width - 0.5) * terrain.worldWidth,
      -terrain.worldWidth * 0.5,
      terrain.worldWidth * 0.5
    );
    attentionTarget.z = clamp(
      ((event.clientY - rect.top) / rect.height - 0.5) * terrain.worldDepth,
      -terrain.worldDepth * 0.5,
      terrain.worldDepth * 0.5
    );
    lastPointerAt = performance.now();
  }

  function onVisibilityChange() {
    if (document.hidden) stop();
    else start();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  }, { rootMargin: "100px" });
  visibilityObserver.observe(hero);

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    hero.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    poster.classList.remove("is-rendered");
  }

  resize();
  if (!staticMode) hero.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  if (staticMode) draw(startTime, true);
  else start();

  return dispose;
}
