/**
 * Analysis of a mark: its pieces and holes (specks, slivers, pin-holes), its stroke and gap widths, and its shape tags
 * (with the measures they are decided on).
 */
export { SPECKS, vectorParts, rasterParts, markParts, smallParts } from './specks.js';
export { SHAPE, shapeTags, tagsOf } from './tags.js';
export { MEASURE, shapeMeasures } from './shape/measures.js';
export { WIDTHS, groupRuns, widths } from './widths.js';
