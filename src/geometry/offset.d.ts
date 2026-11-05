import type { Geom, Shape } from './types.js';

/** A true round offset: grown by d (shrunk when d < 0), every corner rounded. */
export function grow(shape: Geom, d: number): Geom;
/** Inner corners rounded by r1 and outer by r2: the puffy, inflated look. */
export function soften(shape: Geom, r1: number, r2?: number): Geom;
/** The shape plus a band 2w wide round its outline: subtract it to cut a part free by an even gap w. */
export function grown(shape: Geom, w?: number): Shape;
/** `front` in front of `back`, cut free by an even gap w. */
export function over(back: Geom, front: Geom, w?: number): Shape;
/** Glitch slices: cut at `cuts` (across a frame turned `deg`), each cut opened to g, each band slid by its shift. */
export function slices(shape: Geom, cuts: number[], shifts: number[], o?: { deg?: number; g?: number }): Shape;
