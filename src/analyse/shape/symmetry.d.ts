import type { Ink } from './ink.js';

/** Where a pixel centre's value comes from, in pixel coordinates. */
export type PixelMap = (x: number, y: number) => [number, number];

/** The coverage's overlap with itself mapped by `f` (intersection over union), 0–1. */
export function coverageMatch(ink: Pick<Ink, 'a' | 'n'>, f: PixelMap): number;
/** A matcher for the outline: the share of outline pixels a map lands within `tol` pixels of the outline. */
export function outlineMatcher(ink: Pick<Ink, 'n'>, outline: readonly number[]): (f: PixelMap, tol: number) => number;
/** The mirror across the vertical line x = `cx`. */
export function mirrorX(cx: number): PixelMap;
/** A turn by a whole circle over `order` about `c`. */
export function turn(order: number, c: [number, number]): PixelMap;
