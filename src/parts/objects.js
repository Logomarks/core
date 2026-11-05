/**
 * Trade objects drawn about the origin (y down) in parts the gap cuts free: a house, a keyhole, a rocket, a bulb,
 * an anchor, a heart, a globe, a leaf, a speech bubble, a node net, the seven-point leaf, a profile head, scissors and
 * a comb.
 */
import { D, U, bar, circle, ellipse, lens, over, polar, poly, rr, sample, stroke, trackLoop, tracks } from '../geometry/index.js';
import { smooth, heartPts, circPts } from './curves.js';
import { along } from './frame.js';
import { duo, taper } from './lines.js';

/** A house: walls `w` wide, `h` tall overall, the roof `roof` tall; centred on the origin, optionally with a door cut out. */
export const house = (w, h, roof, { door = false, r = 0 } = {}) => {
  const y0 = -h / 2, y1 = h / 2, body = poly([[-w / 2, y1], [w / 2, y1], [w / 2, y0 + roof], [0, y0], [-w / 2, y0 + roof]]);
  return door ? D(body, rr(-w * 0.12, y1 - h * 0.36, w * 0.24, h * 0.36 + 1, [w * 0.12, w * 0.12, 0, 0])) : body; };
/** The classic keyhole, h tall, centred on (cx, cy): a round head over a flared slot (locksmiths, security). */
export const keyhole = (cx, cy, h) => { const r = h * 0.27, top = cy - h / 2;
  return U(circle(cx, top + r, r, 160), poly([[cx - r * 0.5, top + r * 1.3], [cx + r * 0.5, top + r * 1.3], [cx + r * 0.95, top + h], [cx - r * 0.95, top + h]])); };
/** The rocket's body outline (right half mirrored): a parabolic nose from `top` to the shoulder at `sh`, straight sides `w`
 * wide down to `bot`, tapering a little at the tail. */
export const rocketPts = ({ w = 78, top = -224, sh = -40, bot = 130, tail = 0.86 } = {}) => {
  const nose = sample((s) => [w * (1 - (1 - s) ** 2), top + (sh - top) * s], 0, 1, 40);
  const right = [...nose, [w, sh + (bot - sh) * 0.55], [w * tail, bot]];
  return [...right, ...right.slice().reverse().map(([x, y]) => [-x, y]).slice(0, -1)]; };
/** The fins behind the body: swept back from the body's sides out to ±reach. */
export const rocketFins = ({ w = 78, y0 = 0, reach = 166, drop = 190 } = {}) => U(
  poly([[w - 30, y0], [w - 30, y0 + 120], [reach, drop + 10], [reach, drop - 64]]),
  poly([[-(w - 30), y0], [-(w - 30), y0 + 120], [-reach, drop + 10], [-reach, drop - 64]]));
/** Rocket in parts: fins behind, the body in front with a porthole, a flame under the tail; every part cut free by g. */
export const rocket = (g, { window = 36, flame = true } = {}) => { const body = D(poly(rocketPts()), circle(0, -54, window, 160));
  const r = over(rocketFins(), body, g);
  return flame ? U(r, dropDown([0, 130 + g + 38], 38, 262)) : r; };
/** A teardrop pointing down: round end at c (radius r), its tip at y = tipY. */
export const dropDown = (c, r, tipY) => { const d = tipY - c[1], ph = Math.acos(r / d);
  return U(circle(...c, r, 160), poly([[c[0] + r * Math.cos(Math.PI / 2 + ph), c[1] + r * Math.sin(Math.PI / 2 + ph)], [c[0], tipY], [c[0] + r * Math.cos(Math.PI / 2 - ph), c[1] + r * Math.sin(Math.PI / 2 - ph)]])); };
/** A bulb: round glass on a tapering neck, an ∩ filament cut into it as a gap, three screw bands parted by the gap below. */
export const bulb = (g, { filament = true } = {}) => { const R = 150, cy = -70, nb = 92;
  let glass = U(circle(0, cy, R, 300), poly([[-R * 0.86, cy + R * 0.5], [R * 0.86, cy + R * 0.5], [78, nb], [-78, nb]]));
  if (filament) glass = D(glass, stroke([[-34, nb - 32], [-34, -40], ...sample((t) => [34 * Math.cos(t), -40 + 34 * Math.sin(t)], Math.PI, 2 * Math.PI, 30).slice(1), [34, nb - 32]], g, { roundCaps: true }));
  const y1 = nb + g, band = 40;
  return U(glass, rr(-78, y1, 156, band, 14), rr(-70, y1 + band + g, 140, band, 14), rr(-40, y1 + 2 * (band + g), 80, 30, [0, 0, 26, 26])); };
