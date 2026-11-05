/**
 * @module @arraypress/marks-kit/skill
 *
 * The design skill's two scripts, generated from the library so they never drift: `kit.mjs` (the geometry kit as one
 * file, needing only polygon-clipping) and `fit.mjs` (the fit and check, no dependencies). Each module's code goes in
 * as it is, its imports dropped and its exports kept only where the script exposes them. `{{url}}` in each header is
 * left for the skill's build to fill.
 */

import fs from 'node:fs';
import * as geometry from '../geometry/index.js';

const SRC = new URL('../', import.meta.url);

/** The geometry kit's modules, in dependency order. */
const KIT = ['geometry/core.js', 'geometry/booleans.js', 'geometry/polygon.js', 'geometry/random.js', 'geometry/shapes.js', 'geometry/stroke.js',
	'geometry/path.js', 'geometry/offset.js', 'geometry/iso.js', 'geometry/modular.js', 'geometry/badges.js', 'geometry/letters.js',
	'svg/path.js', 'svg/shapes.js', 'svg/rings.js', 'svg/shape.js', 'geometry/glitch.js', 'geometry/needle.js'];

/** The fit's modules, in dependency order. */
const FIT = ['svg/path.js', 'svg/shapes.js', 'svg/outline.js', 'util/number.js', 'fit/index.js'];

const KIT_HEADER = `// Logomarks geometry kit — the helpers the Logomarks set was built with.
// {{url}} · CC0
//
// Shapes are polygon sets (arrays of rings of [x, y] points, y pointing down) on a
// 512 canvas with C = 256 as the centre. Combine them with real booleans:
//   U(...shapes) union · D(a, ...b) subtract · I(...) intersect · X(...) exclude
// then write the result with svg(shape) or write('name.svg', shape).
// Sizes don't need to be exact: scripts/fit.mjs scales every mark to the set's
// standard (longest side 448, centred) afterwards.
//
// Needs one package: npm install polygon-clipping
// Generated from @arraypress/marks-kit (its geometry) by marks-kit-skill: edit the library, not this file.
import pc from 'polygon-clipping';
`;

const FIT_HEADER = `#!/usr/bin/env node
// Fits SVG marks to the Logomarks standard: 512×512 canvas, the mark's longest side
// exactly 448, centred (a 32 margin), filled paths in currentColor, nothing else.
// {{url}} · CC0 · no dependencies
//
//   node fit.mjs mark.svg                 fit in place
//   node fit.mjs in.svg out.svg           fit to a new file
//   node fit.mjs marks/                   fit every .svg in a folder, in place
//   node fit.mjs --check mark.svg marks/  only report; exits 1 if anything is off
//
// Reads <path d> (with fill-rule), <circle>, <ellipse>, <rect> and <polygon>; nested
// <g> transforms are NOT applied, so flatten those first. Measures the real outline,
// curves and arcs included (sampled), never the viewBox.
// Generated from @arraypress/marks-kit (its svg and fit) by marks-kit-skill: edit the library, not this file.

import fs from 'node:fs';
import path from 'node:path';
`;

/** fit.mjs's command line. */
const FIT_MAIN = `
// ---------- command line ----------

const args = process.argv.slice(2);
const checking = args[0] === '--check';
if (checking) args.shift();
if (!args.length) {
	console.log('Usage: node fit.mjs [--check] <file.svg | folder> [out.svg]');
	process.exit(1);
}
const files = [];
const out = !checking && args.length === 2 && !fs.statSync(args[0]).isDirectory() && args[1].endsWith('.svg') ? args.pop() : null;
for (const a of args) {
	if (fs.statSync(a).isDirectory()) for (const f of fs.readdirSync(a)) { if (f.endsWith('.svg')) files.push(path.join(a, f)); }
	else files.push(a);
}
let bad = 0;
for (const file of files) {
	const svg = fs.readFileSync(file, 'utf8');
	try {
		if (checking) {
			const { problems, size } = checkFit(svg);
			if (problems.length) bad++;
			console.log(\`\${problems.length ? '✗' : '✓'} \${file} \${size}\${problems.length ? ' — ' + problems.join('; ') : ''}\`);
		} else {
			const r = fitMark(svg);
			fs.writeFileSync(out ?? file, r.svg);
			const c = checkFit(r.svg);
			console.log(\`\${c.problems.length ? '✗' : '✓'} \${out ?? file} (was \${r.before.w.toFixed(1)}×\${r.before.h.toFixed(1)}, now \${c.size})\`);
			if (c.problems.length) bad++;
		}
	} catch (e) {
		bad++;
		console.log(\`✗ \${file} — \${e.message}\`);
	}
}
process.exit(bad ? 1 : 0);
`;

