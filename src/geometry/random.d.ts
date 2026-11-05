/** A Math.random replacement seeded by a string (FNV-1a into mulberry32): numbers in [0, 1). */
export function seeded(str: string): () => number;
