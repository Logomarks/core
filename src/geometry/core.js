/**
 * The canvas, angles, points and the transforms every other module builds on. Shapes are polygon sets (arrays of
 * rings of [x, y] points, y pointing down) on a 512 canvas with C = 256 as the centre.
 */

export const C = 256, TAU = Math.PI * 2, rad = d => d * Math.PI / 180;
/** The house gap: 22 units between parts, after fitting. */
export const GAP = 22;
export const polar = (r, deg, cx = C, cy = C) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
export const poly = pts => [pts];
export const mapPts = (g, f) => typeof g[0] === 'number' ? f(g) : g.map(x => mapPts(x, f));
export const rot = (g, deg, cx = C, cy = C) => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a);
  return mapPts(g, ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
export const move = (g, dx, dy) => mapPts(g, ([x, y]) => [x + dx, y + dy]);
export const scale = (g, k, cx = C, cy = C) => mapPts(g, ([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
export const flipX = g => mapPts(g, ([x, y]) => [2 * C - x, y]);
export const sample = (f, t0, t1, n) => [...Array(n + 1)].map((_, i) => f(t0 + (t1 - t0) * i / n));
export const closedCurve = (f, n = 600) => [...Array(n)].map((_, i) => f(i / n * TAU));
export const polygonPath = (pts, perEdge = 40) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
  for (let k = 0; k < perEdge; k++) out.push([a[0] + (b[0] - a[0]) * k / perEdge, a[1] + (b[1] - a[1]) * k / perEdge]); } return out; };
