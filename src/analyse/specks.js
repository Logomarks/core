/**
 * @module @arraypress/marks-kit/analyse/specks
 *
 * A mark's pieces and holes, to find the stray specks, slivers and pin-holes a boolean leaves behind. Read as vectors
 * (every outline unioned with its fill rule, booleans retried with a jitter seeded by the mark's name, so a read
 * repeats), or, when the booleans can't read it, from a scanline raster (connected components: 8-connected pieces,
 * 4-connected holes). Areas are square units of the 512 canvas: run it on fitted marks.
 */

import { robustOps } from '../geometry/booleans.js';
import { seeded } from '../geometry/random.js';
import { area, perimeter, ringBox } from '../geometry/polygon.js';
import { filledShape } from '../svg/shape.js';
import { rings } from '../svg/rings.js';
import { frameOf, fill } from '../raster/scanline.js';
import { components } from '../raster/components.js';

/** The house limits: a piece under `piece` is a speck, a hole under `hole` a pin-hole; parts `tiny`, `hairline` (mean
 * width) or repeated `repeat` times (within `tolerance` of each other's area) are left out. */
export const SPECKS = { piece: 60, hole: 30, tiny: 0.5, hairline: 0.12, sliver: 3, repeat: 6, tolerance: { vector: 0.02, raster: 0.05 }, rasterScale: 8 };

/**
 * Every piece and hole of a mark, read as vectors.
 *
 * @param {readonly import('../svg/shapes.js').Shape[]} paths The mark's outlines.
 * @param {string} [seed] Seeds the booleans' retry jitter (the mark's slug), so a read repeats.
 * @returns {import('./specks.js').Part[]} Its parts.
 */
export function vectorParts(paths, seed = '') {
	/** @type {import('./specks.js').Part[]} */
	const out = [];
	for (const [outer, ...holes] of filledShape(paths, robustOps(seeded(seed)))) {
		const a = area(outer) - holes.reduce((s, h) => s + area(h), 0);
		const p = perimeter(outer) + holes.reduce((s, h) => s + perimeter(h), 0);
		out.push({ kind: 'piece', area: a, width: (2 * a) / p, box: ringBox(outer) });
		for (const h of holes) out.push({ kind: 'hole', area: area(h), width: (2 * area(h)) / perimeter(h), box: ringBox(h) });
	}
	return out;
}

/**
 * The same, read from a scanline raster at `scale` pixels a unit (for marks the booleans can't read).
 *
 * @param {readonly import('../svg/shapes.js').Shape[]} paths The mark's outlines.
 * @param {number} [scale] Pixels a unit (8).
 * @returns {import('./specks.js').Part[]} Its parts, each marked `raster`.
 */
export function rasterParts(paths, scale = SPECKS.rasterScale) {
	const fp = paths.map((s) => ({ rings: rings(s.segs, 0.5), evenodd: s.evenodd }));
	const bm = fill(fp, frameOf(fp, scale));
	const K = bm.scale;
	return components(bm)
		.filter((c) => c.ink || !c.border)
		.map((c) => {
			const a = c.pixels / (K * K);
			return {
				kind: c.ink ? 'piece' : 'hole',
				area: a,
				width: (2 * a) / Math.max(c.rim / K, 1e-9),
				box: /** @type {import('../geometry/types.js').Box} */ ([bm.x0 + c.box[0] / K, bm.y0 + c.box[1] / K, bm.x0 + c.box[2] / K, bm.y0 + c.box[3] / K]),
				raster: true,
			};
		});
}

/**
 * A mark's parts: the vector read, or the raster read when the booleans throw (`error` says why).
 *
 * @param {readonly import('../svg/shapes.js').Shape[]} paths The mark's outlines.
 * @param {{ seed?: string, raster?: boolean }} [o] The seed, and `raster` to skip the vector read.
 * @returns {import('./specks.js').PartsRead} The parts and how they were read.
 */
export function markParts(paths, { seed = '', raster = false } = {}) {
	if (!raster) {
		try {
			return { parts: vectorParts(paths, seed), raster: false };
		} catch (e) {
			return { parts: rasterParts(paths), raster: true, error: /** @type {Error} */ (e).message };
		}
	}
	return { parts: rasterParts(paths), raster: true };
}

/**
 * The small parts (pieces under `piece`, holes under `hole`), smallest first, each with why it is left out: '' when it
 * is a real speck, else 'tiny' (two outlines touching), 'hairline' (a zero-width sliver) or 'repeated' (a pattern).
 *
 * @param {readonly import('./specks.js').Part[]} parts A mark's parts.
 * @param {import('./specks.js').SmallOptions} [o] The limits, and whether the parts came from the raster read.
 * @returns {(import('./specks.js').Part & { skip: '' | 'tiny' | 'hairline' | 'repeated' })[]} The small parts.
 */
export function smallParts(parts, { piece = SPECKS.piece, hole = SPECKS.hole, raster = false } = {}) {
	const tol = raster ? SPECKS.tolerance.raster : SPECKS.tolerance.vector;
	const same = (/** @type {import('./specks.js').Part} */ p) => parts.filter((q) => q.kind === p.kind && Math.abs(q.area - p.area) <= tol * Math.max(p.area, q.area)).length;
	return parts
		.filter((p) => p.area < (p.kind === 'piece' ? piece : hole))
		.sort((a, b) => a.area - b.area)
		.map((p) => ({ ...p, skip: p.area < SPECKS.tiny ? 'tiny' : p.width < SPECKS.hairline ? 'hairline' : same(p) >= SPECKS.repeat ? 'repeated' : '' }));
}
