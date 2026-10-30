import type { TowerSpec } from './augments';
import { SPRAY_CRIT_CHANCE } from './sprayCrit';

/**
 * The damage a tower deals per second from its spec: the damage of its hits times how often
 * it hits, plus the burn its hits set ablaze (the burn keeps ticking, so its rate counts in
 * full, with the tower's damage multiplier). A tower that deals no damage and sets no ablaze
 * adds nothing - Frost, Push, Anchor,
 * Mark, Mint, Rally - and an empty tower (no augment) is 0. Extra shots and splash hit more
 * enemies, but the damage to one is still damage times rate. A spray's pellets all fly at the
 * one enemy up close, so every pellet counts: damage times pellets times rate, each pellet also
 * expected to crit now and then (×1.15). A beam tower's
 * lines count too: the main line plus a ray per Bolt and a line per Beam added, every one
 * scaled by Rapid's net factor on the beam and the Rally's speed (`rallyRateMul`).
 */
export function towerDps(spec: TowerSpec, rallyRateMul = 1): number {
  if (!spec.attacks) return 0;
  let dps = 0;
  // A beam's term: every line at its per-second rate, the same factor (Rapid x Rally) on all.
  if (spec.kind === 'beam') {
    const m = spec.beamRapidMul * rallyRateMul;
    dps += (1 + spec.beamRays) * spec.beamDps * m + spec.beamExtras.reduce((a, b) => a + b, 0) * m;
  }
  // A shot or pulse term: the damage of its hits times its rate against one enemy.
  if (spec.kind === 'shot' || spec.kind === 'pulse') dps += spec.damage * spec.rate;
  // A spray's term: every pellet of the blast flies at the enemy up close, so all of them count —
  // each also rolling for its double-damage crit (core/sprayCrit.ts), so the expected damage runs (1 + chance) high.
  if (spec.kind === 'spray') dps += spec.damage * spec.spray * spec.rate * (1 + SPRAY_CRIT_CHANCE);
  if (spec.burn) dps += spec.burn.dps * spec.damageMul;
  return dps;
}
