import type { Bitmap } from './scanline.js';

/** For every pixel of `kind` (1 ink, 0 empty), its distance in pixels to the nearest pixel of the other kind; 0 elsewhere. */
export function distance(bm: Bitmap, kind: 0 | 1): Float32Array;
