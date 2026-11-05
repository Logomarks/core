import type { Geom, Point, Polygon, Shape } from './types.js';

/** The seven house badges. */
export type BadgeKind = 'disc' | 'tile' | 'squircle' | 'hex' | 'shield' | 'pill' | 'plate';
/** A pointed display segment's centreline. */
export type Segment = [Point, Point];

/** The seven house badges, each 448 on its long side, centred on 256. */
export const BADGE: Record<BadgeKind, () => Polygon>;
/** Where a letter sits in each badge (the shield's point pulls the optical centre up). */
export const BADGE_DY: Partial<Record<BadgeKind, number>>;
/** `letter` centred in badge `kind` (moved by dy). */
export function place<T extends Geom>(kind: BadgeKind, letter: T, dy?: number): T;
/** `letter` centred in badge `kind` and knocked out, shrunk until it clears the edge by `room`. */
export function knockout(kind: BadgeKind, letter: Geom, dy?: number, room?: number): Shape;
/** The smallest distance between a placed letter and its badge's edge. */
export function clearance(kind: BadgeKind, placed: Geom): number;
/** PIX7: a chunky 8-bit alphabet on a 7 × 7 grid, rows top to bottom, '#' a pixel. */
export const PIX7: Record<string, string[]>;
/** Every 2 × 2 window that is a checkerboard (pixels touching only at a corner), as [row, col]. */
export function checker(rows: string[]): [number, number][];
/** A pixel glyph as one solid at pitch p. */
export function pixels(rows: string[], p: number, x0?: number, y0?: number): Shape;
/** Display segments t wide with pointed 45°-style ends, parted by g. */
export function dsegs(segs: Segment[], t?: number, g?: number): Shape;
