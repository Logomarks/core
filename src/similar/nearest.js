/**
 * @module @logomarks/marks-kit/similar/nearest
 *
 * "More like this" for a whole set: each mark's nearest by plain overlap (IoU) of its coverage, nudged up for the
 * same style and for each shared mood.
 */

import { iou } from './signature.js';

/**
 * Every mark's nearest marks, closest first.
 *
 * @param {readonly import('./index.js').SetMark[]} marks The set: each mark's slug, its coverage (all the same size),
 *   and optionally its style and moods.
 * @param {import('./index.js').NearestAllOptions} [o] How many (8), and the style and per-mood nudges (0.08, 0.02).
 * @returns {Record<string, string[]>} Slug to its nearest slugs.
 */
export function nearestAll(marks, { top = 8, style = 0.08, mood = 0.02 } = {}) {
	/** @type {Record<string, string[]>} */
	const out = {};
	for (let i = 0; i < marks.length; i++) {
		const a = marks[i], scores = [];
		for (let j = 0; j < marks.length; j++) {
			if (j === i) continue;
			const b = marks[j], moods = (a.mood ?? []).filter((m) => (b.mood ?? []).includes(m)).length;
			scores.push([j, iou(a.alpha, b.alpha) + (a.style && a.style === b.style ? style : 0) + moods * mood]);
		}
		scores.sort((p, q) => q[1] - p[1]);
		out[a.slug] = scores.slice(0, top).map(([j]) => marks[j].slug);
	}
	return out;
}
