/**
 * Shape edits for a studio: weight, soften, gap and detail (Clipper, loaded on first use), turns, tilts, flips and
 * frames, and pixel-art redraws. Browser-safe: what needs a renderer (exact bounds, a canvas) is passed in.
 */
export { loadShaper, shaperReady, hasCorners, reshape, pieceCount, shapeInfo, smallSizeInfo } from './reshape.js';
export { NO_ADJUST, isAdjusted, adjustSuffix, transformPath, adjustPaths } from './adjust.js';
export { SS, pixelGrid, pixelPath } from './pixelate.js';
