/**
 * Talent rules, shared by the server (which ranks may be taken) and the client (what the panel
 * shows): what a talent still needs, and what a player can take now.
 */
import type { TalentDef, TalentTreeDef, UpgradeDef } from './api.ts';
import type { Registry } from './registry.ts';

export type RankOf = (t: TalentDef) => number;

/** Points spent in a tree: its ranks, minus the free start ranks. */
export function spentIn(tree: TalentTreeDef, rankOf: RankOf): number {
  let n = 0;
  for (const t of tree.talents) n += Math.max(0, rankOf(t) - (t.start ?? 0));
  return n;
}

/** What a talent still needs, as text for the panel ("Bolt 2", "4 pts in Gunner"). Empty when its needs are met. */
export function missingFor(reg: Registry, t: TalentDef, rankOf: RankOf): string[] {
  const out: string[] = [];
  for (const [id, rank] of t.needs ?? []) {
    const other = reg.talents.get(id);
    if (other && rankOf(other) < rank) out.push(`${reg.upgrades.get(other.upgrade)?.name ?? id} ${rank}`);
  }
  const tree = reg.treeOf.get(t)!;
  if (t.points && spentIn(tree, rankOf) < t.points) out.push(`${t.points} pts in ${tree.name}`);
  return out;
}

/** A rank of `t` can be taken: below its max, its upgrade below max level, and its needs met. */
export function canTake(reg: Registry, t: TalentDef, rankOf: RankOf, levelOf: (u: UpgradeDef) => number): boolean {
  const up = reg.upgrades.get(t.upgrade);
  if (!up || rankOf(t) >= t.max || levelOf(up) >= up.maxLevel) return false;
  return missingFor(reg, t, rankOf).length === 0;
}

/** Every talent a player could take a rank of now, in registry order. */
export function takeable(reg: Registry, rankOf: RankOf, levelOf: (u: UpgradeDef) => number): TalentDef[] {
  return reg.talentList.filter((t) => canTake(reg, t, rankOf, levelOf));
}
