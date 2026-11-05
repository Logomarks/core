/**
 * @module @arraypress/marks-kit/edit/reshape
 *
 * Weight and Soften: shape edits that change the mark's outline itself, so downloads stay clean filled paths.
 *
 * - Weight grows (or thins) every edge by the same amount, with crisp mitred corners; the gaps between parts
 *   stay as designed.
 * - Soften rounds the corners: each part by as much as it can take without losing a piece.
 * - Gap widens or tightens the space between parts, moving only the edges that face each other.
 *
 * The outline is flattened to polygons (curves and arcs sampled finely) and offset with Clipper, loaded the
 * first time it's needed (clipper-lib, an optional peer). Results are cached, since every card draws the mark.
 */
import { parsePath, arcOf } from '../svg/path.js';
let CL = null;
/** Loads the clipper (once). Shape edits are skipped until it's ready. */
export async function loadShaper() {
	if (!CL) {
		const mod = await import('clipper-lib');
		CL = mod.default ?? mod;
	}
	return CL;
}
export const shaperReady = () => !!CL;
const SCALE = 100; // Clipper works in integers: 0.01 of a unit
/** One path's outline as polygons (each sub-path a ring), in absolute 512-canvas units. */
function flatten(d) {
	const rings = [];
	let ring = [], x = 0, y = 0;
	const add = (px, py) => ring.push({ X: Math.round(px * SCALE), Y: Math.round(py * SCALE) });
	for (const s of parsePath(d)) {
		const c = s[0], n = s.slice(1);
		if (c === 'M') {
			if (ring.length > 2)
				rings.push(ring);
			ring = [];
			[x, y] = n;
			add(x, y);
		}
		else if (c === 'L') {
			[x, y] = n;
			add(x, y);
		}
		else if (c === 'C') {
			for (let i = 1; i <= 16; i++) {
				const t = i / 16, u = 1 - t;
				add(u * u * u * x + 3 * u * u * t * n[0] + 3 * u * t * t * n[2] + t * t * t * n[4], u * u * u * y + 3 * u * u * t * n[1] + 3 * u * t * t * n[3] + t * t * t * n[5]);
			}
			[x, y] = [n[4], n[5]];
		}
		else if (c === 'Q') {
			for (let i = 1; i <= 12; i++) {
				const t = i / 12, u = 1 - t;
				add(u * u * x + 2 * u * t * n[0] + t * t * n[2], u * u * y + 2 * u * t * n[1] + t * t * n[3]);
			}
			[x, y] = [n[2], n[3]];
		}
		else if (c === 'A') {
			for (const p of arcPoints(x, y, n[0], n[1], n[2], !!n[3], !!n[4], n[5], n[6]))
				add(p[0], p[1]);
			[x, y] = [n[5], n[6]];
		}
		else if (c === 'Z') {
			if (ring.length > 2)
				rings.push(ring);
			ring = [];
		}
	}
	if (ring.length > 2)
		rings.push(ring);
	return rings;
}
/** Points along an SVG arc (in centre form, svg/path's arcOf), about every 5°. */
function arcPoints(x1, y1, rx, ry, deg, large, sweep, x2, y2) {
	const a = arcOf(x1, y1, [rx, ry, deg, large, sweep, x2, y2]);
	if (!a) return [[x2, y2]];
	const steps = Math.max(2, Math.ceil(Math.abs(a.sweep) / (Math.PI / 36)));
	const out = [];
	for (let i = 1; i <= steps; i++) {
		const t = a.start + (a.sweep * i) / steps;
		out.push([a.cx + a.rx * Math.cos(t) * a.cos - a.ry * Math.sin(t) * a.sin, a.cy + a.rx * Math.cos(t) * a.sin + a.ry * Math.sin(t) * a.cos]);
	}
	return out;
}
function offset(paths, delta, round) {
	const co = new CL.ClipperOffset(1.6, 0.15 * SCALE);
	co.AddPaths(paths, round ? CL.JoinType.jtRound : CL.JoinType.jtMiter, CL.EndType.etClosedPolygon);
	const out = new CL.Paths();
	co.Execute(out, delta * SCALE);
	return out;
}
const NZ = () => CL.PolyFillType.pftNonZero;
const area = (paths) => paths.reduce((a, p) => a + CL.Clipper.Area(p), 0);
/** A boolean op on two sets of outlines (nonzero). */
function bool(type, a, b = []) {
	const c = new CL.Clipper();
	c.AddPaths(a, CL.PolyType.ptSubject, true);
	if (b.length)
		c.AddPaths(b, CL.PolyType.ptClip, true);
	const out = new CL.Paths();
	c.Execute(type === 'union' ? CL.ClipType.ctUnion : type === 'diff' ? CL.ClipType.ctDifference : CL.ClipType.ctIntersection, out, NZ(), NZ());
	return out;
}
/** The outline split into its separate parts: each an outer ring with its holes (islands inside holes are parts too). */
function splitParts(shape) {
	const c = new CL.Clipper();
	c.AddPaths(shape, CL.PolyType.ptSubject, true);
	const tree = new CL.PolyTree();
	c.Execute(CL.ClipType.ctUnion, tree, NZ(), NZ());
	const parts = [];
		const walk = (node) => {
		for (const outer of node.Childs()) {
			const holes = outer.Childs();
			parts.push([outer.Contour(), ...holes.map((h) => h.Contour())]);
			for (const h of holes)
				walk(h);
		}
	};
	walk(tree);
	return parts;
}
const boxOf = (part) => {
	const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
	for (const r of part)
		for (const p of r) {
			b.x0 = Math.min(b.x0, p.X);
			b.y0 = Math.min(b.y0, p.Y);
			b.x1 = Math.max(b.x1, p.X);
			b.y1 = Math.max(b.y1, p.Y);
		}
	return b;
};
const boxGap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
/** The shortest distance between two parts' outlines (every vertex against every edge, both ways), in Clipper units. */
function partDistance(a, b) {
	let best = Infinity;
	const segDist = (p, s, e) => {
		const dx = e.X - s.X, dy = e.Y - s.Y, l = dx * dx + dy * dy;
		const t = l ? Math.max(0, Math.min(1, ((p.X - s.X) * dx + (p.Y - s.Y) * dy) / l)) : 0;
		return Math.hypot(p.X - s.X - t * dx, p.Y - s.Y - t * dy);
	};
	for (const [A, B] of [
		[a, b],
		[b, a],
	])
		for (const ra of A)
			for (const p of ra)
				for (const rb of B)
					for (let i = 0; i < rb.length; i++) {
						const d = segDist(p, rb[i], rb[(i + 1) % rb.length]);
						if (d < best)
							best = d;
					}
	return best;
}
const prepCache = new Map();
const REACH = 70 * SCALE; // parts further apart than this never affect each other
function prepare(key, shape) {
	const hit = prepCache.get(key);
	if (hit)
		return hit;
	const parts = splitParts(shape);
	const round = parts.map((part) => {
		const ok = (r) => offset(offset(part, -r, true), r, true).length === part.length;
		if (ok(40))
			return 40;
		let lo = 0, hi = 40;
		for (let i = 0; i < 8; i++) {
			const mid = (lo + hi) / 2;
			if (ok(mid))
				lo = mid;
			else
				hi = mid;
		}
		return lo * 0.9;
	});
	// how bold each part can go before a counter (a hole) closes or pinches shut
	const bold = parts.map((part) => {
		const a0 = Math.abs(area(part));
		// no counter closes, and no slot or notch fills (growing then shrinking back adds next to nothing)
		const ok = (r) => offset(part, r, false).length === part.length && Math.abs(area(offset(offset(part, r, true), -r, true))) - a0 < a0 * 0.015;
		if (ok(16))
			return Infinity;
		let lo = 0, hi = 16;
		for (let i = 0; i < 7; i++) {
			const mid = (lo + hi) / 2;
			if (ok(mid))
				lo = mid;
			else
				hi = mid;
		}
		return lo * 0.7;
	});
	const boxes = parts.map(boxOf), pairs = [];
	for (let i = 0; i < parts.length; i++)
		for (let j = i + 1; j < parts.length; j++)
			if (boxGap(boxes[i], boxes[j]) < REACH) {
				const d = partDistance(parts[i], parts[j]);
				if (d < REACH)
					pairs.push({ i, j, d: d / SCALE });
			}
	const out = { parts, round, bold, pairs };
	if (prepCache.size > 40)
		prepCache.delete(prepCache.keys().next().value);
	prepCache.set(key, out);
	return out;
}
/** A turn sharper than this is a corner; gentler turns are the samples of a curve, which are left alone. */
const CORNER = (20 * Math.PI) / 180;
function cornersOf(pts) {
	const n = pts.length, out = [];
	for (let i = 0; i < n; i++) {
		const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
		const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1];
		const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
		if (!lu || !lv)
			continue;
		const phi = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv))));
		if (phi > CORNER)
			out.push({ i, phi });
	}
	return out;
}
/**
 * Rounds every corner of a ring, the way a design tool's corner radius does: each corner gets a smooth curve
 * that starts r·tan(turn/2) back along each edge, but never more than half of either edge (shared with the next
 * corner). So a sharp spike gets a rounded tip rather than vanishing, and curves stay as they are.
 */
