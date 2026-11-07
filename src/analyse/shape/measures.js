/**
 * @module @logomarks/core/analyse/shape/measures
 *
 * Everything the shape tags are decided on, measured from a fitted mark's coverage raster: how round its outline is,
 * how square its closed silhouette, how it mirrors and turns onto itself, and how thick its ink is.
 */

import { distance } from '../../raster/distance.js';
import { inkOf, outlineOf, filled, closed, bitmap } from './ink.js';
import { inkHull, polygonMeasures, rayExit, edgePoints } from './hull.js';
import { findCircle, onCircle } from './circle.js';
import { coverageMatch, outlineMatcher, mirrorX, turn } from './symmetry.js';
import { thickShare, elongation } from './thickness.js';

/** How the measures are taken (units of the 512 canvas, unless a fraction): the Logomarks settings. */
export const MEASURE = {
	/** Rays cast for `reach` and `rim`. */
	rays: { reach: 180, rim: 360 },
	/** The ink reaches the hull on a ray when it gets within this fraction of the hull's edge (less a pixel). */
	reach: 0.08,
	/** A hull point is on the circle within this fraction of the radius. */
	arc: 0.025,
	/** A ray's outermost ink is on the rim within this fraction of the radius (plus half a pixel). */
	rim: 0.07,
	/** The closing that joins a modular mark's pieces before its silhouette is read (bridges gaps up to 60). */
	closing: 30,
	/** Each corner patch of the closed silhouette, a fraction of the box's short side. */
	corner: 0.3,
	/** How far a mirrored or turned outline pixel may land from the outline. */
	tolerance: 4,
	/** The turns tried for rotational symmetry. */
	orders: [3, 4, 5],
	/** Ink in parts thicker than this counts as mass… */
	thick: 48,
	/** …or thicker than this fraction of the box's short side. */
	thickRelative: 0.12,
};

/**
 * The share of rays from `c` on which the ink's outermost pixel passes `test`.
 *
 * @param {import('./ink.js').Ink} ink The ink.
 * @param {[number, number]} c The rays' start.
 * @param {number} count How many rays, evenly turned.
 * @param {(k: number) => number} limit How far to look along ray `k`.
 * @param {(far: number, k: number) => boolean} test Whether ray `k`'s outermost ink, `far` from `c`, counts.
 * @returns {number} 0–1.
 */
function rayShare({ bin, n }, [cx, cy], count, limit, test) {
	let hits = 0;
	for (let k = 0; k < count; k++) {
		const t = k * 2 * Math.PI / count, dx = Math.cos(t), dy = Math.sin(t), end = limit(k);
		let far = 0;
		for (let s = 0; s < end; s += 0.5) {
			const X = Math.floor(cx + dx * s), Y = Math.floor(cy + dy * s);
			if (X >= 0 && Y >= 0 && X < n && Y < n && bin[Y * n + X]) far = s;
		}
		if (test(far, k)) hits++;
	}
	return hits / count;
}

/**
 * The share of a box filled by a mask, and its emptiest corner patch's filled share.
 *
 * @param {Uint8Array} mask 1 inside.
 * @param {number} n The raster's side.
 * @param {[number, number, number, number]} box The box, end-exclusive.
 * @param {number} corner The corner patch's side, a fraction of the box's short side.
 * @returns {{ fill: number, corners: number }} Both 0–1.
 */
function boxFill(mask, n, [x0, y0, x1, y1], corner) {
	const count = (/** @type {number} */ ax, /** @type {number} */ ay, /** @type {number} */ bx, /** @type {number} */ by) => {
		let c = 0;
		for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) c += mask[y * n + x];
		return c;
	};
	const w = x1 - x0, h = y1 - y0, c = Math.max(2, Math.round(Math.min(w, h) * corner));
	const patch = (/** @type {number} */ x, /** @type {number} */ y) => count(x, y, x + c, y + c) / (c * c);
	return { fill: count(x0, y0, x1, y1) / (w * h), corners: Math.min(patch(x0, y0), patch(x1 - c, y0), patch(x0, y1 - c), patch(x1 - c, y1 - c)) };
}

/**
 * The measures behind the shape tags, from a fitted mark's coverage.
 *
 * @param {Float32Array} a Coverage 0–1, `size` × `size`, row by row (the 512 canvas, mark centred).
 * @param {{ w: number, h: number, size?: number }} m The fitted outline's width and height, and the raster's side
 *   (256: the thresholds are tuned there).
 * @param {Partial<typeof MEASURE>} [o] The settings (MEASURE by default).
 * @returns {import('./measures.js').ShapeMeasures} The measures.
 */
export function shapeMeasures(a, { w, h, size: n = 256 }, o = {}) {
	const s = { ...MEASURE, ...o }, unit = n / 512;
	const ink = inkOf(a, n);
	const ratio = w / h;
	if (!ink.count) return { ratio, reach: 0, arc: 0, rim: 0, circularity: 0, closedFill: 0, closedCorners: 0, mirror: { coverage: 0, outline: 0 }, turns: [], thick: 0, thickRelative: 0, elongation: 0 };

	// the outline's hull: how round it is, and whether the ink fills out to it
	const hull = inkHull(ink), { area, perimeter, centre } = polygonMeasures(hull);
	const edge = edgePoints(hull);
	const circle = findCircle(edge, { tol: s.arc, largest: n });
	const reachTo = Array.from({ length: s.rays.reach }, (_, k) => rayExit(hull, centre, k * 2 * Math.PI / s.rays.reach));
	const reach = rayShare(ink, centre, s.rays.reach, (k) => reachTo[k] + 2, (far, k) => far >= reachTo[k] * (1 - s.reach) - 1);
	const rim = rayShare(ink, [circle.cx, circle.cy], s.rays.rim, () => circle.r * 1.3, (far) => Math.abs(far - circle.r) <= s.rim * circle.r + 0.5);

	// the closed silhouette in its box: a square, or a modular tile, fills it to the corners
	const { fill: closedFill, corners: closedCorners } = boxFill(filled(closed(ink.bin, n, s.closing * unit), n), n, ink.box, s.corner);

	// symmetry: the mirror across the box's middle, and turns about the centre of mass
	const match = outlineMatcher(ink, outlineOf(ink)), tol = s.tolerance * unit;
	const axis = mirrorX((ink.box[0] + ink.box[2]) / 2);
	const mirror = { coverage: coverageMatch(ink, axis), outline: match(axis, tol) };
	const turns = s.orders.map((order) => { const f = turn(order, ink.centre); return { order, coverage: coverageMatch(ink, f), outline: match(f, tol) }; });

	// weight: mass versus strokes
	const depth = distance(bitmap(ink.bin, n), 1);
	return {
		ratio,
		reach,
		arc: onCircle(edge, circle, s.arc),
		rim,
		circularity: perimeter ? 4 * Math.PI * area / perimeter ** 2 : 0,
		closedFill,
		closedCorners,
		mirror,
		turns,
		thick: thickShare(ink, depth, s.thick / 2 * unit),
		thickRelative: thickShare(ink, depth, s.thickRelative / 2 * Math.min(w, h) * unit),
		elongation: elongation(ink, depth),
	};
}
