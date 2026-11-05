/**
 * Lines with width: strokes (fixed or variable width), over-under weaving, parallel tracks, fillets, turtle walks,
 * balloon strokes, and points along lines and arcs.
 */
import { polar, poly, sample } from './core.js';
import { U, D } from './booleans.js';
import { circle } from './shapes.js';

// Offsets of a polyline with miter joins; w may be a number or (i)=>width.
function offsets(pts, w, closed) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    let n1 = i === 0 && !closed ? null : norm(sub(p, a)), n2 = i === n - 1 && !closed ? null : norm(sub(b, p));
    if (!n1) n1 = n2; if (!n2) n2 = n1;
    const t1 = [-n1[1], n1[0]], t2 = [-n2[1], n2[0]];
    let m = [t1[0] + t2[0], t1[1] + t2[1]]; const ml = Math.hypot(...m) || 1; m = [m[0] / ml, m[1] / ml];
    const cosh = Math.max(0.25, m[0] * t1[0] + m[1] * t1[1]);
    const hw = (typeof w === 'function' ? w(i, n) : w) / 2 / cosh;
    L.push([p[0] + m[0] * hw, p[1] + m[1] * hw]); R.push([p[0] - m[0] * hw, p[1] - m[1] * hw]);
  }
  return { L, R };
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const norm = v => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; };
// Stroke a polyline into a union of short simple chunks (safe for self-crossing curves).
export function stroke(pts, w, { closed = false, chunk = 16, roundCaps = false } = {}) {
  const { L, R } = offsets(pts, w, closed), n = pts.length, parts = [];
  const last = closed ? n : n - 1;
  for (let s = 0; s < last; s += chunk) {
    const e = Math.min(s + chunk, last), idx = [];
    for (let i = s; i <= e; i++) idx.push(i % n);
    parts.push(poly([...idx.map(i => L[i]), ...idx.slice().reverse().map(i => R[i])]));
  }
  let g = U(...parts);
  if (roundCaps && !closed) { const w0 = typeof w === 'function' ? w(0, n) : w, w1 = typeof w === 'function' ? w(n - 1, n) : w;
    g = U(g, circle(...pts[0], w0 / 2), circle(...pts[n - 1], w1 / 2)); }
  return g;
}

// Over-under weaving. strands: [{ pts, closed, z?: (i)=>depth }]. Alternates over/under along each strand unless z given.
export function weave(strands, w, gap, { overLen = 1.7 } = {}) {
  const segs = [];
  strands.forEach((s, si) => { const n = s.pts.length, m = s.closed ? n : n - 1;
    for (let i = 0; i < m; i++) segs.push({ si, i, a: s.pts[i], b: s.pts[(i + 1) % n] }); });
  const X = [];
  for (let p = 0; p < segs.length; p++) for (let q = p + 1; q < segs.length; q++) {
    const A = segs[p], B = segs[q];
    if (A.si === B.si) { const n = strands[A.si].pts.length; let d = Math.abs(A.i - B.i); if (strands[A.si].closed) d = Math.min(d, n - d); if (d < 3) continue; }
    const r = segHit(A.a, A.b, B.a, B.b); if (!r) continue;
    const pt = [A.a[0] + (A.b[0] - A.a[0]) * r[0], A.a[1] + (A.b[1] - A.a[1]) * r[0]];
    if (X.some(x => Math.hypot(x.pt[0] - pt[0], x.pt[1] - pt[1]) < 1)) continue;
    X.push({ pt, e: [{ si: A.si, i: A.i + r[0] }, { si: B.si, i: B.i + r[1] }] });
  }
  if (process.env.WEAVE_DEBUG) console.log('crossings', X.length);
  // decide over
  const ev = strands.map(() => []);
  X.forEach((x, xi) => x.e.forEach((e, k) => ev[e.si].push({ xi, k, i: e.i })));
  X.forEach(x => x.over = null);
  strands.forEach((s, si) => {
    if (s.z) return;
    const list = ev[si].sort((a, b) => a.i - b.i); let parity = 0;
    const firstSet = list.findIndex(e => X[e.xi].over !== null);
    if (firstSet >= 0) { const e = list[firstSet]; parity = ((X[e.xi].over === e.k) ? 0 : 1) - (firstSet % 2); parity = ((parity % 2) + 2) % 2; }
    list.forEach((e, j) => { const isOver = (j + parity) % 2 === 0; if (X[e.xi].over === null) X[e.xi].over = isOver ? e.k : 1 - e.k; });
  });
  X.forEach(x => { if (x.over !== null) return; const [e0, e1] = x.e;
    const z0 = strands[e0.si].z(e0.i), z1 = strands[e1.si].z(e1.i); x.over = z0 >= z1 ? 0 : 1; });
  // build
  const bands = strands.map(s => stroke(s.pts, w, { closed: s.closed }));
  const win = (s, i, half, width) => { const n = s.pts.length;
    let acc = 0, j = Math.floor(i); const back = [], fwd = [];
    for (let k = j; acc < half; k--) { const kk = s.closed ? (k + n) % n : k; if (kk < 0) break; back.unshift(s.pts[kk]);
      if (back.length > 1) acc += Math.hypot(back[0][0] - back[1][0], back[0][1] - back[1][1]); if (back.length > n) break; }
    acc = 0;
    for (let k = j + 1; acc < half; k++) { const kk = s.closed ? k % n : k; if (kk >= n) break; fwd.push(s.pts[kk]);
      const pr = fwd.length > 1 ? fwd[fwd.length - 2] : back[back.length - 1]; acc += Math.hypot(fwd[fwd.length - 1][0] - pr[0], fwd[fwd.length - 1][1] - pr[1]); if (fwd.length > n) break; }
    return stroke([...back, ...fwd], width, { chunk: 8 }); };
  const fats = [], thins = [];
  X.forEach(x => { const o = x.e[x.over], s = strands[o.si];
    fats.push(win(s, o.i, w * overLen + gap, w + 2 * gap)); thins.push(win(s, o.i, w * overLen + gap * 1.5, w)); });
  let g = U(...bands);
  if (fats.length) g = D(g, ...fats);
  if (thins.length) g = U(g, ...thins);
  return g;
}
function segHit(p, p2, q, q2) {
  const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]], d = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(d) < 1e-9) return null;
  const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / d, u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / d;
  return t >= 0 && t < 1 && u >= 0 && u < 1 ? [t, u] : null;
}

