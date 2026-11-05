/**
 * @module @arraypress/marks-kit/edit/adjust
 *
 * Simple adjustments to a mark, applied to the path data itself so every
 * download stays clean filled paths: rotate (in 90° steps, plus a fine tilt to any angle), flip, and put the
 * mark in a frame — cut out of a circle or rounded tile (app-icon style), or
 * inside a ring. The result still fills the 512 canvas at 448.
 */
import { parsePath } from '../svg/path.js';
import { r1 } from '../util/number.js';
export const NO_ADJUST = { turns: 0, flip: false, frame: 'none', angle: 0, weight: 0, soften: 0 };
export const isAdjusted = (a) => a.turns % 4 !== 0 || a.flip || a.frame !== 'none' || !!a.angle || !!a.weight || !!a.soften || !!a.gap || !!a.detail || !!a.pixel;
/** The total rotation in degrees, 0–359. */
const degrees = (a) => ((((a.turns % 4) * 90 + (a.angle || 0)) % 360) + 360) % 360;
/** A short filename suffix describing the adjustment, e.g. "-r90-flip-circle". */
export const adjustSuffix = (a) => `${a.weight ? `-w${a.weight > 0 ? '+' : ''}${Math.round(a.weight)}` : ''}${a.soften ? `-soft${Math.round(a.soften)}` : ''}${a.gap ? `-gap${a.gap > 0 ? '+' : ''}${Math.round(a.gap)}` : ''}${a.detail ? `-detail${a.detail > 0 ? '+' : ''}${Math.round(a.detail * 100)}` : ''}${a.pixel ? `-px${Math.round(48 - a.pixel * 34)}` : ''}${degrees(a) ? `-r${Math.round(degrees(a))}` : ''}${a.flip ? '-flip' : ''}${a.frame !== 'none' ? `-${a.frame}` : ''}`;
/**
 * Applies a similarity transform (uniform scale, a rotation by any angle, optional mirror, then a move) to
 * path data and writes it back out, absolute. Similarity only, so circular arcs stay exact arcs.
 *
 * @param {string} d The path data.
 * @param {import('./index.js').Similarity} f Scale k, rotation deg, mirror flip, about (cx, cy), then to (tx, ty).
 * @returns {string} The path data, absolute, on the 0.1 grid.
 */
export function transformPath(d, f) {
	const t = (f.deg * Math.PI) / 180, cos = Math.cos(t), sin = Math.sin(t);
	const pt = (x, y) => {
		let dx = (x - f.cx) * f.k;
		const dy = (y - f.cy) * f.k;
		if (f.flip)
			dx = -dx;
		return `${r1(dx * cos - dy * sin + f.tx)} ${r1(dx * sin + dy * cos + f.ty)}`;
	};
	return parsePath(d)
		.map((s) => {
		if (s[0] === 'Z')
			return 'Z';
		if (s[0] === 'A') {
			const [, rx, ry, rot, large, sweep, x, y] = s;
			const angle = (f.flip ? -rot : rot) + f.deg;
			return `A${r1(rx * f.k)} ${r1(ry * f.k)} ${r1(angle)} ${large ? 1 : 0} ${(f.flip ? !sweep : sweep) ? 1 : 0} ${pt(x, y)}`;
		}
		const n = s.slice(1);
		const out = [];
		for (let i = 0; i < n.length; i += 2)
			out.push(pt(n[i], n[i + 1]));
		return s[0] + out.join(' ');
	})
		.join('');
}
// ---------- frames ----------
const CIRCLE = 'M32 256A224 224 0 1 0 480 256A224 224 0 1 0 32 256Z';
const TILE = 'M130 32H382A98 98 0 0 1 480 130V382A98 98 0 0 1 382 480H130A98 98 0 0 1 32 382V130A98 98 0 0 1 130 32Z';
const RING = CIRCLE + 'M60 256A196 196 0 1 0 452 256A196 196 0 1 0 60 256Z';
/** How big the mark sits inside each frame (fraction of its 448 size). */
const INSET = { none: 1, circle: 0.56, tile: 0.6, ring: 0.52 };
const elements = (paths) => [...paths.matchAll(/<path([^>]*)>/g)].map(([, a]) => ({
	d: /\sd="([^"]+)"/.exec(a)?.[1] ?? '',
	rule: /fill-rule="(evenodd|nonzero)"/.exec(a)?.[1],
}));
/**
 * The adjusted mark, as <path> elements for a 512 canvas. What needs a renderer comes in `env`: `measure` (the exact
 * bounds of some path data; without it a tilted or reshaped mark isn't re-fitted), `canCut` (whether the mark can be
 * cut out of a frame with one even-odd path; without it a circle or tile frame falls back to a ring), `pixelate` and
 * `shaper` (reshape, once clipper-lib has loaded).
 *
 * @param {string} paths The mark's <path> elements.
 * @param {import('./index.js').Adjust} a The adjustment.
 * @param {import('./index.js').AdjustEnv} [env] The renderer's helpers.
 * @returns {string} The adjusted <path> elements.
 */
