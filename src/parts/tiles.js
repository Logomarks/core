/**
 * Modular tiles: one grid span with the house gap, tiles by token (squares, quarter discs, coves, bites, arches,
 * triangles, rings), turned tokens, and dissections shrunk to an even gap.
 */
import { C, D, I, U, circle, grow, poly, rect, rr, GAP as G } from '../geometry/index.js';

/** Every modular grid is built to one span (422) with the house gap, so after fitting the family shares one gap (~23):
 * a 2×2 cell is 200, a 3×3 cell 126, a 4×4 cell 89 (batch 46's rule). n across, m down; the cell size comes from the
 * longer side, so a 2×3 letter has the 3×3's cells. Each cell is { i, j, x, y, s }. */
export const MSPAN = 422;
export const gridCells = (n, m = n, { span = MSPAN, g = G, s } = {}) => { const k = Math.max(n, m); s = s ?? (span - (k - 1) * g) / k;
  const x0 = C - (n * s + (n - 1) * g) / 2, y0 = C - (m * s + (m - 1) * g) / 2;
  return [...Array(n * m)].map((_, q) => { const i = q % n, j = Math.floor(q / n); return { i, j, s, x: x0 + i * (s + g), y: y0 + j * (s + g) }; }); };
const CORNERS = ['tl', 'tr', 'br', 'bl'], SIDES = ['t', 'r', 'b', 'l'];
/** A cell's corner point. */
export const corner = (c, k) => [c.x + (k[1] === 'r' ? c.s : 0), c.y + (k[0] === 'b' ? c.s : 0)];
/** The middle of a cell's side. */
export const sideMid = (c, k) => [c.x + c.s / 2 + (k === 'r' ? c.s / 2 : k === 'l' ? -c.s / 2 : 0), c.y + c.s / 2 + (k === 'b' ? c.s / 2 : k === 't' ? -c.s / 2 : 0)];
/**
 * One tile in a cell, by token. Corner tokens end in tl/tr/br/bl, side tokens in t/r/b/l:
 *   S  square            q<k> quarter disc centred on corner k (Fan's tile)   c<k> cove: the square less that quarter disc
 *   t<k> half-square triangle keeping corner k                              b<k> square bitten at corner k (r 0.46, Quad Cove)
 *   d<k> half-pill: the square with side k fully round (an arch)            v<k> triangle pointing to side k
 *   n<k> square notched at corner k (a half-size square out)                o  disc         .  empty
 *   h<k> half disc on side k (radius s/2, flat side on the side)            e<k> half disc of radius s, its flat side on side k
 *   r<k> quarter ring centred on corner k (radii s/2 to s)
 *   P<k> a smaller quarter disc (radius 0.62 s) on corner k, B<k> the square less it (the drunkard's-path pair)
 * A trailing * punches an eye (a hole of radius 0.17 s) at the tile's centre, or at its corner-side third with *<k>.
 */
export const tile = (tok, c) => {
  const star = tok.indexOf('*');
  if (star > 0) { const at = tok.slice(star + 1), [ex, ey] = at ? [c.x + c.s * (at[1] === 'r' ? 0.62 : 0.38), c.y + c.s * (at[0] === 'b' ? 0.62 : 0.38)] : [c.x + c.s / 2, c.y + c.s / 2];
    return D(tile(tok.slice(0, star), c), circle(ex, ey, c.s * 0.17, 96)); }
  const { x, y, s } = c, sq = rect(x, y, s, s), k = tok.slice(1);
  switch (tok[0]) {
    case '.': return [];
    case 'S': return sq;
    case 'o': return circle(x + s / 2, y + s / 2, s / 2, 160);
    case 'q': return I(circle(...corner(c, k), s, 200), sq);
    case 'c': return D(sq, circle(...corner(c, k), s, 200));
    case 'b': return D(sq, circle(...corner(c, k), s * 0.46, 160));
    case 'B': return D(sq, circle(...corner(c, k), s * 0.62, 160));
    case 'P': return I(circle(...corner(c, k), s * 0.62, 160), sq);
    case 'n': { const [px, py] = corner(c, k); return D(sq, rect(px - s / 2, py - s / 2, s, s)); }
    case 't': { const i = CORNERS.indexOf(k); return poly([CORNERS[(i + 3) % 4], k, CORNERS[(i + 1) % 4]].map((q) => corner(c, q))); }
    case 'd': { const r = s / 2; return rr(x, y, s, s, { t: [r, r, 0, 0], r: [0, r, r, 0], b: [0, 0, r, r], l: [r, 0, 0, r] }[k]); }
    case 'v': { const i = SIDES.indexOf(k), back = CORNERS.filter((q) => q.includes(SIDES[(i + 2) % 4][0])); return poly([sideMid(c, k), ...back.map((q) => corner(c, q))]); }
    case 'h': return I(circle(...sideMid(c, k), s / 2, 160), sq);
    case 'e': return I(circle(...sideMid(c, k), s, 200), sq);
    case 'r': return I(D(circle(...corner(c, k), s, 200), circle(...corner(c, k), s / 2, 160)), sq);
    default: throw new Error('tile ' + tok);
  }
};
/** A grid of tiles from rows of space-separated tokens (see `tile`), e.g. ['qbr S', '. S', '. S']. */
export const tiles = (rows, o = {}) => { const grid = rows.map((r) => r.trim().split(/\s+/)), n = Math.max(...grid.map((r) => r.length)), cs = gridCells(n, grid.length, o);
  return U(...cs.map((c) => tile(grid[c.j][c.i] ?? '.', c))); };
/** Turns a token by a quarter turn clockwise, n times (corners tl→tr→br→bl, sides t→r→b→l). */
export const turnTok = (tok, n = 1) => { const k = tok.slice(1); n = ((n % 4) + 4) % 4;
  if (CORNERS.includes(k)) return tok[0] + CORNERS[(CORNERS.indexOf(k) + n) % 4];
  if (SIDES.includes(k)) return tok[0] + SIDES[(SIDES.indexOf(k) + n) % 4];
  return tok; };
/** Polygons in any units, scaled so the set is 448 across, centred, each shrunk by half the gap (an even 22 between). */
export const pieces = (polys, g = G) => { const pts = polys.flat(), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const k = 448 / Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0), w = (Math.max(...xs) - x0) * k, h = (Math.max(...ys) - y0) * k;
  return U(...polys.map((pl) => grow(poly(pl.map(([x, y]) => [C - w / 2 + (x - x0) * k, C - h / 2 + (y - y0) * k])), -g / 2))); };
