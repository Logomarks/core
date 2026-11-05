/**
 * @module @logomarks/marks-kit/svg/outline
 *
 * A mark's real extent: every segment sampled finely (curves and arcs
 * included), never the viewBox or the control points. From `fit.mjs`.
 */

import { bezierAt, arcOf, arcAt } from './path.js';

/** Samples per cubic, quadratic and arc: enough to measure to well under 0.1 units. */
const STEPS = { C: 64, Q: 48, A: 96 };

/**
 * Points along every segment.
 *
 * @param {readonly import('./path.js').Segment[]} segs The segments.
 * @returns {Generator<import('../geometry/types.js').Point>} The points.
 */
export function* outlinePoints(segs) {
	let x = 0, y = 0;
	for (const s of segs) {
		if (s[0] === 'M' || s[0] === 'L') {
			x = s[1]; y = s[2];
			yield [x, y];
		} else if (s[0] === 'C' || s[0] === 'Q') {
			const P = /** @type {import('../geometry/types.js').Point[]} */ ([[x, y]]);
			for (let i = 1; i < s.length; i += 2) P.push([/** @type {number} */ (s[i]), /** @type {number} */ (s[i + 1])]);
			for (let k = 1; k <= STEPS[s[0]]; k++) yield bezierAt(P, k / STEPS[s[0]]);
			[x, y] = P[P.length - 1];
		} else if (s[0] === 'A') {
			const a = arcOf(x, y, /** @type {number[]} */ (s.slice(1)));
			if (a) for (let k = 1; k <= STEPS.A; k++) yield arcAt(a, k / STEPS.A);
			else yield [s[6], s[7]];
			x = s[6]; y = s[7];
		}
	}
}

/**
 * The box round some shapes' real outlines.
 *
 * @param {readonly { segs: import('./path.js').Segment[] }[]} all The shapes.
 * @returns {import('./outline.js').Bounds} Their box.
 */
export function bounds(all) {
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
	for (const { segs } of all) for (const [x, y] of outlinePoints(segs)) {
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
