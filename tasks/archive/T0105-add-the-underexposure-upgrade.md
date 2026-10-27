---
id: T0105
title: Add the Underexposure upgrade
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T11:32:46Z
claimed_at: 2026-10-27T13:08:25Z
finished_at: 2026-10-27T13:18:00Z
---

## Goal
A new level-up card that rewards finishing: while you own Underexposure, any badly wounded shape takes double damage from you, so the kills you are chasing are the ones you end fastest. It is the first conditional card in the pool — it changes which enemy you aim at, not a stat.

## Details
- New upgrade "Underexposure" in `UPGRADES` (appended at the end of the array, same shape as the other entries): `id: 'underexposure'`, `name: 'Underexposure'`, `description: 'Wounded shapes (under 50% HP) take double damage'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink`.
- The rule (the whole point of the card): when the player deals a hit to an enemy, if the enemy's current HP — measured before this hit is applied — is strictly below the threshold of its own max HP, that hit's damage is doubled (×2). The threshold is 50% of max HP at level 1 and widens to 75% of max HP at level 2 (the multiplier is ×2 at both levels).
- It applies to every damageable shape — normal enemies, elites, and bosses — so the second half of a boss fight is a faster, more satisfying finish.
- It composes multiplicatively with the existing crit rule: a crit that lands on a wounded enemy deals ×4 total. It composes with all weapon damage — Point, Line, Orbit contact, Arc, and the queued Counterpoint (T0055) — with no per-weapon special cases.
- Without the card, nothing changes: all damage is exactly as it is today.
- Legibility: damage numbers for hits that are doubled by Underexposure render in blue (PALETTE.blue) instead of ink, so the doubled finish is visible at the moment it happens (normal hits stay ink, crits stay red — see the DamageNumbers system from T0004, which already has the crit color path). The level-up card's description is the teach; there is no new HUD element, no new input, and no new scene.
- Keep the rule isolated from the enemy's own shape, texture and hitbox so it composes cleanly with the shape-aspect change queued on asus (T0098): the doubling is a damage-pipeline rule and the blue numbers live in the damage-number system — do not add markers to, or re-draw, the enemy shapes themselves.

