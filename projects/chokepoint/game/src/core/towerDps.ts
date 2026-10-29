import type { TowerSpec } from './augments';

/**
 * The damage a tower deals per second from its spec: the damage of its hits times how often
 * it hits, plus the burn its hits set ablaze (the burn keeps ticking, so its rate counts in
 * full). A tower that deals no damage and sets no ablaze adds nothing - Frost, Push, Anchor,
 * Mark, Mint, Rally - and an empty tower (no augment) is 0. Extra shots and splash hit more
 * enemies, but the damage to one is still damage times rate.
 */
export function towerDps(spec: TowerSpec): number {
  if (!spec.attacks) return 0;
  let dps = 0;
  if (spec.kind === 'shot' || spec.kind === 'pulse') dps += spec.damage * spec.rate;
  if (spec.burn) dps += spec.burn.dps;
  return dps;
}
