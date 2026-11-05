import type { Box } from '../geometry/types.js';
import type { FilledPath } from '../svg/shapes.js';

/** One piece or hole of a mark. */
export interface Part {
	kind: 'piece' | 'hole';
	/** Square units of the 512 canvas. */
	area: number;
	/** Mean width: 2 · area / perimeter. */
	width: number;
	box: Box;
	/** Read from the raster. */
	raster?: boolean;
}
/** A mark's parts and how they were read. */
export interface PartsRead {
	parts: Part[];
	raster: boolean;
	/** Why the vector read failed, when it did. */
	error?: string;
}
/** The limits for smallParts(). */
export interface SmallOptions {
	piece?: number;
	hole?: number;
	raster?: boolean;
}
/** Why a small part is left out: '' when it is a real speck. */
export type SkipReason = '' | 'tiny' | 'hairline' | 'repeated';

/** The house limits for specks. */
export const SPECKS: {
	piece: number;
	hole: number;
	tiny: number;
	hairline: number;
	sliver: number;
	repeat: number;
	tolerance: { vector: number; raster: number };
	rasterScale: number;
};
/** Every piece and hole, read as vectors; `seed` (the slug) seeds the booleans' retry jitter. */
export function vectorParts(paths: readonly FilledPath[], seed?: string): Part[];
/** Every piece and hole, read from a scanline raster at `scale` px a unit (8). */
export function rasterParts(paths: readonly FilledPath[], scale?: number): Part[];
/** The vector read, or the raster read when the booleans throw (or `raster` is set). */
export function markParts(paths: readonly FilledPath[], o?: { seed?: string; raster?: boolean }): PartsRead;
/** The small parts, smallest first, each with why it is left out. */
export function smallParts(parts: readonly Part[], o?: SmallOptions): (Part & { skip: SkipReason })[];
