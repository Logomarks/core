/** A shape tag measured from a mark's raster. */
export type ShapeTag = 'wide' | 'tall' | 'round' | 'square' | 'solid' | 'light' | 'symmetric' | 'radial';

/** A fitted mark's shape tags, from its coverage at `size` px (128) and its outline's width and height. */
export function shapeTags(a: Float32Array, m: { w: number; h: number; size?: number }): ShapeTag[];