/** An anchor: the ring cut free of the shank, the stock laid across in front of the shank, curved arms ending in flukes. */
export const anchor = (g, { shank = 52, arm = 52 } = {}) => {
  const ringY = -182, ringR = 30, ringW = 32, armR = 172, armCy = 26;
  const ring = D(circle(0, ringY, ringR + ringW / 2, 160), circle(0, ringY, ringR - ringW / 2, 120));
  const stem = rr(-shank / 2, ringY + ringR + ringW / 2 + g, shank, armCy + armR - (ringY + ringR + ringW / 2 + g), 0);
  const arms = D(U(circle(0, armCy, armR + arm / 2, 300)), circle(0, armCy, armR - arm / 2, 300), poly([[-400, armCy - 400], [400, armCy - 400], [400, armCy + 40], [-400, armCy + 40]]));
  const fluke = (s) => { const a = (s > 0 ? 14 : 166) * Math.PI / 180, P = [armR * Math.cos(a), armCy + armR * Math.sin(a)], dir = s > 0 ? [Math.sin(a), -Math.cos(a)] : [-Math.sin(a), Math.cos(a)], rad = [Math.cos(a), Math.sin(a)];
    return poly([[P[0] + dir[0] * 74, P[1] + dir[1] * 74], [P[0] + rad[0] * 50 - dir[0] * 10, P[1] + rad[1] * 50 - dir[1] * 10], [P[0] - rad[0] * 50 - dir[0] * 10, P[1] - rad[1] * 50 - dir[1] * 10]]); };
  const body = U(stem, arms, fluke(1), fluke(-1));
  return U(over(body, rr(-122, -124, 244, 46, 23), g), ring); };
/** A heart w wide, point down, centred on (cx, cy). */
export const heartAt = (cx, cy, w) => poly(heartPts(cx, cy, w));
/** A globe: a disc of radius r cut by the gap g along its equator, two parallels and a central meridian ellipse. */
export const globe = (cx, cy, r, g, { lat = 0.5, mer = 0.42 } = {}) => {
  const par = (k) => bar([cx - r - 10, cy + k * r], [cx + r + 10, cy + k * r], g);
  const meridian = D(ellipse(cx, cy, r * mer + g / 2, r + 10), ellipse(cx, cy, r * mer - g / 2, r + 10));
  return D(circle(cx, cy, r, 300), par(0), par(-lat), par(lat), meridian, bar([cx, cy - r - 10], [cx, cy + r + 10], g)); };
/** A leaf: a lens L long and W wide turned deg, its midrib a gap g that stops short of the stalk end. */
export const leaf = (cx, cy, L, W, deg, g, rib = 0.72) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), p = (t) => [cx + c * t * L / 2, cy + s * t * L / 2];
  return D(lens(cx, cy, L, W, deg), bar(p(-rib), p(1.2), g)); };
/** A speech bubble: a rounded box (x, y, w, h, r) with a tail from its bottom edge at tx, pointing down to the left
 * (dir -1) or right (dir 1). */
export const bubble = (x, y, w, h, r, tx, dir = -1, tl = 70, tw = 64) =>
  U(rr(x, y, w, h, r), poly([[tx, y + h - 2], [tx + dir * tw * 0.1, y + h + tl], [tx + -dir * tw, y + h - 2]]));
/** A node graph: discs at `pts` (radius r, or one per node) joined by bars w wide, each bar stopping a gap g short of the
 * nodes it meets, so every node floats in its own moat (Node Mesh, Neural Graph). `links` are index pairs. */
export const nodeNet = (pts, links, { r = 40, w = 24, g = 22 } = {}) => { const R = (i) => (Array.isArray(r) ? r[i] : r);
  const nodes = pts.map((p, i) => circle(...p, R(i), 120));
  return U(D(U(...links.map(([a, b]) => bar(pts[a], pts[b], w))), ...pts.map((p, i) => circle(...p, R(i) + g, 120))), ...nodes); };
