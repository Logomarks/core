// Shared by the tests: fixture marks (live Logomarks marks, CC0) and a small alpha rasteriser for synthetic images.
import fs from 'node:fs';

/** A fixture mark's SVG text. */
export const fixture = (/** @type {string} */ name) => fs.readFileSync(new URL(`fixtures/${name}.svg`, import.meta.url), 'utf8');

/** A square alpha image of side n, 1 where `inside(x, y)` (pixel centres, 0–1 coordinates). */
export function alpha(n, inside) {
	const a = new Float32Array(n * n);
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) a[y * n + x] = inside((x + 0.5) / n, (y + 0.5) / n) ? 1 : 0;
	return a;
}
