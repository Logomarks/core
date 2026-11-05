import type { Bitmap } from './scanline.js';
import type { Box } from '../geometry/types.js';

/** One connected part of a raster. */
export interface Component {
	/** Ink (8-connected) or empty (4-connected). */
	ink: boolean;
	/** Its size in pixels. */
	pixels: number;
	/** Its pixels on its edge. */
	rim: number;
	/** Whether it touches the raster's border (for empty space: the background). */
	border: boolean;
	/** Its box in pixels, `[x0, y0, x1, y1]`, end-exclusive. */
	box: Box;
}

/** Every connected part of a raster, ink and empty. */
export function components(bm: Bitmap): Component[];
