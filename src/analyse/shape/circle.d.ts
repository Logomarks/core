import type { Pt } from './hull.js';

/** A circle: its centre and radius. */
export interface Circle {
	cx: number;
	cy: number;
	r: number;
}

/** The least-squares circle through some points (NaN radius when they are in a line). */
export function fitCircle(pts: readonly Pt[]): Circle;
/** The share of points within `tol` × r of a circle's line. */
export function onCircle(pts: readonly Pt[], c: Circle, tol: number): number;
/** The circle most of some points lie on, found the same way every time, then refit on the points near it. */
export function findCircle(pts: readonly Pt[], o?: { tol?: number; refit?: number; tries?: number; largest?: number }): Circle;
