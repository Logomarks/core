/**
 * Iso scenes: boxes that cut an even gap round themselves, fitted projections and a true drawing order, and an
 * engine for convex pieces (hulls, lofts, boxes, plans, cylinders) drawn as faces an even gap apart.
 */
import { C, D, U, bar, circle, grow, iso, poly, GAP as G } from '../geometry/index.js';
import { ngonPts } from './curves.js';

/** A convex outline grown by g, every corner rounded (the moat a box cuts round itself). */
export const growPts = (pts, g) => U(poly(pts), ...pts.map((p, i) => bar(p, pts[(i + 1) % pts.length], 2 * g)), ...pts.map((p) => circle(...p, g, 24)));
/** A box's three visible faces, split by a Y of gaps at the front corner. */
export function boxFaces(P, [x0, y0, z0], [x1, y1, z1], g = G) {
  const top = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
  const right = [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)];
  const left = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)];
  const f = P(x1, y1, z1);
  const ys = U(bar(f, P(x0, y1, z1), g), bar(f, P(x1, y0, z1), g), bar(f, P(x1, y1, z0), g));
  return D(U(poly(top), poly(right), poly(left)), ys);
}
/** A box's silhouette: the hexagon round its three visible faces. */
export const boxHex = (P, [x0, y0, z0], [x1, y1, z1]) => [P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1)];
/** Lays one box over a scene: cuts an even gap round its silhouette out of what's there, then adds its faces. */
export const overBox = (scene, P, a, b, g = G) => U(D(scene, growPts(boxHex(P, a, b), g)), boxFaces(P, a, b, g));
/** Boxes drawn back to front (by the sum of their corners), each cutting an even gap round itself out of what's behind. */
export function boxes(P, list, g = G) {
  let scene = [];
  for (const [a, b] of [...list].sort((p, q) => p[0][0] + p[0][1] + p[0][2] + p[1][0] + p[1][1] + p[1][2] - (q[0][0] + q[0][1] + q[0][2] + q[1][0] + q[1][1] + q[1][2])))
    scene = overBox(scene, P, a, b, g);
  return scene;
}
/** An iso projection scaled so the given 3D points span 448 and sit centred, so the 22 gap is still 22 after fitting.
 * It carries its scale and offset (P.u, P.ox, P.oy) for the kit's isoPieces(). */
export const isoFit = (pts, span = 448) => { const P0 = iso(1, -C, -C), p = pts.map((q) => P0(...q)), xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const u = span / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const ox = -u * (Math.max(...xs) + Math.min(...xs)) / 2, oy = -u * (Math.max(...ys) + Math.min(...ys)) / 2;
  return Object.assign(iso(u, ox, oy), { u, ox, oy }); };
/** Iso drawing order for boxes [[x0, y0, z0], [x1, y1, z1]] (or anything `box()` turns into one): A goes before B when A ends
 * where B starts along some axis. Sorting by the sum of corners suits a neat stack, but not a part pulled out of line. */
export const isoOrder = (list, box = (a) => a) => { const behind = (a, b) => { const [, hi] = box(a), [lo] = box(b); return [0, 1, 2].some((i) => hi[i] <= lo[i] + 1e-9); };
  const left = [...list], order = [];
  while (left.length) { const i = left.findIndex((a) => left.every((b) => a === b || !behind(b, a) || behind(a, b))); order.push(...left.splice(Math.max(i, 0), 1)); }
  return order; };
/** Every corner of each box [[x0, y0, z0], [x1, y1, z1]] (to fit a projection round them). */
export const corners = (list) => list.flatMap(([a, b]) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k & 1 ? b[0] : a[0], k & 2 ? b[1] : a[1], k & 4 ? b[2] : a[2]]));
/** Batch 8's boxes, projected to fill the frame. boxes() orders them by the sum of their corners, which suits a neat stack;
 * a plank pulled out of line needs a true order: A goes before B when A ends where B starts along some axis. */
export const fitBoxes = (list, P = isoFit(corners(list))) => { const order = isoOrder(list);
  return order.reduce((scene, [a, b]) => overBox(scene, P, a, b), []); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };
const mean = (V) => V.reduce((s, p) => [s[0] + p[0] / V.length, s[1] + p[1] / V.length, s[2] + p[2] / V.length], [0, 0, 0]);
const EYE = unit([1, 1, 1]); // the iso view: a face shows when its outward normal · (1, 1, 1) > 0
/** A convex piece from corner points and faces (lists of corners in order round the face). Each face gets its outward unit
 * normal n and plane offset d; `tags` names faces that merge with same-named faces of the part (a cylinder's facets). */
export const piece = (faces, tags = []) => { const c = mean(faces.flat());
  return { lo: [0, 1, 2].map((i) => Math.min(...faces.flat().map((p) => p[i]))), hi: [0, 1, 2].map((i) => Math.max(...faces.flat().map((p) => p[i]))),
    faces: faces.map((pts, i) => { let n = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))); if (dot(n, sub(mean(pts), c)) < 0) n = n.map((v) => -v);
      return { pts, n, d: dot(n, pts[0]), tag: tags[i] }; }) }; };
