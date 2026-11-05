/**
 * @arraypress/marks-kit: geometry, SVG reading, fitting, analysis, similarity and shape edits for logomarks on a 512
 * grid. Each area is also its own subpath (`/geometry`, `/svg`, `/fit`, `/raster`, `/analyse`, `/similar`, `/edit`,
 * and `/parts` for the industry-symbol parts, which needs Node for its batch writer).
 */
export * from './geometry/index.js';
export { parsePath, bezierAt, arcOf, arcAt, attr, shapes, viewBox, body, outlinePoints, bounds, rings, filledShape } from './svg/index.js';
export * from './fit/index.js';
export * from './raster/index.js';
export * from './analyse/index.js';
export * from './similar/index.js';
export * from './edit/index.js';
