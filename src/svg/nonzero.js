/**
 * @module @logomarks/core/svg/nonzero
 *
 * Non-zero fill from rings. polygon-clipping (the booleans' library) has no non-zero fill rule across rings: it takes
 * a polygon's first ring as its outside and the rest as holes. So the fill is built from booleans: rings that never
 * meet are classed one by one (union or cut), and rings that cross or touch (overlapping subpaths, as font glyphs
 * draw) go through winding levels, which are exact however they overlap. (clipper-lib has a non-zero fill type, but it
 * is only an optional peer here, for the shape edits.)
 */

import { area, ringBox, signedArea, winding } from '../geometry/polygon.js';

/**
 * Whether segments ab and cd meet (crossing, touching or overlapping along a line).
 *
 * @param {import('../geometry/types.js').Point} a
 * @param {import('../geometry/types.js').Point} b
 * @param {import('../geometry/types.js').Point} c
 * @param {import('../geometry/types.js').Point} d
 * @returns {boolean} True when they share a point.
 */
function segmentsMeet(a, b, c, d) {
	const side = (/** @type {number[]} */ p, /** @type {number[]} */ q, /** @type {number[]} */ r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
	const within = (/** @type {number[]} */ p, /** @type {number[]} */ q, /** @type {number[]} */ r) =>
		Math.min(p[0], q[0]) <= r[0] && r[0] <= Math.max(p[0], q[0]) && Math.min(p[1], q[1]) <= r[1] && r[1] <= Math.max(p[1], q[1]);
	const d1 = side(c, d, a), d2 = side(c, d, b), d3 = side(a, b, c), d4 = side(a, b, d);
	if (d1 * d2 < 0 && d3 * d4 < 0) return true;
	return (d1 === 0 && within(c, d, a)) || (d2 === 0 && within(c, d, b)) || (d3 === 0 && within(a, b, c)) || (d4 === 0 && within(a, b, d));
}

/**
 * Whether two boxes overlap (edges touching count).
 *
 * @param {import('../geometry/types.js').Box} p
 * @param {import('../geometry/types.js').Box} q
 * @returns {boolean} True when they share a point.
 */
const boxesMeet = (p, q) => p[0] <= q[2] && q[0] <= p[2] && p[1] <= q[3] && q[1] <= p[3];

/**
 * The edges of a ring that reach into a box, each as its two ends and its own box.
 *
 * @param {readonly import('../geometry/types.js').Point[]} r The ring.
 * @param {import('../geometry/types.js').Box} box The box.
 * @returns {[import('../geometry/types.js').Point, import('../geometry/types.js').Point, import('../geometry/types.js').Box][]} The edges.
 */
function edgesIn(r, box) {
	/** @type {[import('../geometry/types.js').Point, import('../geometry/types.js').Point, import('../geometry/types.js').Box][]} */
	const out = [];
	r.forEach((p, i) => {
		const q = r[(i + 1) % r.length];
		/** @type {import('../geometry/types.js').Box} */
		const eb = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
		if (boxesMeet(eb, box)) out.push([p, q, eb]);
	});
	return out;
}

/**
 * Whether any two of the rings meet: an edge of one crosses or touches an edge of another.
 *
 * @param {readonly (readonly import('../geometry/types.js').Point[])[]} rs The rings.
 * @returns {boolean} True when two rings meet.
 */
export function ringsMeet(rs) {
	const boxes = rs.map(ringBox);
	for (let i = 0; i < rs.length; i++) {
		for (let j = i + 1; j < rs.length; j++) {
			if (!boxesMeet(boxes[i], boxes[j])) continue;
			/** @type {import('../geometry/types.js').Box} */
			const both = [Math.max(boxes[i][0], boxes[j][0]), Math.max(boxes[i][1], boxes[j][1]), Math.min(boxes[i][2], boxes[j][2]), Math.min(boxes[i][3], boxes[j][3])];
			const ei = edgesIn(rs[i], both), ej = edgesIn(rs[j], both);
			for (const [a, b, ab] of ei) for (const [c, d, cb] of ej) if (boxesMeet(ab, cb) && segmentsMeet(a, b, c, d)) return true;
		}
	}
	return false;
}

/**
 * Non-zero fill for rings that never meet (nested or apart): largest first, each ring is added or cut by the winding
 * just either side of its longest edge. With no other ring touching it, one test point pair speaks for the whole ring.
 *
 * @param {import('../geometry/types.js').Ring[]} rs The rings.
 * @param {import('../geometry/booleans.js').BooleanOps} b The booleans.
 * @returns {import('../geometry/types.js').Shape} The filled shape.
 */
function classedFill(rs, b) {
	const sorted = rs.slice().sort((p, q) => Math.abs(signedArea(q)) - Math.abs(signedArea(p)));
	const total = (/** @type {import('../geometry/types.js').Point} */ pt) => rs.reduce((s, r) => s + winding(r, pt), 0);
	/** @type {import('../geometry/types.js').Shape} */
	let g = [];
	for (const r of sorted) {
		let k = 0, longest = 0;
		r.forEach((p, i) => {
			const q = r[(i + 1) % r.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
			if (L > longest) { k = i; longest = L; }
		});
		const p = r[k], q = r[(k + 1) % r.length], e = 0.05;
		const nx = ((q[1] - p[1]) / longest) * e, ny = ((q[0] - p[0]) / longest) * e;
		const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
		/** @type {import('../geometry/types.js').Point} */
		const a = [m[0] - nx, m[1] + ny];
		/** @type {import('../geometry/types.js').Point} */
		const c = [m[0] + nx, m[1] - ny];
		const [inside, outside] = winding(r, a) ? [a, c] : [c, a];
		const fi = total(inside) !== 0, fo = total(outside) !== 0;
		if (fi && !fo) g = b.union(g, [r]);
		else if (!fi && fo) g = b.difference(g, [r]);
	}
	return g;
}

/**
 * Exact non-zero fill for rings however they overlap. The plane is kept as winding levels (the region where the rings
 * so far sum to each non-zero winding); each ring moves the part of every level it covers one step, up or down by its
 * direction. The fill is every non-zero level unioned. Each ring is taken as simple, wound one way.
 *
 * @param {import('../geometry/types.js').Ring[]} rs The rings.
 * @param {import('../geometry/booleans.js').BooleanOps} b The booleans.
 * @returns {import('../geometry/types.js').Shape} The filled shape.
 */
export function windingFill(rs, b) {
	/** @type {Map<number, import('../geometry/types.js').Shape>} */
	let levels = new Map();
	for (const r of rs) {
		const s = Math.sign(signedArea(r)), R = b.union([r]);
		/** @type {Map<number, import('../geometry/types.js').Shape>} */
		const next = new Map();
		const add = (/** @type {number} */ k, /** @type {import('../geometry/types.js').Shape} */ g) => {
			if (k === 0 || !g.length) return;
			const had = next.get(k);
			next.set(k, had ? b.union(had, g) : g);
		};
		add(s, levels.size ? b.difference(R, ...levels.values()) : R);
		for (const [k, g] of levels) {
			add(k, b.difference(g, R));
			add(k + s, b.intersection(g, R));
		}
		levels = next;
	}
	return b.union(...levels.values());
}

/**
 * A shape's filled area (outsides less holes).
 *
 * @param {import('../geometry/types.js').Shape} g The shape.
 * @returns {number} The area.
 */
const filledArea = (g) => g.reduce((t, pg) => t + area(pg[0]) - pg.slice(1).reduce((h, r) => h + area(r), 0), 0);

/**
 * Non-zero fill from rings. When no two rings meet, each is classed on its own (as filledShape always read them).
 * When any two cross or touch, the winding levels decide; the classed polygons are still returned when they cover the
 * same ground (their exclusive-or has no area to speak of), so an outline that always read right keeps its exact
 * polygons, and only a misread one (an outer whose longest edge lies inside another ring) changes.
 *
 * @param {import('../geometry/types.js').Ring[]} rs The rings.
 * @param {import('../geometry/booleans.js').BooleanOps} b The booleans.
 * @returns {import('../geometry/types.js').Shape} The filled shape.
 */
export function nonzeroFill(rs, b) {
	if (!ringsMeet(rs)) return classedFill(rs, b);
	const exact = windingFill(rs, b), classed = classedFill(rs, b);
	return filledArea(b.xor(classed, exact)) <= 1e-9 * Math.max(1, filledArea(exact)) ? classed : exact;
}
