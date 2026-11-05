import type { Box } from '../geometry/types.js';
import type { Channel } from '../raster/channels.js';
import type { FilledPath } from '../svg/shapes.js';

/** Runs of about the same width, taken together. */
export interface RunGroup {
	/** Their mean width, weighted by length. */
	width: number;
	/** Their total length. */
	length: number;
	count: number;
	/** The box round them all. */
	box: Box;
}
/** The raster's scale and padding, and what counts as a run (units of the 512 canvas). */
export interface WidthSettings {
	scale: number;
	pad: number;
	same: number;
	tolerance: number;
	spread: number;
	run: number;
	shortest: number;
	widest: number;
	narrowest: number;
}

/** The Logomarks settings. */
export const WIDTHS: WidthSettings;
/** Runs grouped by width: runs within `same` of each other are one group. */
export function groupRuns(runs: readonly Channel[], same: number): RunGroup[];
/** A mark's gaps and strokes, each grouped by width. */
export function widths(paths: readonly FilledPath[], o?: Partial<WidthSettings>): { gaps: RunGroup[]; strokes: RunGroup[] };
