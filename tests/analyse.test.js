import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markParts, smallParts, vectorParts, rasterParts, shapeTags, shapeMeasures, tagsOf, SHAPE, MEASURE, widths, groupRuns, SPECKS } from '../src/analyse/index.js';
import { shapes, rings } from '../src/svg/index.js';
import { fill } from '../src/raster/index.js';
import { fixture, alpha } from './helpers.js';

const SPECK = '<svg viewBox="0 0 512 512"><path fill-rule="evenodd" d="M32 32H400V480H32ZM420 240h6v6h-6Z"/></svg>';

test('markParts(): a speck beside a block, vector and raster', () => {
	const read = markParts(shapes(SPECK), { seed: 'x' });
	assert.equal(read.raster, false);
	assert.equal(read.parts.length, 2);
	const small = smallParts(read.parts);
	assert.equal(small.length, 1);
	assert.equal(small[0].kind, 'piece');
	assert.equal(small[0].skip, '');
	assert.equal(Math.round(small[0].area), 36);
	const r = rasterParts(shapes(SPECK));
	assert.ok(r.every((p) => p.raster));
	assert.equal(smallParts(r, { raster: true }).filter((p) => !p.skip).length, 1);
	assert.equal(markParts(shapes(SPECK), { raster: true }).raster, true);
});

test('smallParts(): tiny, hairline and repeated parts are left out', () => {
	const box = [0, 0, 1, 1];
	const parts = [{ kind: 'piece', area: 0.2, width: 1, box }, { kind: 'piece', area: 20, width: 0.05, box }, ...Array(6).fill({ kind: 'hole', area: 10, width: 2, box })];
	assert.deepEqual(smallParts(parts).map((p) => p.skip), ['tiny', ...Array(6).fill('repeated'), 'hairline']);
	assert.equal(SPECKS.piece, 60);
});

test('a live mark reads clean', () => {
	assert.ok(vectorParts(shapes(fixture('moonrise')), 'moonrise').length >= 2);
	assert.equal(smallParts(markParts(shapes(fixture('tally-cut')), { seed: 'tally-cut' }).parts).filter((p) => !p.skip).length, 0);
});

const N = 256;
const disc = (r) => (x, y) => (x - 0.5) ** 2 + (y - 0.5) ** 2 < (r / 512) ** 2;
/** A fixture mark's coverage at 256 px, from the scanline fill (no renderer). */
const coverage = (name) => {
	const paths = shapes(fixture(name)).map((p) => ({ rings: rings(p.segs, 0.5), evenodd: p.evenodd }));
	return Float32Array.from(fill(paths, { x0: 0, y0: 0, scale: N / 512, width: N, height: N }).data);
};

test('shapeTags(): a disc is round, solid, symmetric and radial; a thin ring is light', () => {
	assert.deepEqual(shapeTags(alpha(N, disc(224)), { w: 448, h: 448 }), ['round', 'solid', 'symmetric', 'radial']);
	const ring = alpha(N, (x, y) => disc(224)(x, y) && !disc(200)(x, y));
	assert.deepEqual(shapeTags(ring, { w: 448, h: 448 }), ['round', 'light', 'symmetric', 'radial']);
});

test('shapeTags(): a square is square; a wide bar is wide and only turns by a half (not radial)', () => {
	const square = alpha(N, (x, y) => Math.abs(x - 0.5) < 224 / 512 && Math.abs(y - 0.5) < 224 / 512);
	assert.deepEqual(shapeTags(square, { w: 448, h: 448 }), ['square', 'solid', 'symmetric', 'radial']);
	const bar = alpha(N, (x, y) => Math.abs(x - 0.5) < 224 / 512 && Math.abs(y - 0.5) < 100 / 512);
	assert.deepEqual(shapeTags(bar, { w: 448, h: 200 }), ['wide', 'solid', 'symmetric']);
});

