/**
 * @module @logomarks/core/raster/scanline
 *
 * A binary raster of a mark, filled by scanline at pixel centres: every path
 * with its own fill rule, the paths OR-ed. It needs nothing but the rings, so
 * it reads marks the booleans can't (speckcheck.mjs `rasterParts()`).
 */

/**
 * A frame round some rings: the box plus a margin, at `scale` pixels a unit.
 *
 * @param {readonly import('./scanline.js').FillPath[]} paths The paths.
 * @param {number} scale Pixels a unit.
 * @param {number} [pad=2] The margin in units.
 * @returns {import('./scanline.js').RasterFrame} The frame.
 */
export function frameOf(paths, scale, pad = 2) {
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
	for (const { rings } of paths) for (const r of rings) for (const [x, y] of r) {
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	x0 = Math.floor(x0) - pad; y0 = Math.floor(y0) - pad;
	return { x0, y0, scale, width: (Math.ceil(x1) + pad - x0) * scale, height: (Math.ceil(y1) + pad - y0) * scale };
}

/**
 * Fills paths into a frame: 1 where ink covers a pixel's centre.
 *
 * @param {readonly import('./scanline.js').FillPath[]} paths The paths.
 * @param {import('./scanline.js').RasterFrame} f The frame.
 * @returns {import('./scanline.js').Bitmap} The raster.
 */
export function fill(paths, f) {
	const { x0, y0, scale: K, width: W, height: H } = f;
	const data = new Uint8Array(W * H);
	for (const { rings, evenodd } of paths) {
		/** @type {[number, number][][]} */
		const rows = Array.from({ length: H }, () => []);
		for (const r of rings) for (let i = 0; i < r.length; i++) {
			const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length];
			if (ay === by) continue;
			const lo = Math.max(0, Math.ceil((Math.min(ay, by) - y0) * K - 0.5));
			const hi = Math.min(H - 1, Math.ceil((Math.max(ay, by) - y0) * K - 0.5) - 1);
			for (let j = lo; j <= hi; j++) {
				const y = y0 + (j + 0.5) / K;
				rows[j].push([ax + ((bx - ax) * (y - ay)) / (by - ay), by > ay ? 1 : -1]);
			}
		}
		for (let j = 0; j < H; j++) {
			const c = rows[j].sort((a, b) => a[0] - b[0]);
			let w = 0;
			for (let i = 0; i < c.length - 1; i++) {
				w += evenodd ? 1 : c[i][1];
				if (!(evenodd ? w % 2 : w)) continue;
				const s = Math.max(0, Math.ceil((c[i][0] - x0) * K - 0.5)), e = Math.min(W - 1, Math.ceil((c[i + 1][0] - x0) * K - 0.5) - 1);
				data.fill(1, j * W + s, j * W + e + 1);
			}
		}
	}
	return { ...f, data };
}
