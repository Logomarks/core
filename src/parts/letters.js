/**
 * Letters from the kit's skeletons: solid capitals and lowercase, inline channels, the Shear and Wire cuts, a glyph
 * placed anywhere, and heavy italic block letters nested as a pair.
 */
import { C, D, I, SKEL, U, bar, bbox, circle, grow, joinPts, mapPts, move, poly, rect, rot, skelSolid, slices, stroke } from '../geometry/index.js';
import { skLine, skArc, skStroke } from '../geometry/letters.js';
import { italic, centre } from './frame.js';

/** SKEL[k](H) with B's stem run past the cap and base (clipped flat there), so its square ends don't leave a notch
 * where the bowls' bars start at the stem's centreline. */
export const letterSkel = (k, H) => { const sk = SKEL[k](H); if (k === 'B') sk[0] = { ...sk[0], e: ['c', 'c'] }; return sk; };
/** One glyph of that sans, stroked solid T wide and centred on 256. Lowercase keys ('a' …) draw from LSKEL below. */
export const letterSolid = (k, H, T) => centre(letterRaw(k, H, T));
const letterRaw = (k, H, T) => (LSKEL[k] ? lowerSolid(k, H, T) : skelSolid(k, H, T, letterSkel(k, H)));
/** A skeleton's centrelines as one g-wide line: each stroke split at its sharp turns (over 25°) into runs drawn with butt
 * ends and joined by a disc, so an acute corner (N, 3, Z) stays clean where a mitred thin stroke folds over itself. Free
 * ('f') ends are cut back by `trim`, 'c' ends run on by `run` (clip them where wanted), 'j' ends stay on the stroke they meet. */
export const skelLine = (sk, g, run, trim = 0) => U(...sk.flatMap((s) => { let p = s.p.slice();
  const ext = (a, b) => { const L = Math.hypot(a[0] - b[0], a[1] - b[1]); return [a[0] + ((a[0] - b[0]) / L) * run, a[1] + ((a[1] - b[1]) / L) * run]; };
  const cutBack = (q) => { let left = trim; while (q.length > 2) { const L = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]); if (L > left) break; left -= L; q.shift(); }
    const L = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), t = Math.min(left / L, 0.999); q[0] = [q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t]; return q; };
  if (!s.closed) { if (s.e[0] === 'c') p.unshift(ext(p[0], p[1])); else if (s.e[0] === 'f') p = cutBack(p);
    if (s.e[1] === 'c') p.push(ext(p.at(-1), p.at(-2))); else if (s.e[1] === 'f') p = cutBack(p.reverse()).reverse(); }
  const n = p.length, at = (i) => p[((i % n) + n) % n], turn = (i) => { const a = at(i - 1), b = at(i), c = at(i + 1);
    const t = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]); return Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) * 180 / Math.PI; };
  const sharp = [...Array(n).keys()].filter((i) => (s.closed || (i > 0 && i < n - 1)) && turn(i) > 25);
  if (s.closed && !sharp.length) return [stroke(p, g, { closed: true, chunk: 8 })];
  if (s.closed) p = [...p.slice(sharp[0]), ...p.slice(0, sharp[0] + 1)];
  const cut = s.closed ? sharp.map((i) => i - sharp[0]).concat(n) : [0, ...sharp, n - 1];
  return [...cut.slice(1).map((j, q) => stroke(p.slice(cut[q], j + 1), g, { chunk: 8 })), ...cut.slice(1, -1).map((i) => circle(...p[i], g / 2, 24))]; }));
/** Inline (batch 124): the glyph T wide with one g-wide channel along its skeleton, stopped `wall` short of every free end
 * and of the cap and base lines, so each stroke stays one closed piece (an open channel splits it into two tracks: Track
 * Duo). Along a stroke the walls are (T − g)/2. Centred like letterSolid. */
export const letterInline = (k, H, T, g = 22, wall = (T - g) / 2 - 4) => { const s = letterRaw(k, H, T), [x0, y0, x1, y1] = bbox(s);
  const line = I(skelLine(LSKEL[k] ? LSKEL[k](H, T) : letterSkel(k, H), g, T, wall), rect(-600, -T / 2 + wall, 1800, H + T - 2 * wall));
  return tidyRings(mapPts(D(s, line), ([x, y]) => [x + C - (x0 + x1) / 2, y + C - (y0 + y1) / 2])); };
