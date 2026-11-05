/**
 * Isometric drawing: the projection, unit cubes, and solids built from profiles, plans and rings, every face that
 * shows solid with an even gap where two meet.
 */
import { C, poly, scale, sample } from './core.js';
import { U, D, I } from './booleans.js';
import { circle, bar } from './shapes.js';
import { stroke } from './stroke.js';
import { signedArea, dedupe } from './polygon.js';

// ---------- isometric cubes ----------

const c30 = Math.cos(Math.PI / 6);
/** Isometric projection: x runs down-right, y down-left, z up; u = cube edge in px. */
export const iso = (u, ox = 0, oy = 0) => (x, y, z) => [C + ox + (x - y) * u * c30, C + oy + (x + y) * u * 0.5 - z * u];

/** Unit cubes at integer [x, y, z] positions, drawn back to front with an even gap g between every face. */
export function cubes(list, u, ox = 0, oy = 0, g = 22) {
  const P = iso(u, ox, oy); let scene = [];
  for (const [i, j, k] of [...list].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))) {
    const top = [P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)];
    const right = [P(i + 1, j, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i + 1, j, k + 1)];
    const left = [P(i, j + 1, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)];
    const hex = [P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j, k), P(i + 1, j + 1, k), P(i, j + 1, k), P(i, j + 1, k + 1)];
    const ctr = P(i + 0.5, j + 0.5, k + 0.5), grow = 1 + g / (u * c30);
    const f = P(i + 1, j + 1, k + 1), ys = U(bar(f, P(i, j + 1, k + 1), g), bar(f, P(i + 1, j, k + 1), g), bar(f, P(i + 1, j + 1, k), g));
    scene = U(D(scene, scale(poly(hex), grow, ...ctr)), D(U(poly(top), poly(right), poly(left)), ys));
  }
  return scene;
}

// ---------- iso solids ----------
// Rule for all of these: a face shows when its outward normal points at the viewer (normal · (1, 1, 1) > 0);
// every face that shows is solid, with an even gap wherever two of them meet. Nothing else is drawn.

const orient = (r, ccw) => (signedArea(r) > 0) === ccw ? r : r.slice().reverse();
const sharp = (a, v, b) => { const e1 = [v[0] - a[0], v[1] - a[1]], e2 = [b[0] - v[0], b[1] - v[1]]; return Math.abs(Math.atan2(e1[0] * e2[1] - e1[1] * e2[0], e1[0] * e2[0] + e1[1] * e2[1])) > 0.45; };

/**
 * A side profile pushed back in depth (Quarter Pipe, Half Pipe, Iso Arch). `outer` and `holes` are [x, z] points, z up;
 * the front face sits at y = Y and the solid runs back to y = 0. Gaps run along every front edge whose face shows and up
 * every sharp corner between two faces that show; pass extra `creases` ([x, z]) where a face ends against one behind it.
 * A hole or opening only reads if the shape is shallow enough to see through it: keep Y well under the opening's width.
 */
export function isoPrism(P, outer, { holes = [], Y = 1, creases = [], g = 22 } = {}) {
  const rings = [orient(outer, true), ...holes.map((h) => orient(h, false))];
  const at = (r, y) => r.map(([x, z]) => P(x, y, z));
  const face = (y) => D(poly(at(rings[0], y)), ...rings.slice(1).map((h) => poly(at(h, y))));
  const shows = (a, b) => (b[1] - a[1]) - (b[0] - a[0]) > 1e-9;
  const quads = [], gaps = [];
  for (const r of rings) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) continue;
    quads.push(poly([P(a[0], 0, a[1]), P(b[0], 0, b[1]), P(b[0], Y, b[1]), P(a[0], Y, a[1])]));
    if (shows(a, b)) gaps.push(bar(P(a[0], Y, a[1]), P(b[0], Y, b[1]), g), circle(...P(a[0], Y, a[1]), g / 2, 16), circle(...P(b[0], Y, b[1]), g / 2, 16));
    const z = r[(i + 2) % r.length]; if (sharp(a, b, z) && shows(a, b) && shows(b, z)) creases = [...creases, b]; }
  for (const [x, z] of creases) gaps.push(bar(P(x, 0, z), P(x, Y, z), g));
  return D(U(face(Y), face(0), ...quads), ...gaps);
}

/**
 * A top-down shape raised from z0 to z1 (Iso Star, Iso Stadium). `outer`/`holes` are [x, y] points on the ground.
 * Returns { shape, solid }: pass a list of them to isoPile() to stack them.
 */
export function isoBlock(P, outer, { holes = [], z0 = 0, z1 = 1, g = 22 } = {}) {
  const rings = [orient(outer, true), ...holes.map((h) => orient(h, false))];
  const at = (r, z) => r.map(([x, y]) => P(x, y, z));
  const face = (z) => D(poly(at(rings[0], z)), ...rings.slice(1).map((h) => poly(at(h, z))));
  const shows = (a, b) => (b[1] - a[1]) - (b[0] - a[0]) > 1e-9;
  const quads = [], gaps = [];
  for (const r of rings) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], z = r[(i + 2) % r.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) continue;
    quads.push(poly([P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)]));
    if (shows(a, b)) gaps.push(bar(P(a[0], a[1], z1), P(b[0], b[1], z1), g), circle(...P(a[0], a[1], z1), g / 2, 16), circle(...P(b[0], b[1], z1), g / 2, 16));
    if (sharp(a, b, z) && shows(a, b) && shows(b, z)) gaps.push(bar(P(b[0], b[1], z0), P(b[0], b[1], z1), g)); }
  const solid = U(face(z1), face(z0), ...quads);
  return { shape: D(solid, ...gaps), solid };
}

function hull(pts) { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = []; for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); }
const ell = (P, r, z, t0 = 0, t1 = 2 * Math.PI, n = 160) => sample((t) => P(r * Math.cos(t), r * Math.sin(t), z), t0, t1, n);

/** An upright ring (or a solid cylinder when ri = 0) from z0 to z1: top, outer side and far inside wall, split by gaps. */
export function isoRing(P, r, ri, z0, z1, g = 22) {
  const solid = poly(hull([...ell(P, r, z0), ...ell(P, r, z1)]));
  const cuts = [stroke(dedupe(ell(P, r, z1, -Math.PI / 4 - 0.06, (3 * Math.PI) / 4 + 0.06, 80)), g)];
  if (ri > 0) { const ti = poly(ell(P, ri, z1).slice(0, -1)), bi = poly(ell(P, ri, z0).slice(0, -1));
    cuts.push(I(ti, bi), stroke(dedupe(ell(P, ri, z1, (3 * Math.PI) / 4, (7 * Math.PI) / 4, 80)), g)); }
  return { shape: D(solid, ...cuts), solid };
}

/** Stacks { shape, solid } parts (from isoBlock / isoRing) in order, bottom up and back to front, each cutting an even gap round itself out of what's already there. */
export function isoPile(parts, g = 22) { let scene = [];
  for (const { shape, solid } of parts) { const outline = (Array.isArray(solid[0][0][0]) ? solid : [solid]).map((pg) => stroke(dedupe(pg[0]), 2 * g, { closed: true }));
    scene = U(D(scene, solid, ...outline), shape); }
  return scene; }
