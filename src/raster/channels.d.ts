import type { Box } from '../geometry/types.js';
import type { Bitmap } from './scanline.js';

/** A run of even width: a stroke or a gap. */
export interface Channel {
	/** Its mean width in units. */
	width: number;
	/** Its length in units, along its middle. */
	length: number;
	/** Where it runs, on the canvas. */
	box: Box;
}

/** What counts as a run (units). */
export interface ChannelOptions {
	/** How much wider than its narrowest point a run may get. */
	tolerance: number;
	/** How much most of it (10th to 90th percentile) may vary. */
	spread: number;
	/** How many times its width a run must be long. */
	run: number;
	/** The shortest run. */
	shortest: number;
	/** Wider runs are left out. */
	widest: number;
	/** Narrower runs are left out. */
	narrowest: number;
}

/** The even-width runs of strokes (`kind` 1) or gaps (0), narrowest first. */
export function channels(bm: Bitmap, kind: 0 | 1, o: ChannelOptions): Channel[];
