import type { SkelStroke } from '../geometry/letters.js';
import type { Shape } from '../geometry/types.js';

/** The kit's skeleton for a letter, B's stem run past the cap and base. */
export function letterSkel(k: string, H: number): SkelStroke[];
/** A glyph stroked solid T wide and centred on 256 (lowercase keys from LSKEL). */
export function letterSolid(k: string, H: number, T: number): Shape;
/** A skeleton's centrelines as one g-wide line, split at sharp turns. */
export function skelLine(sk: SkelStroke[], g: number, run: number, trim?: number): Shape;
/** Inline: the glyph T wide with one g-wide channel along its skeleton. */
export function letterInline(k: string, H: number, T: number, g?: number, wall?: number): Shape;
/** The lowercase skeletons. */
export const LSKEL: Record<string, (H: number, T: number) => (SkelStroke & { y0?: number })[]>;
/** A lowercase glyph stroked solid T wide. */
export function lowerSolid(k: string, H: number, T: number): Shape;
/** The Shear and Wire cut's angle: −30°. */
export const LETTER_DEG: -30;
/** Shear: a solid cut along the line, the halves slid `shift` each way. */
export function shearOf(s: Shape, d?: number, shift?: number): Shape;
/** Wire: solid below the line, only its outline (`line` wide) above, g apart. */
export function wireOf(s: Shape, d?: number, o?: { line?: number; g?: number; min?: number }): Shape;
/** A kit letter or numeral stroked solid, centred on (cx, cy). */
export function glyph(k: string, H: number, T: number, cx?: number, cy?: number): Shape;
/** One heavy italic block letter (A V K X Y N Z M W), centred on the origin. */
export function heavyLetter(k: string, o?: { H?: number; T?: number; w?: number; slant?: number }): Shape;
/** Two shapes side by side, the second slid until exactly g from the first. */
export function nestPair(a: Shape, b: Shape, g: number): Shape;
