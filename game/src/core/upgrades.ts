import type { UpgradeDef } from '../content/types';
import type { Rng } from './rng';

/** Can this upgrade be offered right now? */
export function isUpgradeAvailable(def: UpgradeDef, levelOf: (id: string) => number, ownedWeapons: readonly string[]): boolean {
  if (levelOf(def.id) >= def.maxLevel) return false;
  if (def.requires?.some((id) => levelOf(id) === 0)) return false;
  if (def.requiresWeapon && !ownedWeapons.includes(def.requiresWeapon)) return false;
  if (def.grantsWeapon && ownedWeapons.includes(def.grantsWeapon)) return false;
  return true;
}

/** Rolls up to `count` distinct upgrade choices, weighted by `def.weight`. */
export function rollUpgradeChoices(
  rng: Rng,
  pool: readonly UpgradeDef[],
  levelOf: (id: string) => number,
  ownedWeapons: readonly string[],
  count = 3,
): UpgradeDef[] {
  const available = pool.filter((def) => isUpgradeAvailable(def, levelOf, ownedWeapons));
  const choices: UpgradeDef[] = [];
  while (choices.length < count && available.length > 0) {
    const picked = rng.weighted(available, (d) => d.weight);
    if (!picked) break;
    choices.push(picked);
    available.splice(available.indexOf(picked), 1);
  }
  return choices;
}
