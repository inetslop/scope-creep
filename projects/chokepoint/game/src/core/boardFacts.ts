import { GRID, ROCKS } from '../config';
import { BOARD_NODES } from '../content/tech/board';
import { WAVE_NODES } from '../content/tech/wave';
import { generateMap, type GameMap } from './map';
import { Rng } from './rng';

/**
 * The board's modifiers, in the order the pause's "Boards" reference lists them: the choke and
 * its siblings, then the second gate and the marked cell. The tags point at the tree's own data
 * (a node's id) or at "always" / "some boards"; they never retype a tech card or a pick line.
 * A later modifier lands here as one more row (and one more mark) — not in the pause card or the
 * sibling references. Pure: read once from the live profile, no state.
 */

export type BoardFactMark = 'choke' | 'bend' | 'longway' | 'twochokes' | 'switchback' | 'fargate' | 'fork' | 'loop' | 'cove' | 'markedcell';
export type BoardFactTag = { kind: 'always' } | { kind: 'some' } | { kind: 'tech'; node: string } | { kind: 'someTech'; node: string };
export interface BoardFactRow {
  mark: BoardFactMark;
  name: string;
  meaning: string;
  tag: BoardFactTag;
}

export const BOARD_FACTS: readonly BoardFactRow[] = [
  { mark: 'choke', name: 'The choke', meaning: 'one build cell that reaches the road twice', tag: { kind: 'always' } },
  { mark: 'bend', name: 'One more bend', meaning: 'the road winds one bend more', tag: { kind: 'tech', node: 'one-more-bend' } },
  { mark: 'longway', name: 'The long way', meaning: 'the road is longer', tag: { kind: 'tech', node: 'long-way' } },
  { mark: 'twochokes', name: 'Two chokes', meaning: 'two cells that reach the road twice', tag: { kind: 'tech', node: 'two-chokes' } },
  { mark: 'switchback', name: 'The switchback', meaning: 'the road folds back into double cover', tag: { kind: 'tech', node: 'switchback' } },
  { mark: 'fargate', name: 'The far gate', meaning: 'a second gate; a third of each non-boss wave comes through it', tag: { kind: 'someTech', node: 'door' } },
  { mark: 'fork', name: 'The fork', meaning: 'the road splits into two lanes and rejoins', tag: { kind: 'some' } },
  { mark: 'loop', name: 'The loop', meaning: 'the road circles the island once; the cells inside cover the most road', tag: { kind: 'some' } },
  { mark: 'cove', name: 'The cove', meaning: "a bay in the island's edge beside a curve; the pocket's cells cover it from both sides", tag: { kind: 'some' } },
  { mark: 'markedcell', name: 'The marked cell', meaning: 'one build cell that makes its tower stronger', tag: { kind: 'some' } },
];

/** One committed seed per row's modifier, with the row's own parameters — the row's board is grown from it, never a roll. */
export interface BoardFactSeed {
  seed: number;
  extraBends?: number; // the bend row: 1 (the row's tech's own parameter)
  lengthMul?: number;  // the long way row: 2
  chokes?: number;     // the two chokes row: 2
  fold?: boolean;      // the switchback row: true
  farGate?: boolean;   // the far gate row: true
}

/** One fixed seed per row's modifier (never a roll). A row added later without an entry shows text only. */
export const BOARD_FACT_SEEDS: Partial<Record<BoardFactMark, BoardFactSeed>> = {
  choke: { seed: 1 },
  bend: { seed: 2, extraBends: 1 },
  longway: { seed: 4, lengthMul: 2 },
  twochokes: { seed: 3, chokes: 2 },
  switchback: { seed: 5, fold: true },
  fargate: { seed: 8, farGate: true },
  fork: { seed: 6 },
  loop: { seed: 7 },
  cove: { seed: 13 },
  markedcell: { seed: 9 },
};

/** The row's board, grown the run's own way: bgen 2 (the choke guarantee, the loop and cove rolls), the run's rocks, a fixed portrait board (8 cols x 14 rows). */
export function boardFactMap(mark: BoardFactMark): GameMap | undefined {
  const s = BOARD_FACT_SEEDS[mark];
  if (!s) return undefined;
  return generateMap(new Rng(s.seed), GRID.short, GRID.long, ROCKS, s.extraBends ?? 0, s.lengthMul ?? 1, 2, s.chokes ?? 1, s.fold ?? false, s.farGate ?? false, s.seed);
}

/** "always", "some boards", "tech · the node" while its node is owned, the tree's own node name, or "owned" while the profile owns it. */
export function boardFactTag(row: BoardFactRow, purchased: readonly string[]): string {
  const tag = row.tag;
  if (tag.kind === 'always') return 'always';
  if (tag.kind === 'some') return 'some boards';
  if (tag.kind === 'someTech') return purchased.includes(tag.node) ? `tech · ${techName(tag.node)}` : 'some boards';
  if (purchased.includes(tag.node)) return 'owned';
  return techName(tag.node);
}

/** A tagged node's name, looked up in the board's branch first and then the wave's. */
function techName(id: string): string {
  return BOARD_NODES.find((n) => n.id === id)?.name ?? WAVE_NODES.find((n) => n.id === id)?.name ?? '';
}
