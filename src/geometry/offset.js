/**
 * Offsets and slices: a true round grow or shrink, soft (inflated) corners, the gap band that cuts a part free,
 * one shape over another, and glitch slices.
 */
import { rot, move } from './core.js';
import { U, D, I } from './booleans.js';
import { circle, rect, bar } from './shapes.js';
import { stroke } from './stroke.js';
import { dp } from './path.js';
import { dedupe } from './polygon.js';

const polys = (g) => (g.length && typeof g[0][0][0] === 'number' ? [g] : g);
/** A ring's corner points, simplified (an open copy, split at its farthest point so the simplifier never sees first = last). */
const ringPts = (r, tol = 0.2) => { const q = r.length > 1 && r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1] ? r.slice(0, -1) : r; let far = 0, fd = -1;
  q.forEach((p, i) => { const d = Math.hypot(p[0] - q[0][0], p[1] - q[0][1]); if (d > fd) { fd = d; far = i; } });
  return [...dp(q.slice(0, far + 1), tol).slice(0, -1), ...dp([...q.slice(far), q[0]], tol).slice(0, -1)]; };
/** A true round offset: grows a shape by d (shrinks it when d < 0), every corner rounded. */
export function grow(shape, d) {
  if (!d) return shape;
  const a = Math.abs(d), band = [];
  for (const pg of polys(shape)) for (const r of pg) { const pts = ringPts(r);
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) band.push(bar(p, q, 2 * a)); band.push(circle(p[0], p[1], a, 20)); }); }
  return d > 0 ? U(shape, ...band) : D(shape, ...band);
}
/** Rounds every inner corner by r1 (grow then shrink) and every outer corner by r2 (shrink then grow): the puffy, inflated look. */
export const soften = (shape, r1, r2 = r1) => { let g = r1 ? grow(grow(shape, r1), -r1) : shape; return r2 ? grow(grow(g, -r2), r2) : g; };
/** The shape plus a band of width 2w round its outline: subtract it to cut a part free by an even gap w. */
export const grown = (shape, w = 22) => U(shape, ...polys(shape).flatMap((pg) => pg.map((r) => stroke(dedupe(r), 2 * w, { closed: true, chunk: 12 }))));
/** `front` in front of `back`, cut free by an even gap. */
export const over = (back, front, w = 22) => U(D(back, grown(front, w)), front);
/**
 * Glitch slices: cuts a shape at `cuts` (positions across the cut direction, in a frame turned by `deg`), opens each cut
 * to an even gap `g`, and slides each band along the cut by its entry in `shifts` (one per band, cuts.length + 1).
 */
export function slices(shape, cuts, shifts, { deg = 0, g = 22 } = {}) {
  const s = rot(shape, -deg), edges = [-2000, ...cuts, 2000], out = [];
  for (let i = 0; i < edges.length - 1; i++) { const y0 = edges[i] + (i ? g / 2 : 0), y1 = edges[i + 1] - (i < edges.length - 2 ? g / 2 : 0);
    out.push(move(I(s, rect(-2000, y0, 4512, y1 - y0)), shifts[i] || 0, 0)); }
  return rot(U(...out), deg);
}
