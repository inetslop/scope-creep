import type { TowerSpec } from './augments';

/**
 * The damage a tower deals per second from its spec: the damage of its hits times how often
 * it hits, plus the burn its hits set ablaze (the burn keeps ticking, so its rate counts in
 * full, with the tower's damage multiplier). A tower that deals no damage and sets no ablaze
 * adds nothing - Frost, Push, Anchor, Mark, Mint, Rally - and an empty tower (no augment) is 0.
 * Extra shots and splash hit more enemies, but the damage to one is still damage times rate. A
 * spray's pellets all fly at the one enemy up close, so every pellet counts: damage times pellets
 * times rate. A beam tower's lines count too: the main line — already boosted by each Beam added to
 * it — plus a ray per Bolt, every one scaled by Rapid's net factor on the beam and the Rally's
 * speed (`rallyRateMul`). Every one of a tower's damage instances can roll for a crit (Spray,
 * core/augments.ts), so its whole output runs (1 + its crit chance) high at its expected value.
 * The marked cell's `cellMul` (core/markedCell.ts) scales the damage a tower deals of its own
 * — the beam, the shot/pulse and the spray terms — but not the burn its hits set ablaze,
 * which keeps ticking at the burning tower's rate.
 */
export function towerDps(spec: TowerSpec, rallyRateMul = 1, cellMul = 1): number {
  if (!spec.attacks) return 0;
  let dps = 0;
  // A beam's term: every line at its per-second rate (the main line already boosted by its
  // Beams added), the same factor (Rapid x Rally x the marked cell's +25%) on all.
  if (spec.kind === 'beam') {
    const m = spec.beamRapidMul * rallyRateMul * cellMul;
    dps += (1 + spec.beamRays) * spec.beamDps * m;
  }
  // A shot or pulse term: the damage of its hits times its rate against one enemy, times the marked cell's +25%.
  if (spec.kind === 'shot' || spec.kind === 'pulse') dps += spec.damage * spec.rate * cellMul;
  // A spray's term: every pellet of the blast flies at the enemy up close, so all of them count.
  if (spec.kind === 'spray') dps += spec.damage * spec.spray * spec.rate * cellMul;
  // A burn's term: its rate in full (the tick that crits rolls at the burning tower's chance too).
  if (spec.burn) dps += spec.burn.dps * spec.damageMul;
  // Crits (Spray): every damage instance above can land for double, counted at its expected value.
  return dps * (1 + spec.critChance);
}
