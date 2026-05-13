export interface ChartRow {
  label: string;
  value: number | null;
}

export function resolveFgColor(alpha: number): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function resolveAccentRedColor(alpha: number): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent-red').trim();
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
