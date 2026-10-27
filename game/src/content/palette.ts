/**
 * The Bauhaus palette: flat primaries and ink on warm paper. Engine-free so content
 * definitions can use it too. Use these names instead of raw hex values.
 */
export const PALETTE = {
  paper: 0xf2ead8,
  paperLight: 0xfbf7ee,
  paperDark: 0xe2d6bc,
  paperShade: 0xd9c69f,
  ink: 0x1d1d1b,
  inkSoft: 0x55524a,
  gray: 0x9a958a,
  pencil: 0x8a857a,
  red: 0xd7362b,
  redDark: 0x9e2318,
  yellow: 0xf2b822,
  yellowDark: 0xb98a10,
  blue: 0x1f4e9c,
  blueLight: 0x4b78c4,
  green: 0x2e7d55,
  orange: 0xe2702a,
} as const;

/** 0xd7362b -> "#d7362b" (for Phaser Text styles and CSS). */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
