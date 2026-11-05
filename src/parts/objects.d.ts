import type { Geom, Point, Polygon, Shape } from '../geometry/types.js';

/** The scissors' layout: ring spread, pivot height, ring size and tip. */
export interface ScissorsLayout {
	rx: number;
	ry: number;
	py: number;
	ring: number;
	tipY: number;
}

/** A house w wide and h tall, the roof `roof` tall, centred on the origin, with an optional door. */
export function house(w: number, h: number, roof: number, o?: { door?: boolean; r?: number }): Shape | Polygon;
/** The classic keyhole, h tall, centred on (cx, cy). */
export function keyhole(cx: number, cy: number, h: number): Shape;
/** The rocket body's outline points. */
export function rocketPts(o?: { w?: number; top?: number; sh?: number; bot?: number; tail?: number }): Point[];
/** The rocket's swept fins. */
export function rocketFins(o?: { w?: number; y0?: number; reach?: number; drop?: number }): Shape;
/** A rocket in parts: fins behind, the body with a porthole, a flame below, cut free by g. */
export function rocket(g: number, o?: { window?: number; flame?: boolean }): Shape;
/** A teardrop pointing down: round end at c (radius r), tip at y = tipY. */
export function dropDown(c: Point, r: number, tipY: number): Shape;
/** A light bulb: glass, an ∩ filament cut as a gap, three screw bands. */
export function bulb(g: number, o?: { filament?: boolean }): Shape;
/** An anchor: ring, shank, stock in front, arms and flukes. */
export function anchor(g: number, o?: { shank?: number; arm?: number }): Shape;
/** A heart w wide, point down, centred on (cx, cy). */
export function heartAt(cx: number, cy: number, w: number): Polygon;
/** A globe cut by the gap along its equator, two parallels and a meridian. */
export function globe(cx: number, cy: number, r: number, g: number, o?: { lat?: number; mer?: number }): Shape;
/** A leaf (a lens) with its midrib a gap g. */
export function leaf(cx: number, cy: number, L: number, W: number, deg: number, g: number, rib?: number): Shape;
/** A speech bubble with a tail from its bottom edge at tx. */
export function bubble(x: number, y: number, w: number, h: number, r: number, tx: number, dir?: number, tl?: number, tw?: number): Shape;
/** A node graph: discs at `pts` joined by bars, each node in its own moat. */
export function nodeNet(pts: Point[], links: [number, number][], o?: { r?: number | number[]; w?: number; g?: number }): Shape;
/** The seven-point leaf's leaflets: [angle, length]. */
export const LEAF7: [number, number][];
/** The seven-point leaf, stem down, leaflets cut free by g. */
export function leafSeven(g: number, o?: { k?: number; hub?: number; stem?: number }): Shape;
/** A profile head facing right. */
export function head(): Polygon;
/** The leaf where the head's thoughts are: a lens split by the gap g. */
export function mindLeaf(g: number): Shape;
/** The open scissors' layout. */
export const SCISSORS: ScissorsLayout;
/** One solid scissor half (s = ±1). */
export function scissorHalf(s: number, o?: { ring?: number; wall?: number; shank?: number; blade?: number }, layout?: ScissorsLayout): Shape;
/** Solid scissors, the halves cut free by g. */
export function scissorsSolid(g: number, opt?: { ring?: number; wall?: number; shank?: number; blade?: number }, layout?: ScissorsLayout): Geom;
/** Two-track scissors. */
export function scissorsTrack(g: number, layout?: ScissorsLayout, r?: number): Shape;
/** A comb, spine on top, teeth parted by the gap. */
export function comb(g: number, o?: { L?: number; spine?: number; teeth?: number; tw?: number; tail?: number; r?: number }): Shape;
