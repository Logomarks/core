/** The outline signature's side and the scores that flag a pair. */
export const OUTLINE: { size: number; tooClose: number; nearCopy: number };
/** The letter signature's render and cropped sides and the scores that flag a pair. */
export const LETTER: { render: number; size: number; tooClose: number; nearCopy: number };
/** A 3×3 box blur of a square image of side `N`, averaging only pixels inside it. */
export function blur(a: ArrayLike<number>, N: number): Float32Array;
/** A mark's outline signature from its coverage: blurred 3×3. */
export function outlineSignature(alpha: ArrayLike<number>, size?: number): Float32Array;
/** A mark's holes (null when it has none) and its ink, each cropped to its box at `N` px, from its coverage at `R`. */
export function letterSignatures(alpha: ArrayLike<number>, R?: number, N?: number): { holes: Float32Array | null; ink: Float32Array };
/** A square image remapped: each pixel (x, y) read from `f(x, y)`. */
export function remap(a: ArrayLike<number>, N: number, f: (x: number, y: number) => number[]): Float32Array;
/** A square image in all 8 rotations and flips. */
export function variants(a: Float32Array): Float32Array[];
/** Overlap (IoU) of two images: the sum of minima over the sum of maxima. */
export function iou(a: ArrayLike<number>, b: ArrayLike<number>): number;
