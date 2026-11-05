/**
 * Needle trimming for iso solids: where a round-ended gap meets a silhouette corner at a shallow angle, the face runs on
 * past the gap's end as a sliver about 1 wide; deneedle() cuts it off so the face ends square on the gap.
 */

/** Where line a–b meets line c–d. */
const meet = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den; return [a[0] + r[0] * t, a[1] + r[1] * t]; };
/** Cuts the needles off a shape. A needle is a corner sharper than `deg` with one edge shorter than `len`: where a round-ended
    gap meets a silhouette corner at a shallow angle (the hex solids' 60° corners), the face runs on past the gap's end as a
    sliver about 1 wide. The tip and the short edge's far end become one point, where the long edge into the tip meets the
    edge out of the short one, so the face ends square on the gap. */
export const deneedle = (shape, { deg = 12, len = 16 } = {}) => shape.map((pg) => pg.map((ring) => {
  const q = ring.slice(0, -1), d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]);
  for (let i = 0; i < q.length && q.length > 4; i++) { const n = q.length, w = (k) => q[(k + n) % n], v = q[i], a = w(i - 1), b = w(i + 1);
    const ang = Math.abs(Math.atan2((a[0] - v[0]) * (b[1] - v[1]) - (a[1] - v[1]) * (b[0] - v[0]), (a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1])));
    if (ang * 180 / Math.PI >= deg) continue;
    if (d(v, b) < len && d(v, a) >= len) { q[i] = meet(a, v, b, w(i + 2)); q.splice((i + 1) % n, 1); }
    else if (d(v, a) < len && d(v, b) >= len) { q[i] = meet(b, v, a, w(i - 2)); q.splice((i - 1 + n) % n, 1); } }
  return [...q, q[0]]; }));
