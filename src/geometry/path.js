/**
 * Shapes out: SVG path data (Douglas-Peucker simplified, one decimal), the SVG file, and writing it.
 */

// Douglas-Peucker on each ring, then path string (evenodd)
export function dp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b], L = Math.hypot(x2 - x1, y2 - y1) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((x2 - x1) * (y1 - pts[i][1]) - (x1 - pts[i][0]) * (y2 - y1)) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]);
}
export function toPath(mp, tol = 0.12) {
  return mp.map(pg => pg.map(ring => { let pts = ring.slice(0, -1); let far = 0, fd = -1;
    pts.forEach((q, i) => { const d = Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1]); if (d > fd) { fd = d; far = i; } });
    pts = [...dp(pts.slice(0, far + 1), tol).slice(0, -1), ...dp([...pts.slice(far), pts[0]], tol).slice(0, -1)];
    return pts.length < 3 ? '' : 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z'; }).join('')).join('');
}


/** The SVG file for a shape (any size; run scripts/fit.mjs to fit it to the standard). */
export const svg = (shape) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path fill-rule="evenodd" d="${toPath(shape)}"/></svg>\n`;

/** Writes a shape to an SVG file. */
export async function write(file, shape) {
  const fs = await import('node:fs');
  fs.writeFileSync(file, svg(shape));
}
