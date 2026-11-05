/**
 * Letter badges: the seven house badges, placing and knocking a letter out of one, PIX7 (a chunky 8-bit alphabet),
 * pixel glyphs, and pointed display segments.
 */
import { C, poly, move, scale, sample } from './core.js';
import { U, D, I } from './booleans.js';
import { circle, rect, rr, regular, squircle, bar, roundPoly } from './shapes.js';
import { bbox } from './polygon.js';

/* ---------- the seven house badges (letter badges, batches 48 and 70–75), each 448 on its long side, centred on 256 ---------- */
export const BADGE = {
  disc: () => circle(C, C, 224, 360),
  tile: () => rr(32, 32, 448, 448, 100),
  squircle: () => squircle(C, C, 224),
  hex: () => roundPoly(regular(C, C, 236, 6, 0)[0], 36),
  shield: () => { const pts = [[56, 40], [456, 40], [456, 250], ...sample((t) => [256 + 200 * Math.cos(t), 250 + 230 * Math.sin(t)], 0, Math.PI, 60).slice(1, -1), [56, 250]];
    return roundPoly(pts, pts.map((_, i) => (i < 2 ? 40 : 0))); },
  pill: () => rr(C - 150, 32, 300, 448, 150),
  plate: () => poly([[136, 32], [480, 32], [480, 376], [376, 480], [32, 480], [32, 136]]),
};
/** Where a letter sits in each badge: the shield's point pulls the optical centre up. */
export const BADGE_DY = { shield: -26 };
/** Centres `letter` (a shape drawn anywhere) in badge `kind` and knocks it out. */
export const place = (kind, letter, dy = BADGE_DY[kind] || 0) => { const [x0, y0, x1, y1] = bbox(letter); return move(letter, C - (x0 + x1) / 2, C - (y0 + y1) / 2 + dy); };
/** Centres `letter` in badge `kind` and knocks it out. A letter closer than `room` (50) to the edge is shrunk in 3% steps, at most to 0.82. */
export const knockout = (kind, letter, dy, room = 50) => { let g = place(kind, letter, dy), k = 1;
  while (clearance(kind, g) < room && k > 0.82) { k *= 0.97; g = place(kind, scale(letter, k, 0, 0), dy); }
  return D(BADGE[kind](), g); };
