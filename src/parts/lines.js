/**
 * Lines in the house styles: the two-track line and loop, bent solid rails, tapered strokes, dashes that bend round
 * corners, jigsaw seams and over-under crossings.
 */
import { D, I, U, circle, fillet, filletClosed, grown, sample, stroke, trackLoop, tracks } from '../geometry/index.js';

/** The house two-track line (Track · Duo): two tracks 48 apart, each 26 wide. */
export const T2 = { n: 2, pitch: 48, w: 26 };
/** The house two-track line for gap g: tracks 26 wide for a 22 gap (pitch 48), scaled with g so exact() keeps both. */
export const duo = (g) => ({ n: 2, pitch: (48 / 22) * g, w: (26 / 22) * g });
/** An open centreline as two tracks (`T2`), its corners filleted by r (keep r ≥ 44 so the inner track doesn't pinch). */
export const duoLine = (pts, r = 48) => tracks(r ? fillet(pts, r) : pts, T2);
/** A closed outline as two tracks, every corner filleted by r. List corners only: a point mid-side leaves a spur. */
export const duoLoop = (pts, r = 48) => trackLoop(r ? filletClosed(pts, r) : pts, T2);
/** A closed outline as two tracks for gap g, its corners filleted by r. */
export const duoClosed = (pts, g, r = 48) => trackLoop(r ? filletClosed(pts, r) : pts, duo(g));
/** A crossing of a closed track loop made over-under: the stretch `front` (an open run of the same centreline) is laid on
 * top and the loop is cut free of it by g, but only inside the disc (cx, cy, rc), so the strand itself stays whole. */
export const crossOver = (loop, front, g, cx, cy, rc) => { const q = duo(g), f = tracks(front, q), keep = I(f, circle(cx, cy, rc, 200));
  return U(D(loop, I(grown(f, g), circle(cx, cy, rc, 200))), keep); };
/** A solid stroke along a polyline, corners filleted by r, round ends: a rail, a frame, a leg. */
export const bent = (pts, w, r = 0) => stroke(r ? fillet(pts, r) : pts, w, { roundCaps: true, chunk: 12 });
/** A stroke whose width follows f(t), t running 0 → 1 along the points: tapered hair, brows, blades and tails. */
export const taper = (pts, f) => stroke(pts, (i, n) => f(i / (n - 1)), { chunk: 8 });
/** Dashes along a polyline: `on` long, `off` apart from `start`, each a flat-ended stroke w wide that bends round any corner it
 * spans (a road's centre line). */
export const dashes = (pts, on, off, w, start = 0) => { const seg = [], out = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, acc, L]); acc += L; }
  const at = (s) => { for (const [a, b, s0, L] of seg) if (s <= s0 + L + 1e-9) { const t = (s - s0) / L; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } return pts.at(-1); };
  for (let s = start; s < acc - 1; s += on + off) { const e = Math.min(acc, s + on), q = [at(s)];
    for (const [, b, s0, L] of seg) if (s0 + L > s && s0 + L < e) q.push(b);
    q.push(at(e)); out.push(stroke(q, w, { chunk: 8 })); }
  return U(...out); };
/** A jigsaw seam along a straight line from a to b with one round tab bulging to side s (+1 left of travel, −1 right) at
 * fraction f: neck `nk` wide, head radius `hr`, standing `hd` off the line. Returns points for stroke(). */
export const seam = (a, b, { f = 0.5, s = 1, nk = 44, hr = 40, hd = 52 } = {}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [u[1] * s, -u[0] * s];
  const P = (t, o) => [a[0] + u[0] * t + n[0] * o, a[1] + u[1] * t + n[1] * o], m = L * f;
  const half = Math.asin(nk / 2 / hr), head = sample((th) => P(m + hr * Math.sin(th), hd - hr * Math.cos(th)), -half, -(2 * Math.PI - half), 48);
  return [P(0, 0), P(m - nk / 2, 0), ...head, P(m + nk / 2, 0), P(L, 0)]; };
/** Cuts a shape along seams (each a point list from seam()) with gaps g wide. */
export const cutSeams = (shape, g, ...seams) => D(shape, ...seams.map((p) => stroke(p, g, { chunk: 8 })));
