import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundleKit, bundleFit, writeSkillScripts } from '../src/skill/bundle.js';
import * as geometry from '../src/geometry/index.js';
import { fitMark } from '../src/fit/index.js';
import { fixture } from './helpers.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logomarks-skill-'));
const nm = path.join(dir, 'node_modules');
fs.symlinkSync(new URL('../node_modules', import.meta.url).pathname, nm);

test('the bundled kit has the {{url}} header and every geometry export, and draws the same', async () => {
	const kit = bundleKit();
	assert.match(kit, /^\/\/ Logomarks geometry kit[^\n]*\n\/\/ \{\{url\}\} · CC0\n/);
	assert.equal((kit.match(/^import /gm) ?? []).length, 1, 'one import: polygon-clipping');
	writeSkillScripts(dir, { url: 'https://example.com' });
	const bundled = await import(path.join(dir, 'kit.mjs'));
	assert.deepEqual(Object.keys(bundled).sort(), Object.keys(geometry).sort());
	const draw = (k) => k.svg(k.over(k.circle(256, 256, 200), k.skelSolid('K', 260, 64)));
	assert.equal(draw(bundled), draw(geometry));
	assert.match(fs.readFileSync(path.join(dir, 'kit.mjs'), 'utf8'), /\/\/ https:\/\/example\.com · CC0/);
});

test('the bundled fit.mjs needs nothing and fits as fitMark() does', () => {
	const fit = bundleFit();
	assert.match(fit, /^#!\/usr\/bin\/env node\n/);
	assert.equal((fit.match(/^import /gm) ?? []).length, 2, 'node:fs and node:path only');
	const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h40v20h-40z"/><circle cx="70" cy="70" r="12"/></svg>';
	const file = path.join(dir, 'raw.svg');
	fs.writeFileSync(file, raw);
	execFileSync('node', [path.join(dir, 'fit.mjs'), file]);
	assert.equal(fs.readFileSync(file, 'utf8'), fitMark(raw).svg);
	fs.writeFileSync(file, fixture('moonrise'));
	assert.match(execFileSync('node', [path.join(dir, 'fit.mjs'), '--check', file]).toString(), /^✓ /);
});
