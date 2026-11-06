/**
 * The geometry kit: the helpers the Logomarks set is drawn with. Shapes are polygon sets (arrays of rings of [x, y]
 * points, y pointing down) on a 512 canvas with C = 256 as the centre; combine them with real booleans (U union, D
 * subtract, I intersect, X exclude), then write the result with svg(shape).
 */
export { C, GAP, polar, poly, mapPts, rot, move, scale, flipX, sample, closedCurve, polygonPath, TAU, rad } from './core.js';
export { U, I, robust, robustOps, OPS, D, X } from './booleans.js';
export { signedArea, area, perimeter, ringBox, bbox, winding, dedupe, openRing, closeRing } from './polygon.js';
export { seeded } from './random.js';
export { circle, ellipse, rect, regular, annulus, sector, arcBand, rotN, bar, ring, roundPoly, rr, lens, drop, squircle, pill, egg } from './shapes.js';
export { stroke, weave, offsetPts, fillet, tracks, filletClosed, trackLoop, walk, balloon, linePts, arcPts, joinPts } from './stroke.js';
export { toPath, svg, write } from './path.js';
export { grow, soften, grown, over, slices } from './offset.js';
export { iso, cubes, isoPrism, isoBlock, isoRing, isoPile } from './iso.js';
export { segments, segmentLines, isoPieces, blocks, nest, linkage } from './modular.js';
export { BADGE, BADGE_DY, place, knockout, clearance, PIX7, checker, pixels, dsegs } from './badges.js';
export { SKEL, skelSolid, skLine, skArc, skStroke } from './letters.js';
export { glitchMark } from './glitch.js';
export { deneedle } from './needle.js';
export { svgShape, pathRings } from '../svg/shape.js';
