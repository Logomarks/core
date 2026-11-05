/**
 * @module @logomarks/core/analyse/tags
 *
 * Shape tags measured from a mark's coverage: wide or tall, round or square, solid or light, symmetric, radial.
 */

import { remap, iou } from '../similar/signature.js';

/**
 * A fitted mark's shape tags, from its coverage at `size` px (128) and its outline's size on the 512 canvas.
 * - wide / tall: wider than 1.25 or narrower than 0.8;
 * - round: about square, every corner of its box empty and the silhouette reaching the edge midpoints and diagonals;
 * - square: about square with three corners or more filled;
 * - solid / light: over 62% or under 30% of its box inked;
 * - symmetric: mirrors onto itself (IoU over 0.94); radial: a quarter turn (0.92) or a half turn (0.94) does.
 *
 * @param {Float32Array} a Coverage 0–1, `size` × `size`, row by row.
 * @param {{ w: number, h: number, size?: number }} m The outline's width and height (fitted), and the raster's side.
 * @returns {import('./tags.js').ShapeTag[]} The tags, in a fixed order.
 */
export function shapeTags(a, { w: mw, h: mh, size: N = 128 }) {
  const tags = new Set();
  const tf = (/** @type {(x: number, y: number) => number[]} */ f) => remap(a, N, f);
  // bbox in raster px
  const s = N / 512, x0 = Math.round((256 - mw / 2) * s), y0 = Math.round((256 - mh / 2) * s), w = Math.round(mw * s), h = Math.round(mh * s);
  let fill = 0; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) fill += a[y * N + x] || 0;
  const density = fill / (w * h);
  const ratio = mw / mh;
  if (ratio > 1.25) tags.add('wide'); else if (ratio < 0.8) tags.add('tall');
  // corners of the bbox: empty everywhere → round silhouette; mostly filled → square
  const c = Math.max(2, Math.round(Math.min(w, h) * 0.1));
  const corner = (/** @type {number} */ cx, /** @type {number} */ cy) => { let f = 0; for (let y = cy; y < cy + c; y++) for (let x = cx; x < cx + c; x++) f += a[y * N + x] || 0; return f / (c * c); };
  const cs = [corner(x0, y0), corner(x0 + w - c, y0), corner(x0, y0 + h - c), corner(x0 + w - c, y0 + h - c)];
  const sq = ratio > 0.92 && ratio < 1.08;
  if (sq && cs.every((v) => v < 0.04)) {
    // also require the silhouette to reach the edge midpoints (a disc, not a diamond or a small blob)
    const mid = (/** @type {number} */ x, /** @type {number} */ y) => a[y * N + x] > 0.5;
    const r = Math.round(w / 2), cxp = x0 + r, cyp = y0 + r, d = Math.round(w * 0.06);
    const diag = Math.round(r * 0.70);
    if ([mid(cxp, y0 + d), mid(cxp, y0 + h - 1 - d), mid(x0 + d, cyp), mid(x0 + w - 1 - d, cyp)].filter(Boolean).length >= 3 &&
        [mid(cxp - diag + d, cyp - diag + d), mid(cxp + diag - d, cyp - diag + d), mid(cxp - diag + d, cyp + diag - d), mid(cxp + diag - d, cyp + diag - d)].filter(Boolean).length >= 3) tags.add('round');
  }
  if (sq && cs.filter((v) => v > 0.6).length >= 3) tags.add('square');
  if (density > 0.62) tags.add('solid'); else if (density < 0.3) tags.add('light');
  if (iou(a, tf((x, y) => [N - 1 - x, y])) > 0.94 || iou(a, tf((x, y) => [x, N - 1 - y])) > 0.94) tags.add('symmetric');
  if (iou(a, tf((x, y) => [y, N - 1 - x])) > 0.92 || iou(a, tf((x, y) => [N - 1 - x, N - 1 - y])) > 0.94) tags.add('radial');
  return /** @type {import('./tags.js').ShapeTag[]} */ ([...tags]);
}