function roundRing(ring, r) {
	const n = ring.length;
	if (n < 3 || r <= 0)
		return ring;
	const pts = ring.map((p) => [p.X, p.Y]);
	const corners = cornersOf(pts);
	if (!corners.length)
		return ring;
	const s = [0];
	for (let i = 1; i <= n; i++)
		s[i] = s[i - 1] + Math.hypot(pts[i % n][0] - pts[i - 1][0], pts[i % n][1] - pts[i - 1][1]);
	const L = s[n], m = corners.length;
	const span = (a, b) => (s[b] - s[a] + L) % L || L; // arc length from vertex a forward to b
	const t = corners.map((c, k) => Math.min(r * Math.tan(Math.min(c.phi, 3.0) / 2), span(corners[(k - 1 + m) % m].i, c.i) / 2, span(c.i, corners[(k + 1) % m].i) / 2));
	const at = (pos) => {
		pos = ((pos % L) + L) % L;
		let j = 0;
		while (j < n - 1 && s[j + 1] <= pos)
			j++;
		const seg = s[j + 1] - s[j] || 1, f = (pos - s[j]) / seg;
		const a = pts[j], b = pts[(j + 1) % n];
		return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
	};
	const out = [];
	const push = (x, y) => out.push({ X: Math.round(x), Y: Math.round(y) });
	corners.forEach((c, k) => {
		const tk = t[k], p = pts[c.i];
		const a = at(s[c.i] - tk), b = at(s[c.i] + tk);
		const steps = Math.max(3, Math.ceil(c.phi / 0.17));
		for (let q = 0; q <= steps; q++) {
			const u = q / steps, v = 1 - u;
			push(v * v * a[0] + 2 * v * u * p[0] + u * u * b[0], v * v * a[1] + 2 * v * u * p[1] + u * u * b[1]);
		}
		// the original points between this corner's curve and the next one's
		const next = corners[(k + 1) % m], gap = span(c.i, next.i), tn = t[(k + 1) % m];
		for (let j = (c.i + 1) % n; j !== next.i; j = (j + 1) % n) {
			const rel = (s[j] - s[c.i] + L) % L;
			if (rel > tk && rel < gap - tn)
				push(pts[j][0], pts[j][1]);
		}
	});
	return out;
}
/** Whether Soften can change this mark at all (marks of circles and smooth curves have no corners to round). */
export function hasCorners(paths) {
	for (const [, attrs] of paths.matchAll(/<path([^>]*)>/g)) {
		const d = /\sd="([^"]+)"/.exec(attrs)?.[1];
		if (d && flatten(d).some((ring) => cornersOf(ring.map((p) => [p.X, p.Y])).length))
			return true;
	}
	return false;
}
/** The closest gap the Gap slider can tighten to: parts never touch. */
const MIN_GAP = 4;
const cache = new Map();
/**
 * The mark's paths with weight (512-canvas units: + bolder, − thinner), softening (a corner radius) and gap
 * (units added to, or taken from, the space between parts) applied, as one nonzero <path>. Null when the clipper
 * isn't loaded yet, or nothing changes.
 *
 * Every part is edited on its own, then trimmed against its neighbours: bolder never closes a gap (the spacing
 * stays as designed), rounding never erases a thin part, and the gap moves only the edges that face each other.
 */
