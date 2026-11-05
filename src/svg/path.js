/**
 * @module @logomarks/marks-kit/svg/path
 *
 * SVG path data to absolute segments (`M`, `L`, `C`, `Q`, `A`, `Z`), and the
 * curve maths shared by every reader: a point on a Bézier, and an arc in
 * centre form (SVG spec F.6.5). Ported from the skill's `fit.mjs` and kit.
 */

const NUMBER = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;

/** How many numbers each command takes. */
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/**
 * Path data as absolute segments. `H`/`V` become `L`, `S`/`T` become `C`/`Q`.
 *
 * @param {string} d The path data.
 * @returns {import('./path.js').Segment[]} The segments.
 */
export function parsePath(d) {
	const t = [...d.matchAll(NUMBER)].map((m) => m[1] ?? Number(m[2]));
	/** @type {import('./path.js').Segment[]} */
	const segs = [];
	let i = 0;
	let cmd = '';
	let x = 0, y = 0, sx = 0, sy = 0;
	/** @type {number[] | null} */
	let lastC = null;
	/** @type {number[] | null} */
	let lastQ = null;
	while (i < t.length) {
		if (typeof t[i] === 'string') cmd = /** @type {string} */ (t[i++]);
		const up = /** @type {keyof typeof ARITY} */ (cmd.toUpperCase());
		const rel = cmd !== up;
		if (up === 'Z') {
			segs.push(['Z']);
			x = sx; y = sy;
			lastC = lastQ = null;
			continue;
		}
		const n = ARITY[up];
		if (n === undefined) break;
		const a = /** @type {number[]} */ (/** @type {unknown} */ (t.slice(i, i + n)));
		i += n;
		if (a.length < n || a.some((v) => typeof v !== 'number')) break;
		const ox = rel ? x : 0, oy = rel ? y : 0;
		if (up === 'M') {
			x = sx = a[0] + ox; y = sy = a[1] + oy;
			segs.push(['M', x, y]);
			cmd = rel ? 'l' : 'L';
			lastC = lastQ = null;
		} else if (up === 'L' || up === 'H' || up === 'V') {
			if (up !== 'V') x = a[0] + ox;
			if (up === 'L') y = a[1] + oy;
			if (up === 'V') y = a[0] + oy;
			segs.push(['L', x, y]);
			lastC = lastQ = null;
		} else if (up === 'C' || up === 'S') {
			const c1 = up === 'C' ? [a[0] + ox, a[1] + oy] : lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
			const r = up === 'C' ? a.slice(2) : a;
			const c2 = [r[0] + ox, r[1] + oy];
			x = r[2] + ox; y = r[3] + oy;
			segs.push(['C', c1[0], c1[1], c2[0], c2[1], x, y]);
			lastC = c2; lastQ = null;
		} else if (up === 'Q' || up === 'T') {
			const c = /** @type {number[]} */ (up === 'Q' ? [a[0] + ox, a[1] + oy] : lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y]);
			x = (up === 'Q' ? a[2] : a[0]) + ox; y = (up === 'Q' ? a[3] : a[1]) + oy;
			segs.push(['Q', c[0], c[1], x, y]);
			lastQ = c; lastC = null;
		} else if (up === 'A') {
			x = a[5] + ox; y = a[6] + oy;
			segs.push(['A', a[0], a[1], a[2], a[3], a[4], x, y]);
			lastC = lastQ = null;
		}
	}
	return segs;
}

/**
 * A point on a quadratic or cubic Bézier.
 *
 * @param {readonly import('../geometry/types.js').Point[]} P The control points (3 or 4), start first.
 * @param {number} u Where along it, 0–1.
 * @returns {import('../geometry/types.js').Point} The point.
 */
export function bezierAt(P, u) {
	const v = 1 - u;
	const w = P.length === 4 ? [v ** 3, 3 * v * v * u, 3 * v * u * u, u ** 3] : [v * v, 2 * v * u, u * u];
	return [w.reduce((s, c, j) => s + c * P[j][0], 0), w.reduce((s, c, j) => s + c * P[j][1], 0)];
}

/**
 * An arc segment in centre form, so it can be sampled.
 *
 * @param {number} x1 Start x.
 * @param {number} y1 Start y.
 * @param {readonly number[]} arc The `A` segment's numbers: rx, ry, rotation, large, sweep, x2, y2.
 * @returns {import('./path.js').Arc | null} The arc, or null when a radius is 0 (a straight line).
 */
export function arcOf(x1, y1, [rx, ry, phi, large, sweep, x2, y2]) {
	if (!rx || !ry) return null;
	rx = Math.abs(rx); ry = Math.abs(ry);
	const p = (phi * Math.PI) / 180, cp = Math.cos(p), sp = Math.sin(p);
	const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
	const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
	const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
	if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
	const sign = large === sweep ? -1 : 1;
	const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
	const co = sign * Math.sqrt(Math.max(0, num / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
	const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
	const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
	const ang = (/** @type {number} */ ux, /** @type {number} */ uy, /** @type {number} */ vx, /** @type {number} */ vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
	const start = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
	let sweepAngle = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
	if (!sweep && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
	if (sweep && sweepAngle < 0) sweepAngle += 2 * Math.PI;
	return { cx, cy, rx, ry, cos: cp, sin: sp, start, sweep: sweepAngle };
}

/**
 * A point on an arc.
 *
 * @param {import('./path.js').Arc} a The arc.
 * @param {number} k Where along it, 0–1.
 * @returns {import('../geometry/types.js').Point} The point.
 */
export function arcAt(a, k) {
	const t = a.start + a.sweep * k;
	const ex = a.rx * Math.cos(t), ey = a.ry * Math.sin(t);
	return [a.cx + ex * a.cos - ey * a.sin, a.cy + ex * a.sin + ey * a.cos];
}
