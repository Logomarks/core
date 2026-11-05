import type { Geom, Point } from './types.js';

/** The canvas centre: 256. */
export const C: 256;
/** 2π. */
export const TAU: number;
/** Degrees to radians. */
export function rad(d: number): number;
/** The house gap: 22 units between parts, after fitting. */
export const GAP: 22;
/** The point `r` from (cx, cy) at `deg` degrees (0 = right, 90 = down). */
export function polar(r: number, deg: number, cx?: number, cy?: number): Point;
/** A polygon from its outline points. */
export function poly(pts: Point[]): Point[][];
/** Every point of a shape (or a point list) mapped through `f`. */
export function mapPts<T>(g: T, f: (p: Point) => Point): T;
/** Turned by `deg` degrees (clockwise on screen) round (cx, cy), the canvas centre by default. */
export function rot<T extends Geom | Point[]>(g: T, deg: number, cx?: number, cy?: number): T;
/** Moved by (dx, dy). */
export function move<T extends Geom | Point[]>(g: T, dx: number, dy: number): T;
/** Scaled by `k` about (cx, cy), the canvas centre by default. */
export function scale<T extends Geom | Point[]>(g: T, k: number, cx?: number, cy?: number): T;
/** Mirrored left to right across the canvas centre. */
export function flipX<T extends Geom | Point[]>(g: T): T;
/** `f` sampled at n + 1 evenly spaced values from t0 to t1. */
export function sample<P>(f: (t: number) => P, t0: number, t1: number, n: number): P[];
/** A closed curve `f(t)` sampled at n points over a full turn (no repeated end). */
export function closedCurve(f: (t: number) => Point, n?: number): Point[];
/** A polygon's edges resampled at `perEdge` points each (for weave strands). */
export function polygonPath(pts: Point[], perEdge?: number): Point[];
