/**
 * Modular systems: segment letters, iso pieces, block tilings, nested subdivisions and linkages.
 */
import { C, poly } from './core.js';
import { U, D, I } from './booleans.js';
import { circle, rect, bar, pill } from './shapes.js';
import { grow, over } from './offset.js';
import { iso } from './iso.js';

/**
 * Segment letters: every stroke is its own segment. strokes are [[a, b], …] between keys of `nodes` ({ key: [x, y] }); each is a
 * bar of width t, squared off t/2 past its ends. At every joint the strokes are parted by gaps g along the bisectors between
 * neighbouring strokes: a mitre at an L, a Y at a T, an X at a cross. `box` ([x0, y0, x1, y1]) clips it so diagonals end flush.
 * Keep diagonals at 45°: a sharper angle makes a seam longer than the stroke is wide. A stroke that only passes a node isn't
 * parted there (list it as one stroke).
 */
export const segments = (nodes, strokes, { t = 96, g = 22, box = null } = {}) => {
  const h = t / 2, dir = (a, b) => { const [ax, ay] = nodes[a], [bx, by] = nodes[b], L = Math.hypot(bx - ax, by - ay); return [(bx - ax) / L, (by - ay) / L]; };
  let solid = U(...strokes.map(([a, b]) => { const [ux, uy] = dir(a, b), A = nodes[a], B = nodes[b]; return bar([A[0] - ux * h, A[1] - uy * h], [B[0] + ux * h, B[1] + uy * h], t); }));
  if (box) solid = I(solid, rect(box[0], box[1], box[2] - box[0], box[3] - box[1]));
  const at = {}; strokes.forEach(([a, b]) => { (at[a] ||= []).push(dir(a, b)); (at[b] ||= []).push(dir(b, a)); });
  const cuts = [];
  for (const [k, ds] of Object.entries(at)) { if (ds.length < 2) continue; const c = nodes[k], ang = ds.map(([x, y]) => Math.atan2(y, x)).sort((p, q) => p - q);
    ang.forEach((a0, i) => { let a1 = ang[(i + 1) % ang.length]; if (a1 <= a0) a1 += 2 * Math.PI; const mid = (a0 + a1) / 2, L = Math.min(h / Math.sin((a1 - a0) / 2) + 4, 3 * t);
      cuts.push(bar(c, [c[0] + L * Math.cos(mid), c[1] + L * Math.sin(mid)], g)); });
    cuts.push(circle(...c, g / 2, 24)); }
  return D(solid, ...cuts); };
/** The same from polylines of [x, y] points: every vertex is a joint, every leg a stroke. */
export const segmentLines = (lines, o = {}) => { const nodes = {}, strokes = [], key = ([x, y]) => { const k = `${x.toFixed(2)},${y.toFixed(2)}`; nodes[k] = [x, y]; return k; };
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) strokes.push([key(l[i]), key(l[i + 1])]);
  return segments(nodes, strokes, o); };

/**
 * Iso pieces: each piece is a list of unit cubes [i, j, k]. A piece's faces that share a plane and a direction are drawn as one
 * seamless face; gaps g run only between pieces and along creases (Iso Lock: two identical pieces locked into one block).
 */
export const isoPieces = (pieces, u = 80, g = 22, ox = 0, oy = 0) => {
  const P = iso(u, ox, oy), occ = new Set(), all = [];
  pieces.forEach((pc, id) => pc.forEach(([i, j, k]) => { occ.add(`${i},${j},${k}`); all.push([i, j, k, id]); }));
  const has = (i, j, k) => occ.has(`${i},${j},${k}`), groups = new Map();
  all.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  for (const [i, j, k, id] of all) {
    const hex = poly([P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j, k), P(i + 1, j + 1, k), P(i, j + 1, k), P(i, j + 1, k + 1)]);
    for (const [key, sh] of groups) groups.set(key, D(sh, hex));
    const add = (key, f) => groups.set(key, U(groups.get(key) || [], f));
    if (!has(i, j, k + 1)) add(`${id}|z|${k + 1}`, poly([P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)]));
    if (!has(i + 1, j, k)) add(`${id}|x|${i + 1}`, poly([P(i + 1, j, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i + 1, j, k + 1)]));
    if (!has(i, j + 1, k)) add(`${id}|y|${j + 1}`, poly([P(i, j + 1, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)]));
  }
  return U(...[...groups.values()].filter((s) => s.length).map((s) => grow(s, -g / 2))); };

/**
 * Blocks (Golden and its variations): `list` tiles a W × H rectangle with [x, y, w, h] in any units. It's scaled so the long side
 * is 448, centred, and every edge that isn't on the outline is pulled in by g/2, so neighbours sit an even gap apart and the
 * outline stays exact. Returns { shape, k, x0, y0 } (scale and the frame's top-left) for laying a cut across it.
 */
export const blocks = (list, W, H, g = 22) => { const k = 448 / Math.max(W, H), x0 = C - (W * k) / 2, y0 = C - (H * k) / 2, e = 1e-6;
  const shape = U(...list.map(([x, y, w, h]) => { const l = x > e ? g / 2 : 0, t = y > e ? g / 2 : 0, r = x + w < W - e ? g / 2 : 0, b = y + h < H - e ? g / 2 : 0;
    return rect(x0 + x * k + l, y0 + y * k + t, w * k - l - r, h * k - t - b); }));
  return { shape, k, x0, y0 }; };
/** A nested subdivision for blocks(): peel n − 1 blocks off the sides named in turn (l t r b), each `cut(w, h, side)` deep; the rest is the last block. */
export const nest = (W, H, n, sides, cut) => { const out = []; let [x, y, w, h] = [0, 0, W, H];
  for (let i = 0; i < n; i++) { const s = sides[i % sides.length], f = cut(w, h, s);
    if (i === n - 1) { out.push([x, y, w, h]); break; }
    if (s === 'l') { out.push([x, y, f, h]); x += f; w -= f; } else if (s === 'r') { out.push([x + w - f, y, f, h]); w -= f; }
    else if (s === 't') { out.push([x, y, w, f]); y += f; h -= f; } else { out.push([x, y + h - f, w, f]); h -= f; } }
  return out; };

/** Linkage: capsules of width w pinned together. bars [[a, b], …] back to front, each laid over the ones before and cut free by g; a pin hole at each of `pins`. */
export const linkage = (bars, pins = [], { w = 88, g = 22, pin = 17 } = {}) => { let out = [];
  for (const [a, b] of bars) out = over(out, pill(a, b, w), g);
  return D(out, ...pins.map((p) => circle(...p, pin, 40))); };
