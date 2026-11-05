/**
 * Faceted heads and crests (the esports genre): a symmetric outline split into planes by round-ended seams, sharp
 * eye cuts, profiles, and the heater crest.
 */
import { D, U, over, pill, poly } from '../geometry/index.js';
import { mx } from './frame.js';

/** A right-half outline (top centre round to bottom centre, x ≥ 0) closed into a symmetric polygon's points. Ends on
 * x = 0 are not repeated. */
export const sym = (half) => { const inner = half.filter((p, i) => !((i === 0 || i === half.length - 1) && Math.abs(p[0]) < 1e-9));
  const a = half[0][0] === 0 ? [half[0]] : [], z = half.at(-1)[0] === 0 ? [half.at(-1)] : [];
  return [...a, ...inner, ...z, ...inner.slice().reverse().map(mx)]; };
/** Mirrored copies of a list of right-half polygons (a polygon touching x = 0 is mirrored too: union them yourself). */
const both = (pts) => [poly(pts), poly(pts.map(mx).reverse())];
/** A seam: a gap g wide along a..b with round ends, so seams meeting at a node leave the facets' corners sharp. A seam
 * on x = 0 is cut once; any other is mirrored. */
const seamCut = (g, [a, b]) => (Math.abs(a[0]) < 1e-9 && Math.abs(b[0]) < 1e-9 ? [pill(a, b, g)] : [pill(a, b, g), pill(mx(a), mx(b), g)]);
/** A front-facing faceted head, symmetric about x = 0 (y down, about 448 tall round the origin): the outline `half`
 * (plus any `parts`, right-half polygons mirrored and unioned on: horns, tusks, a crest) split into flat planes by
 * `seams` cut g wide, and the eyes cut as sharp holes (`eyes`, right-half polygons, mirrored). `holes` are extra
 * right-half holes (nostrils), mirrored too. `behind` parts (horns, ears) sit behind the head and `front` parts (tusks) in
 * front of it, each right-half, mirrored and cut free by the gap. */
export const facetHead = (g, { half, parts = [], seams = [], eyes = [], holes = [], behind = [], front = [] }) => {
  const solid = U(poly(sym(half)), ...parts.flatMap(both));
  let head = D(solid, ...seams.flatMap((s) => seamCut(g, s)), ...[...eyes, ...holes].flatMap(both));
  if (behind.length) head = over(U(...behind.flatMap(both)), head, g);
  if (front.length) head = over(head, U(...front.flatMap(both)), g);
  return head; };
/** An asymmetric faceted shape (a head in profile): `outline` plus `parts`, split by `seams` (gaps g wide, round ends) and
 * cut by `holes`. */
export const facets = (g, { outline, parts = [], seams = [], holes = [] }) =>
  D(U(poly(outline), ...parts.map(poly)), ...seams.map(([a, b]) => pill(a, b, g)), ...holes.map(poly));
/** A sharp eye cut (right half, angry): the inner end square at (x, y) and h tall, the top edge rising `rise` over `len`
 * to a sharp outer tip, the lower edge meeting it there. */
export const eyeCut = (x, y, len, rise, h) => [[x, y], [x + len, y - rise], [x + len * 0.7, y - rise * 0.7 + h * 0.95], [x + 6, y + h]];
/** An angular heater crest w × h round the origin: a flat top with its corners chamfered c, straight sides down to `knee`
 * (a fraction of h below the centre) and a point at the foot. */
export const heater = (w = 360, h = 448, c = 44, knee = 0.12) => poly([[-w / 2 + c, -h / 2], [w / 2 - c, -h / 2], [w / 2, -h / 2 + c], [w / 2, h * knee], [0, h / 2], [-w / 2, h * knee], [-w / 2, -h / 2 + c]]);
