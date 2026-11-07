import type { Ink } from './ink.js';

/** The share of the ink in parts thicker than 2r (covered by discs of radius `r` pixels inside it), 0–1. */
export function thickShare(ink: Pick<Ink, 'bin' | 'n' | 'count'>, depth: Float32Array, r: number): number;
/** How drawn-out the pieces are: area over width squared per piece, averaged by area (a stroke ≈ length / width). */
export function elongation(ink: Pick<Ink, 'bin' | 'n'>, depth: Float32Array): number;
