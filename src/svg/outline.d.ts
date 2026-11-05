import type { Point } from '../geometry/types.js';
import type { Segment } from './path.js';

/** A box: its top-left corner and size. */
export interface Bounds {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Points along every segment, curves and arcs sampled finely. */
export function outlinePoints(segs: readonly Segment[]): Generator<Point>;
/** The box round some shapes' real outlines. */
export function bounds(all: readonly { segs: Segment[] }[]): Bounds;
