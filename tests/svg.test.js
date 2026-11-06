import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePath, arcOf, arcAt, bezierAt, shapes, viewBox, body, attr, bounds, rings, svgShape, pathRings, filledShape, nonzeroFill, windingFill, ringsMeet } from '../src/svg/index.js';
import { area, signedArea, winding, U, X, OPS } from '../src/geometry/index.js';
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

/** Whether a point is ink in a shape (inside an outside ring and no hole). */
const ink = (s, p) => s.some((pg) => winding(pg[0], p) !== 0 && !pg.slice(1).some((h) => winding(h, p) !== 0));
/** One path's d read non-zero. */
const nonzero = (d) => filledShape([{ segs: parsePath(d), evenodd: false }]);
/** One path's d read even-odd. */
const evenodd = (d) => filledShape([{ segs: parsePath(d), evenodd: true }]);
/** A ring's path data, wound backwards. */
const reverse = (d) => d.split('Z').filter(Boolean).map((sub) => 'M' + pathRings(sub)[0].slice().reverse().map((p) => p.join(' ')).join('L') + 'Z').join('');

// A square and a long bar wound the same way. The bar's longest edge (its top) runs through the square, so the old
// test beside that edge saw ink on both sides and dropped the whole bar, ends and all.
const SQUARE = 'M0 0H100V100H0Z', BAR = 'M-50 40H150V60H-50Z';

test('non-zero: overlapping outers, one crossing the other\'s longest edge, are both kept', () => {
	const g = nonzero(SQUARE + BAR);
	assert.ok(ringsMeet(pathRings(SQUARE + BAR)));
	assert.equal(total(g), 12000);
	assert.ok(ink(g, [-25, 50]) && ink(g, [125, 50]) && ink(g, [50, 50]) && ink(g, [50, 10]));
	assert.ok(!ink(g, [-25, 10]));
});

test('non-zero: a counter inside an outer is cut', () => {
	const d = SQUARE + 'M25 25V75H75V25Z';
	const g = nonzero(d);
	assert.equal(total(g), 7500);
	assert.ok(!ink(g, [50, 50]) && ink(g, [10, 10]));
	assert.deepEqual(g, evenodd(d));
});

test('non-zero: a counter inside an overlapping pair is cut where one outer holds it, kept where both do', () => {
	const g = nonzero(SQUARE + BAR + 'M10 70V90H30V70Z');
	assert.equal(total(g), 12000 - 400);
	assert.ok(!ink(g, [20, 80]) && ink(g, [-25, 50]));
	// In the overlap the winding is 2 - 1 = 1: still ink, as a browser fills it.
	const h = nonzero(SQUARE + BAR + 'M40 45V55H60V45Z');
	assert.equal(total(h), 12000);
	assert.ok(ink(h, [50, 50]));
});

test('non-zero: reversed winding reads the same, and opposite windings cancel where they overlap', () => {
	assert.equal(total(nonzero(reverse(SQUARE) + reverse(BAR))), 12000);
	assert.equal(total(nonzero(reverse(SQUARE + BAR + 'M10 70V90H30V70Z'))), 11600);
	const g = nonzero(SQUARE + reverse(BAR));
	assert.equal(total(g), 10000);
	assert.ok(!ink(g, [50, 50]) && ink(g, [-25, 50]) && ink(g, [50, 10]));
	assert.ok(Math.sign(signedArea(pathRings(SQUARE)[0])) !== Math.sign(signedArea(pathRings(reverse(SQUARE))[0])));
});

test('even-odd input reads exactly as before: every ring excluded', () => {
	const d = SQUARE + BAR + 'M10 70V90H30V70Z';
	const rs = pathRings(d).map((r) => [r]);
	assert.deepEqual(evenodd(d), X(...rs));
	assert.deepEqual(svgShape(d), X(...rs));
	assert.equal(total(evenodd(SQUARE + BAR)), 10000);
});

test('non-zero: rings that meet but always read right keep their exact polygons', () => {
	// house mark hourglass: two triangles touching at their tips
	const d = 'M171.4 402.7l169.2 0 0 0-84.6 -146.7zm169.2 -293.4l0 0-169.2 0 84.6 146.7z';
	const rs = pathRings(d);
	assert.ok(ringsMeet(rs));
	assert.deepEqual(nonzero(d), U(U([], [rs[0]]), [rs[1]]));
	assert.deepEqual(nonzeroFill(rs, OPS), nonzero(d));
	assert.ok(Math.abs(total(windingFill(rs, OPS)) - total(nonzero(d))) < 1e-9);
});

// DM Serif Display "B" (OFL) at cap 100, baseline y 100, y down: the outer and two counters, from the font's contours.
const DM_SERIF_B = 'M41.8 100L3.3 100L3.3 98.5L6.1 97.4Q9.1 96.2 10.2 94.4Q11.4 92.6 11.4 89.5L11.4 89.5L11.4 10.5Q11.4 7.3 10.2 5.5Q9.1 3.6 6.1 2.6L6.1 2.6L3.3 1.5L3.3 0L46.8 0Q65.3 0 73.5 6.7Q81.7 13.5 81.7 23.8L81.7 23.8Q81.7 31.5 75.7 37.8Q69.7 44.1 55.2 46.7L55.2 46.7Q71.8 48.5 79.5 55.4Q87.3 62.3 87.3 72.1L87.3 72.1Q87.3 77 85.2 81.9Q83 86.8 78 90.9Q72.9 95 64.1 97.5Q55.3 100 41.8 100L41.8 100ZM33.8 3L33.8 46.5L40.3 46.5Q50.5 46.5 54.9 41.8Q59.4 37.1 59.4 25.5L59.4 25.5Q59.4 13.3 55.3 8.2Q51.2 3 42 3L42 3L33.8 3ZM33.8 49.5L33.8 97L41.4 97Q52.7 97 58.3 90.9Q63.8 84.8 63.8 72L63.8 72Q63.8 59.8 58.5 54.7Q53.2 49.5 41.1 49.5L41.1 49.5L33.8 49.5Z';

test('non-zero: a real glyph (DM Serif Display B) and a stroke overlapping it', () => {
	const b = nonzero(DM_SERIF_B);
	assert.equal(b.length, 1);
	assert.equal(b[0].length, 3);
	assert.ok(Math.abs(total(b) - total(evenodd(DM_SERIF_B))) < 1e-6);
	assert.ok(ink(b, [20, 50]) && ink(b, [70, 25]) && !ink(b, [45, 25]) && !ink(b, [45, 75]));
	// A bar wound like the outer, its longest edge through the stem (as an overlapping stroke of a variable font draws
	// it): the old reading dropped it. Under non-zero it fills its overhang and crosses the lower counter.
	const bar = 'M-10 60H70V64H-10Z';
	assert.equal(Math.sign(signedArea(pathRings(bar)[0])), Math.sign(signedArea(pathRings(DM_SERIF_B)[0])));
	const g = nonzero(DM_SERIF_B + bar);
	assert.ok(ink(g, [0, 62]) && ink(g, [45, 62]) && ink(g, [20, 50]));
	assert.ok(!ink(g, [45, 75]) && !ink(g, [45, 25]));
	assert.ok(Math.abs(total(g) - total(U(b, [pathRings(bar)[0]]))) < 1e-6);
	// Wound against the outer, the bar cancels the stem where they overlap and fills where the B is empty.
	const h = nonzero(DM_SERIF_B + reverse(bar));
	assert.ok(!ink(h, [20, 62]) && ink(h, [0, 62]) && ink(h, [45, 62]) && ink(h, [20, 50]));
});