/* ---------- Track: a centreline as parallel tracks ---------- */
/** Points offset sideways by d along their normals. */
export const offsetPts = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - (dy / L) * d, p[1] + (dx / L) * d]; });
/** A polyline with every inner corner rounded by a true circular fillet of radius r, densified (batch 37). */
export const fillet = (pts, r) => { const out = [pts[0]], rs = Array.isArray(r) ? r : pts.map(() => r);
  for (let i = 1; i < pts.length - 1; i++) { const [A, B, Cc] = [pts[i - 1], pts[i], pts[i + 1]];
    const u1 = [A[0] - B[0], A[1] - B[1]], u2 = [Cc[0] - B[0], Cc[1] - B[1]], l1 = Math.hypot(...u1), l2 = Math.hypot(...u2);
    u1[0] /= l1; u1[1] /= l1; u2[0] /= l2; u2[1] /= l2;
    const th = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    if (Math.abs(th - Math.PI) < 1e-3 || !rs[i]) { out.push(B); continue; }
    const t = Math.min(rs[i] / Math.tan(th / 2), l1 * 0.5, l2 * 0.5), rr_ = t * Math.tan(th / 2);
    const P1 = [B[0] + u1[0] * t, B[1] + u1[1] * t], P2 = [B[0] + u2[0] * t, B[1] + u2[1] * t], bis = [u1[0] + u2[0], u1[1] + u2[1]], bl = Math.hypot(...bis);
    const cen = [B[0] + (bis[0] / bl) * (rr_ / Math.sin(th / 2)), B[1] + (bis[1] / bl) * (rr_ / Math.sin(th / 2))];
    let a0 = Math.atan2(P1[1] - cen[1], P1[0] - cen[0]), a1 = Math.atan2(P2[1] - cen[1], P2[0] - cen[0]);
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
    for (let k = 0; k <= 24; k++) { const a = a0 + ((a1 - a0) * k) / 24; out.push([cen[0] + rr_ * Math.cos(a), cen[1] + rr_ * Math.sin(a)]); } }
  out.push(pts[pts.length - 1]);
  const dense = [out[0]]; for (let i = 1; i < out.length; i++) { const [a, b] = [out[i - 1], out[i]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8)); if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue; for (let k = 1; k <= n; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); }
  return dense; };
/** n tracks along a centreline, `pitch` apart, each `w` wide with round ends. */
export const tracks = (pts, { n = 2, pitch = 44, w = 22, closed = false } = {}) => U(...[...Array(n)].map((_, i) => stroke(offsetPts(pts, (i - (n - 1) / 2) * pitch), w, { roundCaps: !closed, closed, chunk: 12 })));
/** A closed polygon with every corner filleted (radius r, or one per corner), densely sampled (batches 47, 63, 90). Start the
    list in the middle of a long side, never on a collinear point (the fillet would divide by tan 90°). */
