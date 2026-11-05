import type { Geom } from '../geometry/types.js';

/** One mark of a batch: its trade (`Industry · <trade>`), its style, and its build `(g) => shape`. */
export interface IndustryMark {
	trade: string;
	style: string;
	fn: (g: number) => Geom;
}

/** Writes a batch to `<workdir>/newraw<batch>/` (argv: workdir, then "Name,Name" or "fam:Industry · X"), gap-exact and seeded. */
export function runIndustry(batch: number, M: Record<string, IndustryMark>): void;
