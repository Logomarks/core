import type { Geom, Point, Shape } from '../geometry/types.js';

/** A track set: count, pitch and width. */
export interface TrackSet {
	n: number;
	pitch: number;
	w: number;
}

/** The house two-track line: two tracks 48 apart, each 26 wide. */
export const T2: TrackSet;
/** The two-track line for gap g (26 wide, pitch 48 at g = 22, scaled with g). */
export function duo(g: number): TrackSet;
/** An open centreline as two tracks, corners filleted by r. */
export function duoLine(pts: Point[], r?: number): Shape;
/** A closed outline as two tracks, every corner filleted by r. */
export function duoLoop(pts: Point[], r?: number): Shape;
/** A closed outline as two tracks for gap g, corners filleted by r. */
export function duoClosed(pts: Point[], g: number, r?: number): Shape;
/** A crossing made over-under: the run `front` laid on the loop, cut free by g inside the disc (cx, cy, rc). */
export function crossOver(loop: Geom, front: Point[], g: number, cx: number, cy: number, rc: number): Shape;
/** A solid stroke along a polyline, corners filleted by r, round ends. */
export function bent(pts: Point[], w: number, r?: number): Shape;
/** A stroke whose width follows f(t), t from 0 to 1 along the points. */
export function taper(pts: Point[], f: (t: number) => number): Shape;
/** Dashes `on` long, `off` apart, w wide, bending round any corner they span. */
export function dashes(pts: Point[], on: number, off: number, w: number, start?: number): Shape;
/** A jigsaw seam from a to b with one round tab (points for stroke()). */
export function seam(a: Point, b: Point, o?: { f?: number; s?: number; nk?: number; hr?: number; hd?: number }): Point[];
/** A shape cut along seams with gaps g wide. */
export function cutSeams(shape: Geom, g: number, ...seams: Point[][]): Shape;
