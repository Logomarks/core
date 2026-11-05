/**
 * @module @arraypress/marks-kit/svg/rings
 *
 * Path segments as closed polygons (rings), curves sampled every `step`
 * units: the input to the booleans and the scanline raster. From the kit's
 * `pathRings()`.
 */

import { bezierAt, arcOf, arcAt } from './path.js';
import { dedupe } from '../geometry/polygon.js';

/**
 * The rings a path draws. A ring closes at `Z`, at the next `M` or at the end.
 *
 * @param {readonly import('./path.js').Segment[]} segs The segments.
 * @param {number} [step=1.5] The longest chord along a curve.
 * @returns {import('../geometry/types.js').Ring[]} The rings (each at least 3 points).
 */
export function rings(segs, step = 1.5) {
	/** @type {import('../geometry/types.js').Ring[]} */
	const out = [];
	/** @type {import('../geometry/types.js').Point[] | null} */
	let cur = null;
	let x = 0, y = 0, sx = 0, sy = 0;
	const close = () => {
		if (cur && cur.length > 2) out.push(dedupe(cur));
		cur = null;
	};
	for (const s of segs) {
		if (s[0] === 'Z') { close(); x = sx; y = sy; continue; }
		if (s[0] === 'M') { close(); x = sx = s[1]; y = sy = s[2]; cur = [[x, y]]; continue; }
		const ring = cur ?? (cur = [[x, y]]);
		if (s[0] === 'L') {
			x = s[1]; y = s[2];
			ring.push([x, y]);
		} else if (s[0] === 'C' || s[0] === 'Q') {
			const P = /** @type {import('../geometry/types.js').Point[]} */ ([[x, y]]);
			for (let i = 1; i < s.length; i += 2) P.push([/** @type {number} */ (s[i]), /** @type {number} */ (s[i + 1])]);
			const L = P.slice(1).reduce((t, p, k) => t + Math.hypot(p[0] - P[k][0], p[1] - P[k][1]), 0);
			const n = Math.max(4, Math.ceil(L / step));
			for (let k = 1; k <= n; k++) ring.push(bezierAt(P, k / n));
			[x, y] = P[P.length - 1];
		} else {
			const a = arcOf(x, y, /** @type {number[]} */ (s.slice(1)));
			if (a) {
				const n = Math.max(4, Math.ceil((Math.abs(a.sweep) * Math.max(a.rx, a.ry)) / step));
				for (let k = 1; k <= n; k++) ring.push(arcAt(a, k / n));
			} else ring.push([s[6], s[7]]);
			x = s[6]; y = s[7];
		}
	}
	close();
	return out;
}
