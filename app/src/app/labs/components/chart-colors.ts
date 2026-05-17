export interface ChartRow {
  label: string;
  value: number | null;
}

// Reads a CSS custom property (must be a 6-char hex, e.g. --fg, --accent)
// and returns an rgba() string for use in Chart.js canvas contexts.
// Canvas cannot consume CSS variables directly; this is the approved bridge.
export function resolveTokenColor(token: string, alpha: number): string {
  let hex = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
