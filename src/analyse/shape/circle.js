/**
 * @module @logomarks/core/analyse/shape/circle
 *
 * The circle that best runs along some points: a least-squares fit, a deterministic search over point triples for the
 * circle most points lie on (so a cut-off cap or a tail doesn't pull it), then a refit on the points near it.
 */

/** @typedef {import('./hull.js').Pt} Pt */
/** @typedef {import('./circle.js').Circle} Circle */

/**
 * The least-squares circle through some points (Kåsa's algebraic fit).
 *
 * @param {readonly Pt[]} pts At least three points.
 * @returns {Circle} Its centre and radius (NaN when the points are in a line).
 */
export function fitCircle(pts) {
	let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
	for (const [x, y] of pts) {
		const z = x * x + y * y;
		sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z;
	}
	// solve [sxx sxy sx; sxy syy sy; sx sy n] · [A B C] = [sxz syz sz]; the circle is (A/2, B/2), r² = C + cx² + cy²
	const m = [[sxx, sxy, sx, sxz], [sxy, syy, sy, syz], [sx, sy, pts.length, sz]];
	for (let i = 0; i < 3; i++) {
		let pivot = i;
		for (let j = i + 1; j < 3; j++) if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
		[m[i], m[pivot]] = [m[pivot], m[i]];
		for (let j = 0; j < 3; j++) {
			if (j === i) continue;
			const f = m[j][i] / m[i][i];
			for (let k = i; k < 4; k++) m[j][k] -= f * m[i][k];
		}
	}
	const cx = m[0][3] / m[0][0] / 2, cy = m[1][3] / m[1][1] / 2;
	return { cx, cy, r: Math.sqrt(m[2][3] / m[2][2] + cx * cx + cy * cy) };
}

/**
 * The share of points within `tol` × r of a circle's line.
 *
 * @param {readonly Pt[]} pts The points.
 * @param {Circle} c The circle.
 * @param {number} tol The tolerance, a fraction of the radius.
 * @returns {number} 0–1.
 */
export function onCircle(pts, { cx, cy, r }, tol) {
	let n = 0;
	for (const [x, y] of pts) if (Math.abs(Math.hypot(x - cx, y - cy) - r) < tol * r) n++;
	return pts.length ? n / pts.length : 0;
}

/**
 * The circle most of some points lie on: the least-squares fit, or a better one through three of them (`tries`
 * triples, picked the same way every time), refit three times on the points within `refit` × r of it.
 *
 * @param {readonly Pt[]} pts The points, e.g. along a hull's edge.
 * @param {{ tol?: number, refit?: number, tries?: number, largest?: number }} [o] Inlier tolerance (0.025 of r),
 *   refit tolerance (0.04), triples tried (300), and the largest radius worth trying.
 * @returns {Circle} The circle.
 */
export function findCircle(pts, { tol = 0.025, refit = 0.04, tries = 300, largest = Infinity } = {}) {
	let best = fitCircle(pts), most = onCircle(pts, best, tol);
	const n = pts.length;
	for (let k = 0; k < tries && n >= 3; k++) {
		const c = fitCircle([pts[(k * 7919) % n], pts[(k * 104729 + Math.floor(n / 3)) % n], pts[(k * 1299709 + Math.floor(2 * n / 3)) % n]]);
		if (!(c.r >= 10 && c.r <= largest)) continue;
		const on = onCircle(pts, c, tol);
		if (on > most) { most = on; best = c; }
	}
	for (let i = 0; i < 3; i++) {
		const near = pts.filter(([x, y]) => Math.abs(Math.hypot(x - best.cx, y - best.cy) - best.r) < refit * best.r);
		if (near.length < 20) break;
		best = fitCircle(near);
	}
	return best;
}