/** The smallest distance between a letter (already placed) and its badge's edge: keep it 50 or more. */
export const clearance = (kind, placed) => { const b = BADGE[kind]()[0], segs = (r) => r.map((p, i) => [p, r[(i + 1) % r.length]]);
  const dps = (p, [a, q]) => { const dx = q[0] - a[0], dy = q[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const bs = segs(b), lp = placed.flat(2); let m = Infinity; for (const p of lp) for (const s of bs) m = Math.min(m, dps(p, s)); return m; };

/* ---------- Pixel: a chunky 8-bit alphabet on a 7×7 grid (stems two pixels wide, bars one tall) ---------- */
/**
 * Rows top to bottom, '#' a pixel. Every diagonal steps two pixels wide, so no two pixels ever touch only at a corner
 * (`checker()` finds any that do). Widths vary: T, Y and the numeral 1 are 6 wide so their stems sit centred.
 */
export const PIX7 = {
  A: ['..###..', '.##.##.', '##...##', '##...##', '#######', '##...##', '##...##'],
  B: ['######.', '##...##', '##...##', '######.', '##...##', '##...##', '######.'],
  C: ['.#####.', '##...##', '##.....', '##.....', '##.....', '##...##', '.#####.'],
  D: ['#####..', '##..##.', '##...##', '##...##', '##...##', '##..##.', '#####..'],
  E: ['#######', '##.....', '##.....', '######.', '##.....', '##.....', '#######'],
  F: ['#######', '##.....', '##.....', '######.', '##.....', '##.....', '##.....'],
  G: ['.#####.', '##...##', '##.....', '##.####', '##...##', '##...##', '.######'],
  H: ['##...##', '##...##', '##...##', '#######', '##...##', '##...##', '##...##'],
  I: ['######', '..##..', '..##..', '..##..', '..##..', '..##..', '######'],
  J: ['.....##', '.....##', '.....##', '.....##', '##...##', '##...##', '.#####.'],
  K: ['##...##', '##..##.', '##.##..', '####...', '##.##..', '##..##.', '##...##'],
  L: ['##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '#######'],
  M: ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##'],
  N: ['##...##', '###..##', '####.##', '##.####', '##..###', '##...##', '##...##'],
  O: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  P: ['######.', '##...##', '##...##', '######.', '##.....', '##.....', '##.....'],
  Q: ['.#####..', '##...##.', '##...##.', '##...##.', '##..###.', '##...###', '.#######', '......##'],
  R: ['######.', '##...##', '##...##', '######.', '##.##..', '##..##.', '##...##'],
  S: ['.#####.', '##...##', '##.....', '.#####.', '.....##', '##...##', '.#####.'],
  T: ['######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
  U: ['##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  V: ['##...##', '##...##', '##...##', '###.###', '.#####.', '..###..', '...#...'],
  W: ['##...##', '##...##', '##...##', '##.#.##', '#######', '###.###', '##...##'],
  X: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  Y: ['##...##', '##...##', '###.###', '.#####.', '..###..', '..###..', '..###..'],
  Z: ['#######', '....###', '...###.', '..###..', '.###...', '###....', '#######'],
  Zero: ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
  One: ['..##..', '.###..', '####..', '..##..', '..##..', '..##..', '######'],
  Two: ['.#####.', '##...##', '.....##', '..####.', '.###...', '##.....', '#######'],
  Three: ['#######', '....##.', '...##..', '..####.', '.....##', '##...##', '.#####.'],
  Four: ['...###.', '..####.', '.##.##.', '##..##.', '#######', '....##.', '....##.'],
  Five: ['######.', '##.....', '######.', '.....##', '.....##', '##...##', '.#####.'],
  Six: ['..####.', '.##....', '##.....', '######.', '##...##', '##...##', '.#####.'],
  Seven: ['#######', '##...##', '....##.', '...##..', '..##...', '..##...', '..##...'],
  Eight: ['.#####.', '##...##', '##...##', '.#####.', '##...##', '##...##', '.#####.'],
  Nine: ['.#####.', '##...##', '##...##', '.######', '.....##', '....##.', '.####..'],
};
/** Any 2×2 window that is a checkerboard (pixels, or holes, touching only at a corner); the grid is padded with empties. */
export const checker = (rows) => { const w = Math.max(...rows.map((r) => r.length)), at = (r, c) => (rows[r]?.[c] === '#' ? 1 : 0), hits = [];
  for (let r = -1; r < rows.length; r++) for (let c = -1; c < w; c++) { const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
    if (a === e && b === d && a !== b) hits.push([r, c]); } return hits; };
/** A pixel glyph as one solid: each row's runs as rectangles, overlapping the next row by 0.01 so they fuse. */
export const pixels = (rows, p, x0 = 0, y0 = 0) => U(...rows.flatMap((row, r) => [...row.matchAll(/#+/g)].map((m) => rect(x0 + m.index * p, y0 + r * p - 0.01, m[0].length * p, p + 0.02))));

/* ---------- Segment: chamfered display segments (pointed 45° ends, parted by an even gap) ---------- */
/**
 * Display segments: `segs` is a list of [a, b] centreline pairs ([x, y] points). Each becomes a bar t wide whose ends are
 * 45°-style points: at a joint, the end is cut by the bisector with its nearest neighbour and by that line's mirror about
 * the segment's own axis, both pulled back so neighbours are parted by an even gap g. A free end is pointed as if at a
 * right-angle joint. The result is the classic LCD segment (an elongated hexagon) for square joints, and a sharper or
 * blunter point where a diagonal comes in.
 */
export const dsegs = (segs, t = 50, g = 22) => { const key = (p) => p.map((v) => v.toFixed(2)).join(','), at = {};
  const dir = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
  segs.forEach(([p, q]) => { (at[key(p)] ||= []).push(dir(p, q)); (at[key(q)] ||= []).push(dir(q, p)); });
  // a node that lies inside another segment (a T-junction): the end stops g short of that segment's edge
  const through = (P) => segs.some(([p, q]) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), s_ = ((P[0] - p[0]) * dx + (P[1] - p[1]) * dy) / L / L;
    return s_ > 1e-3 && s_ < 1 - 1e-3 && Math.abs((P[0] - p[0]) * dy - (P[1] - p[1]) * dx) / L < 1e-3; });
  const wedge = (P, u) => { const others = at[key(P)].filter((v) => Math.hypot(v[0] - u[0], v[1] - u[1]) > 1e-6);
    let phi = Math.PI / 2; for (const v of others) phi = Math.min(phi, Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))));
    const back = through(P) ? t / 2 + g : (g / 2) / Math.sin(phi / 2), A = [P[0] + u[0] * back, P[1] + u[1] * back], R = 3000, a = Math.atan2(u[1], u[0]);
    return poly([A, [A[0] + R * Math.cos(a - phi / 2), A[1] + R * Math.sin(a - phi / 2)], [A[0] + R * Math.cos(a), A[1] + R * Math.sin(a)], [A[0] + R * Math.cos(a + phi / 2), A[1] + R * Math.sin(a + phi / 2)]]); };
  return U(...segs.map(([p, q]) => { const u = dir(p, q), v = [-u[0], -u[1]];
    return I(bar([p[0] - u[0] * t, p[1] - u[1] * t], [q[0] + u[0] * t, q[1] + u[1] * t], t), wedge(p, u), wedge(q, v)); })); };
