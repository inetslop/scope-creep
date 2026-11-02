import { BOARD_NODES } from '../content/tech/board';
import { WAVE_NODES } from '../content/tech/wave';

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