/** The seven-point leaf about the origin, stem down: seven lens leaflets fanned from a hub, the centre one longest, each cut
 * free of the ones beside it by the gap; the hub and stem one piece, the leaflets cut free of it. */
export const LEAF7 = [[112, 110], [-112, 110], [72, 190], [-72, 190], [36, 250], [-36, 250], [0, 290]];
export const leafSeven = (g, { k = 0.27, hub = 6, stem = 150 } = {}) => {
  const leaflets = LEAF7.map(([a, L]) => { const t = (a * Math.PI) / 180, d = hub + g + L / 2; return lens(Math.sin(t) * d, -Math.cos(t) * d, L, L * k, a - 90); });
  const hubStem = U(circle(0, 0, 16, 60), bar([0, 0], [0, stem], 32));
  return U(over(leaflets.reduce((s, l) => over(s, l, g), []), hubStem, g)); };
/** A profile head facing right (the round skull, brow, nose, lips and chin, the neck cut square), about 390 × 454. */
const HEAD = [[-150, 224], [-150, 120], [-200, 30], [-210, -80], [-150, -190], [-30, -230], [80, -200], [130, -130], [136, -70], [176, -10], [136, 6],
  [146, 50], [128, 70], [136, 104], [104, 140], [40, 150], [30, 224]];
export const head = () => poly(smooth(HEAD, 20));
/** The leaf that sits where the head's thoughts are (Mind Leaf): a lens split down its midrib by the gap g. */
export const mindLeaf = (g) => D(lens(-40, -90, 230, 120, -40), bar(polar(130, 140, -40, -90), polar(80, -40, -40, -90), g));
export const SCISSORS = { rx: 92, ry: 150, py: 0, ring: 66, tipY: -224 };
const half = (s, o = SCISSORS) => { const R = [s * o.rx, o.ry], P = [0, o.py], k = (o.tipY - o.py) / (o.py - o.ry), T = [-s * o.rx * k, o.tipY];
  return { R, P, T }; };
/** One solid half: a ring, a shank and a blade tapering to a round point. */
export const scissorHalf = (s, { ring = 66, wall = 34, shank = 40, blade = 70 } = {}, o = SCISSORS) => { const { R, P, T } = half(s, o);
  const ringS = D(circle(...R, ring, 200), circle(...R, ring - wall, 200));
  const a = along(R, P, ring - wall / 2), b = along(P, T, -30);
  return U(ringS, bar(a, P, shank), taper(sample((t) => [b[0] + (T[0] - b[0]) * t, b[1] + (T[1] - b[1]) * t], 0, 1, 40), (t) => blade * (1 - t) ** 0.7 + 12), circle(...T, 6, 40)); };
/** Solid scissors: the right ring's half in front, cut free of the other by the gap, its pivot a hole. */
export const scissorsSolid = (g, opt = {}, o = SCISSORS) => D(over(scissorHalf(-1, opt, o), scissorHalf(1, opt, o), g), circle(0, o.py, 13, 60));
/** Two-track scissors: each half a ring loop and a straight line that stops a gap short of it, crossing over-under at the pivot. */
export const scissorsTrack = (g, o = SCISSORS, r = 58) => { const q = duo(g), band = q.pitch / 2 + q.w / 2;
  const halfT = (s) => { const { R, P, T } = half(s, o); const a = along(R, P, Math.sqrt((r + band + g + q.w / 2) ** 2 - (q.pitch / 2) ** 2));
    return U(trackLoop(circPts(...R, r, 180), q), tracks([a, T], q)); };
  return over(halfT(-1), halfT(1), g); };
/** A comb, spine on top: `n` teeth `tw` wide parted by the gap, the left `tail` of the spine left plain as a handle. */
export const comb = (g, { L = 448, spine = 70, teeth = 130, tw = 26, tail = 0, r = 18 } = {}) => {
  const x0 = -L / 2, x1 = L / 2, teethX0 = x0 + tail, n = Math.floor((x1 - teethX0 + g) / (tw + g)), span = n * tw + (n - 1) * g, s0 = x1 - span;
  const t = [...Array(n)].map((_, i) => rr(s0 + i * (tw + g), spine / 2 - 2, tw, teeth, [0, 0, tw / 2, tw / 2]));
  return U(rr(x0, -spine / 2, L, spine, r), ...t); };
