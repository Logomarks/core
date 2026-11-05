import type { Point, Point3, Projection, Shape } from './types.js';

/** A part to stack with isoPile(): its drawing and its solid silhouette. */
export interface IsoPart {
	shape: Shape;
	solid: Shape;
}

/** The isometric projection for cube edge u, offset (ox, oy) from the canvas centre. */
export function iso(u: number, ox?: number, oy?: number): Projection;
/** Unit cubes at integer positions, back to front, an even gap g between every face. */
export function cubes(list: Point3[], u: number, ox?: number, oy?: number, g?: number): Shape;
/** A side profile ([x, z] points, z up) pushed back in depth from y = Y to 0, every face that shows parted by g. */
export function isoPrism(P: Projection, outer: Point[], o?: { holes?: Point[][]; Y?: number; creases?: Point[]; g?: number }): Shape;
/** A top-down shape ([x, y] points) raised from z0 to z1. */
export function isoBlock(P: Projection, outer: Point[], o?: { holes?: Point[][]; z0?: number; z1?: number; g?: number }): IsoPart;
/** An upright ring (a cylinder when ri = 0) from z0 to z1. */
export function isoRing(P: Projection, r: number, ri: number, z0: number, z1: number, g?: number): IsoPart;
/** Parts stacked bottom up, back to front, each cutting an even gap round itself out of what's there. */
export function isoPile(parts: IsoPart[], g?: number): Shape;