const XR = 0.62;
const lRing = (cx, cy, r) => skStroke(skArc(cx, cy, r, -90, 270).slice(0, -1), ['f', 'f'], { closed: true });
const lStem = (x, y0, y1, e = ['c', 'c']) => skStroke(skLine([x, y0], [x, y1]), e);
/** An n's arch from the stem at x0 (radius ra, top on y), down its right leg to the baseline. `flat` leaves the stem along the
 * top (a square shoulder: the n's own, so it isn't a turned U); otherwise it springs from the stem as a half circle (h). */
const lArch = (x0, y, ra, H, flat = true) => skStroke(joinPts(...(flat ? [skLine([x0, y], [x0 + ra, y]), skArc(x0 + ra, y + ra, ra, 270, 360)] : [skArc(x0 + ra, y + ra, ra, 180, 360)]), skLine([x0 + 2 * ra, y + ra], [x0 + 2 * ra, H])), ['j', 'c']);
export const LSKEL = {
  a: (H) => { const w = H * 0.74, r1 = w / 2, y0 = H * 0.5, rb = (H - y0) / 2;
    return [skStroke(joinPts(skArc(r1, r1, r1, 215, 360), skLine([w, r1], [w, H])), ['f', 'c']), skStroke(joinPts(skLine([w, y0], [rb, y0]), skArc(rb, y0 + rb, rb, 270, 90), skLine([rb, H], [w, H])), ['j', 'j'])]; },
  b: (H) => { const r = (H * XR) / 2; return [lStem(0, 0, H), lRing(r, H - r, r)]; },
  d: (H) => { const r = (H * XR) / 2; return [lStem(2 * r, 0, H), lRing(r, H - r, r)]; },
  p: (H) => { const r = (H * XR) / 2; return [lStem(0, 0, H), lRing(r, r, r)]; },
  q: (H) => { const r = (H * XR) / 2; return [lStem(2 * r, 0, H), lRing(r, r, r)]; },
  e: (H, T) => { const r = H / 2, R = r + T / 2, h = T / 2; // the bar ends on the bowl's outer circle, the bowl starts where its end is hidden in the bar
    return [skStroke(skLine([0, r], [r + Math.sqrt(R * R - h * h) - 0.5, r]), ['j', 'f']), skStroke(skArc(r, r, r, (Math.asin(h / R) * 180) / Math.PI, -318))]; },
  g: (H) => { const r = H * 0.27, r2 = r; return [lRing(r, r, r), skStroke(joinPts(skLine([2 * r, 0], [2 * r, H - r2]), skArc(2 * r - r2, H - r2, r2, 0, 165)), ['c', 'f'])]; },
  h: (H) => { const X = H * XR; return [lStem(0, 0, H), lArch(0, H - X, X / 2, H, false)]; },
  i: (H, T) => [lStem(0, T / 2, 0, ['f', 'c']), lStem(0, T * 1.15, H, ['f', 'c'])],
  j: (H, T) => { const rj = H * 0.26; return [lStem(0, T / 2, 0, ['f', 'c']), skStroke(joinPts(skLine([0, T * 1.15], [0, H - rj]), skArc(-rj, H - rj, rj, 0, 160)))]; },
  k: (H, T) => { const X = H * XR, w = X * 0.9, a = [0, H - X * 0.32], v = [w, -X * 0.68], l = Math.hypot(...v), b = [w + (v[0] / l) * T, H - X + (v[1] / l) * T];
    return [lStem(0, 0, H), skStroke(skLine(a, b), ['j', 'f'], { y0: H - X }), skStroke(skLine([w * 0.36, a[1] - 0.36 * X * 0.68], [w + 4, H]), ['j', 'c'])]; },
  m: (H) => { const ra = H * 0.27; return [lStem(0, 0, H), lArch(0, 0, ra, H), lArch(2 * ra, 0, ra, H, false)]; },
  n: (H) => { const ra = H * 0.4; return [lStem(0, 0, H), lArch(0, 0, ra, H)]; },
  r: (H) => { const rr = H * 0.4; return [lStem(0, 0, H), skStroke(joinPts(skLine([0, 0], [rr, 0]), skArc(rr, rr, rr, 270, 320)), ['j', 'f'])]; },
  u: (H) => { const ra = H * 0.4; return [skStroke(joinPts(skLine([0, 0], [0, H - ra]), skArc(ra, H - ra, ra, 180, 90), skLine([ra, H], [2 * ra, H])), ['c', 'j']), lStem(2 * ra, 0, H)]; },
  y: (H) => { const X = H * 0.6, w = X * 0.95; return [skStroke(skLine([0, 0], [w / 2, X]), ['c', 'j']), skStroke(skLine([w, 0], [w - (w / 2) * (H / X), H]), ['c', 'c'])]; },
};
/** A lowercase glyph stroked solid T wide (square ends, 'c' ends clipped flat at the frame's top and bottom, `y0` strokes at their line). */
export const lowerSolid = (k, H, T) => U(...LSKEL[k](H, T).map((s) => { const g = skelSolid(null, H, T, [s]); return s.y0 == null ? g : I(g, rect(-600, s.y0 - T / 2, 1800, 4000)); }));
export const LETTER_DEG = -30;
const ringArea = (r) => Math.abs(r.reduce((a, p, j) => { const q = r[(j + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
/** Drops zero-area rings a cut can leave where it runs along an edge (a hairline hole in N). */
const tidyRings = (g) => g.map((pg) => pg.filter((r) => ringArea(r) > 1)).filter((pg) => pg.length);
/** Shear: a solid centred on 256 cut along the line (positive d moves it down and left), the halves slid `shift` each way along it. */
export const shearOf = (s, d = 0, shift = 22) => tidyRings(slices(s, [C + d], [-shift, shift], { deg: LETTER_DEG }));
/** The half-plane below (side 1) or above (side −1) the line, pulled back g/2 from it. */
const halfPlane = (d, s, g) => rot(s > 0 ? rect(-2000, C + d + g / 2, 4512, 2000) : rect(-2000, C + d - g / 2 - 2000, 4512, 2000), LETTER_DEG);
const polyList = (g) => (g.length && typeof g[0][0][0] === 'number' ? [g] : g);
const polyArea = (pg) => pg.reduce((s, r, i) => s + (i ? -1 : 1) * ringArea(r), 0);
/** Wire: a solid centred on 256, solid below the line and only its outline (`line` wide, inside the edge) above, g apart.
 * Outline pieces under `min` are a counter's tip or a junction's corner cut off by the gap (A's ^, K's hooks): dropped. */
export const wireOf = (s, d = 0, { line = 22, g = 22, min = 3000 } = {}) =>
  U(I(s, halfPlane(d, 1, g)), polyList(I(D(s, grow(s, -line)), halfPlane(d, -1, g))).filter((pg) => polyArea(pg) >= min));
/** A kit letter or numeral ('T', 'Four') stroked solid, H tall at the centreline with stroke T, centred on (cx, cy): the letter
 * of a letter badge with a trade hint (a T in a roof sign, a P in crop marks, a race bib's number). */
export const glyph = (k, H, T, cx = 0, cy = 0) => mapPts(letterSolid(k, H, T), ([x, y]) => [x + cx - 256, y + cy - 256]);
/** Heavy italic block letters for the monograms, drawn from straight strokes T wide between the cap line (y = −H/2) and
 * the base line, every end cut flat on those lines, then sheared italic by k. Each is a list of strokes [a, b] (ends run
 * past the lines and clipped) plus any bars [x0, y0, x1, y1]. */
const STROKES = {
  A: (w) => ({ s: [[[-w / 2, 1], [0, -1]], [[0, -1], [w / 2, 1]]], inbar: [0.16, 0.42] }),
  V: (w) => ({ s: [[[-w / 2, -1], [0, 1]], [[0, 1], [w / 2, -1]]] }),
  K: (w) => ({ s: [[[-w / 2, -1], [-w / 2, 1]], [[-w / 2, 0.16], [w / 2, -1]], [[-w * 0.08, -0.12], [w / 2, 1]]] }),
  X: (w) => ({ s: [[[-w / 2, -1], [w / 2, 1]], [[-w / 2, 1], [w / 2, -1]]] }),
  Y: (w) => ({ s: [[[-w / 2, -1], [0, 0.1]], [[w / 2, -1], [0, 0.1]], [[0, 0.1], [0, 1]]] }),
  N: (w) => ({ s: [[[-w / 2, 1], [-w / 2, -1]], [[-w / 2, -1], [w / 2, 1]], [[w / 2, 1], [w / 2, -1]]] }),
  Z: (w) => ({ s: [[[w / 2, -1], [-w / 2, 1]]], bars: [[-w / 2, -1, w / 2, -0.62], [-w / 2, 0.62, w / 2, 1]] }),
  M: (w) => ({ s: [[[-w / 2, 1], [-w / 2, -1]], [[-w / 2, -1], [0, 0.5]], [[0, 0.5], [w / 2, -1]], [[w / 2, -1], [w / 2, 1]]] }),
  W: (w) => ({ s: [[[-w / 2, -1], [-w / 4, 1]], [[-w / 4, 1], [0, -0.4]], [[0, -0.4], [w / 4, 1]], [[w / 4, 1], [w / 2, -1]]] }),
};
/** One heavy italic letter, cap H, stroke T, w wide, centred on the origin. */
export const heavyLetter = (k, { H = 360, T = 88, w = 300, slant = 0.22 } = {}) => { const W = w - T, { s, inbar, bars = [] } = STROKES[k](W), h = H / 2;
  const P = ([x, y]) => [x, y * h], line = poly([[-2000, -h], [2000, -h], [2000, h], [-2000, h]]);
  const ext = (p) => (Math.abs(p[1]) === 1 ? 2.4 * T : 0); // ends on the cap or base line run past it (clipped flat); a join stops on the centreline it meets
  const strokes = s.map(([a, c]) => { const A = P(a), B = P(c), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ea = ext(a), eb = ext(c);
    return bar([A[0] - (dx / L) * ea, A[1] - (dy / L) * ea], [B[0] + (dx / L) * eb, B[1] + (dy / L) * eb], T); });
  // where two strokes meet inside the letter (W's middle apex), fill the notch their square ends leave with the hull of the four end corners
  const ends = s.flatMap(([a, c]) => [[a, c], [c, a]]).filter(([p]) => Math.abs(p[1]) < 1).map(([p, q]) => { const A = P(p), B = P(q), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), nx = (-dy / L) * T / 2, ny = (dx / L) * T / 2;
    return { k: p.join(), pts: [[A[0] + nx, A[1] + ny], [A[0] - nx, A[1] - ny]] }; });
  const fills = ends.flatMap((e, i) => ends.slice(i + 1).filter((f) => f.k === e.k).map((f) => { const q = [...e.pts, ...f.pts], c = q.reduce((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4], [0, 0]);
    return poly(q.sort((u, v) => Math.atan2(u[1] - c[1], u[0] - c[0]) - Math.atan2(v[1] - c[1], v[0] - c[0]))); }));
  const parts = [...strokes, ...fills, ...bars.map(([x0, y0, x1, y1]) => poly([[x0 - T / 2, y0 * h], [x1 + T / 2, y0 * h], [x1 + T / 2, y1 * h], [x0 - T / 2, y1 * h]]))];
  if (inbar) parts.push(I(poly([[-W / 2, h], [0, -h], [W / 2, h]]), poly([[-2000, inbar[0] * h], [2000, inbar[0] * h], [2000, inbar[1] * h], [-2000, inbar[1] * h]])));
  return italic(I(U(...parts), line), slant); };
/** Two shapes set side by side, the second slid left until it sits exactly g from the first (a binary search on the
 * true offset), then centred. */
export const nestPair = (a, b, g) => { let lo = -800, hi = 800; const hit = (s) => I(grow(a, g - 0.5), move(b, s, 0)).length > 0;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (hit(m)) lo = m; else hi = m; }
  return U(a, move(b, hi, 0)); };