export function reshape(paths, weight, soften, gap = 0, detail = 0) {
	if (!CL || (!weight && !soften && !gap && !detail))
		return null;
	const key = `${weight}|${soften}|${gap}|${detail}|${paths}`;
	if (cache.has(key))
		return cache.get(key);
	// Each <path> with its own fill rule, merged into one clean outline.
	let all = [];
	for (const [, attrs] of paths.matchAll(/<path([^>]*)>/g)) {
		const d = /\sd="([^"]+)"/.exec(attrs)?.[1];
		if (!d)
			continue;
		const evenodd = /fill-rule="evenodd"/.test(attrs);
		const c = new CL.Clipper();
		c.AddPaths(flatten(d), CL.PolyType.ptSubject, true);
		const sol = new CL.Paths();
		const ft = evenodd ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero;
		c.Execute(CL.ClipType.ctUnion, sol, ft, ft);
		all = all.concat(sol);
	}
	const prep = prepare(paths, bool('union', all));
	// 0. Less detail: the smallest features go first — small parts dropped, small holes filled — up to everything
	//    under 12% of the biggest part's area at the far end. The biggest part always stays.
	let parts = prep.parts;
	if (detail < 0) {
		const sizes = parts.map((p) => Math.abs(CL.Clipper.Area(p[0])));
		const cut = Math.max(...sizes) * 0.12 * -detail;
		parts = parts.map((p, i) => (sizes[i] < cut ? [] : [p[0], ...p.slice(1).filter((h) => Math.abs(CL.Clipper.Area(h)) >= cut)]));
	}
	// 1. Soften: every corner of every part rounded (outer and inner), each by as much as its edges allow.
	const soft = parts.map((part) => soften > 0.2
		? bool('union', CL.Clipper.CleanPolygons(part, 0.05 * SCALE).map((ring) => roundRing(ring, soften * SCALE)))
		: part);
	// 2. Weight: bolder grows every part with crisp corners; thinner stops at about half the part's stroke.
	const grown = soft.map((p, i) => {
		if (!p.length)
			return p;
		const w = weight < 0 ? Math.max(weight, -prep.round[i] * 0.5) : Math.min(weight, prep.bold[i]);
		return Math.abs(w) > 0.1 ? offset(p, w, false) : p;
	});
	// 3. Gaps: each pair of neighbours ends up `target` apart (as designed, plus the Gap slider, never tighter
	//    than MIN_GAP). A part keeps only the points at least `target` nearer to itself than to its neighbour, so
	//    the cut runs along the line halfway between them and ends stay convex, rather than taking a bite the
	//    shape of the neighbour.
	const out = grown.map((p) => p);
	const offs = new Map();
	const off = (k, r, round) => {
		const key = `${k}|${r.toFixed(2)}|${round}`;
		let v = offs.get(key);
		if (!v)
			offs.set(key, (v = r ? offset(soft[k], r, round) : soft[k]));
		return v;
	};
	const W = Math.max(weight, 0);
	if (W > 0 || gap)
		for (const { i, j, d } of prep.pairs) {
			if (!soft[i].length || !soft[j].length)
				continue;
			const target = Math.max(d + gap, Math.min(d, MIN_GAP));
			const reach = (d - target) / 2; // > 0 closer, < 0 further apart
			const R = Math.max(W, reach, 0), R0 = Math.min(0, reach); // inside the part when widening: depth counts as negative distance
			if (R + target < d - 0.1)
				continue; // never meet: nothing to do
			for (const [a, b] of [
				[i, j],
				[j, i],
			]) {
				// tighter than the weight alone: grow this part towards that one, where they face
				if (reach > W + 0.1)
					out[a] = bool('union', out[a], bool('inter', off(a, reach, true), off(b, d + reach, true)));
				// the points this part may keep: those at signed distance r from it (negative inside) and more than
				// r + target from the neighbour, for r stepping from R0 to R. The steps leave fine teeth along the
				// cut, so the forbidden region is smoothed before it's taken away.
				const n = Math.min(12, Math.max(1, Math.ceil((R - R0) / 1.2)));
				let keep = [];
				for (let k = 0; k <= n; k++) {
					const r = R0 + ((R - R0) * k) / n;
					if (r + target <= 0)
						continue;
					keep = keep.concat(bool('diff', off(a, r, false), off(b, r + target, true)));
				}
				const step = (R - R0) / n;
				let forbid = bool('diff', off(b, R + target, true), keep);
				if (step > 0.2)
					forbid = offset(offset(forbid, -step, true), step, true);
				out[a] = bool('diff', out[a], forbid);
			}
		}
	let shape = bool('union', out.flat());
	// 4. More detail: inline channels, the classic way to add detail — a thin line cut inside every part thick
	//    enough to hold it (one, then a second further in), following the outline.
	if (detail > 0) {
		const lines = detail > 0.5 ? 2 : 1, c = 3 + 2.5 * (detail > 0.5 ? detail - 0.5 : detail) * 2; // channel width grows within each step
		for (let k = 0; k < lines; k++) {
			const inset = 10 + k * (c + 10);
			const ring = bool('diff', offset(shape, -inset, false), offset(shape, -inset - c, false));
			// only where a solid core is left inside the channel, so thin strokes stay whole
			const core = offset(offset(shape, -inset - c - 4, true), inset + c + 4, true);
			shape = bool('diff', shape, bool('inter', ring, core));
		}
	}
	shape = CL.Clipper.CleanPolygons(shape, 0.05 * SCALE);
	const r = (v) => Math.round((v / SCALE) * 10) / 10;
	const d = shape
		.filter((p) => p.length > 2)
		.map((p) => 'M' + p.map((q) => `${r(q.X)} ${r(q.Y)}`).join('L') + 'Z')
		.join('');
	const res = d ? `<path d="${d}"/>` : null;
	if (cache.size > 80)
		cache.delete(cache.keys().next().value);
	cache.set(key, res);
	return res;
}
/** How many separate pieces the mark is made of (Gap needs at least two). Null until the clipper has loaded. */
export function pieceCount(paths) {
	if (!CL)
		return null;
	let all = [];
	for (const [, attrs] of paths.matchAll(/<path([^>]*)>/g)) {
		const d = /\sd="([^"]+)"/.exec(attrs)?.[1];
		if (!d)
			continue;
		const c = new CL.Clipper();
		c.AddPaths(flatten(d), CL.PolyType.ptSubject, true);
		const sol = new CL.Paths();
		const ft = /fill-rule="evenodd"/.test(attrs) ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero;
		c.Execute(CL.ClipType.ctUnion, sol, ft, ft);
		all = all.concat(sol);
	}
	return splitParts(bool('union', all)).length;
}
/** For tests and tooling: a mark's parts, rounding limits and neighbour gaps. */
export function shapeInfo(paths) {
	if (!CL)
		return null;
	reshape(paths, 0, 0.0001);
	const p = prepCache.get(paths);
	return (p && { parts: p.parts.length, round: p.round.map((r) => Math.round(r * 10) / 10), gaps: p.pairs.map((q) => Math.round(q.d * 10) / 10) });
}
/**
 * How well a mark survives at favicon size, and what would help. At 16 px a favicon's 480-unit canvas is 30 units a
 * pixel: strokes thinner than ~1.5 px blur, gaps narrower than ~1.2 px close up, and tiny parts vanish. From the
 * mark's parts: its thinnest stroke (about twice the most it can be rounded without losing a piece) and its
 * narrowest gap; and the Weight, Gap and Detail that would bring them up to size.
 */
