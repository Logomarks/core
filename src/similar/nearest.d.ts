/** One mark of a set, for nearestAll(). */
export interface SetMark {
	slug: string;
	/** Its coverage, 0–1, every mark at the same size. */
	alpha: ArrayLike<number>;
	style?: string;
	mood?: readonly string[];
}
/** How many, and the nudges for the same style and each shared mood. */
export interface NearestAllOptions {
	top?: number;
	style?: number;
	mood?: number;
}

/** Every mark's nearest marks, closest first: overlap, plus 0.08 for the same style and 0.02 a shared mood. */
export function nearestAll(marks: readonly SetMark[], o?: NearestAllOptions): Record<string, string[]>;