test('shapeTags(): a hexagon is neither round nor square; a triangle turns by a third', () => {
	const inPoly = (n, r, t0) => (x, y) => {
		const px = (x - 0.5) * 512, py = (y - 0.5) * 512;
		for (let i = 0; i < n; i++) {
			const a = t0 + (i + 0.5) * 2 * Math.PI / n;
			if (px * Math.cos(a) + py * Math.sin(a) > r * Math.cos(Math.PI / n)) return false;
		}
		return true;
	};
	const hex = shapeTags(alpha(N, inPoly(6, 224, -Math.PI / 2)), { w: 388, h: 448 });
	assert.ok(!hex.includes('round') && !hex.includes('square'));
	assert.ok(hex.includes('radial') && hex.includes('symmetric'));
	// apex up, centred on its centre of mass; its box is 388 wide and 336 tall
	const tri = shapeTags(alpha(N, inPoly(3, 224, Math.PI / 2)), { w: 388, h: 336 });
	assert.deepEqual(tri, ['solid', 'symmetric', 'radial']);
});

test('shapeTags(): an off-centre notch inside a badge breaks the mirror, though the mass barely changes', () => {
	const badge = (x, y) => Math.abs(x - 0.5) < 224 / 512 && Math.abs(y - 0.5) < 224 / 512;
	const notch = (x, y) => Math.abs(x - 0.36) < 16 / 512 && Math.abs(y - 0.45) < 40 / 512;
	const ms = shapeMeasures(alpha(N, (x, y) => badge(x, y) && !notch(x, y)), { w: 448, h: 448 });
	assert.ok(ms.mirror.coverage >= SHAPE.symmetric.coverage, "the coverage still matches");
	assert.ok(ms.mirror.outline < SHAPE.symmetric.outline, 'the outline does not');
	assert.ok(!tagsOf(ms).includes('symmetric'));
});

test('shapeTags(): dots are solid (not strokes); strokes with little mass are light', () => {
	const dots = alpha(N, (x, y) => {
		const gx = (x * 512 - 64) / 96, gy = (y * 512 - 64) / 96;
		return gx >= -0.5 && gy >= -0.5 && gx <= 4.5 && gy <= 4.5 && (gx - Math.round(gx)) ** 2 + (gy - Math.round(gy)) ** 2 < 0.2 ** 2;
	});
	const ms = shapeMeasures(dots, { w: 448, h: 448 });
	assert.ok(ms.elongation < SHAPE.light.elongation);
	assert.ok(shapeTags(dots, { w: 448, h: 448 }).includes('solid'));
	const zig = alpha(N, (x, y) => Math.abs(y - 0.5 - 0.3 * Math.abs(((x * 4) % 2) - 1) + 0.15) < 12 / 512 && Math.abs(x - 0.5) < 224 / 512);
	assert.ok(shapeTags(zig, { w: 448, h: 200 }).includes('light'));
});

test('shapeTags(): live marks', () => {
	const tags = (name, w, h) => shapeTags(coverage(name), { w, h });
	assert.deepEqual(tags('ring-chomp', 447.9, 448), ['round', 'solid']);
	assert.deepEqual(tags('badge-a', 448, 448), ['square', 'solid']);
	assert.deepEqual(tags('moonrise', 425.2, 448), ['solid', 'symmetric']);
	assert.deepEqual(tags('tally-cut', 448, 351.4), ['wide', 'solid']);
	assert.deepEqual(tags('cut-k', 428.2, 448), ['solid'], 'a K mirrors top to bottom only');
});

test('tagsOf(): exactly one of solid and light, and the thresholds can be changed', () => {
	const ms = shapeMeasures(alpha(N, disc(224)), { w: 448, h: 448 });
	const weight = (t) => t.filter((x) => x === 'solid' || x === 'light').length;
	assert.equal(weight(tagsOf(ms)), 1);
	assert.ok(!tagsOf(ms, { ...SHAPE, round: { ...SHAPE.round, reach: 2 } }).includes('round'));
	assert.equal(MEASURE.closing, 30);
	const empty = shapeMeasures(new Float32Array(N * N), { w: 448, h: 448 });
	assert.deepEqual(tagsOf(empty), ['solid']);
});

test('widths(): two bars 22 apart have one gap of about 22', () => {
	const two = '<svg viewBox="0 0 512 512"><path d="M32 32H245V480H32ZM267 32H480V480H267Z"/></svg>';
	const { gaps, strokes } = widths(shapes(two));
	assert.equal(gaps.length, 1);
	assert.ok(Math.abs(gaps[0].width - 22) <= 1);
	assert.equal(strokes.length, 0, 'bars wider than the widest run are not strokes');
	assert.equal(groupRuns([{ width: 10, length: 5, box: [0, 0, 1, 1] }, { width: 12, length: 5, box: [1, 1, 2, 2] }], 3).length, 1);
});
