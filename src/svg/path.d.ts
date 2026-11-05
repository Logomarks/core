import type { Point } from '../geometry/types.js';

/** An absolute path segment: `M`/`L` to a point, `C`/`Q` with control points, `A` with its seven numbers, or `Z`. */
export type Segment =
	| ['M', number, number]
	| ['L', number, number]
	| ['C', number, number, number, number, number, number]
	| ['Q', number, number, number, number]
	| ['A', number, number, number, number, number, number, number]
	| ['Z'];

/** An arc in centre form. */
export interface Arc {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	/** Cosine and sine of the x-axis rotation. */
	cos: number;
	sin: number;
	/** Start angle and signed sweep, in radians. */
	start: number;
	sweep: number;
}

/** Path data as absolute segments (`H`/`V` as `L`, `S`/`T` as `C`/`Q`). */
export function parsePath(d: string): Segment[];
/** A point on a quadratic (3 points) or cubic (4) Bézier, `u` from 0 to 1. */
export function bezierAt(P: readonly Point[], u: number): Point;
/** An `A` segment from `(x1, y1)` in centre form; null when a radius is 0. */
export function arcOf(x1: number, y1: number, arc: readonly number[]): Arc | null;
/** A point on an arc, `k` from 0 to 1. */
export function arcAt(a: Arc, k: number): Point;
