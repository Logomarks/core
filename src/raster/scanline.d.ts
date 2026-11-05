import type { Ring } from '../geometry/types.js';

/** One path's rings and its fill rule. */
export interface FillPath {
	rings: Ring[];
	evenodd: boolean;
}

/** Where a raster sits on the canvas. */
export interface RasterFrame {
	/** The canvas point at the raster's top-left corner. */
	x0: number;
	y0: number;
	/** Pixels a unit. */
	scale: number;
	/** Its size in pixels. */
	width: number;
	height: number;
}

/** A binary raster: 1 for ink, 0 for empty, row by row. */
export interface Bitmap extends RasterFrame {
	data: Uint8Array;
}

/** A frame round some paths: their box plus `pad` units (2), at `scale` pixels a unit. */
export function frameOf(paths: readonly FillPath[], scale: number, pad?: number): RasterFrame;
/** Paths filled into a frame by scanline at pixel centres, each by its own rule, OR-ed. */
export function fill(paths: readonly FillPath[], f: RasterFrame): Bitmap;