export const filletClosed = (pts, r) => { const n = pts.length, out = [];
  for (let i = 0; i < n; i++) { const A = pts[(i - 1 + n) % n], B = pts[i], Cc = pts[(i + 1) % n], rr_ = Array.isArray(r) ? r[i] : r;
    const u1 = [A[0] - B[0], A[1] - B[1]], u2 = [Cc[0] - B[0], Cc[1] - B[1]], l1 = Math.hypot(...u1), l2 = Math.hypot(...u2); u1[0] /= l1; u1[1] /= l1; u2[0] /= l2; u2[1] /= l2;
    const th = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))), t = Math.min(rr_ / Math.tan(th / 2), l1 * 0.48, l2 * 0.48), rad = t * Math.tan(th / 2);
    const P1 = [B[0] + u1[0] * t, B[1] + u1[1] * t], P2 = [B[0] + u2[0] * t, B[1] + u2[1] * t], bis = [u1[0] + u2[0], u1[1] + u2[1]], bl = Math.hypot(...bis);
    const cen = [B[0] + (bis[0] / bl) * (rad / Math.sin(th / 2)), B[1] + (bis[1] / bl) * (rad / Math.sin(th / 2))];
    let a0 = Math.atan2(P1[1] - cen[1], P1[0] - cen[0]), a1 = Math.atan2(P2[1] - cen[1], P2[0] - cen[0]);
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
    for (let k = 0; k <= 24; k++) { const a = a0 + ((a1 - a0) * k) / 24; out.push([cen[0] + rad * Math.cos(a), cen[1] + rad * Math.sin(a)]); } }
  const dense = []; for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 10)); for (let k = 0; k < m; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / m, a[1] + ((b[1] - a[1]) * k) / m]); }
  return dense.filter((p, i) => Math.hypot(p[0] - dense[(i + 1) % dense.length][0], p[1] - dense[(i + 1) % dense.length][1]) > 1e-6); };
/** Three (n) tracks round a closed outline, offset with wrap-around normals (tracks() is for open lines). Track animals: pitch 42. */
export const trackLoop = (pts, { n = 3, pitch = 42, w = 22 } = {}) => { const off = (d) => pts.map((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - (dy / L) * d, p[1] + (dx / L) * d]; });
  return U(...[...Array(n)].map((_, i) => stroke(off((i - (n - 1) / 2) * pitch), w, { closed: true, chunk: 12 }))); };
/** A path drawn like a turtle: from `at`, heading `deg` (0 = right, 90 = down), through steps ['L', length] and ['A', turn°, radius]
    (a positive turn is clockwise on screen). Arcs have exact radii, so a turn of radius 64+ always leaves three tracks room. */
export const walk = (at, deg, steps) => { let [x, y] = at, h = deg; const out = [[x, y]];
  for (const [k, a, r] of steps) { const n = k === 'L' ? Math.max(2, Math.ceil(a / 8)) : Math.max(4, Math.ceil(Math.abs(a) / 3));
    for (let i = 1; i <= n; i++) { if (k === 'L') { const t = (h * Math.PI) / 180; out.push([x + Math.cos(t) * (a * i) / n, y + Math.sin(t) * (a * i) / n]); continue; }
      const s = Math.sign(a), c = ((h + s * 90) * Math.PI) / 180, cx = x + r * Math.cos(c), cy = y + r * Math.sin(c), b = ((h - s * 90 + (a * i) / n) * Math.PI) / 180; out.push([cx + r * Math.cos(b), cy + r * Math.sin(b)]); }
    [x, y] = out.at(-1); if (k === 'A') h += a; }
  return out; };

/* ---------- Inflated: balloon strokes (batch 44) ---------- */
/** A balloon: a stroke along pts, w0 wide at its ends and w1 at its middle, with round ends. */
export const balloon = (pts, w0 = 100, w1 = 134) => { const n = pts.length;
  const body = (q) => { const m = q.length; return stroke(q, (i) => w0 + (w1 - w0) * Math.sin((Math.PI * i) / (m - 1)) ** 0.5, { chunk: 10 }); };
  let b; try { b = body(pts); } catch (e) { b = body(pts.filter((_, i) => i !== n - 2)); } // polygon-clipping can call an evenly spaced straight run degenerate: drop a point
  return U(b, circle(...pts[0], w0 / 2, 64), circle(...pts[n - 1], w0 / 2, 64)); };

/* ---------- points along lines and arcs ---------- */
export const linePts = (a, b, n = 30) => sample((t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0, 1, n);
export const arcPts = (cx, cy, r, a0, a1, n = 60) => sample((t) => polar(r, t, cx, cy), a0, a1, n);
export const joinPts = (...parts) => parts.flatMap((p, i) => (i ? p.slice(1) : p));
