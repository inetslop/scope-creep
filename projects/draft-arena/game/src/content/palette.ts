/**
 * Every color the game uses, Critters style: bright candy colors with an ink outline on a mint
 * field. Monsters are warm (red, orange, purple, pink, magenta, coral, violet), player weapons
 * cool (teal, blue, ice), rewards yellow and green.
 */
export const PALETTE = {
  ground: '#dff1e9',
  ink: '#3b3355',
  muted: '#7a7193',
  white: '#ffffff',

  red: '#ff6b6b',
  orange: '#ffa94d',
  peach: '#ffc078',
  purple: '#a78bfa',
  pink: '#f783ac',
  magenta: '#da77f2',
  coral: '#ffa8a8',
  violet: '#845ef7',
  berry: '#e64980',

  teal: '#38d9a9',
  blue: '#4dabf7',
  ice: '#99e9f2',
  yellow: '#ffd43b',
  green: '#51cf66',
  lime: '#a9e34b',
} as const;

/** One per player, handed out so players near each other differ. */
export const PLAYER_COLORS: readonly string[] = ['#4dabf7', '#38d9a9', '#ffd43b', '#69db7c', '#748ffc', '#3bc9db', '#a9e34b', '#ffc078', '#e599f7', '#faa2c1'];
