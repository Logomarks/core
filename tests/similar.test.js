import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iou, variants, blur, outlineSignature, letterSignatures, remap, nearestAll, OUTLINE, LETTER } from '../src/similar/index.js';
import { alpha } from './helpers.js';

const L = alpha(48, (x, y) => x < 0.4 || y > 0.7);

test('iou(): identity, disjoint, half', () => {
	assert.equal(iou(L, L), 1);
	assert.equal(iou([1, 0], [0, 1]), 0);
	assert.equal(iou([1, 1], [1, 0]), 0.5);
	assert.equal(iou([0, 0], [0, 0]), 0);
});

test('variants(): all 8 rotations and flips; a turned copy matches one of them exactly', () => {
	const vs = variants(L);
	assert.equal(vs.length, 8);
	const turned = remap(L, 48, (x, y) => [y, 47 - x]);
	assert.equal(Math.max(...vs.map((v) => iou(v, turned))), 1);
});

test('signatures: the outline is blurred, a solid has no holes, a ring has one', () => {
	assert.equal(outlineSignature(L).length, OUTLINE.size ** 2);
	assert.deepEqual(blur(new Float32Array([1, 1, 1, 1]), 2), new Float32Array([1, 1, 1, 1]));
	const solid = alpha(LETTER.render, (x, y) => Math.abs(x - 0.5) < 0.3 && Math.abs(y - 0.5) < 0.3);
	assert.equal(letterSignatures(solid).holes, null);
	const ring = alpha(LETTER.render, (x, y) => Math.abs(x - 0.5) < 0.3 && Math.abs(y - 0.5) < 0.3 && !(Math.abs(x - 0.5) < 0.1 && Math.abs(y - 0.5) < 0.1));
	const { holes, ink } = letterSignatures(ring);
	assert.ok(holes && holes.some((v) => v > 0));
	assert.equal(ink.length, LETTER.size ** 2);
});

test('letterSignatures(): ink is alpha 128 and up, in Float32 coverage too (127 is not)', () => {
	const R = 8, N = 8, at = (v) => { const a = new Float32Array(R * R); for (let i = 0; i < R * R; i++) a[i] = (i % R) < 4 ? v / 255 : 0; return a; };
	assert.equal(letterSignatures(at(127), R, N).ink.some((v) => v > 0), false);
	assert.equal(letterSignatures(at(128), R, N).ink.some((v) => v > 0), true);
	assert.deepEqual(letterSignatures(at(127), R, N).ink, letterSignatures(Float64Array.from(at(127)), R, N).ink);
});

test('nearestAll(): closest by overlap, nudged by style and mood', () => {
	const a = alpha(16, (x) => x < 0.5), b = alpha(16, (x) => x < 0.45), c = alpha(16, (x) => x > 0.5);
	const out = nearestAll([{ slug: 'a', alpha: a }, { slug: 'b', alpha: b }, { slug: 'c', alpha: c, style: 'x' }], { top: 2 });
	assert.deepEqual(out.a, ['b', 'c']);
	const nudged = nearestAll([{ slug: 'a', alpha: a, style: 'x' }, { slug: 'b', alpha: b }, { slug: 'c', alpha: a.map(() => 0), style: 'x', mood: ['bold'] }], { top: 1, style: 2 });
	assert.deepEqual(nudged.a, ['c']);
});
