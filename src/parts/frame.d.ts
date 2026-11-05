import type { Geom, Point, Shape } from '../geometry/types.js';

/** Turned by `deg` (clockwise on screen) round the origin, or round (cx, cy). */
export function turn<T extends Geom | Point[]>(s: T, deg: number, cx?: number, cy?: number): T;
/** Mirrored left to right across x = 0, unioned. */
export function mirror(s: Geom): Shape;
/** A point mirrored across x = 0. */
export function mx(p: Point): Point;
/** Sheared into an italic: x moves right by k × the height above y = 0. */
export function italic<T extends Geom>(s: T, k?: number): T;
/** The point d along a → b from a. */
export function along(a: Point, b: Point, d: number): Point;
/** The point d from p at heading `deg` (0 = right, 90 = down). */
export function at(p: Point, d: number, deg: number): Point;
/** Scaled about its own centre so its longest side is `span`. */
export function sized(s: Geom, span: number): Shape;
/** Scaled and centred so its longest side is `size`, centred on (cx, cy) (the canvas centre by default). */
export function fitTo(s: Geom, size: number, cx?: number, cy?: number): Shape;
/** Moved so its box is centred on the canvas. */
export function centre<T extends Geom>(g: T): T;
/** The first ring of a shape (its outline points). */
export function outline(shape: Geom): Point[];
/** Parts stacked back to front, each later one in front, cut free by the gap g. */
export function chain(g: number, ...parts: Geom[]): Shape;
/** A mark whose gap lands on exactly `target` (22) once fitted to 448: `build(g)` drawn, measured and drawn again. */
export function exact<T extends Geom>(build: (g: number) => T, before?: () => void, target?: number): T;
/** The shape without pieces under `piece` square units (60) or holes under `hole` (30). */
export function despeckShape(shape: Shape, piece?: number, hole?: number): Shape;
