/**
 * Glitch editions: an existing mark cut into bands by even gaps and slid along the cuts.
 */
import { svgShape } from '../svg/shape.js';
import { slices } from './offset.js';

/**
 * Glitch editions: an existing mark cut into bands by even gaps (g, 22) and slid along the cuts, in the house range (40–46).
 * `src` is the mark's SVG text or path data. Treatments (cuts are positions across the cut direction, on the 512 canvas):
 *   { kind: 'bands', cuts: [a, b], shift: 44 }        the house cut: three bands, the middle one slid
 *   { kind: 'vertical', cuts: [a, b], shift: 44 }     the same, cut top to bottom, the middle band slid up or down
 *   { kind: 'steps', cuts: [a, b, c(, d)], shift: 22 } four or five thin bands, slid +shift, −shift alternately
 *   { kind: 'cut', cuts: [a], shift: 44 }             one cut, the lower (or right) band slid
 *   { kind: 'shear', cuts: [a(, b)], deg: 30, shift: 44 } a diagonal cut (deg from horizontal); two or three bands
 * `shifts` (one per band) overrides the pattern. Run scripts/fit.mjs on the result.
 */
export function glitchMark(src, { kind = 'bands', cuts, shift = 44, shifts, deg, g = 22 } = {}) {
  const s = typeof src === 'string' ? svgShape(src) : src, n = cuts.length + 1;
  deg ??= kind === 'vertical' ? 90 : kind === 'shear' ? 30 : 0;
  shifts ??= kind === 'steps' ? [...Array(n)].map((_, i) => (i % 2 ? -shift : shift))
    : kind === 'cut' ? [0, shift] : n === 2 ? [0, shift] : [...Array(n)].map((_, i) => (i % 2 ? shift : 0));
  return slices(s, cuts, shifts, { deg, g });
}
