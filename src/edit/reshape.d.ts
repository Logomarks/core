/** A mark's parts, rounding limits and neighbour gaps. */
export interface ShapeInfo {
	parts: number;
	round: number[];
	gaps: number[];
}
/** How well a mark survives at favicon size, and the settings for a small-size version. */
export interface SmallSizeInfo {
	grade: 'crisp' | 'ok' | 'thin';
	stroke: number;
	gap: number | null;
	fix: { weight: number; gap: number; detail: number } | null;
}

/** Loads clipper-lib (once); the shape edits return null until it has. */
export function loadShaper(): Promise<unknown>;
/** Whether clipper-lib has loaded. */
export function shaperReady(): boolean;
/** Whether Soften can change the mark at all. */
export function hasCorners(paths: string): boolean;
/** The <path> elements with weight, soften, gap and detail applied, as one <path>; null before load or when nothing changes. */
export function reshape(paths: string, weight: number, soften: number, gap?: number, detail?: number): string | null;
/** How many separate pieces the mark is made of; null before load. */
export function pieceCount(paths: string): number | null;
/** A mark's parts, rounding limits and neighbour gaps; null before load. */
export function shapeInfo(paths: string): ShapeInfo | null | undefined;
/** The mark's grade at favicon size and what would help; null before load. */
export function smallSizeInfo(paths: string): SmallSizeInfo | null;
