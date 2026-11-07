import type { ShapeMeasures } from './shape/measures.js';

/** A shape tag measured from a mark's raster. */
export type ShapeTag = 'wide' | 'tall' | 'round' | 'square' | 'solid' | 'light' | 'symmetric' | 'radial';

/** The thresholds the tags are decided by. */
export const SHAPE: {
	wide: number;
	tall: number;
	squarish: number;
	round: { reach: number; ways: Partial<Record<'arc' | 'rim' | 'circularity', number>>[] };
	square: { fill: number; corners: number };
	symmetric: { coverage: number; outline: number };
	radial: { coverage: number; outline: number };
	light: { elongation: number; thick: number };
};

/** The shape tags a mark's measures earn, in a fixed order; exactly one of solid and light. */
export function tagsOf(ms: ShapeMeasures, t?: typeof SHAPE): ShapeTag[];
/** A fitted mark's shape tags, from its coverage at `size` px (256) and its outline's width and height. */
export function shapeTags(a: Float32Array, m: { w: number; h: number; size?: number }): ShapeTag[];
