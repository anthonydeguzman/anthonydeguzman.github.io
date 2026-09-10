// GLSL ES 3.00 sources for the relief renderer (see js/relief.js).
//
// Coordinate conventions:
//   JS / sun-controller space: +x right, +y up the page (north), +z out of the screen. u_light points toward the sun.
//   Shader space: CSS px with y DOWN (matches the DOM, the mask canvas rows and PNG row 0 = north).
//   gl_FragCoord is y-up in render px; fragToCss() converts it. The light vector is flipped exactly once in main().
//   A sun at the upper right (u_light ≈ (0.7, 0.7, 0.17)) must cast shadows toward the lower left of the screen.

export const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
#define NEAR __NEAR__
#define FAR __FAR__
#define MAX_DIST __MAX_DIST__

uniform sampler2D u_terrain;   // RGB8: elevation16 = r*256 + b (gamma-encoded 0..65535), g = water 0..1
uniform sampler2D u_mask;      // RGBA8, document space: r = letter coverage, g = engraved lines
uniform vec2 u_viewport, u_scroll, u_terrainOrigin, u_terrainSize, u_docSize;
uniform float u_renderScale, u_parallax, u_terrainHeight, u_plateau, u_groove, u_time, u_grain, u_shadowSoft, u_sidePx, u_glint, u_sheen, u_lakeLevel;
uniform vec3 u_light, u_keyColor, u_ambientColor, u_albedo, u_waterAlbedo;
out vec4 fragColor;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0)), c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec3 toSrgb(vec3 c) { return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
// Soft shoulder above 0.8 so raking highlights never clip to white; flats (≤ 0.78) pass through untouched.
vec3 shoulder(vec3 c) { return mix(c, 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) / 0.2)), step(0.8, c)); }

vec2 fragToCss(vec2 fc) { vec2 css = fc / u_renderScale; return vec2(css.x, u_viewport.y - css.y); }
vec2 layerOf(vec2 v)    { return vec2(v.x, v.y + u_scroll.y * u_parallax); }
vec2 terrainUv(vec2 v)  { return (layerOf(v) - u_terrainOrigin) / u_terrainSize; }
vec2 maskUv(vec2 v)     { return (v + u_scroll) / u_docSize; }

