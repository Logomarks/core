/**
 * Letter skeletons: one geometric sans as centrelines (SKEL), and a skeleton stroked solid.
 */
import { polar, sample } from './core.js';
import { U, I } from './booleans.js';
import { rect } from './shapes.js';
import { stroke, linePts, arcPts, joinPts } from './stroke.js';

/* ---------- Letter skeletons (batches 72–75): one geometric sans as centrelines, rendered many ways ---------- */
// Each letter is (H) => strokes; a stroke is { p: points, e: [startEnd, endEnd], closed? }. H is the centreline cap height
// (the outer cap is H plus the stroke width). End kinds: 'c' runs past the cap or base line and is clipped flat there,
// 'f' is a free end, 'j' lands on another stroke (a renderer that parts strokes stops it short there).
// skelSolid() strokes them solid (Stencil and Slab Badge); tracks() and balloon() take the same points (Track and Puffy Badge).
/** A skeleton's straight stroke from a to b, a point about every 10 units. */
export const skLine = (a, b) => linePts(a, b, Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 10)));
/** A skeleton's arc round (cx, cy), degrees a0 to a1, at least 12 points. */
export const skArc = (cx, cy, r, a0, a1) => arcPts(cx, cy, r, a0, a1, Math.max(12, Math.ceil((Math.abs(a1 - a0) * r) / 600)));
const skPoly = (pts) => joinPts(...pts.slice(1).map((b, i) => skLine(pts[i], b)));
/** A skeleton stroke: points `p`, end kinds `e` ('c' clipped at the cap or base line, 'f' free, 'j' a join), and options (closed). */
export const skStroke = (p, e = ['f', 'f'], o = {}) => ({ p, e, ...o });
/** A bowl from the stem at x = 0, between y0 and y1, reaching x = w: bar, half circle, bar. */
const skBowl = (y0, y1, w) => { const r = (y1 - y0) / 2, cx = w - r; return joinPts(skLine([0, y0], [cx, y0]), skArc(cx, y0 + r, r, -90, 90), skLine([cx, y1], [0, y1])); };
export const SKEL = {
  A: (H, w = H * 0.92) => [skStroke(skPoly([[0, H], [w / 2, 0], [w, H]]), ['c', 'c']), skStroke(skLine([w * 0.2, H * 0.66], [w * 0.8, H * 0.66]), ['j', 'j'])],
  B: (H, w = H * 0.74) => [skStroke(skLine([0, 0], [0, H])), skStroke(skBowl(0, H * 0.47, w - 14), ['j', 'j']), skStroke(skBowl(H * 0.47, H, w), ['j', 'j'])],
  C: (H) => [skStroke(skArc(H / 2, H / 2, H / 2, 42, 318))],
  D: (H, w = H * 0.84) => [skStroke(joinPts(skLine([0, H / 2], [0, 0]), skBowl(0, H, w), skLine([0, H], [0, H / 2])).slice(0, -1), ['f', 'f'], { closed: true })],
  E: (H, w = H * 0.7) => [skStroke(skPoly([[w, 0], [0, 0], [0, H], [w, H]])), skStroke(skLine([0, H / 2], [w * 0.86, H / 2]), ['j', 'f'])],
  F: (H, w = H * 0.7) => [skStroke(skPoly([[w, 0], [0, 0], [0, H]])), skStroke(skLine([0, H * 0.5], [w * 0.84, H * 0.5]), ['j', 'f'])],
  G: (H) => [skStroke(joinPts(skLine([H * 0.56, H / 2], [H, H / 2]), skArc(H / 2, H / 2, H / 2, 0, 312)))],
  H: (H, w = H * 0.8) => [skStroke(skLine([0, 0], [0, H])), skStroke(skLine([w, 0], [w, H])), skStroke(skLine([0, H / 2], [w, H / 2]), ['j', 'j'])],
  J: (H, w = H * 0.66) => { const r = w / 2; return [skStroke(joinPts(skLine([w, 0], [w, H - r]), skArc(r, H - r, r, 0, 180), skLine([0, H - r], [0, H - r - H * 0.12])))]; },
  K: (H, w = H * 0.8) => [skStroke(skLine([0, 0], [0, H])), skStroke(skPoly([[w + 6, 0], [0, H * 0.6]]), ['c', 'j']), skStroke(skLine([w * 0.32, H * 0.38], [w + 6, H]), ['j', 'c'])],
  L: (H, w = H * 0.66) => [skStroke(skPoly([[0, 0], [0, H], [w, H]]))],
  M: (H, w = H * 1.02) => [skStroke(skPoly([[0, H], [0, 0], [w / 2, H * 0.72], [w, 0], [w, H]]), ['f', 'f'])],
  N: (H, w = H * 0.82) => [skStroke(skPoly([[0, H], [0, 0], [w, H], [w, 0]]))],
  O: (H) => [skStroke(skArc(H / 2, H / 2, H / 2, -90, 270).slice(0, -1), ['f', 'f'], { closed: true })],
  P: (H, w = H * 0.76) => [skStroke(joinPts(skLine([0, H], [0, 0]), skBowl(0, H * 0.58, w)), ['f', 'j'])],
  Q: (H) => [skStroke(skArc(H / 2, H / 2, H / 2, -90, 270).slice(0, -1), ['f', 'f'], { closed: true }), skStroke(skLine([H * 0.62, H * 0.62], [H * 1.04, H * 1.04]), ['j', 'f'])],
  R: (H, w = H * 0.78) => [skStroke(joinPts(skLine([0, H], [0, 0]), skBowl(0, H * 0.56, w)), ['f', 'j']), skStroke(skLine([w * 0.4, H * 0.56], [w + 4, H]), ['j', 'c'])],
  S: (H) => { const r = H / 4; return [skStroke(joinPts(skArc(r * 1.04, r, r, -12, -270), skArc(r * 1.04, 3 * r, r, -90, 168)))]; },
  T: (H, w = H * 0.84) => [skStroke(skLine([0, 0], [w, 0])), skStroke(skLine([w / 2, 0], [w / 2, H]), ['j', 'f'])],
  U: (H, w = H * 0.8) => { const r = w / 2; return [skStroke(joinPts(skLine([0, 0], [0, H - r]), skArc(r, H - r, r, 180, 0), skLine([w, H - r], [w, 0])))]; },
  V: (H, w = H * 0.92) => [skStroke(skPoly([[0, 0], [w / 2, H], [w, 0]]), ['c', 'c'])],
  W: (H, w = H * 1.24) => [skStroke(skPoly([[0, 0], [w * 0.25, H], [w * 0.5, H * 0.26], [w * 0.75, H], [w, 0]]), ['c', 'c'])],
  X: (H, w = H * 0.86) => [skStroke(skLine([0, 0], [w, H]), ['c', 'c']), skStroke(skLine([w, 0], [0, H]), ['c', 'c'])],
  Y: (H, w = H * 0.92) => [skStroke(skPoly([[0, 0], [w / 2, H * 0.5], [w, 0]]), ['c', 'c']), skStroke(skLine([w / 2, H * 0.5], [w / 2, H]), ['j', 'f'])],
  Z: (H, w = H * 0.8) => [skStroke(skPoly([[0, 0], [w, 0], [0, H], [w, H]]))],
  One: (H, w = H * 0.5) => [skStroke(skPoly([[0, H * 0.3], [w, 0], [w, H]]))],
  Two: (H, w = H * 0.76) => { const r = w / 2; return [skStroke(joinPts(skArc(r, r, r, 180, 380), skLine(polar(r, 380, r, r), [0, H]), skLine([0, H], [w, H])))]; },
  Three: (H, w = H * 0.76) => { const r = H * 0.29, cx = w - r, cy = H - r; return [skStroke(joinPts(skPoly([[0, 0], [w * 0.92, 0], [cx - r * 0.2, cy - r]]), skArc(cx, cy, r, -90, 160)))]; },
  Four: (H, w = H * 0.84) => [skStroke(skPoly([[w * 0.68, H], [w * 0.68, 0], [0, H * 0.7], [w, H * 0.7]]), ['f', 'f'])],
  Five: (H, w = H * 0.76) => { const r = H * 0.3, cx = w - r, cy = H - r; return [skStroke(joinPts(skPoly([[w, 0], [0, 0], [0, cy - r], [cx, cy - r]]), skArc(cx, cy, r, -90, 150)))]; },
  Six: (H) => { const r = H * 0.3, cx = r, cy = H - r; return [skStroke(skArc(cx, cy, r, 0, 360).slice(0, -1), ['f', 'f'], { closed: true }), skStroke(skLine(polar(r, 200, cx, cy), [cx + r * 1.05, 0]), ['j', 'f'])]; },
  Seven: (H, w = H * 0.76) => [skStroke(skPoly([[0, 0], [w, 0], [w * 0.3, H]]), ['f', 'c'])],
  Eight: (H) => { const r1 = H * 0.22, r2 = H * 0.28, cx = r2; return [skStroke(skArc(cx, r1, r1, 0, 360).slice(0, -1), ['f', 'f'], { closed: true }), skStroke(skArc(cx, H - r2, r2, 0, 360).slice(0, -1), ['f', 'f'], { closed: true })]; },
  Nine: (H) => { const r = H * 0.3, cx = r, cy = r; return [skStroke(skArc(cx, cy, r, 0, 360).slice(0, -1), ['f', 'f'], { closed: true }), skStroke(skLine(polar(r, 20, cx, cy), [cx - r * 1.05, H]), ['j', 'f'])]; },
  Zero: (H) => { const rx = H * 0.36, ry = H / 2; return [skStroke(sample((t) => [rx + rx * Math.cos(t), ry + ry * Math.sin(t)], 0, 2 * Math.PI, 90).slice(0, -1), ['f', 'f'], { closed: true })]; },
};

/** A skeleton stroked solid: square ends T wide; 'c' ends run on and are clipped flat at the cap and base lines. */
export const skelSolid = (k, H, T, sk = SKEL[k](H)) => { const ext = (p, e) => { const q = p.slice();
    if (e[0] === 'c') { const [a, b] = [q[0], q[1]], L = Math.hypot(a[0] - b[0], a[1] - b[1]); q.unshift([a[0] + ((a[0] - b[0]) / L) * T * 2, a[1] + ((a[1] - b[1]) / L) * T * 2]); }
    if (e[1] === 'c') { const [a, b] = [q.at(-1), q.at(-2)], L = Math.hypot(a[0] - b[0], a[1] - b[1]); q.push([a[0] + ((a[0] - b[0]) / L) * T * 2, a[1] + ((a[1] - b[1]) / L) * T * 2]); }
    return q; };
  return I(U(...sk.map((s) => stroke(ext(s.p, s.e), T, { closed: !!s.closed, chunk: 8 }))), rect(-600, -T / 2, 1800, H + T)); };
