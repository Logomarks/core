import type { Bounds } from '../svg/outline.js';

/** A fitted mark and the box its outline had before. */
export interface Fitted {
	/** The fitted file: 512 canvas, longest side 448, centred, filled paths in currentColor, 0.1 grid. */
	svg: string;
	before: Bounds;
}
/** What is off about a mark. */
export interface FitCheck {
	/** Plain-words problems; empty when the mark meets the standard. */
	problems: string[];
	/** The outline's size, "w×h" to one decimal. */
	size: string;
	bounds: Bounds;
}

/** The canvas: 512. */
export const CANVAS: 512;
/** The longest side: 448. */
export const FIT: 448;
/** How far size, centre and edges may drift: 0.5. */
export const FIT_TOLERANCE: 0.5;
/** Markup a finished mark must not contain. */
export const FORBIDDEN_MARKUP: RegExp;
/** A mark fitted to the standard; throws when the file has no filled shapes. */
export function fitMark(svg: string): Fitted;
/** What is off about a mark against the standard, and its measured size. */
export function checkFit(svg: string): FitCheck;
