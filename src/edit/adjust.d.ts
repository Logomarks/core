/** A frame round the mark. */
export type Frame = 'none' | 'circle' | 'tile' | 'ring';
/** An adjustment: quarter turns, a fine tilt (degrees), a flip, a frame, and the shape edits. */
export interface Adjust {
	turns: number;
	flip: boolean;
	frame: Frame;
	angle: number;
	weight: number;
	soften: number;
	gap?: number;
	detail?: number;
	pixel?: number;
}
/** A similarity transform: scale k and rotation deg about (cx, cy), an optional mirror, then to (tx, ty). */
export interface Similarity {
	k: number;
	deg: number;
	flip: boolean;
	cx: number;
	cy: number;
	tx: number;
	ty: number;
}
/** What adjustPaths() needs from a renderer. */
export interface AdjustEnv {
	/** The exact bounds of some path data. */
	measure?: (ds: string[]) => { x: number; y: number; width: number; height: number };
	/** Whether the mark can be cut out of a frame with one even-odd path. */
	canCut?: (paths: string) => boolean;
	/** The pixelated mark as one path's d (null when nothing is drawn). */
	pixelate?: (els: { d: string; rule?: string }[], amount: number, box: { x: number; y: number; width: number; height: number }) => string | null;
	/** reshape(), once loaded. */
	shaper?: (paths: string, weight: number, soften: number, gap: number, detail: number) => string | null;
}

/** No adjustment. */
export const NO_ADJUST: Adjust;
/** Whether an adjustment changes anything. */
export function isAdjusted(a: Adjust): boolean;
/** A short filename suffix for an adjustment, e.g. "-r90-flip-circle". */
export function adjustSuffix(a: Adjust): string;
/** Path data through a similarity transform, written absolute on the 0.1 grid (arcs stay arcs). */
export function transformPath(d: string, f: Similarity): string;
/** The adjusted mark, as <path> elements for a 512 canvas. */
export function adjustPaths(paths: string, a: Adjust, env?: AdjustEnv): string;
