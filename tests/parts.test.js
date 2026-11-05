import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exact, turn, mirror, sized, fitTo, centre, chain, despeckShape, splineClosed, smooth, heartPts, ngonPts, dense, duo, T2, badge, tiles, gridCells, turnTok, letterSolid, shearOf, isoFit, scene, box, rocket, facetHead } from '../src/parts/index.js';
import { rect, bbox, regular, area, U, robust } from '../src/geometry/index.js';

robust();

test('exact(): the gap lands on 22 after fitting to 448', () => {
	let last = 0;
	const s = exact((g) => { last = g; return U(rect(0, 0, 100, 300), rect(100 + g, 0, 100, 300)); });
	const [x0, y0, x1, y1] = bbox(s), k = 448 / Math.max(x1 - x0, y1 - y0);
	assert.ok(Math.abs(last * k - 22) < 0.05);
});

test('placing and sizing', () => {
	assert.deepEqual(bbox([turn(rect(0, 0, 10, 20), 90)]).map((v) => Math.round(v)), [-20, 0, 0, 10]);
	assert.deepEqual(bbox(mirror(rect(10, 0, 10, 10))).map(Math.round), [-20, 0, -10, 10]);
	assert.deepEqual(bbox(sized(rect(0, 0, 10, 20), 40)).map(Math.round), [-5, -10, 15, 30]);
	assert.deepEqual(bbox(fitTo(rect(0, 0, 10, 20), 448)).map(Math.round), [144, 32, 368, 480]);
	assert.deepEqual(bbox(centre([rect(0, 0, 10, 10)])), [251, 251, 261, 261]);
	assert.equal(chain(22, rect(0, 0, 100, 100), rect(50, 50, 100, 100)).length, 2);
	assert.equal(despeckShape([rect(0, 0, 100, 100), rect(200, 0, 5, 5)]).length, 1);
});

test('curves', () => {
	const sq = [[0, 0], [100, 0], [100, 100], [0, 100]];
	assert.equal(splineClosed(sq).length, 64);
	assert.deepEqual(smooth(sq), splineClosed(sq, 24));
	assert.equal(heartPts(0, 0, 100).length, 240);
	assert.deepEqual(ngonPts(0, 0, 10, 6, -90), regular(0, 0, 10, 6, -90)[0]);
	assert.ok(dense([[0, 0], [60, 0]], 6, false).length >= 10);
	assert.deepEqual(duo(22), T2);
	assert.deepEqual(T2, { n: 2, pitch: 48, w: 26 });
});

test('badges, tiles and letters', () => {
	assert.equal(badge('disc', (g) => U(rect(-100, -50, 90 - g / 2, 100), rect(10 + g / 2, -50, 90, 100))).length, 1);
	assert.equal(gridCells(3).length, 9);
	assert.equal(turnTok('qtl', 1), 'qtr');
	assert.ok(tiles(['S .', '. S']).length === 2);
	const T = letterSolid('T', 300, 70);
	assert.ok(area(T[0][0]) > 0);
	assert.ok(shearOf(T).length >= 2);
});

test('iso scenes and trade objects', () => {
	assert.equal(typeof isoFit([[0, 0, 0], [1, 1, 1]]).u, 'number');
	assert.ok(scene([box([0, 0, 0], [1, 1, 1])], 22).length >= 3, 'a cube shows three faces');
	assert.ok(rocket(22).length >= 3);
	assert.ok(facetHead(22, { half: [[0, -200], [150, -100], [120, 150], [0, 220]], seams: [[[0, -200], [0, 220]]] }).length >= 2);
});
