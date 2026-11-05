/**
 * The batch writer for generators drawn with the gap as a parameter (Node only: it writes files).
 */
import fs from 'node:fs';
import path from 'node:path';
import { seeded, toPath } from '../geometry/index.js';
import { exact } from './frame.js';

/** Writes a batch: every mark in `M` ({ name: { trade, style, fn(g) } }) drawn with exact() so its gap is 22 once fitted,
 * seeded per mark (a re-run is byte-identical); `node genbatchN.mjs <workdir> ["Name,Name" | "fam:Industry · Law"]`. */
export const runIndustry = (batch, M) => {
  const [S, only = ''] = process.argv.slice(2), OUT = path.join(S, `newraw${batch}`), slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  fs.mkdirSync(OUT, { recursive: true }); let n = 0;
  for (const [name, { trade, fn }] of Object.entries(M)) {
    if (only.startsWith('fam:') ? 'Industry · ' + trade !== only.slice(4) : only && !only.split(',').includes(name)) continue;
    try { const s = exact(fn, () => { Math.random = seeded(name); });
      fs.writeFileSync(path.join(OUT, slug(name) + '.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path fill-rule="evenodd" d="${toPath(s)}"/></svg>\n`); n++; }
    catch (e) { console.log('FAIL', name, e.message.slice(0, 160)); } }
  const map = (f) => JSON.stringify(Object.fromEntries(Object.entries(M).map(([k, v]) => [slug(k), f(v)])), null, 1);
  fs.writeFileSync(path.join(OUT, '_names.json'), JSON.stringify(Object.keys(M))); // normalize.mjs finds a batch by this file
  fs.writeFileSync(path.join(OUT, '_families.json'), map((v) => 'Industry · ' + v.trade));
  fs.writeFileSync(path.join(OUT, '_styles.json'), map((v) => v.style));
  console.log('built', n, 'of', Object.keys(M).length); };
