/**
 * @module @arraypress/marks-kit/similar
 *
 * What two marks are compared by, from their coverage (alpha 0–1, row by row, any renderer). The outline: the mark at
 * 48 px blurred 3×3, so a few pixels of shift or a thin gap don't hide a near-copy. The letter: a badge's knocked-out
 * letter (its holes) or a letter mark's ink, cropped to its box and scaled to 40 px. Both compare by overlap (IoU) in
 * all 8 rotations and flips. And "More like this" for a whole set: plain overlap at 48 px, nudged by style and mood.
 */

/** The outline signature's side, and the scores that flag a pair: too close, a near-copy (1.00 is usually a rotation). */
export const OUTLINE = { size: 48, tooClose: 0.72, nearCopy: 0.9 };
/** The letter signature: rendered at `render`, cropped to `size`; the scores that flag a pair. */
export const LETTER = { render: 128, size: 40, tooClose: 0.7, nearCopy: 0.85 };

/**
 * A 3×3 box blur, averaging only the pixels inside the image.
 *
 * @param {Float32Array} a The image.
 * @param {number} N Its side.
 * @returns {Float32Array} The blurred image.
 */
export function blur(a, N) {
	const b = new Float32Array(N * N);
	for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
		let s = 0, c = 0;
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			const X = x + dx, Y = y + dy;
			if (X >= 0 && Y >= 0 && X < N && Y < N) { s += a[Y * N + X]; c++; }
		}
		b[y * N + x] = s / c;
	}
	return b;
}

/**
 * A mark's outline signature from its coverage at OUTLINE.size: blurred 3×3.
 *
 * @param {Float32Array} alpha Coverage 0–1, `size` × `size`.
 * @param {number} [size] Its side (48).
 * @returns {Float32Array} The signature.
 */
export const outlineSignature = (alpha, size = OUTLINE.size) => blur(alpha, size);

/**
 * The empty space a mark encloses: everything not ink and not reachable from the border.
 *
 * @param {Uint8Array} ink The mark's ink, 1 or 0.
 * @param {number} R The raster's side.
 * @returns {Uint8Array} Its holes, 1 or 0.
 */
function holesOf(ink, R) {
	const out = new Uint8Array(R * R).fill(1);
	const stack = [];
	for (let i = 0; i < R; i++) stack.push(i, (R - 1) * R + i, i * R, i * R + R - 1);
	while (stack.length) {
		const k = /** @type {number} */ (stack.pop());
		if (out[k] === 0 || ink[k]) continue;
		out[k] = 0;
		const x = k % R, y = (k / R) | 0;
		if (x > 0) stack.push(k - 1);
		if (x < R - 1) stack.push(k + 1);
		if (y > 0) stack.push(k - R);
		if (y < R - 1) stack.push(k + R);
	}
	for (let i = 0; i < R * R; i++) if (ink[i]) out[i] = 0;
	return out;
}

/**
 * A mask cropped to its box (as a square round its centre) and scaled to 40 px, 2×2 supersampled.
 *
 * @param {Uint8Array} a The mask.
 * @param {number} R Its side.
 * @param {number} N The cropped side.
 * @returns {Float32Array} The crop (all zero when the mask is empty).
 */
function cropped(a, R, N) {
	let x0 = R, y0 = R, x1 = -1, y1 = -1;
	for (let i = 0; i < R * R; i++) if (a[i]) {
		const x = i % R, y = (i / R) | 0;
		x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
	}
	const o = new Float32Array(N * N);
	if (x1 < 0) return o;
	const s = Math.max(x1 - x0 + 1, y1 - y0 + 1) / N, cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
	for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
		let v = 0;
		for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
			const X = Math.floor(cx + (x - N / 2 + (dx + 0.5) / 2) * s), Y = Math.floor(cy + (y - N / 2 + (dy + 0.5) / 2) * s);
			if (X >= 0 && Y >= 0 && X < R && Y < R) v += a[Y * R + X];
		}
		o[y * N + x] = v / 4;
	}
	return o;
}

/**
 * A mark's letter signatures from its coverage at LETTER.render: its holes (null when it has none) and its ink, each
 * cropped to its box at LETTER.size.
 *
 * @param {Float32Array} alpha Coverage 0–1, `render` × `render`.
 * @param {number} [R] Its side (128).
 * @param {number} [N] The cropped side (40).
 * @returns {{ holes: Float32Array | null, ink: Float32Array }} The signatures.
 */
export function letterSignatures(alpha, R = LETTER.render, N = LETTER.size) {
	const ink = new Uint8Array(R * R);
	for (let i = 0; i < ink.length; i++) ink[i] = alpha[i] > 127 / 255 ? 1 : 0;
	const holes = cropped(holesOf(ink, R), R, N);
	return { holes: holes.some((v) => v > 0) ? holes : null, ink: cropped(ink, R, N) };
}

/**
 * A square image turned or flipped: `f` maps each output pixel to its source.
 *
 * @param {Float32Array} a The image.
 * @param {number} N Its side.
 * @param {(x: number, y: number) => [number, number]} f The map.
 * @returns {Float32Array} The new image.
 */
export function remap(a, N, f) {
	const o = new Float32Array(N * N);
	for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
		const [sx, sy] = f(x, y);
		o[y * N + x] = a[sy * N + sx];
	}
	return o;
}

/**
 * An image in all 8 rotations and flips.
 *
 * @param {Float32Array} a The image (square).
 * @returns {Float32Array[]} Its 4 turns, then the 4 mirrored.
 */
export function variants(a) {
	const N = Math.sqrt(a.length), M = N - 1;
	const turn = (/** @type {Float32Array} */ b) => remap(b, N, (x, y) => [y, M - x]);
	const out = [a];
	for (let i = 0; i < 3; i++) out.push(turn(out[out.length - 1]));
	return [...out, ...out.map((b) => remap(b, N, (x, y) => [M - x, y]))];
}

/**
 * Overlap of two images: the sum of minima over the sum of maxima.
 *
 * @param {ArrayLike<number>} a One image.
 * @param {ArrayLike<number>} b The other, the same size.
 * @returns {number} 0 to 1.
 */
export function iou(a, b) {
	let i = 0, u = 0;
	for (let k = 0; k < a.length; k++) {
		const x = a[k], y = b[k];
		if (x < y) { i += x; u += y; } else { i += y; u += x; }
	}
	return u ? i / u : 0;
}
