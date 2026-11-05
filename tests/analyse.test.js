import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markParts, smallParts, vectorParts, rasterParts, shapeTags, widths, groupRuns, SPECKS } from '../src/analyse/index.js';
import { shapes } from '../src/svg/index.js';
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

test('shapeTags(): a disc is round, symmetric and radial; a wide bar is wide and solid', () => {
	const disc = alpha(128, (x, y) => (x - 0.5) ** 2 + (y - 0.5) ** 2 < (448 / 512 / 2) ** 2);
	assert.deepEqual(shapeTags(disc, { w: 448, h: 448 }).sort(), ['radial', 'round', 'solid', 'symmetric']);
	const bar = alpha(128, (x, y) => Math.abs(x - 0.5) < 224 / 512 && Math.abs(y - 0.5) < 100 / 512);
	assert.deepEqual(shapeTags(bar, { w: 448, h: 200 }).sort(), ['radial', 'solid', 'symmetric', 'wide']);
});

test('widths(): two bars 22 apart have one gap of about 22', () => {
	const two = '<svg viewBox="0 0 512 512"><path d="M32 32H245V480H32ZM267 32H480V480H267Z"/></svg>';
	const { gaps, strokes } = widths(shapes(two));
	assert.equal(gaps.length, 1);
	assert.ok(Math.abs(gaps[0].width - 22) <= 1);
	assert.equal(strokes.length, 0, 'bars wider than the widest run are not strokes');
	assert.equal(groupRuns([{ width: 10, length: 5, box: [0, 0, 1, 1] }, { width: 12, length: 5, box: [1, 1, 2, 2] }], 3).length, 1);
});
