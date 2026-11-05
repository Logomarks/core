import type { Shape } from './types.js';

/** Cuts the needles off a shape: corners sharper than `deg` with an edge shorter than `len` end square on the gap. */
export function deneedle(shape: Shape, o?: { deg?: number; len?: number }): Shape;
