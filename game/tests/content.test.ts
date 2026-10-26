/**
 * Validates every content definition. If you add an enemy/weapon/upgrade and this
 * fails, the message tells you which field is wrong.
 */
import { describe, expect, it } from 'vitest';
import { ENEMIES, ENEMY_BY_ID } from '../src/content/enemies';
import { UPGRADES } from '../src/content/upgrades';
import { WEAPON_BY_ID, WEAPONS } from '../src/content/weapons';
import { BASE_STATS } from '../src/core/stats';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function expectUniqueIds(items: readonly { id: string }[]): void {
  const seen = new Set<string>();
  for (const { id } of items) {
    expect(ID_PATTERN.test(id), `id "${id}" must be kebab-case`).toBe(true);
    expect(seen.has(id), `duplicate id "${id}"`).toBe(false);
    seen.add(id);
  }
}

const positive = (v: number): boolean => Number.isFinite(v) && v > 0;
const nonNegative = (v: number): boolean => Number.isFinite(v) && v >= 0;

describe('enemies', () => {
  it('have unique kebab-case ids', () => expectUniqueIds(ENEMIES));

  it.each(ENEMIES.map((e) => [e.id, e] as const))('%s has sane numbers', (_id, e) => {
    expect(positive(e.hp), 'hp > 0').toBe(true);
    expect(nonNegative(e.speed), 'speed >= 0').toBe(true);
    expect(nonNegative(e.contactDamage), 'contactDamage >= 0').toBe(true);
    expect(nonNegative(e.xp), 'xp >= 0').toBe(true);
    expect(positive(e.threat), 'threat > 0').toBe(true);
    expect(nonNegative(e.spawnWeight), 'spawnWeight >= 0').toBe(true);
    expect(nonNegative(e.unlockAtSec), 'unlockAtSec >= 0').toBe(true);
    expect(e.knockbackResist >= 0 && e.knockbackResist <= 1, 'knockbackResist in [0,1]').toBe(true);
    expect(e.look.radius >= 4 && e.look.radius <= 80, 'look.radius in [4,80]').toBe(true);
  });

  it('at least one enemy is available at time 0', () => {
    expect(ENEMIES.some((e) => e.unlockAtSec === 0 && e.spawnWeight > 0)).toBe(true);
  });

  it.each(ENEMIES.map((e) => [e.id, e] as const))('%s note is non-empty all-caps when present', (_id, e) => {
    if (e.note === undefined) return;
    expect(e.note.length > 0 && e.note === e.note.toUpperCase(), 'note must be non-empty all-caps').toBe(true);
  });

  it.each(ENEMIES.filter((e) => e.splitsInto).map((e) => [e.id, e] as const))('%s splitsInto a real enemy', (_id, e) => {
    const spec = e.splitsInto!;
    expect(Number.isInteger(spec.count) && spec.count >= 1, 'count is an integer >= 1').toBe(true);
    expect(spec.id !== e.id, 'no self-split').toBe(true);
    expect(ENEMY_BY_ID.has(spec.id), `unknown split child "${spec.id}"`).toBe(true);
  });

  it.each(ENEMIES.filter((e) => e.shoot).map((e) => [e.id, e] as const))('%s shoot tuning is sane', (_id, e) => {
    const s = e.shoot!;
    expect(positive(s.periodSec) && positive(s.speed) && positive(s.damage), 'shoot numbers > 0').toBe(true);
  });
});

describe('weapons', () => {
  it('have unique kebab-case ids', () => expectUniqueIds(WEAPONS));

  it.each(WEAPONS.map((w) => [w.id, w] as const))('%s has sane numbers', (_id, w) => {
    expect(positive(w.damage), 'damage > 0').toBe(true);
    expect(nonNegative(w.knockback), 'knockback >= 0').toBe(true);
    if (w.orbit) {
      const o = w.orbit;
      expect(Number.isInteger(o.count) && o.count >= 1, 'orbit.count >= 1').toBe(true);
      expect(positive(o.radius) && positive(o.speed) && positive(o.circleRadius) && positive(o.hitCooldownSec), 'orbit numbers > 0').toBe(true);
      return;
    }
    if (w.arc) {
      const a = w.arc;
      expect(positive(a.range) && positive(a.chainRadius) && positive(a.coneDeg), 'arc range/chain/cone > 0').toBe(true);
      expect(Number.isInteger(a.maxJumps) && a.maxJumps >= 1, 'arc.maxJumps >= 1').toBe(true);
      expect(positive(a.fadeMs), 'arc.fadeMs > 0').toBe(true);
      return;
    }
    for (const key of ['fireRate', 'count', 'speed', 'lifetimeSec'] as const) expect(positive(w[key]), `${key} > 0`).toBe(true);
    for (const key of ['spreadDeg', 'jitterDeg', 'pierce'] as const) expect(nonNegative(w[key]), `${key} >= 0`).toBe(true);
    expect(Number.isInteger(w.count) && Number.isInteger(w.pierce), 'count and pierce are integers').toBe(true);
  });

  it('starting weapon exists', () => {
    expect(WEAPON_BY_ID.has('point')).toBe(true);
  });
});

describe('upgrades', () => {
  it('have unique kebab-case ids', () => expectUniqueIds(UPGRADES));

  it.each(UPGRADES.map((u) => [u.id, u] as const))('%s is valid', (_id, u) => {
    expect(u.name.length > 0 && u.description.length > 0, 'name and description').toBe(true);
    expect(Number.isInteger(u.maxLevel) && u.maxLevel >= 1, 'maxLevel >= 1').toBe(true);
    expect(positive(u.weight), 'weight > 0').toBe(true);
    for (const mod of u.mods) {
      expect(mod.stat in BASE_STATS, `unknown stat "${mod.stat}"`).toBe(true);
      expect(Number.isFinite(mod.value), 'mod value is a number').toBe(true);
      if (mod.op === 'mul') expect(mod.value > 0, 'mul mods must be > 0').toBe(true);
    }
    if (u.grantsWeapon) expect(WEAPON_BY_ID.has(u.grantsWeapon), `unknown weapon "${u.grantsWeapon}"`).toBe(true);
    if (u.requiresWeapon) expect(WEAPON_BY_ID.has(u.requiresWeapon), `unknown weapon "${u.requiresWeapon}"`).toBe(true);
    for (const req of u.requires ?? []) expect(UPGRADES.some((x) => x.id === req), `unknown required upgrade "${req}"`).toBe(true);
    expect(u.mods.length > 0 || u.grantsWeapon !== undefined, 'upgrade must do something').toBe(true);
  });
});
