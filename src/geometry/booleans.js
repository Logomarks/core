/**
 * Booleans on shapes (polygon sets): union, subtract, intersect and exclude, through polygon-clipping, and the jitter
 * that retries a boolean polygon-clipping throws on ("Unable to complete output ring", "Unable to find segment … in
 * SweepLine tree").
 */
import pc from 'polygon-clipping';

/** polygon-clipping's own operations, kept before robust() patches them. */
const RAW = { union: pc.union, difference: pc.difference, intersection: pc.intersection, xor: pc.xor };

/**
 * Union of any number of shapes (none: an empty shape).
 *
 * @param {...import('./types.js').Geom} g The shapes.
 * @returns {import('./types.js').Shape} The union.
 */
export const U = (...g) => g.length ? pc.union(...g) : [], D = (a, ...b) => b.length ? pc.difference(a, ...b) : a;
export const I = (...g) => pc.intersection(...g), X = (...g) => pc.xor(...g);

/**
 * A point jitter driven by `rand`: every point of a shape moved by up to ±e/2 on each axis.
 *
 * @param {() => number} rand Numbers in [0, 1).
 * @returns {(g: any, e: number) => any} The jitter.
 */
const jitterWith = (rand) => { const jit = (g, e) => typeof g[0] === 'number' ? [g[0] + (rand() - 0.5) * e, g[1] + (rand() - 0.5) * e] : g.map((x) => jit(x, e)); return jit; };

/**
 * An operation that retries with a growing jitter (0.001 up to ~0.26 units, invisible at one decimal place) when it throws.
 *
 * @param {(...g: any[]) => any} op The operation.
 * @param {(g: any, e: number) => any} jit The jitter.
 * @returns {(...g: any[]) => any} The operation, retried.
 */
const retrying = (op, jit) => (...a) => { for (let t = 0; ; t++) { try { return op(...(t ? a.map((x) => jit(x, 0.001 * 2 ** t)) : a)); } catch (e) { if (t > 7) throw e; } } };

/**
 * Opt-in: call robust() once at the top of a script. When polygon-clipping throws on near-coincident edges, every
 * boolean (U, D, I, X and anything built on them) then retries with a growing jitter instead of failing. The jitter
 * reads Math.random: set `Math.random = seeded(name)` before each mark to repeat it byte for byte.
 */
export function robust() { if (pc.__robust) return; pc.__robust = true;
  const jit = jitterWith(() => Math.random());
  for (const k of ['union', 'difference', 'intersection', 'xor']) pc[k] = retrying(RAW[k], jit); }

/**
 * Booleans that retry with a jitter from their own generator, leaving polygon-clipping (and Math.random) alone: the
 * same retries as robust(), for reading marks in a library or a long-running process.
 *
 * @param {() => number} rand Numbers in [0, 1), e.g. `seeded(slug)`.
 * @returns {import('./booleans.js').BooleanOps} union, difference, intersection and xor.
 */
export function robustOps(rand) {
  const jit = jitterWith(rand), [u, d, i, x] = ['union', 'difference', 'intersection', 'xor'].map((k) => retrying(RAW[k], jit));
  return { union: (...g) => (g.length ? u(...g) : []), difference: (a, ...b) => (b.length ? d(a, ...b) : a), intersection: (...g) => i(...g), xor: (...g) => (g.length ? x(...g) : []) };
}

/** The plain booleans (U, D, I, X) as an operations object, with an empty xor giving an empty shape. */
export const OPS = { union: U, difference: D, intersection: I, xor: (...g) => (g.length ? X(...g) : []) };
