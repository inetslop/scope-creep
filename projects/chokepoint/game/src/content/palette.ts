/**
 * The only colors in the game. Bright minimal: a soft sage-grey ground, a lighter board island,
 * a white road, ink-slate text, and clear saturated colors for everything that matters.
 * Each bright has a `*Deep` twin: the darker side face that gives shapes their thickness.
 */
export const PALETTE = {
  /** The page around the board. */
  ground: 0xd9e2e0,
  /** The board island. */
  island: 0xedf2f1,
  /** Grid dots on the island. */
  dot: 0xc8d4d2,
  road: 0xffffff,
  rock: 0xd2dcda,
  rockDeep: 0xb4c2bf,
  /** Text, icons, the exit gate. */
  ink: 0x2c3a40,
  muted: 0x6f8287,
  faint: 0xa7b6b9,
  /** Gold numbers (popups): darker than the coin so they read on the light board. */
  goldText: 0x9c6c00,
  /** HUD cards and buttons, and the tower plinths. */
  card: 0xffffff,
  cardDeep: 0xd3dcdb,
  red: 0xe5574b,
  redDeep: 0xb53b31,
  orange: 0xf29c38,
  orangeDeep: 0xbf7417,
  yellow: 0xf3c33c,
  yellowDeep: 0xb88f12,
  green: 0x5cb85f,
  greenDeep: 0x3d8a41,
  teal: 0x24a99c,
  tealDeep: 0x17786f,
  blue: 0x3c86d6,
  blueDeep: 0x255fa3,
  purple: 0x8d6bd0,
  purpleDeep: 0x6346a3,
  pink: 0xe679ab,
  pinkDeep: 0xb4507f,
  /** Frost: a light ice blue, well apart from blue. */
  ice: 0x8ed6f2,
  iceDeep: 0x4c9fc2,
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** The colors content may use (enemies, augments). Enemies are warm red, orange and purple. */
export const BRIGHTS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'ice'] as const;
export type Bright = (typeof BRIGHTS)[number];

/** The darker side face of a bright color. */
export function deepOf(color: Bright): number {
  return PALETTE[`${color}Deep`];
}

/** A lighter tint of a color, mixed 40% toward white (the Spray's needles, a lighter shade of the tower's own color). */
export function lightOf(color: number): number {
  const m = (c: number): number => Math.round(c + (255 - c) * 0.4);
  return (m((color >> 16) & 255) << 16) | (m((color >> 8) & 255) << 8) | m(color & 255);
}

/** 0xRRGGBB -> "#rrggbb" for text styles. */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** 0xRRGGBB + alpha -> "rgba(...)" for canvas drawing. */
export function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha})`;
}
