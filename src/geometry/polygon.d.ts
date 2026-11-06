import type { Box, Point, Shape } from './types.js';

export type { Box, Point, Ring, Polygon, Shape, Geom } from './types.js';

/** A ring's signed area (positive clockwise on screen). */
export function signedArea(r: readonly Point[]): number;
/** A ring's area. */
export function area(r: readonly Point[]): number;
/** A ring's perimeter, closing edge included. */
export function perimeter(r: readonly Point[]): number;
/** A ring's bounding box. */
export function ringBox(r: readonly Point[]): Box;
/** A shape's bounding box (every point of every ring). */
export function bbox(g: Shape): Box;
/** The winding number of a ring round a point (non-zero: inside). */
export function winding(r: readonly Point[], p: Point): number;
/** The points without repeated consecutive ones. */
export function dedupe<P extends Point>(pts: readonly P[]): P[];
/** A ring without its closing point: the last goes only when within `eps` (default 1e-6) of the first, so open rings keep every corner. */
export function openRing<P extends Point>(ring: readonly P[], eps?: number): P[];
/** A ring with its closing point: the first repeated at the end, unless the last is already within `eps` (default 1e-6) of it. */
export function closeRing<P extends Point>(ring: readonly P[], eps?: number): P[];
