/** How well a mark maps onto itself, two ways. */
export interface SelfMatch {
	/** Coverage overlap over union, 0–1 (a big solid mass dominates it). */
	coverage: number;
	/** Share of outline pixels that land on the outline, 0–1 (a small asymmetric detail still breaks it). */
	outline: number;
}

/** The measures behind the shape tags. */
export interface ShapeMeasures {
	/** The fitted outline's width over its height. */
	ratio: number;
	/** Share of rays from the hull's centre on which the ink reaches the hull. */
	reach: number;
	/** Share of the hull's edge on its best circle. */
	arc: number;
	/** Share of rays from that circle's centre whose outermost ink lies on it. */
	rim: number;
	/** The hull's circularity, 4πA / P² (a disc 1, a hexagon about 0.95 on the raster, a square 0.79). */
	circularity: number;
	/** The closed silhouette's share of the ink's box. */
	closedFill: number;
	/** Its emptiest corner patch's filled share. */
	closedCorners: number;
	/** The mirror across the vertical middle. */
	mirror: SelfMatch;
	/** Each turn tried (orders 3, 4, 5). */
	turns: (SelfMatch & { order: number })[];
	/** Share of the ink in parts thicker than 48 units. */
	thick: number;
	/** Share of the ink in parts thicker than 12% of the short side. */
	thickRelative: number;
	/** How drawn-out the pieces are (a stroke ≈ length / width, a dot 1.8). */
	elongation: number;
}

/** How the measures are taken (units of the 512 canvas, unless a fraction). */
export const MEASURE: {
	rays: { reach: number; rim: number };
	reach: number;
	arc: number;
	rim: number;
	closing: number;
	corner: number;
	tolerance: number;
	orders: number[];
	thick: number;
	thickRelative: number;
};

/** The measures behind the shape tags, from a fitted mark's coverage at `size` px (256). */
export function shapeMeasures(a: Float32Array, m: { w: number; h: number; size?: number }, o?: Partial<typeof MEASURE>): ShapeMeasures;
