/**
 * Validates every content definition. If you add an enemy/weapon/upgrade and this
 * fails, the message tells you which field is wrong.
 */
import { describe, expect, it } from 'vitest';
import { BOSS_BY_ID, BOSSES, getBoss, type GridBossDef, type PaletteBossDef } from '../src/content/bosses';
import { ENEMIES, ENEMY_BY_ID } from '../src/content/enemies';
import { PALETTE } from '../src/content/palette';
import type { EnemyLook } from '../src/content/types';
import { UPGRADES } from '../src/content/upgrades';
import { WEAPON_BY_ID, WEAPONS } from '../src/content/weapons';
import { BASE_STATS } from '../src/core/stats';
import { SWATCH_CASCADE } from '../src/core/swatchCascade';

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
    const maxR = e.look.bar ? 96 : 80;
    expect(e.look.radius >= 4 && e.look.radius <= maxR, `look.radius in [4,${maxR}]`).toBe(true);
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

  const checkBarLook = (look: EnemyLook): void => {
    const bar = look.bar!;
    expect(look.shape === 'rect', 'bar look must be a rect').toBe(true);
    expect(positive(bar.length) && positive(bar.thickness), 'bar length and thickness > 0').toBe(true);
    expect(bar.length / bar.thickness >= 3, 'bar aspect length/thickness >= 3').toBe(true);
    expect(look.radius, 'radius must be length/2 + thickness/2').toBeCloseTo(bar.length / 2 + bar.thickness / 2);
  };

  it.each(ENEMIES.filter((e) => e.look.bar).map((e) => [e.id, e] as const))('%s bar look is valid', (_id, e) => {
    checkBarLook(e.look);
  });

  it('long bars (120x16, 160x12) are expressible in look data', () => {
    const looks: EnemyLook[] = [
      { shape: 'rect', radius: 68, body: 0, accent: 0, bar: { length: 120, thickness: 16 } },
      { shape: 'rect', radius: 86, body: 0, accent: 0, bar: { length: 160, thickness: 12 } },
    ];
    for (const look of looks) {
      checkBarLook(look);
      expect(look.radius >= 4 && look.radius <= 96, 'bar radius within [4,96]').toBe(true);
    }
  });

  it.each(ENEMIES.filter((e) => e.puddle).map((e) => [e.id, e] as const))('%s puddle tuning is sane', (_id, e) => {
    const p = e.puddle!;
    expect(positive(p.periodSec) && positive(p.radius) && positive(p.lifeSec), 'puddle numbers > 0').toBe(true);
    expect(p.fadeSec > 0 && p.fadeSec < p.lifeSec, 'fadeSec in (0, lifeSec)').toBe(true);
    expect(Number.isInteger(p.maxAlive) && p.maxAlive >= 1, 'maxAlive integer >= 1').toBe(true);
    expect(p.slowMul > 0 && p.slowMul <= 1, 'slowMul in (0, 1]').toBe(true);
  });
});

describe('bosses', () => {
  it('have unique kebab-case ids', () => expectUniqueIds(BOSSES));

  it.each(BOSSES.map((b) => [b.id, b] as const))('%s has sane numbers', (_id, b) => {
    expect(positive(b.hp), 'hp > 0').toBe(true);
    expect(positive(b.speed), 'speed > 0').toBe(true);
    expect(positive(b.contactDamage), 'contactDamage > 0').toBe(true);
    expect(positive(b.bodyRadius), 'bodyRadius > 0').toBe(true);
    expect(positive(b.deathXp), 'deathXp > 0').toBe(true);
    expect(Number.isInteger(b.deathPickups) && b.deathPickups >= 1, 'deathPickups integer >= 1').toBe(true);
    expect(b.name.length > 0 && b.name === b.name.toUpperCase(), 'name is non-empty all-caps').toBe(true);
  });

  it.each(BOSSES.filter((b): b is GridBossDef => b.behavior === 'grid').map((b) => [b.id, b] as const))('%s has sane grid numbers', (_id, b) => {
    expect(positive(b.spinRadPerSec), 'spinRadPerSec > 0').toBe(true);
    expect(positive(b.armLength), 'armLength > 0').toBe(true);
    expect(positive(b.armThickness), 'armThickness > 0').toBe(true);
    expect(positive(b.armDamage), 'armDamage > 0').toBe(true);
  });

  const PALETTE_VALUES: readonly number[] = Object.values(PALETTE);
  it.each(BOSSES.filter((b): b is PaletteBossDef => b.behavior === 'palette').map((b) => [b.id, b] as const))('%s has sane palette numbers', (_id, b) => {
    expect(positive(b.swatchHp), 'swatchHp > 0').toBe(true);
    expect(positive(b.swatchWidth), 'swatchWidth > 0').toBe(true);
    expect(positive(b.swatchHeight), 'swatchHeight > 0').toBe(true);
    expect(Number.isInteger(b.shardCount) && b.shardCount >= 1, 'shardCount integer >= 1').toBe(true);
    expect(b.swatchColors.length === SWATCH_CASCADE.count, 'one swatch color per cascade swatch').toBe(true);
    for (const color of b.swatchColors) expect(PALETTE_VALUES.includes(color), `swatch color ${color} is in PALETTE`).toBe(true);
    expect(b.hp === b.swatchHp * SWATCH_CASCADE.count, 'hp is swatchHp times the swatch count').toBe(true);
  });

  it('registry looks up every boss and rejects unknown ids', () => {
    for (const b of BOSSES) expect(BOSS_BY_ID.get(b.id)).toBe(b);
    expect(() => getBoss('nope')).toThrow();
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
    if (w.bounce) {
      expect(Number.isInteger(w.bounce.maxBounces) && w.bounce.maxBounces >= 0, 'bounce.maxBounces is an integer >= 0').toBe(true);
      expect(w.bounce.damageMul > 0 && w.bounce.damageMul <= 1, 'bounce.damageMul in (0, 1]').toBe(true);
    }
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
