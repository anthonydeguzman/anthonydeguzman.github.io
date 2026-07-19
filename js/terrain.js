const GRID_WIDTH = 256;
const GRID_DEPTH = 160;
const WORLD_WIDTH = 40;
const WORLD_DEPTH = 24;

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded 2D simplex noise, adapted from Stefan Gustavson's public-domain method.
class Simplex2D {
  constructor(seed) {
    const random = mulberry32(seed);
    const source = Array.from({ length: 256 }, (_, index) => index);
    for (let index = source.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [source[index], source[swap]] = [source[swap], source[index]];
    }
    this.perm = new Uint8Array(512);
    for (let index = 0; index < 512; index += 1) this.perm[index] = source[index & 255];
  }

  noise(x, y) {
    const gradients = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [1, 0], [-1, 0],
      [0, 1], [0, -1], [0, 1], [0, -1]
    ];
    const f2 = 0.5 * (Math.sqrt(3) - 1);
    const g2 = (3 - Math.sqrt(3)) / 6;
    const skew = (x + y) * f2;
    const i = Math.floor(x + skew);
    const j = Math.floor(y + skew);
    const unskew = (i + j) * g2;
    const x0 = x - (i - unskew);
    const y0 = y - (j - unskew);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + g2;
    const y1 = y0 - j1 + g2;
    const x2 = x0 - 1 + 2 * g2;
    const y2 = y0 - 1 + 2 * g2;
    const ii = i & 255;
    const jj = j & 255;
    const indices = [
      this.perm[ii + this.perm[jj]] % 12,
      this.perm[ii + i1 + this.perm[jj + j1]] % 12,
      this.perm[ii + 1 + this.perm[jj + 1]] % 12
    ];
    const offsets = [[x0, y0], [x1, y1], [x2, y2]];
    let value = 0;

    for (let corner = 0; corner < 3; corner += 1) {
      const [dx, dy] = offsets[corner];
      let influence = 0.5 - dx * dx - dy * dy;
      if (influence <= 0) continue;
      const [gx, gy] = gradients[indices[corner]];
      influence *= influence;
      value += influence * influence * (gx * dx + gy * dy);
    }
    return 70 * value;
  }
}

function gaussian(x, z, centerX, centerZ, radiusX, radiusZ, depth) {
  const dx = (x - centerX) / radiusX;
  const dz = (z - centerZ) / radiusZ;
  return -depth * Math.exp(-(dx * dx + dz * dz) * 0.5);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resamplePath(points, count) {
  const cumulative = new Float32Array(points.length);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    cumulative[index] = cumulative[index - 1] + Math.hypot(
      current.x - previous.x,
      (current.y - previous.y) * 0.5,
      current.z - previous.z
    );
  }

  const total = cumulative[cumulative.length - 1];
  const result = [];
  let cursor = 1;
  for (let sample = 0; sample < count; sample += 1) {
    const distance = (sample / (count - 1)) * total;
    while (cursor < cumulative.length - 1 && cumulative[cursor] < distance) cursor += 1;
    const before = Math.max(0, cursor - 1);
    const span = cumulative[cursor] - cumulative[before] || 1;
    const mix = (distance - cumulative[before]) / span;
    const a = points[before];
    const b = points[cursor];
    result.push({
      x: a.x + (b.x - a.x) * mix,
      y: a.y + (b.y - a.y) * mix,
      z: a.z + (b.z - a.z) * mix
    });
  }
  result[result.length - 1] = { ...result[0] };
  return result;
}

