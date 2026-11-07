/**
 * @module @logomarks/core/analyse/shape/thickness
 *
 * How thick a mark's ink is, from its distance transform: the share of the ink in parts thicker than a width (what
 * an opening by a disc keeps), and how drawn-out its pieces are (a stroke is long for its width; a dot or a block
 * isn't).
 */

import { distance } from '../../raster/distance.js';
import { bitmap } from './ink.js';

/**
 * The share of the ink covered by discs of radius `r` that fit inside it: the ink in parts thicker than 2r.
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @param {Float32Array} depth Each ink pixel's distance to the empty space (`distance(ink, 1)`).
 * @param {number} r The radius in pixels.
 * @returns {number} 0–1.
 */
export function thickShare({ bin, n, count }, depth, r) {
	const core = new Uint8Array(n * n);
	let any = false;
	for (let k = 0; k < n * n; k++) if (bin[k] && depth[k] >= r) { core[k] = 1; any = true; }
	if (!any || !count) return 0;
	const near = distance(bitmap(core, n), 0);
	let kept = 0;
	for (let k = 0; k < n * n; k++) if (bin[k] && near[k] <= r) kept++;
	return kept / count;
}

/**
 * How drawn-out the pieces are: each 8-connected piece's area over its width squared (its width four times its mean
 * depth, exact for a long even stroke), averaged by area. A stroke L long and w wide scores about L / w; a dot about
 * 1.8, a square block 2.3.
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @param {Float32Array} depth Each ink pixel's distance to the empty space.
 * @returns {number} The area-weighted mean.
 */
export function elongation({ bin, n }, depth) {
	const seen = new Uint8Array(n * n), stack = [];
	let sum = 0, total = 0;
	for (let s = 0; s < n * n; s++) {
		if (!bin[s] || seen[s]) continue;
		let area = 0, deep = 0;
		seen[s] = 1;
		stack.push(s);
		while (stack.length) {
			const k = /** @type {number} */ (stack.pop()), x = k % n, y = (k - x) / n;
			area++;
			deep += depth[k];
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const X = x + dx, Y = y + dy, j = Y * n + X;
				if (X >= 0 && Y >= 0 && X < n && Y < n && bin[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
			}
		}
		const width = 4 * deep / area;
		sum += area * area / (width * width);
		total += area;
	}
	return total ? sum / total : 0;
}
