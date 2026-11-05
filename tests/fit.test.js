import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitMark, checkFit, FIT, CANVAS } from '../src/fit/index.js';
import { fixture } from './helpers.js';

test('fitMark(): longest side 448, centred, and idempotent on a live mark (arc marks like Ring Chomp can move 0.1 on a refit)', () => {
	assert.deepEqual(checkFit(fixture('ring-chomp')).problems, []);
	for (const name of ['moonrise', 'dot-sphere', 'badge-a', 'tally-cut', 'cut-k']) {
		const svg = fixture(name);
		assert.equal(fitMark(svg).svg, svg, name);
		assert.deepEqual(checkFit(svg).problems, [], name);
	}
});

test('fitMark() fits a raw drawing; checkFit() says what is off before', () => {
	const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h40v20h-40z"/></svg>';
	const before = checkFit(raw);
	assert.ok(before.problems.some((p) => p.startsWith('viewBox')));
	assert.ok(before.problems.some((p) => p.startsWith('longest side')));
	const { svg, before: box } = fitMark(raw);
	assert.deepEqual([box.w, box.h], [40, 20]);
	const after = checkFit(svg);
	assert.deepEqual(after.problems, []);
	assert.equal(after.size, '448.0×224.0');
	assert.equal(svg, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="currentColor"><path d="M32 144l${FIT} 0 0 224-${FIT} 0z"/></svg>\n`);
});

test('checkFit() flags markup and marks off the canvas', () => {
	assert.ok(checkFit('<svg viewBox="0 0 512 512"><g transform="x"><path d="M32 32H480V480H32Z"/></g></svg>').problems.some((p) => p.includes('flatten')));
	assert.ok(checkFit('<svg viewBox="0 0 512 512"><path d="M100 32H548V480H100Z"/></svg>').problems.some((p) => p.includes('outside')));
	assert.throws(() => fitMark('<svg/>'), /no filled shapes/);
});
