import type { Segment } from './path.js';

/** One filled element of a mark's file, as path data. */
export interface FilledPath {
	/** Its outline as path data. */
	d: string;
	/** The same, as absolute segments. */
	segs: Segment[];
	/** Whether it fills with `fill-rule="evenodd"` (nonzero otherwise). */
	evenodd: boolean;
}

/** An attribute's value in one tag. */
export function attr(tag: string, name: string): string | undefined;
/** Every filled `<path>`, `<circle>`, `<ellipse>`, `<rect>` and `<polygon>`, in document order. */
export function shapes(svg: string): FilledPath[];
/** The file's viewBox numbers. */
export function viewBox(svg: string): number[] | undefined;
/** The markup inside the root `<svg>`. */
export function body(svg: string): string;