export function makeTerrain(seed = 3032014) {
  const simplex = new Simplex2D(seed);
  const heights = new Float32Array(GRID_WIDTH * GRID_DEPTH);
  let minimum = Infinity;
  let maximum = -Infinity;
  let total = 0;

  for (let row = 0; row < GRID_DEPTH; row += 1) {
    const z = (row / (GRID_DEPTH - 1) - 0.5) * WORLD_DEPTH;
    for (let column = 0; column < GRID_WIDTH; column += 1) {
      const x = (column / (GRID_WIDTH - 1) - 0.5) * WORLD_WIDTH;
      let amplitude = 1.32;
      let frequency = 0.072;
      let height = 0;
      for (let octave = 0; octave < 4; octave += 1) {
        height += simplex.noise(x * frequency + octave * 9.1, z * frequency - octave * 4.7) * amplitude;
        amplitude *= 0.51;
        frequency *= 2.04;
      }

      height += gaussian(x, z, -11.8, -4.6, 4.8, 3.9, 4.7);
      height += gaussian(x, z, 8.8, -4.0, 5.4, 3.3, 4.25);
      height += gaussian(x, z, -2.2, 5.5, 4.1, 3.0, 3.7);
      height += gaussian(x, z, 14.8, 5.9, 3.2, 2.7, 3.25);

      const edgeX = Math.abs(x) / (WORLD_WIDTH * 0.5);
      const edgeZ = Math.abs(z) / (WORLD_DEPTH * 0.5);
      height += 2.7 * (edgeX ** 4 + edgeZ ** 4);
      height *= 0.92;

      const index = row * GRID_WIDTH + column;
      heights[index] = height;
      minimum = Math.min(minimum, height);
      maximum = Math.max(maximum, height);
      total += height;
    }
  }

  function heightAt(x, z) {
    const gridX = clamp((x / WORLD_WIDTH + 0.5) * (GRID_WIDTH - 1), 0, GRID_WIDTH - 1);
    const gridZ = clamp((z / WORLD_DEPTH + 0.5) * (GRID_DEPTH - 1), 0, GRID_DEPTH - 1);
    const x0 = Math.floor(gridX);
    const z0 = Math.floor(gridZ);
    const x1 = Math.min(x0 + 1, GRID_WIDTH - 1);
    const z1 = Math.min(z0 + 1, GRID_DEPTH - 1);
    const tx = gridX - x0;
    const tz = gridZ - z0;
    const a = heights[z0 * GRID_WIDTH + x0];
    const b = heights[z0 * GRID_WIDTH + x1];
    const c = heights[z1 * GRID_WIDTH + x0];
    const d = heights[z1 * GRID_WIDTH + x1];
    return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
  }

  function gradAt(x, z) {
    const epsilon = 0.11;
    return {
      x: (heightAt(x + epsilon, z) - heightAt(x - epsilon, z)) / (2 * epsilon),
      z: (heightAt(x, z + epsilon) - heightAt(x, z - epsilon)) / (2 * epsilon)
    };
  }

  const terrain = {
    width: GRID_WIDTH,
    depth: GRID_DEPTH,
    worldWidth: WORLD_WIDTH,
    worldDepth: WORLD_DEPTH,
    heights,
    minimum,
    maximum,
    mean: total / heights.length,
    heightAt,
    gradAt
  };
  terrain.descentPath = (options) => descentPath(terrain, options);
  return terrain;
}

export function descentPath(terrain, { samples = 900 } = {}) {
  const halfWidth = terrain.worldWidth * 0.5 - 0.45;
  const halfDepth = terrain.worldDepth * 0.5 - 0.45;
  const points = [];
  const start = { x: -17.2, z: -8.0 };
  const kicks = [
    { x: 18.0, z: 2.6 },
    { x: -11.5, z: 10.8 },
    { x: 17.0, z: -4.2 }
  ];
  let x = start.x;
  let z = start.z;
  let velocityX = 0;
  let velocityZ = 0;

  function record(extraHeight = 0) {
    points.push({ x, z, y: terrain.heightAt(x, z) + 0.2 + extraHeight });
  }

  for (let run = 0; run <= kicks.length; run += 1) {
    let settledFrames = 0;
    for (let step = 0; step < 250; step += 1) {
      const gradient = terrain.gradAt(x, z);
      velocityX = velocityX * 0.9 - gradient.x * 0.06;
      velocityZ = velocityZ * 0.9 - gradient.z * 0.06;
      const speed = Math.hypot(velocityX, velocityZ);
      if (speed > 0.28) {
        velocityX = (velocityX / speed) * 0.28;
        velocityZ = (velocityZ / speed) * 0.28;
      }
      x = clamp(x + velocityX, -halfWidth, halfWidth);
      z = clamp(z + velocityZ, -halfDepth, halfDepth);
      record();
      settledFrames = speed < 0.012 && Math.hypot(gradient.x, gradient.z) < 0.08 ? settledFrames + 1 : 0;
      if (step > 70 && settledFrames > 20) break;
    }

    if (run === kicks.length) break;
    const fromX = x;
    const fromZ = z;
    const targetX = clamp(x + kicks[run].x, -halfWidth, halfWidth);
    const targetZ = clamp(z + kicks[run].z, -halfDepth, halfDepth);
    for (let frame = 1; frame <= 32; frame += 1) {
      const progress = frame / 32;
      const eased = progress * progress * (3 - 2 * progress);
      x = fromX + (targetX - fromX) * eased;
      z = fromZ + (targetZ - fromZ) * eased;
      record(Math.sin(progress * Math.PI) * 1.4);
    }
    velocityX = 0;
    velocityZ = 0;
  }

  const fromX = x;
  const fromZ = z;
  for (let frame = 1; frame <= 48; frame += 1) {
    const progress = frame / 48;
    const eased = progress * progress * (3 - 2 * progress);
    x = fromX + (start.x - fromX) * eased;
    z = fromZ + (start.z - fromZ) * eased;
    record(Math.sin(progress * Math.PI) * 1.7);
  }
  return resamplePath(points, samples);
}