/** The convex hull of a few points (brute force: every plane through three points with all the points on one side). */
export const hull = (V) => { const faces = [], seen = new Set(), eps = 1e-7;
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
    const nn = cross(sub(V[j], V[i]), sub(V[k], V[i])), l = Math.hypot(...nn); if (l < eps) continue; const n = nn.map((v) => v / l), d = dot(n, V[i]);
    const s = V.map((p) => dot(n, p) - d); if (!(s.every((v) => v < eps) || s.every((v) => v > -eps))) continue;
    const on = V.filter((p, q) => Math.abs(s[q]) < eps), key = on.map((p) => V.indexOf(p)).sort((a, b) => a - b).join(','); if (seen.has(key)) continue; seen.add(key);
    const c = mean(on), u = unit(sub(on[0], c)), w = cross(n, u);
    faces.push(on.slice().sort((a, b) => Math.atan2(dot(sub(a, c), w), dot(sub(a, c), u)) - Math.atan2(dot(sub(b, c), w), dot(sub(b, c), u)))); }
  return piece(faces); };
/** A loft between two outlines with the same number of points (bottom and top, each a list of [x, y, z]): a prism, a
 * frustum, a wedge. `smooth` merges the side facets into one face (a cylinder's or cone's side). */
export const loft = (A, B, smooth = false) => piece([A, B, ...A.map((p, i) => [p, A[(i + 1) % A.length], B[(i + 1) % A.length], B[i]])], [0, 0, ...A.map(() => (smooth ? 'side' : 0))]);
/** A box between two corners. */
export const box = ([x0, y0, z0], [x1, y1, z1]) => loft([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
/** A flat outline [[x, y]] raised from z0 to z1 (plan), or a side profile [[x, z]] pushed back from y0 to y1 (side), or a front
 * profile [[y, z]] pushed along x (front). */
export const plan = (pts, z0, z1, smooth) => loft(pts.map(([x, y]) => [x, y, z0]), pts.map(([x, y]) => [x, y, z1]), smooth);
export const side = (pts, y0, y1, smooth) => loft(pts.map(([x, z]) => [x, y0, z]), pts.map(([x, z]) => [x, y1, z]), smooth);
export const front = (pts, x0, x1, smooth) => loft(pts.map(([y, z]) => [x0, y, z]), pts.map(([y, z]) => [x1, y, z]), smooth);
export const cyl = (cx, cy, r, z0, z1, n = 72) => plan(ngonPts(cx, cy, r, n), z0, z1, true);
/**
 * Draws parts (each a piece or a list of pieces) as one iso mark. Faces that look away are dropped, and so is any part of a
 * face that lies against another piece's face (two pieces of a part touching). Pieces are drawn back to front (isoOrder on
 * their boxes, ties by the box's centre), each hiding what's behind it; a part's faces that share a plane (or a tag) merge; every face is then shrunk
 * by g/2, so faces that meet sit an even gap apart. The projection is fitted to 448 first.
 */
export const scene = (parts, g) => { const all = parts.flatMap((p, obj) => (Array.isArray(p) ? p : [p]).map((q) => ({ ...q, obj })));
  const P = isoFit(all.flatMap((q) => q.faces.flatMap((f) => f.pts))), proj = (pts) => poly(pts.map((p) => P(...p))), groups = new Map();
  const key = (q, f) => (f.tag ? `${q.obj}|${f.tag}` : `${q.obj}|${f.n.map((v) => v.toFixed(4))}|${f.d.toFixed(4)}`);
  const depth = (q) => q.lo[0] + q.lo[1] + q.lo[2] + q.hi[0] + q.hi[1] + q.hi[2]; // ties in isoOrder (boxes that overlap) fall back to this
  for (const q of isoOrder([...all].sort((a, b) => depth(a) - depth(b)), (q) => [q.lo, q.hi])) {
    const shown = q.faces.filter((f) => dot(f.n, EYE) > 1e-6).map((f) => { const against = all.flatMap((o) => (o === q ? [] : o.faces.filter((h) => dot(h.n, f.n) < -0.99999 && Math.abs(h.d + f.d) < 1e-6)));
      return { k: key(q, f), s: against.length ? D(proj(f.pts), ...against.map((h) => proj(h.pts))) : proj(f.pts) }; }).filter((f) => f.s.length);
    if (!shown.length) continue; const sil = U(...shown.map((f) => f.s));
    for (const [k, s] of groups) groups.set(k, D(s, sil));
    for (const { k, s } of shown) groups.set(k, U(groups.get(k) || [], s)); }
  return U(...[...groups.values()].filter((s) => s.length).map((s) => grow(s, -g / 2))); };
