/**
 * @module @logomarks/marks-kit/analyse/widths
 *
 * A mark's gaps and strokes, measured on a raster as runs of even width (raster/channels.js) and grouped by width:
 * what tells a mark that keeps one gap from one that doesn't, and a feature too thin to survive 32 px.
 */

import { rings } from '../svg/rings.js';
import { frameOf, fill } from '../raster/scanline.js';
import { channels } from '../raster/channels.js';

/** What counts as a run (units of the 512 canvas), and the raster's scale: the Logomarks settings. */
export const WIDTHS = { scale: 2, pad: 4, same: 3, tolerance: 2, spread: 1, run: 3, shortest: 16, widest: 32, narrowest: 1 };

/**
 * Runs grouped by width: runs within `same` of each other are one group.
 *
 * @param {readonly import('../raster/channels.js').Channel[]} runs The runs, narrowest first.
 * @param {number} same How far apart two widths can be and still be one group.
 * @returns {import('./widths.js').RunGroup[]} The groups, each with its mean width, total length, count and box.
 */
export function groupRuns(runs, same) {
	/** @type {import('./widths.js').RunGroup[]} */
	const out = [];
	for (const c of runs) {
		const g = out.find((x) => Math.abs(x.width - c.width) <= same);
		if (!g) { out.push({ width: c.width, length: c.length, count: 1, box: [...c.box] }); continue; }
		g.width = (g.width * g.length + c.width * c.length) / (g.length + c.length);
		g.length += c.length;
		g.count++;
		g.box = [Math.min(g.box[0], c.box[0]), Math.min(g.box[1], c.box[1]), Math.max(g.box[2], c.box[2]), Math.max(g.box[3], c.box[3])];
	}
	return out;
}

/**
 * A mark's gaps and strokes, each grouped by width.
 *
 * @param {readonly import('../svg/shapes.js').Shape[]} paths The mark's outlines.
 * @param {Partial<typeof WIDTHS>} [o] The settings (WIDTHS by default).
 * @returns {{ gaps: import('./widths.js').RunGroup[], strokes: import('./widths.js').RunGroup[] }} The groups.
 */
export function widths(paths, o = {}) {
	const s = { ...WIDTHS, ...o };
	const fp = paths.map((p) => ({ rings: rings(p.segs, 0.5), evenodd: p.evenodd }));
	const bm = fill(fp, frameOf(fp, s.scale, s.pad));
	return { gaps: groupRuns(channels(bm, 0, s), s.same), strokes: groupRuns(channels(bm, 1, s), s.same) };
}
