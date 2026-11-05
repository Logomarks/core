import type { Point, Polygon, Shape } from '../geometry/types.js';

/** A seam: a round-ended gap along a → b. */
export type Seam = [Point, Point];

/** A right-half outline closed into a symmetric polygon's points. */
export function sym(half: Point[]): Point[];
/** A front-facing faceted head, symmetric about x = 0: outline, planes split by seams, sharp eye cuts. */
export function facetHead(g: number, o: { half: Point[]; parts?: Point[][]; seams?: Seam[]; eyes?: Point[][]; holes?: Point[][]; behind?: Point[][]; front?: Point[][] }): Shape;
/** An asymmetric faceted shape (a head in profile). */
export function facets(g: number, o: { outline: Point[]; parts?: Point[][]; seams?: Seam[]; holes?: Point[][] }): Shape;
/** A sharp eye cut's right half. */
export function eyeCut(x: number, y: number, len: number, rise: number, h: number): Point[];
/** An angular heater crest w × h round the origin. */
export function heater(w?: number, h?: number, c?: number, knee?: number): Polygon;
