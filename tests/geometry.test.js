import { test } from 'node:test';
import assert from 'node:assert/strict';
import { C, U, D, I, X, rect, circle, poly, regular, area, signedArea, perimeter, bbox, ringBox, winding, dedupe, rot, move, seeded, robust, robustOps, toPath, svg, over, grow, stroke, tracks, pill, BADGE, knockout, SKEL, skelSolid, glitchMark, polar } from '../src/geometry/index.js';

robust(); // the kit's booleans retry on near-coincident edges, as every generator sets up

const total = (s) => s.reduce((t, pg) => t + area(pg[0]) - pg.slice(1).reduce((h, r) => h + area(r), 0), 0);

test('measures: a 100 × 50 rectangle', () => {
	const r = rect(0, 0, 100, 50)[0];
	assert.equal(area(r), 5000);
	assert.equal(signedArea(r), 5000);
	assert.equal(perimeter(r), 300);
	assert.deepEqual(ringBox(r), [0, 0, 100, 50]);
	assert.deepEqual(bbox([rect(10, 20, 30, 40)]), [10, 20, 40, 60]);
	assert.equal(winding(r, [50, 25]), 1);
	assert.equal(winding(r, [150, 25]), 0);
	assert.deepEqual(dedupe([[0, 0], [0, 0], [1, 0]]), [[0, 0], [1, 0]]);
});

test('booleans: union, difference, intersection and exclude of two squares', () => {
	const a = rect(0, 0, 100, 100), b = rect(50, 0, 100, 100);
	assert.equal(total(U(a, b)), 15000);
	assert.equal(total(D(a, b)), 5000);
	assert.equal(total(I(a, b)), 5000);
	assert.equal(total(X(a, b)), 10000);
	assert.deepEqual(U(), []);
	assert.equal(D(a), a);
});

test('a circle is close to πr² and centred where asked', () => {
	const c = circle(C, C, 100);
	assert.ok(Math.abs(area(c[0]) - Math.PI * 100 * 100) < 100);
	assert.deepEqual(bbox([c]).map(Math.round), [156, 156, 356, 356]);
	assert.deepEqual(polar(10, 90, 0, 0).map((v) => Math.round(v * 1e9) / 1e9), [0, 10]);
});

test('transforms keep the area', () => {
	const t = regular(C, C, 120, 3);
	assert.ok(Math.abs(area(rot(t, 37)[0]) - area(t[0])) < 1e-6);
	assert.deepEqual(bbox([move(rect(0, 0, 10, 10), 5, 6)]), [5, 6, 15, 16]);
});

test('over() cuts the back part free by an even gap', () => {
	const s = over(rect(0, 0, 200, 100), rect(80, 0, 40, 100), 22);
	assert.equal(s.length, 3);
	assert.ok(Math.abs(total(s) - (200 * 100 - 44 * 100)) < 1);
});

test('grow() rounds and offsets', () => {
	const g = grow(rect(0, 0, 100, 100), 10);
	assert.ok(Math.abs(total(g) - (100 * 100 + 4 * 100 * 10 + Math.PI * 100)) < 30);
});

test('strokes and tracks', () => {
	assert.ok(Math.abs(total(stroke([[0, 0], [100, 0]], 20)) - 2000) < 1e-6);
	assert.equal(tracks([[0, 0], [200, 0]], { n: 3, pitch: 44, w: 22 }).length, 3);
	assert.equal(pill([0, 0], [100, 0], 20).length, 1);
});

test('seeded() repeats and differs by seed', () => {
	const a = seeded('Moonrise'), b = seeded('Moonrise'), c = seeded('Quadrant');
	const xs = [a(), a(), a()];
	assert.deepEqual(xs, [b(), b(), b()]);
	assert.notDeepEqual(xs, [c(), c(), c()]);
	assert.ok(xs.every((v) => v >= 0 && v < 1));
});

test('robustOps() gives the same result as the plain booleans when nothing throws', () => {
	const ops = robustOps(seeded('x'));
	const a = rect(0, 0, 100, 100), b = circle(100, 50, 40);
	assert.deepEqual(ops.union(a, b), U(a, b));
	assert.deepEqual(ops.difference(a, b), D(a, b));
	assert.deepEqual(ops.xor(), []);
	robust();
	robust();
	assert.deepEqual(U(a, b), ops.union(a, b));
});

test('toPath() and svg() write one decimal, even-odd, the 512 canvas', () => {
	assert.equal(toPath(U(rect(0, 0, 10, 20))), 'M0.0 0.0L10.0 0.0L10.0 20.0L0.0 20.0Z');
	assert.equal(svg(U(poly([[0, 0], [10, 0], [0, 10]]))), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path fill-rule="evenodd" d="M0.0 0.0L10.0 0.0L0.0 10.0Z"/></svg>\n');
});

test('letter badges and skeletons', () => {
	const a = skelSolid('A', 300, 60);
	assert.ok(a.length >= 1);
	assert.equal(Object.keys(BADGE).length, 7);
	const k = knockout('disc', a);
	assert.ok(k[0].length >= 2, 'the A is a hole in the disc');
	assert.ok(Object.keys(SKEL).length > 30);
});

test('glitchMark() slides the middle band', () => {
	const s = glitchMark(rect(56, 56, 400, 400), { kind: 'bands', cuts: [200, 300], shift: 44 });
	assert.equal(s.length, 3);
	const [x0, , x1] = bbox(s);
	assert.equal(Math.round(x1 - x0), 444);
});
