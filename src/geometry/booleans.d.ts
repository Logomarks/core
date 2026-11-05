import type { Geom, Shape } from './types.js';

/** Booleans as an object, so a reader can bring its own (seeded, retried) set. */
export interface BooleanOps {
	union(...g: Geom[]): Shape;
	difference(a: Geom, ...b: Geom[]): Shape;
	intersection(...g: Geom[]): Shape;
	xor(...g: Geom[]): Shape;
}

/** Union of any number of shapes (none: an empty shape). */
export function U(...g: Geom[]): Shape;
/** `a` with every one of `b` taken away (no `b`: `a` as it is). */
export function D<T extends Geom>(a: T, ...b: Geom[]): Shape | T;
/** Intersection. */
export function I(...g: Geom[]): Shape;
/** Exclusive or. */
export function X(...g: Geom[]): Shape;
/**
 * Opt-in: every boolean (U, D, I, X and all built on them) retries with a growing jitter when polygon-clipping throws.
 * The jitter reads Math.random: set `Math.random = seeded(name)` before each mark to repeat it byte for byte.
 */
export function robust(): void;
/** Booleans that retry with a jitter from their own generator (polygon-clipping and Math.random left alone). */
export function robustOps(rand: () => number): BooleanOps;
/** U, D, I and X as an operations object (an empty xor gives an empty shape). */
export const OPS: BooleanOps;