export function adjustPaths(paths, a, { measure, canCut, pixelate, shaper } = {}) {
	if (!isAdjusted(a))
		return paths;
	// Weight and Soften change the outline itself (once the clipper has loaded); the result is re-fitted to 448.
	const reshaped = (a.weight || a.soften || a.gap || a.detail) && shaper ? shaper(paths, a.weight || 0, a.soften || 0, a.gap || 0, a.detail || 0) : null;
	if (reshaped && measure) {
		const b = measure([...reshaped.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]));
		const k = 448 / Math.max(b.width, b.height);
		paths = reshaped.replace(/\sd="([^"]+)"/, (_, d) => ` d="${transformPath(d, { k, deg: 0, flip: false, cx: b.x + b.width / 2, cy: b.y + b.height / 2, tx: 256, ty: 256 })}"`);
	}
	const frame = a.frame === 'circle' || a.frame === 'tile' ? (canCut?.(paths) ? a.frame : 'ring') : a.frame;
	const deg = degrees(a);
	let els = elements(paths).map((e) => ({ ...e, d: transformPath(e.d, { k: 1, deg, flip: a.flip, cx: 256, cy: 256, tx: 256, ty: 256 }) }));
	// A tilt changes the mark's bounds: fit it back to 448 on its longest side, centred, as every mark is.
	if (deg % 90 !== 0 && measure) {
		const b = measure(els.map((e) => e.d));
		const k = 448 / Math.max(b.width, b.height);
		els = els.map((e) => ({ ...e, d: transformPath(e.d, { k, deg: 0, flip: false, cx: b.x + b.width / 2, cy: b.y + b.height / 2, tx: 256, ty: 256 }) }));
	}
	// Pixelate: redrawn on a square grid after any tilt (so the pixels stay square to the canvas), then fitted again
	if (a.pixel && measure && pixelate) {
		const px = pixelate(els, a.pixel, measure(els.map((e) => e.d)));
		if (px) {
			const b = measure([px]);
			const k = 448 / Math.max(b.width, b.height);
			els = [{ d: transformPath(px, { k, deg: 0, flip: false, cx: b.x + b.width / 2, cy: b.y + b.height / 2, tx: 256, ty: 256 }) }];
		}
	}
	if (INSET[frame] !== 1)
		els = els.map((e) => ({ ...e, d: transformPath(e.d, { k: INSET[frame], deg: 0, flip: false, cx: 256, cy: 256, tx: 256, ty: 256 }) }));
	if (frame === 'circle' || frame === 'tile') {
		// The frame and the mark in one even-odd path: the mark becomes a hole in the frame.
		return `<path fill-rule="evenodd" d="${frame === 'circle' ? CIRCLE : TILE}${els.map((e) => e.d).join('')}"/>`;
	}
	const ring = frame === 'ring' ? `<path fill-rule="evenodd" d="${RING}"/>` : '';
	return ring + els.map((e) => `<path${e.rule ? ` fill-rule="${e.rule}"` : ''} d="${e.d}"/>`).join('');
}
