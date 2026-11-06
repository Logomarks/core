import type { FillPath } from '../raster/scanline.js';

/** A pixel grid over a mark's box. */
export interface PixelGrid {
	cols: number;
	rows: number;
	cell: number;
	x0: number;
	y0: number;
}

/** Samples a cell is measured at along each side (6). */
export const SS: 6;
/** The grid for a box: 48 cells across its longest side at amount 0, 14 at amount 1, centred. */
export function pixelGrid(amount: number, box: { x: number; y: number; width: number; height: number }): PixelGrid;
/** How much of each cell the mark's rings cover (0–1, row by row), by scanline at SS × SS samples a cell. */
export function pixelCoverage(paths: readonly FillPath[], grid: PixelGrid): Float32Array;
/** The filled cells (1 each, row by row): half covered, or a fifth where a cell stands alone or bridges two. */
export function pixelCells(cov: ArrayLike<number>, grid: Pick<PixelGrid, 'cols' | 'rows'>): Uint8Array;
/** The pixelated mark as one path's d, from each cell's coverage; null when nothing is filled. */
export function pixelPath(cov: ArrayLike<number>, grid: PixelGrid): string | null;
