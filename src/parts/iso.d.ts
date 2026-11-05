import type { Point, Point3, Projection, Shape } from '../geometry/types.js';

/** A fitted projection: it carries its scale and offset. */
export type FittedProjection = Projection & { u: number; ox: number; oy: number };
/** A box from two corners. */
export type Box3 = [Point3, Point3];
/** A convex piece for scene(): its faces (with outward normals) and its bounds. */
export interface Piece {
	faces: { pts: Point3[]; n: Point3; d: number; tag?: string | number }[];
	lo: Point3;
	hi: Point3;
}

/** A convex outline grown by g, every corner rounded. */
export function growPts(pts: Point[], g: number): Shape;
/** A box's three visible faces, split by a Y of gaps. */
export function boxFaces(P: Projection, a: Point3, b: Point3, g?: number): Shape;
/** A box's silhouette: the hexagon round its visible faces. */
export function boxHex(P: Projection, a: Point3, b: Point3): Point[];
/** One box laid over a scene, cutting an even gap round itself. */
export function overBox(scene: Shape, P: Projection, a: Point3, b: Point3, g?: number): Shape;
/** Boxes back to front by the sum of their corners. */
export function boxes(P: Projection, list: Box3[], g?: number): Shape;
/** An iso projection scaled so the points span 448, centred. */
export function isoFit(pts: Point3[], span?: number): FittedProjection;
/** A true iso drawing order: A before B when A ends where B starts along some axis. */
export function isoOrder<T>(list: T[], box?: (a: T) => Box3): T[];
/** Every corner of each box. */
export function corners(list: Box3[]): Point3[];
/** Boxes projected to fill the frame, in a true order. */
export function fitBoxes(list: Box3[], P?: Projection): Shape;
/** A convex piece from its faces (corner lists), each tagged to merge with like faces. */
export function piece(faces: Point3[][], tags?: (string | number)[]): Piece;
/** The convex hull of a few points. */
export function hull(V: Point3[]): Piece;
/** A loft between two outlines with the same number of points. */
export function loft(A: Point3[], B: Point3[], smooth?: boolean): Piece;
/** A box between two corners. */
export function box(a: Point3, b: Point3): Piece;
/** A flat outline raised from z0 to z1. */
export function plan(pts: Point[], z0: number, z1: number, smooth?: boolean): Piece;
/** A side profile ([x, z]) pushed back from y0 to y1. */
export function side(pts: Point[], y0: number, y1: number, smooth?: boolean): Piece;
/** A front profile ([y, z]) pushed across from x0 to x1. */
export function front(pts: Point[], x0: number, x1: number, smooth?: boolean): Piece;
/** A cylinder of n sides. */
export function cyl(cx: number, cy: number, r: number, z0: number, z1: number, n?: number): Piece;
/** Pieces (or groups of pieces) drawn as one iso mark, faces an even gap g apart, fitted to 448. */
export function scene(parts: (Piece | Piece[])[], g: number): Shape;
