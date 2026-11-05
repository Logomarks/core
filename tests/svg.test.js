import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePath, arcOf, arcAt, bezierAt, shapes, viewBox, body, attr, bounds, rings, svgShape, pathRings, filledShape } from '../src/svg/index.js';
import { area } from '../src/geometry/index.js';
import { fixture } from './helpers.js';

const total = (s) => s.reduce((t, pg) => t + area(pg[0]) - pg.slice(1).reduce((h, r) => h + area(r), 0), 0);

test('parsePath(): relative, implicit and shorthand commands become absolute M L C Q A Z', () => {
	assert.deepEqual(parsePath('M10 10h20v5l-5 5zm5 5 10 0'), [['M', 10, 10], ['L', 30, 10], ['L', 30, 15], ['L', 25, 20], ['Z'], ['M', 15, 15], ['L', 25, 15]]);
	assert.deepEqual(parsePath('M0 0C0 10 10 10 10 0S20-10 20 0'), [['M', 0, 0], ['C', 0, 10, 10, 10, 10, 0], ['C', 10, -10, 20, -10, 20, 0]]);
	assert.deepEqual(parsePath('M0 0Q5 10 10 0T20 0'), [['M', 0, 0], ['Q', 5, 10, 10, 0], ['Q', 15, -10, 20, 0]]);
	assert.deepEqual(parsePath('M0 0a5 5 0 0 1 10 0'), [['M', 0, 0], ['A', 5, 5, 0, 0, 1, 10, 0]]);
	assert.deepEqual(parsePath('M1e1 .5'), [['M', 10, 0.5]]);
});

test('arcs in centre form (SVG spec F.6.5): a semicircle', () => {
	const a = arcOf(0, 0, [5, 5, 0, 0, 1, 10, 0]);
	assert.ok(a);
	assert.ok(Math.abs(a.cx - 5) < 1e-9 && Math.abs(a.cy) < 1e-9);
	assert.ok(Math.abs(Math.abs(a.sweep) - Math.PI) < 1e-9);
	const mid = arcAt(a, 0.5);
	assert.ok(Math.abs(mid[0] - 5) < 1e-9 && Math.abs(Math.abs(mid[1]) - 5) < 1e-9);
	assert.equal(arcOf(0, 0, [0, 5, 0, 0, 1, 10, 0]), null);
	assert.deepEqual(bezierAt([[0, 0], [5, 10], [10, 0]], 0.5), [5, 5]);
});

test('shapes(): every filled element as path data with its fill rule', () => {
	const s = shapes('<svg viewBox="0 0 512 512"><path fill-rule="evenodd" d="M0 0H10V10Z"/><circle cx="5" cy="5" r="2"/><rect x="1" y="1" width="2" height="2" fill="none"/></svg>');
	assert.equal(s.length, 2);
	assert.equal(s[0].evenodd, true);
	assert.equal(s[1].evenodd, false);
	assert.deepEqual(viewBox('<svg viewBox="0 0 512 512">'), [0, 0, 512, 512]);
	assert.equal(body('<svg x="1"><path d="M0 0"/></svg>'), '<path d="M0 0"/>');
	assert.equal(attr('<path d="M1 2" fill="red"/>', 'fill'), 'red');
});

test('bounds() measure the real outline, arcs included', () => {
	const b = bounds(shapes('<svg><circle cx="100" cy="100" r="50"/></svg>'));
	assert.ok(Math.abs(b.x - 50) < 0.01 && Math.abs(b.w - 100) < 0.01);
});

test('rings() and svgShape(): an even-odd ring and a fixture mark', () => {
	const ring = svgShape('M0 0H100V100H0ZM25 25H75V75H25Z');
	assert.equal(total(ring), 7500);
	assert.equal(rings(parsePath('M0 0H10V10Z')).length, 1);
	assert.equal(pathRings('M0 0H10V10Z')[0].length, 3);
	const moon = svgShape(fixture('moonrise'));
	assert.ok(moon.length >= 2);
	assert.deepEqual(filledShape(shapes(fixture('moonrise'))), moon);
});
