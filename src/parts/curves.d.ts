import type { Point, Shape } from '../geometry/types.js';

/** A Catmull-Rom curve through `pts` (open; the ends held), n points a span. */
export function spline(pts: Point[], n?: number): Point[];
/** The same curve closed through every point (no repeated end), n points a span (16). */
export function splineClosed(pts: Point[], n?: number): Point[];
/** splineClosed() at 24 points a span: smooth organic outlines from a few knots. */
export function smooth(pts: Point[], n?: number): Point[];
/** The classic heart curve, w wide, centred on (cx, cy). */
export function heartPts(cx: number, cy: number, w: number, n?: number): Point[];
/** A heart w wide, point down, centred on the origin. */
export function heart(w: number): Shape;
/** Points round a circle (closed, no repeated end), from angle a0 (radians). */
export function circPts(cx: number, cy: number, r: number, n?: number, a0?: number): Point[];
/** Points round a rounded rectangle (closed, starting on a corner arc). */
export function roundRectPts(x: number, y: number, w: number, h: number, r: number, n?: number): Point[];
/** A regular polygon's points: n sides of radius r, turned deg. */
export function ngonPts(cx: number, cy: number, r: number, n?: number, deg?: number): Point[];
/** A polyline resampled to points about `step` apart, closing the loop when `closed`. */
export function dense(pts: Point[], step?: number, closed?: boolean): Point[];
