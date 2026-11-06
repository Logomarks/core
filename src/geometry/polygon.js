/**
 * Measures of a ring (a list of [x, y] points, closed implicitly) and of a shape: signed area, area, perimeter,
 * bounding box, winding number round a point, consecutive duplicates dropped, and a ring opened or closed.
 *
 * Rings come both ways: the shape builders (poly, rect, circle, ellipse, rr, roundPoly, …) return them open (no repeated
 * first point), the booleans (U, D, I, grow, lens, drop, …) closed (the first point repeated at the end). Code that wants
 * one or the other asks for it with openRing() or closeRing() rather than slicing the last point off blind.
 */

/**
 * A ring's signed area (positive when it runs clockwise on screen, y pointing down).
 *
 * @param {readonly import('./types.js').Point[]} r The ring.
 * @returns {number} The area, signed.
 */
export function signedArea(r) {
	let a = 0;
	for (let i = 0; i < r.length; i++) {
		const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length];
		a += x1 * y2 - x2 * y1;
	}
	return a / 2;
}

/**
 * A ring's area.
 *
 * @param {readonly import('./types.js').Point[]} r The ring.
 * @returns {number} The area.
 */
export const area = (r) => Math.abs(signedArea(r));

/**
 * A ring's perimeter, closing edge included.
 *
 * @param {readonly import('./types.js').Point[]} r The ring.
 * @returns {number} The length.
 */
export const perimeter = (r) => r.reduce((s, p, i) => {
	const q = r[(i + 1) % r.length];
	return s + Math.hypot(q[0] - p[0], q[1] - p[1]);
}, 0);

/**
 * A ring's bounding box.
 *
 * @param {readonly import('./types.js').Point[]} r The ring.
 * @returns {import('./types.js').Box} [x0, y0, x1, y1].
 */
export function ringBox(r) {
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
	for (const [x, y] of r) {
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	return [x0, y0, x1, y1];
}

/**
 * A shape's bounding box (every point of every ring).
 *
 * @param {import('./types.js').Shape | import('./types.js').Polygon} g The shape.
 * @returns {import('./types.js').Box} [x0, y0, x1, y1].
 */
export const bbox = (g) => ringBox(/** @type {import('./types.js').Point[]} */ (g.flat(2)));

/**
 * The winding number of a ring round a point (non-zero: inside).
 *
 * @param {readonly import('./types.js').Point[]} r The ring.
 * @param {import('./types.js').Point} p The point.
 * @returns {number} The winding number.
 */
export function winding(r, [px, py]) {
	let w = 0;
	for (let i = 0; i < r.length; i++) {
		const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length];
		const side = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
		if (y1 <= py) { if (y2 > py && side > 0) w++; }
		else if (y2 <= py && side < 0) w--;
	}
	return w;
}

/**
 * Drops repeated consecutive points (a repeated closing point makes stroke() fail with "degenerate segment").
 *
 * @template {import('./types.js').Point} P
 * @param {readonly P[]} pts The points.
 * @returns {P[]} The points, each one distinct from the next.
 */
export const dedupe = (pts) => pts.filter((p, i) => {
	const q = pts[(i + 1) % pts.length];
	return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6;
});

/**
 * A ring without its closing point: the last point goes only when it lies within `eps` of the first (a sampled full turn
 * ends near, not exactly on, its start), so an open ring comes back as it is, every corner kept.
 *
 * @template {import('./types.js').Point} P
 * @param {readonly P[]} ring The ring, open or closed.
 * @param {number} [eps] How near the last point must be to the first to count as its repeat.
 * @returns {P[]} The ring, open (the input itself when it already was).
 */
export const openRing = (ring, eps = 1e-6) =>
	/** @type {P[]} */ (ring.length > 1 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) <= eps ? ring.slice(0, -1) : ring);

/**
 * A ring with its closing point: the first point repeated at the end, unless the last already lies within `eps` of it.
 *
 * @template {import('./types.js').Point} P
 * @param {readonly P[]} ring The ring, open or closed.
 * @param {number} [eps] How near the last point must be to the first to count as its repeat.
 * @returns {P[]} The ring, closed (the input itself when it already was).
 */
export const closeRing = (ring, eps = 1e-6) =>
	/** @type {P[]} */ (ring.length && openRing(ring, eps) === ring ? [...ring, ring[0]] : ring);
