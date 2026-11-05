import type { Box, Point, Point3, Shape } from './types.js';

/** Segment letters: bars t wide between named nodes, parted by g along the bisectors at every joint, clipped to `box`. */
export function segments(nodes: Record<string, Point>, strokes: [string, string][], o?: { t?: number; g?: number; box?: Box | null }): Shape;
/** The same from polylines: every vertex a joint, every leg a stroke. */
export function segmentLines(lines: Point[][], o?: { t?: number; g?: number; box?: Box | null }): Shape;
/** Iso pieces: boxes [[x0, y0, z0], [x1, y1, z1]] drawn as faces parted by g. */
export function isoPieces(pieces: [Point3, Point3][], u?: number, g?: number, ox?: number, oy?: number): Shape;
/** Blocks [x, y, w, h] on a W × H grid, scaled to 448 and parted by g. */
export function blocks(list: [number, number, number, number][], W: number, H: number, g?: number): Shape;
/** A nested subdivision for blocks(): n − 1 blocks peeled off the sides named in turn (l t r b), each `cut` of what's left. */
export function nest(W: number, H: number, n: number, sides: string, cut: number | ((i: number) => number)): [number, number, number, number][];
/** Capsules w wide pinned together, back to front, each cut free by g; pin holes at `pins`. */
export function linkage(bars: [Point, Point][], pins?: Point[], o?: { w?: number; g?: number; pin?: number }): Shape;
