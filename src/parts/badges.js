/**
 * A symbol in a container: knocked out of a house badge (gap-exact or sized), out of any solid, or drawn as a pixel
 * sprite.
 */
import { BADGE, BADGE_DY, C, D, U, bbox, checker, knockout, pixels } from '../geometry/index.js';
import { sized, fitTo } from './frame.js';

/** A symbol knocked out of one of the house badges (kit `BADGE`), its longest side `span`. Pass the symbol's build `(g) => shape`
 * and it is drawn with its gap scaled up first, so its own gaps (the plate's bridges) are still 22 at badge size. */
export const badge = (kind, sym, span = 280, g = 22) => { if (typeof sym !== 'function') return knockout(kind, sized(sym, span));
  const [x0, y0, x1, y1] = bbox(U(sym(g))), k = span / Math.max(x1 - x0, y1 - y0); return knockout(kind, sized(sym(g / k), span)); };
/** A symbol knocked out of one of the house badges, its longest side `size` (keep it 50+ clear of the edge). */
export const badgeOf = (kind, sym, size, dy = BADGE_DY[kind] || 0) => D(BADGE[kind](), fitTo(sym, size, C, C + dy));
/** A symbol `sym(g)` knocked out of any solid `outer`, its longest side `span`, centred on (cx, cy). The symbol is drawn with
 * its gap scaled up by the shrink first, so the bridges it leaves in `outer` are still g wide (industrysyms.mjs's badge()
 * for shapes that aren't a house badge: a drop, a cloud, a shield). */
export const inside = (outer, sym, span, cx, cy, g) => { const [x0, y0, x1, y1] = bbox(U(sym(g))), k = span / Math.max(x1 - x0, y1 - y0);
  return D(outer, fitTo(sym(g / k), span, cx, cy)); };
/** A pixel sprite, checked for corner-only contacts, at pitch p. */
export const sprite = (name, rows, p = 64) => { const bad = checker(rows); if (bad.length) console.log('corner contact', name, JSON.stringify(bad)); return pixels(rows, p); };
