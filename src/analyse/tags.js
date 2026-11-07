/**
 * @module @logomarks/core/analyse/tags
 *
 * Shape tags measured from a mark's coverage: wide or tall, round or square, solid or light, symmetric, radial.
 * Tuned on the 4,040 Logomarks marks against contact sheets (about 95% read right by eye; see docs/tags.md).
 */

import { shapeMeasures } from './shape/measures.js';

/** The thresholds the tags are decided by: the Logomarks settings. */
export const SHAPE = {
	/** Width over height beyond which a mark is wide, or below which it is tall. */
	wide: 1.25,
	tall: 0.8,
	/** Round and square marks are about as wide as tall: between this and its inverse. */
	squarish: 0.9,
	/** Round: the ink reaches the hull all round, and the hull runs on a circle (any one way). */
	round: {
		reach: 0.6,
		ways: [
			{ arc: 0.74, circularity: 0.89 },
			{ arc: 0.65, circularity: 0.96 },
			{ rim: 0.8, circularity: 0.97 },
		],
	},
	/** Square: the closed silhouette fills its box, every corner too (and it isn't round). */
	square: { fill: 0.88, corners: 0.6 },
	/** Symmetric: the left-right mirror matches, coverage and outline both. */
	symmetric: { coverage: 0.95, outline: 0.95 },
	/** Radial: a turn of order 3, 4 or 5 matches, coverage and outline both. */
	radial: { coverage: 0.9, outline: 0.9 },
	/** Light: strokes (drawn-out pieces) with little mass; every other mark is solid. */
	light: { elongation: 3, thick: 0.3 },
};

/**
 * Whether the measures clear every threshold in `need`.
 *
 * @param {import('./shape/measures.js').ShapeMeasures} ms The measures.
 * @param {Partial<Record<'arc' | 'rim' | 'circularity', number>>} need The thresholds, by measure.
 * @returns {boolean} All met.
 */
const meets = (ms, need) => Object.entries(need).every(([k, v]) => ms[/** @type {'arc' | 'rim' | 'circularity'} */ (k)] >= /** @type {number} */ (v));

/**
 * The shape tags a mark's measures earn.
 *
 * @param {import('./shape/measures.js').ShapeMeasures} ms The measures (`shapeMeasures`).
 * @param {typeof SHAPE} [t] The thresholds (SHAPE by default).
 * @returns {import('./tags.js').ShapeTag[]} The tags, in a fixed order; exactly one of solid and light.
 */
export function tagsOf(ms, t = SHAPE) {
	/** @type {import('./tags.js').ShapeTag[]} */
	const tags = [];
	if (ms.ratio > t.wide) tags.push('wide'); else if (ms.ratio < t.tall) tags.push('tall');
	const squarish = ms.ratio > t.squarish && ms.ratio < 1 / t.squarish;
	if (squarish && ms.reach >= t.round.reach && t.round.ways.some((way) => meets(ms, way))) tags.push('round');
	else if (squarish && ms.closedFill >= t.square.fill && ms.closedCorners >= t.square.corners) tags.push('square');
	const light = ms.elongation >= t.light.elongation && Math.min(ms.thick, ms.thickRelative) < t.light.thick;
	tags.push(light ? 'light' : 'solid');
	if (ms.mirror.coverage >= t.symmetric.coverage && ms.mirror.outline >= t.symmetric.outline) tags.push('symmetric');
	if (ms.turns.some((r) => r.coverage >= t.radial.coverage && r.outline >= t.radial.outline)) tags.push('radial');
	return tags;
}

/**
 * A fitted mark's shape tags, from its coverage at `size` px (256) and its outline's size on the 512 canvas.
 * - wide / tall: wider than 1.25 or narrower than 0.8;
 * - round: about square (0.9–1.11), the ink reaching its convex hull all round, and the hull running on a circle;
 * - square: about square, not round, and its silhouette (gaps up to 60 closed, holes filled) filling its box to the
 *   corners;
 * - solid / light: light when it's drawn in strokes with little mass (under 30% of the ink in parts thicker than 48
 *   units, or than 12% of its short side); every other mark is solid;
 * - symmetric: its left-right mirror matches (coverage and outline 0.95); a top-bottom mirror alone doesn't count;
 * - radial: a turn by a third, a quarter or a fifth matches (0.9): rotational symmetry of order 3 or more.
 *
 * @param {Float32Array} a Coverage 0–1, `size` × `size`, row by row.
 * @param {{ w: number, h: number, size?: number }} m The outline's width and height (fitted), and the raster's side.
 * @returns {import('./tags.js').ShapeTag[]} The tags, in a fixed order.
 */
export function shapeTags(a, m) {
	return tagsOf(shapeMeasures(a, m));
}
