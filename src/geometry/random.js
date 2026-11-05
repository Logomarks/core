/**
 * Seeded randomness, so a drawing repeats byte for byte.
 */

/**
 * A Math.random replacement seeded by a string (FNV-1a into mulberry32): set `Math.random = seeded(name)` before
 * drawing each mark, so robust()'s jitter (and anything else random) is the same on every run.
 *
 * @param {string} str The seed.
 * @returns {() => number} A generator of numbers in [0, 1).
 */
export const seeded = (str) => { let a = [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
