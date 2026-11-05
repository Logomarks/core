/**
 * Primitive shapes: circles, ellipses, rectangles, regular polygons, rings, sectors, arc bands, bars, rounded
 * rectangles, lenses, drops, squircles, pills and eggs.
 */
import { TAU, rad, polar, poly, rot, move, sample, closedCurve } from './core.js';
import { U, D, I } from './booleans.js';

export const circle = (cx, cy, r, n = 0) => { n = n || Math.max(48, Math.min(360, Math.round(r * 1.6)));
  return [[...Array(n)].map((_, i) => [cx + r * Math.cos(i / n * TAU), cy + r * Math.sin(i / n * TAU)])]; };
export const ellipse = (cx, cy, rx, ry, rotDeg = 0, n = 300) => { const a = rad(rotDeg), c = Math.cos(a), s = Math.sin(a);
  return [[...Array(n)].map((_, i) => { const t = i / n * TAU, x = rx * Math.cos(t), y = ry * Math.sin(t); return [cx + x * c - y * s, cy + x * s + y * c]; })]; };
export const rect = (x, y, w, h) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
export const regular = (cx, cy, r, n, rotDeg = -90) => poly([...Array(n)].map((_, i) => polar(r, rotDeg + i * 360 / n, cx, cy)));
export const annulus = (cx, cy, r, w) => D(circle(cx, cy, r + w / 2), circle(cx, cy, r - w / 2));
export const sector = (cx, cy, r, a0, a1, n = 0) => { n = n || Math.max(8, Math.ceil(Math.abs(a1 - a0) / 2));
  return poly([[cx, cy], ...[...Array(n + 1)].map((_, i) => polar(r, a0 + (a1 - a0) * i / n, cx, cy))]); };
export const arcBand = (cx, cy, r, w, a0, a1, round = false) => {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 1.5));
  const outer = [...Array(n + 1)].map((_, i) => polar(r + w / 2, a0 + (a1 - a0) * i / n, cx, cy));
  const inner = [...Array(n + 1)].map((_, i) => polar(r - w / 2, a1 - (a1 - a0) * i / n, cx, cy));
  let g = poly([...outer, ...inner]);
  if (round) g = U(g, circle(...polar(r, a0, cx, cy), w / 2), circle(...polar(r, a1, cx, cy), w / 2));
  return g; };
export const rotN = (g, n, offset = 0) => U(...[...Array(n)].map((_, i) => rot(g, offset + i * 360 / n)));
export const bar = ([x1, y1], [x2, y2], w) => { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2;
  return poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]); };

/** A closed ring of points (for weave strands). */
export const ring = (cx, cy, r, n = 360) => closedCurve((t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)], n);

/** Rounds a polygon's corners (c = corner cut length, or one per corner). Returns a shape. */
export const roundPoly = (pts, c, cp = 18) => { const out = [], n = pts.length;
  for (let i = 0; i < n; i++) { const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const cc = Array.isArray(c) ? c[i] : c;
    if (!cc) { out.push(p); continue; }
    const s = [p[0] + (a[0] - p[0]) / la * cc, p[1] + (a[1] - p[1]) / la * cc], e = [p[0] + (b[0] - p[0]) / lb * cc, p[1] + (b[1] - p[1]) / lb * cc];
    for (let k = 0; k <= cp; k++) { const t = k / cp; out.push([(1 - t) ** 2 * s[0] + 2 * (1 - t) * t * p[0] + t * t * e[0], (1 - t) ** 2 * s[1] + 2 * (1 - t) * t * p[1] + t * t * e[1]]); } }
  return [out]; };

/** Rectangle with circular corners; r = radius or [topLeft, topRight, bottomRight, bottomLeft] (0 = sharp). */
export const rr = (x, y, w, h, r) => { const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r], pts = [];
  const arc = (cx, cy, rad_, a0, corner) => { if (!rad_) { pts.push(corner); return; } for (let k = 0; k <= 16; k++) pts.push(polar(rad_, a0 + 90 * k / 16, cx, cy)); };
  arc(x + a, y + a, a, 180, [x, y]); arc(x + w - b, y + b, b, 270, [x + w, y]);
  arc(x + w - c, y + h - c, c, 0, [x + w, y + h]); arc(x + d, y + h - d, d, 90, [x, y + h]);
  return [pts]; };

/** A lens (vesica): length L, width W, centred at (cx, cy), long axis at `deg`. */
export const lens = (cx, cy, L, W, deg = 0) => { const r = ((L / 2) ** 2 + (W / 2) ** 2) / W, d = r - W / 2;
  return rot(move(I(circle(0, -d, r, 220), circle(0, d, r, 220)), cx, cy), deg, cx, cy); };

/** A teardrop: circle at c with radius r, pulled to a point at t. */
export const drop = (c, r, t) => { const d = Math.hypot(t[0] - c[0], t[1] - c[1]), th = Math.atan2(t[1] - c[1], t[0] - c[0]), ph = Math.acos(r / d);
  return U(circle(...c, r, 200), poly([[c[0] + r * Math.cos(th + ph), c[1] + r * Math.sin(th + ph)], t, [c[0] + r * Math.cos(th - ph), c[1] + r * Math.sin(th - ph)]])); };

/** A squircle (superellipse |x|^n + |y|^n = R^n): the soft square of app icons and badges. n = 2 is a circle, 4–5 a squircle. */
export const squircle = (cx, cy, R, n = 4.5, k = 400) => poly([...Array(k)].map((_, i) => { const t = i / k * TAU, c = Math.cos(t), s = Math.sin(t);
  return [cx + R * Math.sign(c) * Math.abs(c) ** (2 / n), cy + R * Math.sign(s) * Math.abs(s) ** (2 / n)]; }));

/** A pill: a line from a to b, width w, round ends. */
export const pill = (a, b, w) => U(bar(a, b, w), circle(...a, w / 2, 160), circle(...b, w / 2, 160));
/** An egg (wider at the bottom when k > 0), for figurine bodies. */
export const egg = (cx, cy, rx, ry, deg = 0, k = 0.18) => rot(poly(sample((t) => { const y = Math.sin(t); return [cx + rx * Math.cos(t) * (1 + k * y), cy + ry * y]; }, 0, TAU, 220).slice(0, -1)), deg, cx, cy);
