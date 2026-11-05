/**
 * @module @logomarks/core/svg/shapes
 *
 * The filled shapes in a mark's file: every `<path>`, `<circle>`, `<ellipse>`,
 * `<rect>` and `<polygon>` as path data with its fill rule. Nested `<g>`
 * transforms are not applied (the check reports them). From `fit.mjs`.
 */

import { parsePath } from './path.js';

/**
 * An attribute's value in one tag.
 *
 * @param {string} tag The tag's text.
 * @param {string} name The attribute.
 * @returns {string | undefined} Its value.
 */
export const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/**
 * A numeric attribute.
 *
 * @param {string} tag The tag's text.
 * @param {string} name The attribute.
 * @param {number} [fallback=0] When it is missing.
 * @returns {number} Its value.
 */
const num = (tag, name, fallback = 0) => Number(attr(tag, name) ?? fallback);

/**
 * One element as path data.
 *
 * @param {string} tag The tag's text.
 * @param {string} name The element.
 * @returns {string | undefined} Its outline as path data.
 */
function outlineOf(tag, name) {
	if (name === 'path') return attr(tag, 'd');
	if (name === 'circle' || name === 'ellipse') {
		const cx = num(tag, 'cx'), cy = num(tag, 'cy');
		const rx = num(tag, name === 'circle' ? 'r' : 'rx'), ry = num(tag, name === 'circle' ? 'r' : 'ry');
		return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
	}
	if (name === 'rect') {
		const x = num(tag, 'x'), y = num(tag, 'y'), w = num(tag, 'width'), h = num(tag, 'height');
		return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
	}
	const points = attr(tag, 'points')?.trim().replace(/\s+/g, ' ');
	return points ? `M${points}Z` : undefined;
}

/**
 * Every filled shape in a file, in document order.
 *
 * @param {string} svg The file's text.
 * @returns {import('./shapes.js').FilledPath[]} The shapes.
 */
export function shapes(svg) {
	/** @type {import('./shapes.js').FilledPath[]} */
	const out = [];
	for (const [tag, name] of svg.matchAll(/<(path|circle|ellipse|rect|polygon)\b[^>]*>/g)) {
		if (attr(tag, 'fill') === 'none') continue;
		const d = outlineOf(tag, name);
		if (d) out.push({ d, segs: parsePath(d), evenodd: attr(tag, 'fill-rule') === 'evenodd' });
	}
	return out;
}

/**
 * The file's viewBox.
 *
 * @param {string} svg The file's text.
 * @returns {number[] | undefined} Its four numbers.
 */
export const viewBox = (svg) => /viewBox="([^"]+)"/.exec(svg)?.[1].trim().split(/[\s,]+/).map(Number);

/**
 * The markup inside the root `<svg>`.
 *
 * @param {string} svg The file's text.
 * @returns {string} Its body.
 */
export const body = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
