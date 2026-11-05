import type { Point, Shape } from './types.js';

/** A skeleton stroke's end: 'c' runs past the cap or base line and is clipped flat, 'f' is free, 'j' lands on a stroke. */
export type SkelEnd = 'c' | 'f' | 'j';
/** A skeleton stroke: its points, its end kinds, and whether it closes. */
export interface SkelStroke {
	p: Point[];
	e: [SkelEnd, SkelEnd];
	closed?: boolean;
	[k: string]: unknown;
}
/** A letter's skeleton at centreline cap height H. */
export type Skeleton = (H: number, ...a: number[]) => SkelStroke[];

/** A skeleton's straight stroke from a to b, a point about every 10 units. */
export function skLine(a: Point, b: Point): Point[];
/** A skeleton's arc round (cx, cy), degrees a0 to a1, at least 12 points. */
export function skArc(cx: number, cy: number, r: number, a0: number, a1: number): Point[];
/** A skeleton stroke from points, end kinds and options. */
export function skStroke(p: Point[], e?: [SkelEnd, SkelEnd], o?: Record<string, unknown>): SkelStroke;
/** One geometric sans as centrelines: A–Z, numerals by name (Zero … Nine), and a few symbols. */
export const SKEL: Record<string, Skeleton>;
/** A skeleton stroked solid T wide, square ends, 'c' ends clipped flat at the cap and base lines. */
export function skelSolid(k: string | null, H: number, T: number, sk?: SkelStroke[]): Shape;
