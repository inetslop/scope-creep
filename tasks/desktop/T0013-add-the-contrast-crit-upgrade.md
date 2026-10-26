---
id: T0013
title: Add the Contrast crit upgrade
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T18:15:01Z
claimed_at: 2026-10-26T19:53:40Z
---

## Goal
A new upgrade that gives the player a chance to deal double damage, using the crit style already reserved in the damage numbers. Big hits become visible, exciting moments.

## Details
- New upgrade in `src/content/upgrades/index.ts` (same shape as the others; append to the end of the `UPGRADES` array): `id: 'contrast'`, `name: 'Contrast'`, `description: '+10% chance to deal double damage'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- New stat `critChance`, starting at 0: each level of Contrast adds +0.10 (an additive mod, in the same `mods` style as the other entries in that file).
- In `CombatSystem`, whenever the player deals weapon damage to an enemy (projectile hits, and any weapon contact damage such as Orbit's), roll `critChance` with the run's seeded rng. On a crit the damage dealt is exactly 2x, and the floating damage number is shown with the reserved crit style (pass `true` as the `crit` argument to `DamageNumbers.show`).
- A crit changes only the damage value and the number's style: knockback, shard drops and the hit flash are unchanged.
- No UI changes beyond the level-up menu offering the new upgrade like any other.

## Acceptance criteria
- [ ] The level-up menu offers Contrast, up to 3 times
- [ ] With 3 levels of Contrast, about 1 in 3 player hits deals double damage and shows a red, larger damage number
- [ ] Without Contrast, no damage number ever uses the crit style
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/core/stats.ts` - add `critChance` to `PlayerStats`, `BASE_STATS` (0) and `STAT_LIMITS`
- edit `src/content/upgrades/index.ts` - append the `contrast` entry to the end of `UPGRADES`
- edit `src/systems/CombatSystem.ts` - crit roll in `onProjectileHit`
- edit `src/systems/OrbitSystem.ts` - crit roll in `update` (NOTE: the task says "in CombatSystem", but Orbit's contact damage lives in OrbitSystem — both files must change)
- edit `tests/core/core.test.ts` - one new stats test

### Interfaces
```ts
// src/core/stats.ts — add to PlayerStats (after xpMul):
/** Chance (0-0.5) that a player weapon hit deals double damage. */
critChance: number;
// BASE_STATS: `critChance: 0,`   STAT_LIMITS: `critChance: { min: 0, max: 0.5 },`
```
No other signature changes. `DamageNumbers.show(x, y, amount, crit = false)` and `Rng.chance(p)` already exist.

### Steps
1. `src/core/stats.ts`: add the field, `BASE_STATS.critChance = 0`, `STAT_LIMITS.critChance = { min: 0, max: 0.5 }`.
2. `src/content/upgrades/index.ts`: append (after `tempo`, before the closing `];`):
```ts
  {
    id: 'contrast',
    name: 'Contrast',
    description: '+10% chance to deal double damage',
    maxLevel: 3,
    weight: 4,
    mods: [{ stat: 'critChance', op: 'add', value: 0.1 }],
    color: PALETTE.red,
  },
```
3. `src/systems/CombatSystem.ts` `onProjectileHit`: replace `const died = e.hit(p.damage, p, p.knockback);` and `this.damageNumbers.show(e.x, e.y, p.damage);` with:
```ts
    const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
    const dmg = crit ? p.damage * 2 : p.damage;
    const died = e.hit(dmg, p, p.knockback);
    this.damageNumbers.show(e.x, e.y, dmg, crit);
```
4. `src/systems/OrbitSystem.ts` `update`: replace `const dmg = def.damage * this.run.stats.damageMul;` and `this.damageNumbers.show(e.x, e.y, dmg);` with:
```ts
        const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
        const dmg = (crit ? 2 : 1) * def.damage * this.run.stats.damageMul;
        const died = e.hit(dmg, { x: cx, y: cy }, def.knockback);
        this.damageNumbers.show(e.x, e.y, dmg, crit);
```
5. Add the test (below), then run `npm run check` and `npm run smoke`.

### Pitfalls
- Orbit contact damage is in `OrbitSystem.ts`, not `CombatSystem.ts` — missing it fails the spec (Orbit hits must crit too). The `e.hit(0, ...)` shove in `onPlayerTouched` is 0-damage contact, NOT weapon damage: leave it alone.
- Keep the `critChance > 0 &&` guard so runs without Contrast never consume rng on hits (seeded runs stay byte-identical to today) and no number ever uses the crit style.
- Only the damage value and the `crit` flag change: do not touch `p.knockback`, `fx.hit`, `sfx.hit`, shard drops or `killEnemy`.
- Pass the doubled value to `show` (it rounds for display); crit style (red, 28 px) already exists in `DamageNumbers.style`.
- No new system, no scene/listener/pooling changes — nothing to register or clean up on shutdown. Level-up menu and `rollUpgradeChoices` pick up the new entry automatically; no UI code changes.
- T0012 (Draft) and T0005 (elites) touch the same files; your edits are independent appends/inserts at different lines — do not reformat their code.

### Tests
In `tests/core/core.test.ts`, inside `describe('stats')` (imports for `BASE_STATS`, `RunState`, `UPGRADE_BY_ID` already exist):
```ts
  it('contrast adds 10% crit chance per level', () => {
    expect(BASE_STATS.critChance).toBe(0);
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('contrast')!;
    for (let i = 0; i < 3; i++) run.applyUpgrade(def);
    expect(run.stats.critChance).toBeCloseTo(0.3); // 0.1*3 is not exact in float
  });
```
`tests/content.test.ts` validates the new upgrade automatically (kebab-case id, `critChance` in BASE_STATS, weight > 0).
