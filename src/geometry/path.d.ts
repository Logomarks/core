import type { Point, Shape } from './types.js';

/** Douglas-Peucker on an open run of points: those within `tol` of the line between kept ones go. */
export function dp(pts: Point[], tol: number): Point[];
/** A shape as SVG path data (even-odd), each ring simplified within `tol` and written to one decimal. */
export function toPath(mp: Shape, tol?: number): string;
/** A shape's SVG file on the 512 canvas (fit it to the standard afterwards). */
export function svg(shape: Shape): string;
/** Writes a shape's SVG file (Node). */
export function write(file: string, shape: Shape): Promise<void>;
