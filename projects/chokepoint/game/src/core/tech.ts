/** The tech tree: the coins runs earn buy lasting bonuses. Storage is passed in, so this stays pure and testable. */
import { CLAIM_NODES } from '../content/tech/claim';
import { POOL_NODES } from '../content/tech/pool';
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
 * The "Run start" branch: one row of four, each node needing the one before it. The life node
 * sits last, so it is the most expensive thing the branch has to offer.
 */
export const TECH_NODES: readonly TechNode[] = [
  { id: 'gold-1', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 5, requires: null, gold: 5, life: 0 },
  { id: 'gold-2', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 10, requires: 'gold-1', gold: 5, life: 0 },
  { id: 'gold-3', name: 'Gold +5', line: 'new runs start with 5 more gold', price: 15, requires: 'gold-2', gold: 5, life: 0 },
  { id: 'life-1', name: 'Life +1', line: 'new runs start with one more life', price: 30, requires: 'gold-3', gold: 0, life: 1 },
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

/**
 * Buys a node from the saved profile's coins. Refuses an unknown or already owned id, a node
 * whose previous one is not owned, and a price the coins don't cover (they never go below zero).
 */
export function buyNode(store: KeyValueStore | undefined, id: string): boolean {
  const profile = loadProfile(store);
  const node = TECH_NODES.find((n) => n.id === id);
  if (!node || profile.purchased.includes(id)) return false;
  if (node.requires !== null && !profile.purchased.includes(node.requires)) return false;
  if (profile.coins < node.price) return false;
  profile.coins -= node.price;
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
  if (profile.coins < node.price) return false;
  profile.coins -= node.price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
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
  if (profile.coins < node.price) return false;
  profile.coins -= node.price;
  profile.purchased.push(id);
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the purchase just isn't kept */
  }
  return true;
}
