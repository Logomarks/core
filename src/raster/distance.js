/**
 * @module @logomarks/marks-kit/raster/distance
 *
 * The Euclidean distance transform (Felzenszwalb and Huttenlocher): for every
 * pixel of one kind, how far it is from the nearest pixel of the other. Half
 * a stroke's width is the distance along its middle.
 */

const INF = 1e20;

/**
 * The squared 1D transform of `f` (length `n`) into `d`.
 *
 * @param {Float64Array} f The input.
 * @param {number} n Its length.
 * @param {Float64Array} d The output.
 * @param {Int32Array} v Scratch: parabola positions.
 * @param {Float64Array} z Scratch: their boundaries.
 */
function line(f, n, d, v, z) {
	let k = 0;
	v[0] = 0; z[0] = -INF; z[1] = INF;
	for (let q = 1; q < n; q++) {
		let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
		while (s <= z[k]) {
			k--;
			s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
		}
		k++;
		v[k] = q; z[k] = s; z[k + 1] = INF;
	}
	k = 0;
	for (let q = 0; q < n; q++) {
		while (z[k + 1] < q) k++;
		d[q] = (q - v[k]) ** 2 + f[v[k]];
	}
}

/**
 * For every pixel of one kind, its distance in pixels to the nearest pixel of the other (0 for the other kind).
 *
 * @param {import('./scanline.js').Bitmap} bm The raster.
 * @param {0 | 1} kind 1 to measure ink (distance to empty), 0 to measure empty space (distance to ink).
 * @returns {Float32Array} The distances, row by row.
 */
export function distance(bm, kind) {
	const { data, width: W, height: H } = bm;
	const n = Math.max(W, H);
	const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1), v = new Int32Array(n);
	const grid = new Float64Array(W * H);
	for (let i = 0; i < W * H; i++) grid[i] = data[i] === kind ? INF : 0;
	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) f[y] = grid[y * W + x];
		line(f, H, d, v, z);
		for (let y = 0; y < H; y++) grid[y * W + x] = d[y];
	}
	const out = new Float32Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) f[x] = grid[y * W + x];
		line(f, W, d, v, z);
		for (let x = 0; x < W; x++) out[y * W + x] = Math.sqrt(d[x]);
	}
	return out;
}
