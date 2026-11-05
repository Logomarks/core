/**
 * @module @arraypress/marks-kit/edit/pixelate
 *
 * Pixelate: the mark redrawn on a square grid, as clean pixel art.
 *
 * - The grid is centred on the mark and sized to its longest side (48 cells across at the lightest, 14 at the
 *   coarsest), so symmetric marks stay symmetric and the pixels line up with the mark's edges.
 * - Each cell is measured, not point-sampled: the mark is drawn at 6×6 samples a cell and a cell is filled when the
 *   mark covers at least half of it.
 * - A second pass keeps what a plain threshold loses: a cell covered at least a fifth is filled too when it stands
 *   alone (a thin line or a small dot would vanish) or when it bridges two filled cells across it (a diagonal would
 *   break into steps that don't touch).
 * - Filled cells are merged into as few rectangles as possible, so the SVG stays small and clean.
 */
/** Samples a cell is measured at, along each side (6 × 6 a cell). */
export const SS = 6;

/**
 * The pixel grid for a mark's box: 48 cells across its longest side at the lightest (amount 0), 14 at the coarsest
 * (amount 1), centred on the box.
 *
 * @param {number} amount 0–1.
 * @param {{ x: number, y: number, width: number, height: number }} box The mark's box.
 * @returns {import('./index.js').PixelGrid} The grid: columns, rows, cell size and top-left corner.
 */
export function pixelGrid(amount, box) {
	const n = Math.round(48 - amount * 34); // 48 cells across at the lightest, 14 at the coarsest
	const side = Math.max(box.width, box.height), cell = side / n;
	const cols = Math.max(1, Math.round(box.width / cell)), rows = Math.max(1, Math.round(box.height / cell));
	const x0 = box.x + box.width / 2 - (cols * cell) / 2, y0 = box.y + box.height / 2 - (rows * cell) / 2;
	return { cols, rows, cell, x0, y0 };
}

/**
 * The pixelated mark as one path's d, from how much of each cell the mark covers: cells covered half or more are
 * filled, cells covered a fifth or more too when they stand alone or bridge two filled cells, then merged into as few
 * rectangles as possible. Null when nothing is filled.
 *
 * @param {ArrayLike<number>} cov Coverage 0–1 per cell, row by row.
 * @param {import('./index.js').PixelGrid} grid The grid.
 * @returns {string | null} The path data.
 */
export function pixelPath(cov, { cols, rows, cell, x0, y0 }) {
	const at = (m, q, r) => (q >= 0 && r >= 0 && q < cols && r < rows ? m[r * cols + q] : 0);
	const on = new Uint8Array(cols * rows);
	for (let i = 0; i < on.length; i++)
		on[i] = cov[i] >= 0.5 ? 1 : 0;
	// keep thin lines and small dots, and bridge diagonals
	const keep = on.slice();
	for (let r = 0; r < rows; r++)
		for (let q = 0; q < cols; q++) {
			const i = r * cols + q;
			if (on[i] || cov[i] < 0.2)
				continue;
			let near = 0;
			for (let dy = -1; dy <= 1; dy++)
				for (let dx = -1; dx <= 1; dx++)
					if (dx || dy)
						near += at(on, q + dx, r + dy);
			const bridges = (at(on, q - 1, r) && at(on, q + 1, r)) ||
				(at(on, q, r - 1) && at(on, q, r + 1)) ||
				(at(on, q - 1, r - 1) && at(on, q + 1, r + 1)) ||
				(at(on, q + 1, r - 1) && at(on, q - 1, r + 1));
			if (!near || (bridges && cov[i] >= 0.3))
				keep[i] = 1;
		}
	const done = [];
	let open = new Map();
	for (let r = 0; r <= rows; r++) {
		const runs = [];
		if (r < rows)
			for (let q = 0; q < cols;) {
				if (!keep[r * cols + q]) {
					q++;
					continue;
				}
				let e = q;
				while (e < cols && keep[r * cols + e])
					e++;
				runs.push([q, e - q]);
				q = e;
			}
		const next = new Map();
		for (const [q, w] of runs) {
			const key = `${q}:${w}`;
			const o = open.get(key);
			if (o) {
				o.h++;
				next.set(key, o);
				open.delete(key);
			}
			else
				next.set(key, { q, r, w, h: 1 });
		}
		for (const o of open.values())
			done.push(o);
		open = next;
	}
	if (!done.length)
		return null;
	const f = (v) => Math.round(v * 100) / 100;
	// each rectangle overlaps its right and lower neighbours by a hair, so no seam shows where they meet
	const o = 0.35;
	return done.map((b) => `M${f(x0 + b.q * cell)} ${f(y0 + b.r * cell)}h${f(b.w * cell + o)}v${f(b.h * cell + o)}h${f(-b.w * cell - o)}Z`).join('');
}
