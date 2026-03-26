/**
 * PUBLIC_INTERFACE
 * Format ISO date string to short readable value.
 * @param {string} iso
 */
export function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return iso;
  }
}

/**
 * PUBLIC_INTERFACE
 * Clamp a number to 0-100 and format as percent string.
 * @param {number} v
 */
export function pct(v) {
  const n = Math.max(0, Math.min(100, Number(v)));
  return `${Math.round(n)}%`;
}
