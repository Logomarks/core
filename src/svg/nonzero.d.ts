import type { BooleanOps } from '../geometry/booleans.js';
import type { Point, Ring, Shape } from '../geometry/types.js';

/** Whether any two rings meet: an edge of one crosses or touches an edge of another. */
export function ringsMeet(rs: readonly (readonly Point[])[]): boolean;
/** Exact non-zero fill by winding levels, however the rings overlap (each ring taken as simple). */
export function windingFill(rs: Ring[], b: BooleanOps): Shape;
/**
 * Non-zero fill from rings: classed one by one when no two meet; by winding levels when any do, keeping the classed
 * polygons when they cover the same ground.
 */
export function nonzeroFill(rs: Ring[], b: BooleanOps): Shape;
