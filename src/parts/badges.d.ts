import type { BadgeKind } from '../geometry/badges.js';
import type { Geom, Shape } from '../geometry/types.js';

/** A symbol knocked out of a house badge, its longest side `span`; a build `(g) => shape` is drawn gap-exact. */
export function badge(kind: BadgeKind, sym: Geom | ((g: number) => Geom), span?: number, g?: number): Shape;
/** A symbol knocked out of a house badge, its longest side `size`. */
export function badgeOf(kind: BadgeKind, sym: Geom, size: number, dy?: number): Shape;
/** A symbol `sym(g)` knocked out of any solid, its longest side `span`, centred on (cx, cy), its bridges g wide. */
export function inside(outer: Geom, sym: (g: number) => Geom, span: number, cx: number, cy: number, g: number): Shape;
/** A pixel sprite at pitch p, warning of corner-only contacts. */
export function sprite(name: string, rows: string[], p?: number): Shape;
