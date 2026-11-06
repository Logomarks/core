/**
 * A mark read back in as a shape: every filled outline unioned, each with its own fill rule. Even-odd outlines
 * exclude every ring; non-zero ones sum the rings' windings (nonzero.js), so reversed holes, islands, same-way
 * overlaps and overlapping subpaths (font glyphs) all come out right.
 */
import { OPS } from '../geometry/booleans.js';
import { signedArea } from '../geometry/polygon.js';
import { nonzeroFill } from './nonzero.js';
import { rings } from './rings.js';
import { parsePath } from './path.js';
import { shapes } from './shapes.js';

/**
 * One outline's fill, from its rings.
 *
 * @param {import('../geometry/types.js').Ring[]} rs The rings (curves sampled).
 * @param {boolean} evenodd Its fill rule.
 * @param {import('../geometry/booleans.js').BooleanOps} b The booleans.
 * @returns {import('../geometry/types.js').Shape} The filled shape.
 */
const fillOf = (rs, evenodd, b) => (evenodd ? b.xor(...rs.map((r) => [r])) : nonzeroFill(rs, b));

/**
 * Outlines (parsed path data with their fill rules) as one shape.
 *
 * @param {readonly { segs: readonly import('./path.js').Segment[], evenodd: boolean }[]} paths The outlines.
 * @param {import('../geometry/booleans.js').BooleanOps} [ops] The booleans (default: U, D, X, so robust() applies).
 * @returns {import('../geometry/types.js').Shape} The shape.
 */
export function filledShape(paths, ops = OPS) {
	return ops.union(...paths.map((s) => fillOf(rings(s.segs).filter((r) => Math.abs(signedArea(r)) > 0.5), s.evenodd, ops)));
}

/**
 * A mark's SVG (its text, or one path's d, read even-odd) as a shape, every filled element unioned.
 *
 * @param {string} src The SVG text or path data.
 * @param {import('../geometry/booleans.js').BooleanOps} [ops] The booleans.
 * @returns {import('../geometry/types.js').Shape} The shape.
 */
export const svgShape = (src, ops = OPS) => filledShape(src.includes('<') ? shapes(src) : [{ segs: parsePath(src), evenodd: true }], ops);

/**
 * Path data (M L H V C S Q T A Z, absolute or relative) as closed rings of points, curves and arcs sampled about
 * every `step` units.
 *
 * @param {string} d The path data.
 * @param {number} [step] The sampling step (1.5).
 * @returns {import('../geometry/types.js').Ring[]} The rings.
 */
export const pathRings = (d, step = 1.5) => rings(parsePath(d), step);
