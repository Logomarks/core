import type { Geom, Point, Polygon, Shape } from './types.js';

/** A circle, `n` points (by default 48–360 by size). */
export function circle(cx: number, cy: number, r: number, n?: number): Polygon;
/** An ellipse turned `rotDeg`. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, rotDeg?: number, n?: number): Polygon;
/** A rectangle from its top-left corner. */
export function rect(x: number, y: number, w: number, h: number): Polygon;
/** A regular n-gon, first point at `rotDeg` (−90: on top). */
export function regular(cx: number, cy: number, r: number, n: number, rotDeg?: number): Polygon;
/** A ring of radius r (to the middle of its band), w wide. */
export function annulus(cx: number, cy: number, r: number, w: number): Shape | Polygon;
/** A pie slice from a0 to a1 degrees. */
export function sector(cx: number, cy: number, r: number, a0: number, a1: number, n?: number): Polygon;
/** An arc band of radius r and width w from a0 to a1 degrees, optionally round-ended. */
export function arcBand(cx: number, cy: number, r: number, w: number, a0: number, a1: number, round?: boolean): Geom;
/** n copies turned evenly round the canvas centre, unioned. */
export function rotN(g: Geom, n: number, offset?: number): Shape;
/** A square-ended bar from a to b, w wide. */
export function bar(a: Point, b: Point, w: number): Polygon;
/** A closed ring of points (for weave strands). */
export function ring(cx: number, cy: number, r: number, n?: number): Point[];
/** A polygon with its corners rounded (c: the corner cut length, or one per corner). */
export function roundPoly(pts: Point[], c: number | number[], cp?: number): Polygon;
/** A rectangle with circular corners: one radius, or [topLeft, topRight, bottomRight, bottomLeft] (0 = sharp). */
export function rr(x: number, y: number, w: number, h: number, r: number | [number, number, number, number]): Polygon;
/** A lens (vesica) L long and W wide, its long axis at `deg`. */
export function lens(cx: number, cy: number, L: number, W: number, deg?: number): Shape;
/** A teardrop: a circle at c of radius r pulled to a point at t. */
export function drop(c: Point, r: number, t: Point): Shape;
/** A squircle (superellipse): n = 2 a circle, 4–5 the soft square of app icons. */
export function squircle(cx: number, cy: number, R: number, n?: number, k?: number): Polygon;
/** A round-ended line from a to b, w wide. */
export function pill(a: Point, b: Point, w: number): Shape;
/** An egg, wider at the bottom when k > 0 (figurine bodies). */
export function egg(cx: number, cy: number, rx: number, ry: number, deg?: number, k?: number): Polygon;
