/**
 * @module @logomarks/core/analyse/shape/hull
 *
 * The convex hull of a mark's ink, and what is measured on it: area, perimeter, centre, how far it reaches along a
 * ray, and points along its edge.
 */

/** @typedef {[number, number]} Pt */

/**
 * The cross product of `oa` and `ob`.
 *
 * @param {Pt} o The origin.
 * @param {Pt} a One point.
 * @param {Pt} b The other.
 * @returns {number} Positive for a left turn.
 */
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/**
 * The convex hull of some points (Andrew's monotone chain), counter-clockwise on screen axes.
 *
 * @param {Pt[]} pts The points (sorted in place).
 * @returns {Pt[]} The hull's corners.
 */
export function convexHull(pts) {
	pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
	/** @type {Pt[]} */
	const lo = [], up = [];
	for (const p of pts) {
		while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
		lo.push(p);
	}
	for (let i = pts.length - 1; i >= 0; i--) {
		const p = pts[i];
		while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
		up.push(p);
	}
	return lo.slice(0, -1).concat(up.slice(0, -1));
}

/**
 * The hull of a raster's ink: the corners of each row's outermost ink pixels.
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @returns {Pt[]} The hull's corners, in pixels.
 */
export function inkHull({ bin, n, box }) {
	/** @type {Pt[]} */
	const pts = [];
	for (let y = box[1]; y < box[3]; y++) {
		let l = -1, r = -1;
		for (let x = box[0]; x < box[2]; x++) if (bin[y * n + x]) { if (l < 0) l = x; r = x; }
		if (l >= 0) pts.push([l, y], [l, y + 1], [r + 1, y], [r + 1, y + 1]);
	}
	return convexHull(pts);
}

/**
 * A polygon's area, perimeter and centre of area.
 *
 * @param {Pt[]} poly The corners.
 * @returns {{ area: number, perimeter: number, centre: Pt }} Its measures (area unsigned).
 */
export function polygonMeasures(poly) {
	let a = 0, p = 0, cx = 0, cy = 0;
	for (let i = 0; i < poly.length; i++) {
		const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length], c = x0 * y1 - x1 * y0;
		a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
		p += Math.hypot(x1 - x0, y1 - y0);
	}
	a /= 2;
	return { area: Math.abs(a), perimeter: p, centre: a ? [cx / (6 * a), cy / (6 * a)] : poly[0] ?? [0, 0] };
}

/**
 * How far a ray from `c` at angle `t` runs before it leaves a convex polygon round `c`.
 *
 * @param {Pt[]} poly The polygon.
 * @param {Pt} c The ray's start, inside.
 * @param {number} t Its angle in radians.
 * @returns {number} The distance to the polygon's edge.
 */
export function rayExit(poly, c, t) {
	const dx = Math.cos(t), dy = Math.sin(t);
	let far = 0;
	for (let i = 0; i < poly.length; i++) {
		const p = poly[i], q = poly[(i + 1) % poly.length], ex = q[0] - p[0], ey = q[1] - p[1];
		const den = dx * ey - dy * ex;
		if (Math.abs(den) < 1e-9) continue;
		const px = p[0] - c[0], py = p[1] - c[1];
		const s = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den;
		if (s > 0 && u >= 0 && u <= 1) far = Math.max(far, s);
	}
	return far;
}

/**
 * Points along a polygon's edges, `step` apart.
 *
 * @param {Pt[]} poly The polygon.
 * @param {number} [step] The spacing (1).
 * @returns {Pt[]} The points.
 */
export function edgePoints(poly, step = 1) {
	/** @type {Pt[]} */
	const out = [];
	for (let i = 0; i < poly.length; i++) {
		const p = poly[i], q = poly[(i + 1) % poly.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
		for (let t = 0; t < len; t += step) out.push([p[0] + (q[0] - p[0]) * t / len, p[1] + (q[1] - p[1]) * t / len]);
	}
	return out;
}
