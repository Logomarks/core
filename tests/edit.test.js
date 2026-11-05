import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_ADJUST, isAdjusted, adjustSuffix, transformPath, adjustPaths, pixelGrid, pixelPath, loadShaper, shaperReady, reshape, pieceCount, hasCorners, shapeInfo, smallSizeInfo } from '../src/edit/index.js';

const TWO = '<path d="M32 32H245V480H32ZM267 32H480V480H267Z"/>';

test('adjustments: suffix, a quarter turn, a ring frame', () => {
	assert.equal(isAdjusted(NO_ADJUST), false);
	assert.equal(adjustSuffix({ ...NO_ADJUST, turns: 1, flip: true, frame: 'circle' }), '-r90-flip-circle');
	assert.equal(transformPath('M0 0L10 0', { k: 1, deg: 90, flip: false, cx: 0, cy: 0, tx: 0, ty: 0 }), 'M0 0L0 10');
	assert.equal(adjustPaths(TWO, NO_ADJUST), TWO);
	const ringed = adjustPaths(TWO, { ...NO_ADJUST, frame: 'ring' });
	assert.ok(ringed.startsWith('<path fill-rule="evenodd" d="M32 256A224'));
	assert.ok(adjustPaths(TWO, { ...NO_ADJUST, frame: 'circle' }).includes('A196'), 'no canCut: a circle frame falls back to a ring');
});

test('pixelate: the grid and the merged rectangles', () => {
	const g = pixelGrid(1, { x: 32, y: 32, width: 448, height: 448 });
	assert.equal(g.cols, 14);
	assert.equal(g.rows, 14);
	assert.equal(pixelPath(new Float32Array(196), g), null);
	const full = pixelPath(new Float32Array(196).fill(1), g);
	assert.equal(full, 'M32 32h448.35v448.35h-448.35Z');
});

test('reshape: pieces, corners, weight and the small-size grade (clipper-lib)', async () => {
	assert.equal(reshape(TWO, 4, 0), null, 'nothing before clipper-lib loads');
	await loadShaper();
	assert.equal(shaperReady(), true);
	assert.equal(pieceCount(TWO), 2);
	assert.equal(hasCorners(TWO), true);
	const bold = reshape(TWO, 4, 0);
	assert.ok(bold && bold.startsWith('<path d="M'));
	assert.deepEqual(shapeInfo(TWO)?.gaps, [22]);
	assert.equal(smallSizeInfo(TWO)?.grade, 'thin');
});
