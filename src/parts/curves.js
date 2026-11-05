/**
 * Smooth outlines from a few control points (Catmull-Rom, open and closed), the classic heart, points round circles,
 * rounded rectangles and polygons, and even resampling.
 */
import { U, bbox, move, polar, poly, regular, sample } from '../geometry/index.js';

/** A Catmull-Rom curve through `pts` (open; the ends are held), n points a span: lips, a shoe, a flame, a leaf. */
export const spline = (pts, n = 16) => { const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3))); } }
  out.push(pts.at(-1)); return out; };
/** The same curve closed through every point (no repeated end point), for trackLoop() and poly(). */
export const splineClosed = (pts, n = 16) => spline([pts.at(-1), ...pts, pts[0], pts[1]], n).slice(n, -n - 1);
/** A closed Catmull-Rom spline through pts (n points a span): smooth organic outlines (the head, the paw's pad) from a few knots. */
export const smooth = (pts, n = 24) => splineClosed(pts, n);
/** The classic heart curve, w wide, centred on (cx, cy): x = 16 sin³t, y = −(13 cos t − 5 cos 2t − 2 cos 3t − cos 4t). */
export const heartPts = (cx, cy, w, n = 240) => { const k = w / 32, pts = [...Array(n)].map((_, i) => { const t = (i / n) * 2 * Math.PI;
  return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });
  const ys = pts.map((p) => p[1]), my = (Math.min(...ys) + Math.max(...ys)) / 2; return pts.map(([x, y]) => [cx + x * k, cy + (y - my) * k]); };
/** The classic parametric heart curve (16 sin³t, 13 cos t − 5 cos 2t − …) `w` wide, point down, x centred on 0 (y as drawn). */
const heartCurve = (w = 448, n = 240) => { const k = w / 32;
  return sample((t) => [k * 16 * Math.sin(t) ** 3, -k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))], 0, 2 * Math.PI, n).slice(0, -1); };
/** A heart `w` wide, point down, centred on the origin. */
export const heart = (w) => { const s = U(poly(heartCurve(w))), [x0, y0, x1, y1] = bbox(s); return move(s, -(x0 + x1) / 2, -(y0 + y1) / 2); };
/** Points round a circle (closed, no repeated end). */
export const circPts = (cx, cy, r, n = 160, a0 = 0) => sample((t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)], a0, a0 + 2 * Math.PI, n).slice(0, -1);
/** Points round a rounded rectangle (closed, no repeated end, starting on a corner arc): for trackLoop(). */
export const roundRectPts = (x, y, w, h, r, n = 16) => [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]]
  .flatMap(([cx, cy, a]) => sample((t) => polar(r, t, cx, cy), a, a + 90, n));
/** A polygon's points: n sides of radius r round (cx, cy), turned deg. */
export const ngonPts = (cx, cy, r, n = 72, deg = 0) => regular(cx, cy, r, n, deg)[0];
/** Resamples a polyline to points about `step` apart, closing the loop when `closed` (weave() measures its over-under
 * windows along the points, and balloon() swells by point index, so both want even spacing). */
export const dense = (pts, step = 6, closed = true) => { const out = [], m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); }
  if (!closed) out.push(pts.at(-1));
  return out.filter((p, i) => i === 0 || Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]) > 1e-6); };
