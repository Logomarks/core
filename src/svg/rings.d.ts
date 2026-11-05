import type { Ring } from '../geometry/types.js';
import type { Segment } from './path.js';

/** The closed rings a path draws, curves sampled every `step` units (1.5). */
export function rings(segs: readonly Segment[], step?: number): Ring[];
