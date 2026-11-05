/**
 * Rasters in pure JS, no renderer: a scanline fill of outlines (each with its fill rule) at a scale, its connected
 * components, a distance transform, and runs of even width (gaps and strokes) across it.
 */
export { frameOf, fill } from './scanline.js';
export { components } from './components.js';
export { distance } from './distance.js';
export { channels } from './channels.js';
