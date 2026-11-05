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
/** The pixelated mark as one path's d, from each cell's coverage; null when nothing is filled. */
export function pixelPath(cov: ArrayLike<number>, grid: PixelGrid): string | null;
