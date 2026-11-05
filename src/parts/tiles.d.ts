import type { Point, Polygon, Shape } from '../geometry/types.js';

/** A grid cell: its column and row, top-left corner and size. */
export interface Cell {
	i: number;
	j: number;
	x: number;
	y: number;
	s: number;
}

/** Every modular grid's span: 422. */
export const MSPAN: 422;
/** n × m cells at the house span and gap. */
export function gridCells(n: number, m?: number, o?: { span?: number; g?: number; s?: number }): Cell[];
/** A cell's corner ('tl', 'tr', 'br', 'bl'). */
export function corner(c: Cell, k: string): Point;
/** The middle of a cell's side ('t', 'r', 'b', 'l'). */
export function sideMid(c: Cell, k: string): Point;
/** One tile in a cell, by token (S, q<k>, c<k>, t<k>, b<k>, d<k>, v<k>, n<k>, o, h<k>, e<k>, r<k>, P<k>, B<k>, '.', with * for an eye). */
export function tile(tok: string, c: Cell): Shape | Polygon | [];
/** A grid of tiles from rows of space-separated tokens. */
export function tiles(rows: string[], o?: { span?: number; g?: number; s?: number }): Shape;
/** A token turned a quarter turn clockwise, n times. */
export function turnTok(tok: string, n?: number): string;
/** Polygons in any units, scaled to 448 across, centred, each shrunk by half the gap. */
export function pieces(polys: Point[][], g?: number): Shape;
