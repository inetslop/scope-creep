import type { WeaponDef } from '../types';
import { arc } from './arc';
import { line } from './line';
import { orbit } from './orbit';
import { point } from './point';

/** Every weapon in the game. To add one: create a file next to this one and add it here. */
export const WEAPONS: readonly WeaponDef[] = [point, line, orbit, arc];

export const WEAPON_BY_ID: ReadonlyMap<string, WeaponDef> = new Map(WEAPONS.map((w) => [w.id, w]));

export function getWeapon(id: string): WeaponDef {
  const def = WEAPON_BY_ID.get(id);
  if (!def) throw new Error(`Unknown weapon id: ${id}`);
  return def;
}
