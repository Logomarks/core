/**
 * @module @arraypress/marks-kit/raster/components
 *
 * The connected parts of a binary raster: ink as 8-connected pieces, empty
 * space as 4-connected regions (holes are those not touching the border).
 * From speckcheck.mjs.
 */

const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const N4 = N8.slice(0, 4);

/**
 * Every connected part of a raster, ink and empty.
 *
 * @param {import('./scanline.js').Bitmap} bm The raster.
 * @returns {import('./components.js').Component[]} Its parts, in pixels.
 */
export function components(bm) {
	const { data, width: W, height: H } = bm;
	const seen = new Uint8Array(W * H), stack = new Int32Array(W * H);
	/** @type {import('./components.js').Component[]} */
	const out = [];
	for (let s = 0; s < W * H; s++) {
		if (seen[s]) continue;
		const ink = data[s] === 1;
		let n = 0, rim = 0, border = false, x0 = W, y0 = H, x1 = 0, y1 = 0, top = 0;
		stack[top++] = s;
		seen[s] = 1;
		while (top) {
			const q = stack[--top], x = q % W, y = (q - x) / W;
			let edge = false;
			n++;
			if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
			if (x < x0) x0 = x;
			if (y < y0) y0 = y;
			if (x > x1) x1 = x;
			if (y > y1) y1 = y;
			for (const [dx, dy] of ink ? N8 : N4) {
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const t = ny * W + nx;
				if (data[t] !== data[s]) {
					if (!dx || !dy) edge = true;
					continue;
				}
				if (!seen[t]) { seen[t] = 1; stack[top++] = t; }
			}
			if (edge) rim++;
		}
		out.push({ ink, pixels: n, rim, border, box: [x0, y0, x1 + 1, y1 + 1] });
	}
	return out;
}
