/**
 * Placing and sizing parts drawn round the origin: turns, mirrors, sizes, centring, stacking parts back to front
 * with the gap, the gap-exact draw, and dropping a boolean's specks.
 */
import { C, U, area, bbox, mapPts, over, polar, rot, scale, GAP as G } from '../geometry/index.js';

/** Turns a shape drawn round the origin by `deg`, clockwise on screen (or round [cx, cy]). */
export const turn = (s, deg, cx = 0, cy = 0) => rot(s, deg, cx, cy);
/** Mirror a shape (drawn about the origin) left to right. */
export const mirror = (s) => U(mapPts(s, ([x, y]) => [-x, y]));
/** A point mirrored across x = 0. */
export const mx = ([x, y]) => [-x, y];
/** Shears a shape drawn upright into an italic: x moves right by `k` × height above y = 0 (y down). */
export const italic = (s, k = 0.22) => mapPts(s, ([x, y]) => [x - y * k, y]);
/** A point along a → b at distance d from a. */
export const along = (a, b, d) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L]; };
/** A point at distance d along heading deg (0 = right, 90 = down) from p. */
export const at = (p, d, deg) => polar(d, deg, p[0], p[1]);
/** Scales a shape so its longest side is `span`, about its own centre. */
export const sized = (s, span) => { s = U(s); const [x0, y0, x1, y1] = bbox(s); return scale(s, span / Math.max(x1 - x0, y1 - y0), (x0 + x1) / 2, (y0 + y1) / 2); };
/** Scale and centre a shape so its longest side is `size`, centred on (cx, cy). */
export const fitTo = (s, size, cx = C, cy = C) => { s = U(s); const [x0, y0, x1, y1] = bbox(s), k = size / Math.max(x1 - x0, y1 - y0);
  return mapPts(s, ([x, y]) => [cx + (x - (x0 + x1) / 2) * k, cy + (y - (y0 + y1) / 2) * k]); };
/** Moves a shape so its bounding box is centred on the canvas (for marks drawn round the origin). */
export const centre = (g) => { const [x0, y0, x1, y1] = bbox(g); return mapPts(g, ([x, y]) => [x + C - (x0 + x1) / 2, y + C - (y0 + y1) / 2]); };
/** The first ring of a shape (its outline points). */
export const outline = (shape) => (typeof shape[0][0][0] === 'number' ? shape[0] : shape[0][0]);
/** Stacks parts back to front, each later part in front of everything before it and cut free by the gap g. */
export const chain = (g, ...parts) => parts.reduce((scene, p) => over(scene, p, g));
/** Builds a mark whose gap lands on exactly `G` once fit.mjs scales it to 448: `build(g)` draws it with gap g; it's drawn,
 * measured, and drawn again with the gap divided by the fit's scale (twice, as the gap changes the size a little).
 * `before()` runs before every draw (seed Math.random there, so robust()'s jitter repeats). */
export const exact = (build, before = () => {}, target = G) => { let g = target, s;
  for (let i = 0; i < 3; i++) { before(); s = build(g); const [x0, y0, x1, y1] = bbox(s), k = 448 / Math.max(x1 - x0, y1 - y0);
    if (Math.abs(g * k - target) < 0.05) return s; g = target / k; }
  before(); return build(g); };
/** Drops the pieces of a shape under `piece` square units and its holes under `hole`: a boolean's specks, or the wedge a
 * slanted cut leaves of a brick. */
export const despeckShape = (shape, piece = 60, hole = 30) => shape.filter((pg) => area(pg[0]) >= piece).map((pg) => [pg[0], ...pg.slice(1).filter((h) => area(h) >= hole)]);
