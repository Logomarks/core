/**
 * @module @logomarks/core/analyse/shape/symmetry
 *
 * How well a mark maps onto itself under a mirror or a turn, measured two ways: its coverage (overlap over union,
 * which a big solid mass dominates) and its outline (the share of outline pixels that land on the outline, which a
 * small asymmetric detail inside a badge still breaks).
 */

import { distance } from '../../raster/distance.js';
import { bitmap } from './ink.js';

/** @typedef {(x: number, y: number) => [number, number]} PixelMap */

/**
 * Coverage at a point between pixel centres (bilinear; 0 outside).
 *
 * @param {Float32Array} a Coverage, `n` × `n`.
 * @param {number} n The side.
 * @param {number} x Pixel coordinates (centres at whole numbers).
 * @param {number} y
 * @returns {number} The coverage there.
 */
function sample(a, n, x, y) {
	const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
	const at = (/** @type {number} */ i, /** @type {number} */ j) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : a[j * n + i]);
	return at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy;
}

/**
 * The coverage's overlap with itself mapped by `f` (intersection over union).
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @param {PixelMap} f Where each pixel centre (x + 0.5, y + 0.5) comes from.
 * @returns {number} 0–1.
 */
export function coverageMatch({ a, n }, f) {
	let i = 0, u = 0;
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		const [sx, sy] = f(x + 0.5, y + 0.5), p = a[y * n + x], q = sample(a, n, sx - 0.5, sy - 0.5);
		i += Math.min(p, q); u += Math.max(p, q);
	}
	return u ? i / u : 0;
}

/**
 * A matcher for the outline: maps each outline pixel and counts those landing within `tol` pixels of the outline.
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @param {number[]} outline Its outline pixels (`outlineOf`).
 * @returns {(f: PixelMap, tol: number) => number} The share matched, 0–1, for a map and a tolerance in pixels.
 */
export function outlineMatcher({ n }, outline) {
	const edge = new Uint8Array(n * n);
	for (const k of outline) edge[k] = 1;
	const near = distance(bitmap(edge, n), 0);
	return (f, tol) => {
		let ok = 0;
		for (const k of outline) {
			const x = k % n, [X, Y] = f(x + 0.5, (k - x) / n + 0.5), i = Math.floor(X), j = Math.floor(Y);
			if (i >= 0 && j >= 0 && i < n && j < n && near[j * n + i] <= tol) ok++;
		}
		return outline.length ? ok / outline.length : 0;
	};
}

/**
 * The mirror across the vertical line x = `cx`.
 *
 * @param {number} cx The axis, in pixels.
 * @returns {PixelMap} The map.
 */
export const mirrorX = (cx) => (x, y) => [2 * cx - x, y];

/**
 * A turn by a whole circle over `order` about `c`.
 *
 * @param {number} order How many turns make the circle.
 * @param {[number, number]} c The centre, in pixels.
 * @returns {PixelMap} The map.
 */
export function turn(order, [cx, cy]) {
	const t = 2 * Math.PI / order, co = Math.cos(t), si = Math.sin(t);
	return (x, y) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co];
}