/**
 * One module's code for a single-file script: its header docblock as a section line, its imports dropped, and
 * `export` kept only on the names in `keep`.
 *
 * @param {string} file The module, relative to src/.
 * @param {ReadonlySet<string>} keep The names the script exports.
 * @returns {{ code: string, names: string[] }} The code, and the top-level names it declares.
 */
function inline(file, keep) {
	let s = fs.readFileSync(new URL(file, SRC), 'utf8');
	const doc = /^\/\*\*([\s\S]*?)\*\/\n/.exec(s);
	const title = doc ? doc[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '')).filter((l) => l && !l.startsWith('@module')).join(' ').split(/[.:](\s|$)/)[0] : file;
	if (doc) s = s.slice(doc[0].length);
	if (/^import \{[^}]* as /m.test(s)) throw new Error(`skill bundle: ${file} renames an import, which a single file can't keep`);
	s = s.replace(/^import [^\n]*\n/gm, '').replace(/^\n+/, '');
	const names = [];
	s = s.replace(/^export (const|function|async function|let) ([\w$]+)/gm, (m, kind, name) => { names.push(name); return keep.has(name) ? m : `${kind} ${name}`; });
	for (const m of s.matchAll(/^(?:const|function|async function|let) ([\w$]+)/gm)) if (!names.includes(m[1])) names.push(m[1]);
	return { code: `// ---------- ${title.trim()} (${file}) ----------\n\n${s.trimEnd()}\n`, names };
}

/**
 * Modules joined into one script; throws when two declare the same top-level name.
 *
 * @param {readonly string[]} files The modules.
 * @param {ReadonlySet<string>} keep The names the script exports.
 * @returns {string} The code.
 */
function join(files, keep) {
	const seen = new Map();
	return files.map((f) => {
		const { code, names } = inline(f, keep);
		for (const n of names) {
			if (seen.has(n)) throw new Error(`skill bundle: ${n} is declared in both ${seen.get(n)} and ${f}`);
			seen.set(n, f);
		}
		return code;
	}).join('\n');
}

/**
 * The skill's `kit.mjs`: the geometry kit as one file (every export of `@arraypress/marks-kit/geometry`).
 *
 * @returns {string} The script, `{{url}}` unfilled.
 */
export const bundleKit = () => KIT_HEADER + '\n' + join(KIT, new Set(Object.keys(geometry)));

/**
 * The skill's `fit.mjs`: the fit and the check as one script with no dependencies.
 *
 * @returns {string} The script, `{{url}}` unfilled.
 */
export const bundleFit = () => FIT_HEADER + '\n' + join(FIT, new Set()) + FIT_MAIN;

/**
 * Writes both scripts into a folder (the skill's `scripts/`).
 *
 * @param {string} dir The folder.
 * @param {{ url?: string }} [o] A URL to fill `{{url}}` with (left as is by default).
 * @returns {string[]} The files written.
 */
export function writeSkillScripts(dir, { url } = {}) {
	const fill = (/** @type {string} */ s) => (url ? s.replaceAll('{{url}}', url) : s);
	fs.mkdirSync(dir, { recursive: true });
	const out = [[`${dir}/kit.mjs`, bundleKit()], [`${dir}/fit.mjs`, bundleFit()]];
	for (const [file, text] of out) fs.writeFileSync(file, fill(text));
	return out.map(([file]) => file);
}
