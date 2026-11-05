/**
 * @module @logomarks/core/raster/channels
 *
 * Runs of even width: the strokes of the ink, or the gaps in the empty
 * space. Along the middle of a stroke (the ridge of its distance transform)
 * its width is twice the distance. Ridge pixels are grouped from the
 * narrowest up, each group taking the connected pixels no more than a
 * tolerance wider than its seed. A group that stays even and runs well past
 * its width is a run; notches and tapering points widen too fast along their
 * ridge to make one.
 */

import { distance } from './distance.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * The ridge: pixels at a strict local maximum of the distance across at least one direction (one pixel thick).
 *
 * @param {Float32Array} d The distances.
 * @param {number} W The raster's width.
 * @param {number} H Its height.
 * @returns {number[]} The ridge pixels' indices.
 */
function ridge(d, W, H) {
	const out = [];
	for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
		const i = y * W + x, v = d[i];
		if (v < 1) continue;
		for (const [dx, dy] of DIRS) {
			if (v > d[i - dy * W - dx] && v >= d[i + dy * W + dx]) { out.push(i); break; }
		}
	}
	return out;
}

/**
 * A value at a fraction of the way through a sorted list.
 *
 * @param {readonly number[]} sorted The list, ascending.
 * @param {number} q The fraction, 0–1.
 * @returns {number} The value.
 */
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

/**
 * The even-width runs of one kind of pixel.
 *
 * @param {import('./scanline.js').Bitmap} bm The raster.
 * @param {0 | 1} kind 1 for strokes, 0 for gaps.
 * @param {import('./channels.js').ChannelOptions} o What counts as a run.
 * @returns {import('./channels.js').Channel[]} The runs, narrowest first.
 */
export function channels(bm, kind, { tolerance, spread, run, shortest, widest, narrowest }) {
	const { width: W, height: H, scale: K, x0, y0 } = bm;
	const d = distance(bm, kind);
	const r = ridge(d, W, H);
	// a run spans 2d pixel centres, less half a pixel on average
	const width = (/** @type {number} */ i) => (2 * d[i] - 0.5) / K;
	const onRidge = new Uint8Array(W * H);
	for (const i of r) onRidge[i] = 1;
	r.sort((a, b) => d[a] - d[b]);
	const taken = new Uint8Array(W * H);
	/** @type {import('./channels.js').Channel[]} */
	const out = [];
	for (const seed of r) {
		if (taken[seed]) continue;
		const limit = width(seed) + tolerance;
		const stack = [seed];
		/** @type {number[]} */
		const widths = [];
		let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
		taken[seed] = 1;
		while (stack.length) {
			const q = /** @type {number} */ (stack.pop()), x = q % W, y = (q - x) / W;
			widths.push(width(q));
			if (x < bx0) bx0 = x;
			if (y < by0) by0 = y;
			if (x > bx1) bx1 = x;
			if (y > by1) by1 = y;
			for (const [dx, dy] of N8) {
				const t = q + dy * W + dx;
				if (onRidge[t] && !taken[t] && width(t) <= limit) { taken[t] = 1; stack.push(t); }
			}
		}
		const w = widths.reduce((s, v) => s + v, 0) / widths.length, length = widths.length / K;
		if (w > widest || w < narrowest || length < Math.max(run * w, shortest)) continue;
		widths.sort((a, b) => a - b);
		if (quantile(widths, 0.9) - quantile(widths, 0.1) > spread) continue;
		// the ridge's box, grown by half the width: the run itself
		const h = w / 2;
		out.push({ width: w, length, box: [x0 + bx0 / K - h, y0 + by0 / K - h, x0 + (bx1 + 1) / K + h, y0 + (by1 + 1) / K + h] });
	}
	return out.sort((a, b) => a.width - b.width);
}