export function smallSizeInfo(paths) {
	if (!CL)
		return null;
	reshape(paths, 0, 0.0001);
	const p = prepCache.get(paths);
	if (!p)
		return null;
	const stroke = Math.min(80, ...p.round.map((r) => (r * 2) / 0.9));
	const gap = p.pairs.length ? Math.min(...p.pairs.map((q) => q.d)) : Infinity;
	const areas = p.parts.map((part) => Math.abs(CL.Clipper.Area(part[0])));
	const tiny = areas.some((a) => a < Math.max(...areas) * 0.03);
	const grade = stroke >= 44 && gap >= 36 && !tiny ? 'crisp' : stroke >= 28 && gap >= 24 ? 'ok' : 'thin';
	return {
		grade: grade,
		stroke: Math.round(stroke),
		gap: Number.isFinite(gap) ? Math.round(gap) : null,
		/** Shape settings for a small-size version (all zero when it's already crisp). */
		fix: grade === 'crisp'
			? null
			: {
				weight: Math.min(8, Math.max(0, (46 - stroke) / 2)),
				// widening gaps takes from the parts, so only when they're thick enough to spare it (dots shrink)
				gap: Number.isFinite(gap) && stroke >= 56 ? Math.min(20, Math.max(0, 40 - gap)) : 0,
				detail: tiny ? -0.5 : 0,
			},
	};
}
