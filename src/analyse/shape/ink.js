/**
 * @module @logomarks/core/analyse/shape/ink
 *
 * A mark's ink on a square coverage raster: the binary ink, its box and centre, its outline pixels, and its
 * silhouette with the holes filled (optionally closed first, so narrow gaps join the pieces).
 */

import { distance } from '../../raster/distance.js';

/**
 * A square binary raster as the raster module reads one.
 *
 * @param {Uint8Array} data 1 for ink, 0 for empty, row by row.
 * @param {number} n Its side in pixels.
 * @returns {import('../../raster/scanline.js').Bitmap} The bitmap.
 */
export const bitmap = (data, n) => ({ data, width: n, height: n, x0: 0, y0: 0, scale: 1 });

/**
 * The ink of a coverage raster: pixels over half covered.
 *
 * @param {Float32Array} a Coverage 0–1, `n` × `n`, row by row.
 * @param {number} n The raster's side.
 * @returns {import('./ink.js').Ink} The ink, its box and its centre.
 */
export function inkOf(a, n) {
	const bin = new Uint8Array(n * n);
	let count = 0, mass = 0, mx = 0, my = 0, x0 = n, y0 = n, x1 = -1, y1 = -1;
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		const v = a[y * n + x];
		mass += v; mx += v * (x + 0.5); my += v * (y + 0.5);
		if (v <= 0.5) continue;
		bin[y * n + x] = 1;
		count++;
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	return { a, n, bin, count, box: [x0, y0, x1 + 1, y1 + 1], centre: mass ? [mx / mass, my / mass] : [n / 2, n / 2] };
}

/**
 * The outline: ink pixels on the raster's border or beside an empty pixel (4-connected).
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @returns {number[]} The outline pixels' indices.
 */
export function outlineOf({ bin, n }) {
	const out = [];
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		const k = y * n + x;
		if (bin[k] && (x === 0 || y === 0 || x === n - 1 || y === n - 1 || !bin[k - 1] || !bin[k + 1] || !bin[k - n] || !bin[k + n])) out.push(k);
	}
	return out;
}

/**
 * Pixels of a binary raster with their holes filled: everything the empty space round the border can't reach.
 *
 * @param {Uint8Array} bin 1 for ink.
 * @param {number} n The raster's side.
 * @returns {Uint8Array} 1 inside the silhouette.
 */
export function filled(bin, n) {
	const out = new Uint8Array(n * n).fill(1), stack = [];
	const seed = (/** @type {number} */ k) => { if (!bin[k] && out[k]) { out[k] = 0; stack.push(k); } };
	for (let i = 0; i < n; i++) { seed(i); seed((n - 1) * n + i); seed(i * n); seed(i * n + n - 1); }
	while (stack.length) {
		const k = /** @type {number} */ (stack.pop()), x = k % n, y = (k - x) / n;
		if (x > 0) seed(k - 1);
		if (x < n - 1) seed(k + 1);
		if (y > 0) seed(k - n);
		if (y < n - 1) seed(k + n);
	}
	return out;
}

/**
 * The ink closed by a disc (grown, then shrunk, by `r` pixels): gaps narrower than 2r join, outer corners stay.
 *
 * @param {Uint8Array} bin 1 for ink.
 * @param {number} n The raster's side.
 * @param {number} r The disc's radius in pixels.
 * @returns {Uint8Array} 1 for the closed ink.
 */
export function closed(bin, n, r) {
	const near = distance(bitmap(bin, n), 0);
	const grown = new Uint8Array(n * n);
	for (let k = 0; k < n * n; k++) grown[k] = near[k] <= r ? 1 : 0;
	const depth = distance(bitmap(grown, n), 1);
	const out = new Uint8Array(n * n);
	for (let k = 0; k < n * n; k++) out[k] = depth[k] > r ? 1 : 0;
	return out;
}
