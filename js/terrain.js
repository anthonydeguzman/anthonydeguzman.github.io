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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
      let amplitude = 1.18;
      let frequency = 0.065;
      let height = 0;

      for (let octave = 0; octave < 4; octave += 1) {
        height += simplex.noise(x * frequency + octave * 8.7, z * frequency - octave * 5.1) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.08;
      }

      height += Math.sin(x * 0.16) * 0.35;
      height += Math.cos(z * 0.24) * 0.28;
      height += Math.sin((x + z) * 0.1) * 0.22;

      const edgeX = Math.abs(x) / (WORLD_WIDTH * 0.5);
      const edgeZ = Math.abs(z) / (WORLD_DEPTH * 0.5);
      height += 1.1 * (edgeX ** 4 + edgeZ ** 4);

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
    const top = a + (b - a) * tx;
    const bottom = c + (d - c) * tx;
    return top + (bottom - top) * tz;
  }

  return {
    width: GRID_WIDTH,
    depth: GRID_DEPTH,
    worldWidth: WORLD_WIDTH,
    worldDepth: WORLD_DEPTH,
    heights,
    minimum,
    maximum,
    mean: total / heights.length,
    heightAt
  };
}
