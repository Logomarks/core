/**
 * Numbers as SVG writes them.
 */

/**
 * A number to one decimal, as short as it can be written ("12", "-3.5", never "-0").
 *
 * @param {number} v The number.
 * @returns {string} It, written.
 */
export const r1 = (v) => {
	const s = (Math.round(v * 10) / 10).toFixed(1);
	return s === '-0.0' ? '0' : s.endsWith('.0') ? s.slice(0, -2) : s;
};
