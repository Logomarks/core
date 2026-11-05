/**
 * A mark read back in as a shape: every filled outline unioned, each with its own fill rule. Even-odd outlines
 * exclude every ring; non-zero ones test the winding just either side of each ring's edge, so reversed holes, islands
 * and same-way overlaps all come out right.
 */
import { OPS } from '../geometry/booleans.js';
import { signedArea, winding } from '../geometry/polygon.js';
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
function fillOf(rs, evenodd, b) {
	if (evenodd) return b.xor(...rs.map((r) => [r]));
	const sorted = rs.slice().sort((p, q) => Math.abs(signedArea(q)) - Math.abs(signedArea(p)));
	const total = (/** @type {import('../geometry/types.js').Point} */ pt) => rs.reduce((s, r) => s + winding(r, pt), 0);
	/** @type {import('../geometry/types.js').Shape} */
	let g = [];
	for (const r of sorted) {
		let k = 0, longest = 0;
		r.forEach((p, i) => {
			const q = r[(i + 1) % r.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
			if (L > longest) { k = i; longest = L; }
		});
		const p = r[k], q = r[(k + 1) % r.length], e = 0.05;
		const nx = ((q[1] - p[1]) / longest) * e, ny = ((q[0] - p[0]) / longest) * e;
		const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
		/** @type {import('../geometry/types.js').Point} */
		const a = [m[0] - nx, m[1] + ny];
		/** @type {import('../geometry/types.js').Point} */
		const c = [m[0] + nx, m[1] - ny];
		const [inside, outside] = winding(r, a) ? [a, c] : [c, a];
		const fi = total(inside) !== 0, fo = total(outside) !== 0;
		if (fi && !fo) g = b.union(g, [r]);
		else if (!fi && fo) g = b.difference(g, [r]);
	}
	return g;
}

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
