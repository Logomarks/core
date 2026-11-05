import type { BooleanOps } from '../geometry/booleans.js';
import type { Ring, Shape } from '../geometry/types.js';
import type { Segment } from './path.js';

/** Outlines (parsed path data with their fill rules) as one shape; `ops` default to U, D and X (so robust() applies). */
export function filledShape(paths: readonly { segs: readonly Segment[]; evenodd: boolean }[], ops?: BooleanOps): Shape;
/** A mark's SVG (its text, or one path's d, read even-odd) as a shape, every filled element unioned. */
export function svgShape(src: string, ops?: BooleanOps): Shape;
/** Path data as closed rings of points, curves and arcs sampled about every `step` units (1.5). */
export function pathRings(d: string, step?: number): Ring[];
