import type { Point, Shape } from './types.js';

/** A width: one number, or one per point (`i` of `n`). */
export type Width = number | ((i: number, n: number) => number);
/** A weave strand: its centreline, closed or open, and an optional depth along it (otherwise over-under alternates). */
export interface Strand {
	pts: Point[];
	closed?: boolean;
	z?: (i: number) => number;
}
/** One turtle step: a straight run, or a turn of `deg` (clockwise positive) at `radius`. */
export type WalkStep = ['L', number] | ['A', number, number];

/** A polyline stroked w wide (mitred joins), as a union of short chunks (safe for self-crossing curves). */
export function stroke(pts: Point[], w: Width, o?: { closed?: boolean; chunk?: number; roundCaps?: boolean }): Shape;
/** Over-under weaving: strands w wide, cut `gap` free where one passes over another. */
export function weave(strands: Strand[], w: number, gap: number, o?: { overLen?: number }): Shape;
/** Points offset sideways by d along their normals. */
export function offsetPts(pts: Point[], d: number): Point[];
/** A polyline with every inner corner rounded by a true circular fillet (radius r, or one per corner), densified. */
export function fillet(pts: Point[], r: number | number[]): Point[];
/** n tracks along a centreline, `pitch` apart, each w wide with round ends. */
export function tracks(pts: Point[], o?: { n?: number; pitch?: number; w?: number; closed?: boolean }): Shape;
/** A closed polygon with every corner filleted (radius r, or one per corner), densely sampled. */
export function filletClosed(pts: Point[], r: number | number[]): Point[];
/** n tracks round a closed outline, offset with wrap-around normals. */
export function trackLoop(pts: Point[], o?: { n?: number; pitch?: number; w?: number }): Shape;
/** A path drawn like a turtle: from `at`, heading `deg`, through straight runs and exact-radius turns. */
export function walk(at: Point, deg: number, steps: WalkStep[]): Point[];
/** A balloon stroke: w0 wide at its ends, w1 at its middle, round ends. */
export function balloon(pts: Point[], w0?: number, w1?: number): Shape;
/** n + 1 points from a to b. */
export function linePts(a: Point, b: Point, n?: number): Point[];
/** n + 1 points round an arc, degrees a0 to a1 (0 = right, 90 = down). */
export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n?: number): Point[];
/** Point runs joined end to start (each run after the first drops its first point). */
export function joinPts(...parts: Point[][]): Point[];
