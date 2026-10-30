/** The tech tree: the coins runs earn buy lasting bonuses. Storage is passed in, so this stays pure and testable. */
import { BOARD_NODES } from '../content/tech/board';
import { CLAIM_NODES } from '../content/tech/claim';
import { POOL_NODES } from '../content/tech/pool';
import { DRAFT_NODES } from '../content/tech/draft';
import { PROFILE_KEY, loadProfile, type KeyValueStore } from './profile';

/** One buyable node: what it costs, what it needs before it unlocks, and what it adds to every new run. */
export interface TechNode {
  id: string;
  name: string;
  line: string;
  price: number;
  requires: string | null;
  gold: number;
  life: number;
}

/**
 * The "Run start" branch: one row of five, each node needing the one before it. The two life
 * nodes sit last and stack.
 */
export const TECH_NODES: readonly TechNode[] = [
  { id: 'gold-1', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 5, requires: null, gold: 5, life: 0 },
  { id: 'gold-2', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 10, requires: 'gold-1', gold: 5, life: 0 },
  { id: 'gold-3', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 15, requires: 'gold-2', gold: 5, life: 0 },
  { id: 'life-1', name: 'Life +1', line: 'new runs start with one more life', price: 30, requires: 'gold-3', gold: 0, life: 1 },
  { id: 'life-2', name: 'Life +1', line: 'new runs start with one more life', price: 40, requires: 'life-1', gold: 0, life: 1 },
];

/** What a new run starts with extra for the owned nodes; each node counts once, unknown ids count for nothing. */
export function startBonuses(owned: readonly string[]): { gold: number; life: number } {
  let gold = 0;
  let life = 0;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = TECH_NODES.find((n) => n.id === id);
    if (!node) continue;
    gold += node.gold;
    life += node.life;
  }
  return { gold, life };
}

/** How many extra bends a new run's road gets for the owned board nodes; each node counts once, unknown ids count for nothing. */
export function boardBends(owned: readonly string[]): number {
  let bends = 0;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = BOARD_NODES.find((n) => n.id === id);
    if (!node) continue;
    bends += node.bends;
  }
  return bends;
}

/** The road length multiplier for a new run's board: the biggest owned node's, 1 when none has one; each node counts once. */
export function boardLengthMul(owned: readonly string[]): number {
  let mul = 1;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = BOARD_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.lengthMul > mul) mul = node.lengthMul;
  }
  return mul;
}

/** A branch's first-node price scaled by depth^1.5 and rounded to the nearest multiple of 5 (halves up). */
export function nodePrice(base: number, depth: number): number {
  return Math.round((base * Math.pow(depth, 1.5)) / 5) * 5;
}

/** One node's price now: its branch's first-node base, at the node's 1-based position in the branch. */
export function nodeCost(branch: readonly { id: string; price: number }[], id: string): number {
  return nodePrice(branch[0].price, branch.findIndex((n) => n.id === id) + 1);
}

/**
 * Buys a node from the saved profile's coins. Refuses an unknown or already owned id, a node
 * whose previous one is not owned, and a price the coins don't cover (they never go below zero).
 */
export function buyNode(store: KeyValueStore | undefined, id: string): boolean {
  const profile = loadProfile(store);
  const branch = TECH_NODES.some((n) => n.id === id) ? TECH_NODES : DRAFT_NODES;
  const node = branch.find((n) => n.id === id);
  if (!node || profile.purchased.includes(id)) return false;
  if (node.requires !== null && !profile.purchased.includes(node.requires)) return false;
  const price = nodeCost(branch, id);
  if (profile.coins < price) return false;
  profile.coins -= price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
}

/**
 * Buys a pool node from the saved profile's coins. Refuses an unknown or already owned id and a
 * price the coins don't cover (they never go below zero); a pool node has no prerequisites.
 */
export function buyPoolNode(store: KeyValueStore | undefined, id: string): boolean {
  const profile = loadProfile(store);
  const node = POOL_NODES.find((n) => n.id === id);
  if (!node || profile.purchased.includes(id)) return false;
  const price = nodeCost(POOL_NODES, id);
  if (profile.coins < price) return false;
  profile.coins -= price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
}

/**
 * The menu's Tech button wears a dot while the coins reach at least one unowned node. The
 * branch node lists are the ones the tech screen's rows read (TechScene's `rows`).
 */
export function nodeInReach(purchased: readonly string[], coins: number): boolean {
  for (const branch of [TECH_NODES, POOL_NODES, CLAIM_NODES, BOARD_NODES]) {
    for (const node of branch) {
      if (!purchased.includes(node.id) && coins >= nodeCost(branch, node.id)) return true;
    }
  }
  return false;
}

/**
 * Buys a claim node from the saved profile's coins. Refuses an unknown or already owned id and a
 * price the coins don't cover (they never go below zero); a claim node has no prerequisites and
 * no gate — its effect is in the run the moment it is bought.
 */
export function buyClaimNode(store: KeyValueStore | undefined, id: string): boolean {
  const profile = loadProfile(store);
  const node = CLAIM_NODES.find((n) => n.id === id);
  if (!node || profile.purchased.includes(id)) return false;
  const price = nodeCost(CLAIM_NODES, id);
  if (profile.coins < price) return false;
  profile.coins -= price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
}

/**
 * Buys a board node from the saved profile's coins. Refuses an unknown or already owned id and a
 * price the coins don't cover (they never go below zero); a board node has no prerequisites and
 * no gate — its effect is in new runs the moment it is bought.
 */
export function buyBoardNode(store: KeyValueStore | undefined, id: string): boolean {
  const profile = loadProfile(store);
  const node = BOARD_NODES.find((n) => n.id === id);
  if (!node || profile.purchased.includes(id)) return false;
  const price = nodeCost(BOARD_NODES, id);
  if (profile.coins < price) return false;
  profile.coins -= price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
}