## Acceptance criteria
- [ ] The level-up menu can offer the Underexposure card: a max-level-2, weight-3, ink-colored card reading "Wounded shapes (under 50% HP) take double damage".
- [ ] Without the card, a hit on an enemy at 40% of its max HP deals exactly the normal (un-doubled) damage — the game is unchanged.
- [ ] With level 1, a hit on an enemy at 49% of its max HP deals double damage, while a hit on an enemy at exactly 50% (or 51%) deals normal damage — the threshold is 50% of that enemy's own max HP, checked on the HP the enemy has before the hit.
- [ ] At level 2 the threshold widens: a hit on an enemy at 74% of its max HP is doubled, at 76% it is normal.
- [ ] It works on elites and bosses (a boss below the threshold takes double damage on the next hit), and a crit on a wounded enemy deals ×4 total.
- [ ] Damage numbers for Underexposure-doubled hits render in blue (PALETTE.blue); normal hits stay ink and crits stay red.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/core/underexposure.ts` - pure wounded-damage rule (no Phaser)
- edit `src/core/stats.ts` - new `woundThreshold` stat
- edit `src/content/upgrades/index.ts` - append Underexposure to `UPGRADES`
- edit `src/systems/DamageNumbers.ts` - blue color path in `show()`/`style()`
- edit `src/systems/CombatSystem.ts`, `src/systems/OrbitSystem.ts`, `src/systems/ArcSystem.ts` - apply the rule at the three enemy damage sites
- edit `src/systems/BossSystem.ts` - apply the rule at the boss projectile site
- edit `src/scenes/GameScene.ts` - `wound-threshold` invariant + its name in the `INVARIANTS` list
- create `tests/core/underexposure.test.ts` - unit tests for the rule

### Interfaces
```ts
// src/core/underexposure.ts
export const WOUND_MULTIPLIER: number; // = 2
export function underexposureDamage(threshold: number, hpBefore: number, maxHp: number, damage: number): { damage: number; doubled: boolean };
// doubled iff threshold > 0 && hpBefore < maxHp * threshold; damage = doubled ? damage * WOUND_MULTIPLIER : damage
// src/core/stats.ts (all three after critChance):
//   PlayerStats:  woundThreshold: number;   // 0 without the card
//   BASE_STATS:   woundThreshold: 0
//   STAT_LIMITS:  woundThreshold: { min: 0, max: 0.75 }
// src/systems/DamageNumbers.ts: show(x, y, amount, crit = false, red = false, blue = false) — blue prints PALETTE.blue
```

### Steps
1. Create `src/core/underexposure.ts` exactly as above; doc comment: "Underexposure: a hit on a shape below the wound threshold (a fraction of its own max HP) is doubled. `threshold` comes from `run.stats.woundThreshold` (0 = off). The threshold is checked on the HP the target has *before* this hit."
2. `src/core/stats.ts`: add the three entries above; `PlayerStats` doc line: "Fraction of a shape's own max HP below which a hit deals double damage (Underexposure; 0 = off)."
3. Append to the end of `UPGRADES` (currently after `'contrast'`): `{ id: 'underexposure', name: 'Underexposure', description: 'Wounded shapes (under 50% HP) take double damage', maxLevel: 2, weight: 3, mods: [{ stat: 'woundThreshold', op: 'add', value: 0.25 }], color: PALETTE.ink },` (0.25 per level: 0.5 at L1, 0.75 at L2).
4. `DamageNumbers.ts`: add `blue = false` as the last param of `show`; pass it to **both** `this.style(...)` calls (pool-creation and `setStyle`); `style(crit, red, blue)` color = `crit || red ? PALETTE.red : blue ? PALETTE.blue : PALETTE.ink`, size stays `crit ? 28 : 20`.
5. The three enemy sites — CombatSystem `onProjectileHit` (line 62), OrbitSystem `update` (line 71), ArcSystem `fire` (line 92): replace `const dmg = <expr>;` with `const wound = underexposureDamage(this.run.stats.woundThreshold, e.hp, e.maxHp, <expr>);` + `const dmg = wound.damage;` where `<expr>` is the current right-hand side (`crit ? p.damage * 2 : p.damage` in Combat; `(crit ? 2 : 1) * def.damage * this.run.stats.damageMul` in Orbit; `(crit ? 2 : 1) * def.damage * stats.damageMul` in Arc), and change `show(e.x, e.y, dmg, crit)` to `show(e.x, e.y, dmg, crit, false, wound.doubled)`. Add `import { underexposureDamage } from '../core/underexposure';` to each file.
6. BossSystem `onProjectileHit` (line 288; the boss has **no** crit path today — do not add one): replace `const died = b.hit(p.damage);` with `const wound = underexposureDamage(this.run.stats.woundThreshold, b.hp, b.maxHp, p.damage);` + `const died = b.hit(wound.damage);`, and change `show(b.x, b.y, p.damage)` to `show(b.x, b.y, wound.damage, false, false, wound.doubled)`.
7. GameScene: in `registerInvariants()` add `hook.addInvariant('wound-threshold', () => (this.run.stats.woundThreshold >= 0 && this.run.stats.woundThreshold <= 0.75 + 1e-6 ? null : \`woundThreshold ${this.run.stats.woundThreshold}\`));` and append `'wound-threshold'` to the `INVARIANTS` array (line 361).
8. Create `tests/core/underexposure.test.ts` (cases below).
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Threshold is checked on pre-hit HP: pass `e.hp`/`b.hp` into the call *before* `hit()` runs; never re-read HP afterwards.
- Color precedence: crit (red, size 28) beats blue — a crit on a wounded enemy renders red at ×4. Do not change crit sizing.
- Leave the zero-damage shove calls `e.hit(0, ...)` (combat contact, slam wave) untouched.
- No new pooled objects, listeners, scenes or input; the only shutdown work is the invariant name.
- T0055 (Counterpoint) also appends to `UPGRADES` — append after whatever the last entry is when you edit; Counterpoint projectiles flow through CombatSystem, so the rule composes with it for free.
- `tests/content.test.ts` already passes (non-empty mods, stat in BASE_STATS); do not edit it.

### Tests
`tests/core/underexposure.test.ts` (vitest, model on `tests/core/critChance.test.ts`):
- threshold 0: `underexposureDamage(0, 40, 100, 10)` → `{ damage: 10, doubled: false }` (game unchanged without the card)
- 0.5: `(0.5, 49, 100, 10)` → `{20, true}`; `(0.5, 50, 100, 10)` → `{10, false}`; `(0.5, 51, 100, 10)` → `{10, false}`
- 0.75: `(74,100)` doubled; `(75,100)` and `(76,100)` not doubled
- target's own max: `(0.5, 9, 20, 10)` doubled; `(0.5, 10, 20, 10)` not
- multiplies, not flat: `(0.5, 1, 100, 13.5)` → 27; `WOUND_MULTIPLIER` is 2
- `RunState`: base `woundThreshold` 0; applying `UPGRADE_BY_ID.get('underexposure')` once → 0.5, twice → 0.75; `computeStats([{ stat: 'woundThreshold', op: 'add', value: 99 }])` clamps to 0.75

## Result (attempt 1, desktop)

Added the Underexposure level-up card (maxLevel 2, weight 3, ink) with a new pure rule in src/core/underexposure.ts and a `woundThreshold` stat (0 off, clamped 0–0.75): hits on enemies, elites, or bosses below 50% (L1) / 75% (L2) of their own max HP — checked on pre-hit HP — deal ×2 damage and pop blue damage numbers, composing multiplicatively with crits (×4). Applied at all four damage sites (Combat, Orbit, Arc, Boss), with a `wound-threshold` scene invariant and unit tests in tests/core/underexposure.test.ts. Sole deviation from the design: the upgrade mod is +0.5/level rather than +0.25, because applyUpgrade pushes mods once per level and the acceptance criteria require 0.5 at L1 — the design's own 0.75 STAT_LIMITS cap then produces L2 = 0.75. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 9.6 min

```
game/src/content/upgrades/index.ts    |  9 +++++++
 game/src/core/stats.ts                |  4 ++++
 game/src/core/underexposure.ts        | 11 +++++++++
 game/src/scenes/GameScene.ts          |  5 +++-
 game/src/systems/ArcSystem.ts         |  6 +++--
 game/src/systems/BossSystem.ts        |  6 +++--
 game/src/systems/CombatSystem.ts      |  6 +++--
 game/src/systems/DamageNumbers.ts     | 12 +++++-----
 game/src/systems/OrbitSystem.ts       |  6 +++--
 game/tests/core/underexposure.test.ts | 45 +++++++++++++++++++++++++++++++++++
 10 files changed, 95 insertions(+), 15 deletions(-)
```
