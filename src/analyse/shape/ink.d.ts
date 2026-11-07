import type { Bitmap } from '../../raster/scanline.js';

/** A mark's ink on a square coverage raster. */
export interface Ink {
	/** The coverage, 0–1, row by row. */
	a: Float32Array;
	/** The raster's side in pixels. */
	n: number;
	/** 1 where a pixel is over half covered. */
	bin: Uint8Array;
	/** How many ink pixels. */
	count: number;
	/** The ink's box in pixels, `[x0, y0, x1, y1]`, end-exclusive. */
	box: [number, number, number, number];
	/** The coverage's centre of mass, in pixels. */
	centre: [number, number];
}

/** A square binary raster as the raster module reads one. */
export function bitmap(data: Uint8Array, n: number): Bitmap;
/** The ink of a coverage raster: pixels over half covered, their box and the coverage's centre. */
export function inkOf(a: Float32Array, n: number): Ink;
/** The outline: ink pixels on the border or beside an empty pixel. */
export function outlineOf(ink: Pick<Ink, 'bin' | 'n'>): number[];
/** A binary raster with its holes filled. */
export function filled(bin: Uint8Array, n: number): Uint8Array;
/** The ink closed by a disc of radius `r` pixels: narrower gaps join. */
export function closed(bin: Uint8Array, n: number, r: number): Uint8Array;
