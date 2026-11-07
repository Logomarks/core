import type { Ink } from './ink.js';

/** A point, `[x, y]`. */
export type Pt = [number, number];

/** The convex hull of some points (sorts them in place). */
export function convexHull(pts: Pt[]): Pt[];
/** The hull of a raster's ink, in pixels. */
export function inkHull(ink: Pick<Ink, 'bin' | 'n' | 'box'>): Pt[];
/** A polygon's area (unsigned), perimeter and centre of area. */
export function polygonMeasures(poly: readonly Pt[]): { area: number; perimeter: number; centre: Pt };
/** How far a ray from `c` at angle `t` (radians) runs before it leaves a convex polygon round `c`. */
export function rayExit(poly: readonly Pt[], c: Pt, t: number): number;
/** Points along a polygon's edges, `step` (1) apart. */
export function edgePoints(poly: readonly Pt[], step?: number): Pt[];
