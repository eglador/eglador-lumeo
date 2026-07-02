/** Vivid, mutually distinguishable palette so overlapping crop region outlines never get mixed up. */
export const REGION_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#84cc16",
];

/** Picks a random color, preferring one not already used by an existing region so new regions stay distinguishable. */
export function pickRegionColor(usedColors: string[]): string {
  const unused = REGION_COLORS.filter((color) => !usedColors.includes(color));
  const pool = unused.length > 0 ? unused : REGION_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}