vec2 maskAt(vec2 v) { return texture(u_mask, maskUv(v)).rg; }
// (elevation 0..1, water 0..1). Outside the model the table is flat lake, so nothing off-model casts shadows.
vec2 terrainAt(vec2 v) {
  vec2 uv = terrainUv(v);
  float inside = smoothstep(0.0, 0.02, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  if (inside <= 0.0) return vec2(u_lakeLevel, 1.0);
  vec4 s = texture(u_terrain, clamp(uv, 0.0, 1.0));
  float elev = (s.r * 255.0 * 256.0 + s.b * 255.0) / 65535.0;
  return vec2(mix(u_lakeLevel, elev, inside), max(s.g, 1.0 - inside));
}
// Letters as the shadow march sees them: a slightly blurred, thresholded mip level, so no stroke is thinner than a
// march step and thin type never breaks into ghost copies.
float maskShadowAt(vec2 v) { return smoothstep(0.08, 0.35, textureLod(u_mask, maskUv(v), 1.5).r); }
// Ground height: terrain and engraved grooves. Letters are handled by the shadow march and the side-face pass only,
// because from straight above a vertical letter side has no projected area.
float groundAt(vec2 v)  { return terrainAt(v).r * u_terrainHeight - maskAt(v).g * u_groove; }
float terrainOnly(vec2 v) { return terrainAt(v).r * u_terrainHeight; }
float fullAt(vec2 v)    { return terrainAt(v).r * u_terrainHeight + maskShadowAt(v) * u_plateau; }

vec3 normalAt(vec2 v, float e) {
  float hx = groundAt(v + vec2(e, 0.0)) - groundAt(v - vec2(e, 0.0));
  float hy = groundAt(v + vec2(0.0, e)) - groundAt(v - vec2(0.0, e));
  return normalize(vec3(-hx, -hy, 2.0 * e));
}

// Shadow march toward the sun. Near field: uniform fine steps sized to the letters' shadow reach, so thin strokes are
// never skipped. Far field: geometric steps over the terrain only (letters are too short to reach that far).
float softShadow(vec2 v, float h0, vec3 L) {
  float horiz = length(L.xy);
  if (horiz < 1e-3) return 1.0;
  float slope = L.z / horiz;
  if (slope <= 0.0) return 0.0;
  vec2 dir = L.xy / horiz;
  float res = 1.0;
  float nearLen = min(96.0, u_plateau / slope + 6.0);
  float stepLen = nearLen / float(NEAR);
  for (int i = 1; i <= NEAR; i++) {
    float t = float(i) * stepLen;
    float d = h0 + 0.35 + t * slope - fullAt(v + dir * t);
    if (d < 0.0) return 0.0;
    res = min(res, u_shadowSoft * d / max(t, 2.0));
  }
  float maxH = u_terrainHeight + u_plateau;
  float t = nearLen;
  float grow = pow(float(MAX_DIST) / nearLen, 1.0 / float(FAR));
  for (int i = 0; i < FAR; i++) {
    t *= grow;
    float rayH = h0 + 0.35 + t * slope;
    if (rayH > maxH) break;
    float d = rayH - terrainOnly(v + dir * t);
    if (d < 0.0) return 0.0;
    res = min(res, u_shadowSoft * d / t);
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

// Water: flat, faintly rippled. From straight above a low sun cannot be mirrored, so the low-sun sheen is a warm wash
// that grows at grazing angles (the last light on the lake), with a broad highlight when the sun is high.
vec3 shadeWater(vec2 layerPx, vec3 L, float shadow) {
  vec2 q = layerPx * 0.05;
  vec2 rip = vec2(vnoise(q + u_time * 0.03) * 0.6 + vnoise(q * 2.3 + 3.0 - u_time * 0.02) * 0.4,
                  vnoise(q * 1.3 + 11.0 - u_time * 0.025) * 0.6 + vnoise(q * 2.9 + 5.0 + u_time * 0.02) * 0.4) - 0.5;
  vec3 N = normalize(vec3(rip * 0.06, 1.0));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float grazing = 1.0 - clamp(L.z, 0.0, 1.0);
  float spec = pow(max(dot(N, H), 0.0), 40.0) * 0.35;
  float sheen = grazing * grazing * u_sheen * (1.0 + 0.2 * rip.x);
  vec3 col = u_waterAlbedo * (u_ambientColor + u_keyColor * max(L.z, 0.0) * shadow * 0.9);
  return col + u_keyColor * (spec * u_glint + sheen) * shadow;
}

void main() {
  vec2 v = fragToCss(gl_FragCoord.xy);
  vec3 L = normalize(vec3(u_light.x, -u_light.y, u_light.z));
  vec2 t = terrainAt(v);
  vec2 m0 = maskAt(v);
  float water = t.g * (1.0 - m0.r);
  float h0 = t.r * u_terrainHeight + m0.r * u_plateau - m0.g * u_groove;
  float e = max(1.0, 1.0 / u_renderScale);
  vec3 N = normalAt(v, e);
  float sh = mix(0.2, 1.0, softShadow(v, h0, L));   // 20% fill light keeps shadows plaster, not ink
  float lambert = max(dot(N, L), 0.0);
  float sky = 0.55 + 0.45 * N.z;
  vec2 layerPx = layerOf(v);

  float g = (vnoise(layerPx * 0.2) - 0.5) * 0.045 + (vnoise(layerPx * 0.045 + 7.0) - 0.5) * 0.03;
  vec3 albedo = u_albedo * (1.0 + u_grain * g);
  vec3 land = albedo * (u_ambientColor * sky * (1.0 - 0.35 * m0.g) + u_keyColor * lambert * sh);
  vec3 lake = shadeWater(layerPx, L, sh);
  vec3 col = mix(land, lake, smoothstep(0.35, 0.65, water));

  float horiz = max(length(L.xy), 1e-3);
  float m1 = texture(u_mask, maskUv(v + (L.xy / horiz) * u_sidePx)).r;
  float side = clamp(m1 - m0.r, 0.0, 1.0);
  col *= 1.0 - 0.5 * side * (1.0 - 0.5 * L.z);

  col = shoulder(max(col, 0.0));
  fragColor = vec4(toSrgb(col) + (hash21(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);
}`;
