/**
 * SVG in: one path parser (absolute segments), the filled elements of a file, outlines sampled into rings, the real
 * bounds of an outline, and a whole mark read back in as a shape.
 */
export { parsePath, bezierAt, arcOf, arcAt } from './path.js';
export { attr, shapes, viewBox, body } from './shapes.js';
export { outlinePoints, bounds } from './outline.js';
export { rings } from './rings.js';
export { filledShape, svgShape, pathRings } from './shape.js';
