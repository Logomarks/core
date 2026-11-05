import type { Geom, Shape } from './types.js';

/** A glitch treatment: the cut kind, the cuts across it, the shift (or one per band), the angle and the gap. */
export interface GlitchOptions {
	kind?: 'bands' | 'vertical' | 'steps' | 'cut' | 'shear';
	cuts: number[];
	shift?: number;
	shifts?: number[];
	deg?: number;
	g?: number;
}

/** A glitch edition: the mark (its SVG text, path data or shape) cut into bands by even gaps and slid along the cuts. */
export function glitchMark(src: string | Geom, o: GlitchOptions): Shape;
