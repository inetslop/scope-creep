---
id: T0242
title: "Beam combos IIb: a beam kill splits into Spray needles"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T00:29:56Z
epic: E4
design_attempts: 1
---

## Goal
Finish the beam's combination set (T0130, T0210, T0132): when a beam kills, the corpse splits into Spray's needles — the one beam clause that turns a kill into a new attack on other enemies, so a Beam + Spray tower pays for the Spray's slot with every kill.

## Details
- When a Beam-first tower deals the killing blow (its own beam line, its added beams or the T0210 Lance corridor — anything the source-of-kill rule attributes to it) and the tower has one or more Sprays added, one homing needle launches from the corpse per Spray copy added.
- The needles seek different nearest other living enemies within 2 cells of the corpse (one target per needle, as Spray's split did); a needle with no enemy in reach does not launch — nothing ever fires at nothing.
- Each needle: 12 damage, homing like a Bolt, at the Spray pellet's speed, in the Spray pellet's look tinted with the killing tower's color (the lighter tint), so a needle reads as "the beam tower's Spray."
- A needle's damage counts for the killing beam tower: its panel kills line, the end card's by-tower chips, the combo and Mint's aura all attribute it to the beam tower. A needle kill is itself a beam kill — it launches the split again (the cascade is bounded by the 2-cell reach and the 12 damage per needle).
- The split is a kill moment only: the beam's ongoing ticks never split, a beam tower without added Spray is unchanged, a Spray-first tower (the shotgun) is unchanged, and the "≈ N/s" line gains no term from added Spray on a beam (a kill bonus, not cadence). No new sound.
- No new mark on the tower: it already shows its Sprays in its slots; the needles are the effect's own feedback.
- Card lines: unchanged — Spray keeps "Blasts 5 pellets in a cone: deadly up close. Added: +2 pellets per blast." (the clause is a board interaction, not a card change, as Bolt's card is unchanged by its beam ray, T0130).
- New files: the split as a new enemy hook on the burnLeap pattern (T0059) plus a small pure module for the split's math (how many needles, which targets), unit-tested; the hook's registry line is the only edit to a shared file besides the projectile spawn.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Spray | the added form this changes: +2 pellets per blast, inert on a beam (no shots) | makes the added form work on a beam: a kill launches homing needles at enemies the beam is not holding |
| Beam | the host's kind (beam) | gives the beam's kill a projectile consequence — a beam never produced a projectile before |
| Bolt (T0130) | a beam combo: an added form changing the beam's lines | adds parallel rays that fire on the beam's own cadence at the beam's targets; this fires once per kill, at other enemies, and can chain from its own kills |
| Lance (T0210) | a beam combo | extends the beam's line straight through the target it is holding; this redirects damage from a dead target to live ones |
| Splash (T0210) | a beam combo | scorch adds damage to the beam's current target; this attacks different enemies |
| Mint | a kill-triggered effect | the kill drops gold for an aura within 2 cells; this kill deals damage, and only the killing tower's own Sprays count |

## Acceptance criteria
- [ ] A Beam-first tower with one added Spray: when the beam deals the killing blow, one small homing needle (12 damage, the pellet's look and speed in the tower's lighter tint) flies to the nearest other living enemy within 2 cells of the corpse; with none in reach, nothing launches.
- [ ] Two added Sprays launch two needles at two different nearest enemies; the kill and any needle kills count for the beam tower on its panel kills line and the end card's by-tower chips, and a needle kill launches the split again.
- [ ] A beam tower without added Spray, a Spray-first tower, every non-beam kill and the beam's ongoing ticks are unchanged; the "≈ N/s" line is unchanged by added Spray on a beam.

## Design (architect, inet-racing)

### Files
- create `src/core/sprayNeedles.ts` - pure split math: needle count, needle damage, 2-cell reach, target pick (wraps `pickNearest`)
- create `src/systems/enemyHooks/sprayNeedles.ts` - the enemy hook: a beam kill with added Sprays fires one homing needle per Spray
- create `tests/core/sprayNeedles.test.ts` - unit tests for the core module
- edit `src/systems/ProjectileSystem.ts` - one new method `fireNeedle()` (the projectile spawn; homing bolt with the pellet's thin tracer look)
- edit `src/systems/enemyHooks/hook.ts` - one line in `EnemyHookContext` (`projectiles()`) + one type import
- edit `src/systems/EnemySystem.ts` - one field (`projectiles`), one line in the ctx object (line 72), one type import
- edit `src/scenes/GameScene.ts` - one wiring line next to `this.enemies.towers = ...` (line 112)
- edit `src/systems/enemyHooks/index.ts` - import + one registry line next to `burnLeap`

### Interfaces
```ts
// src/core/sprayNeedles.ts (pure, no Phaser)
import { CELL } from '../config';
import { pickNearest, type TargetCandidate } from './targeting';
import type { AttackKind } from '../content/types';

export const NEEDLE_DAMAGE = 12;
export const NEEDLE_REACH_CELLS = 2;
/** One per Spray in the tower, only when the beam is its own attack. `TowerSpec` satisfies this. */
export function needleCount(spec: { kind: AttackKind; sprayCount: number }): number: number; // body: return spec.kind === 'beam' ? spec.sprayCount : 0;
/** Up to `count` other living enemies within NEEDLE_REACH_CELLS of the corpse, nearest first; identity-skip of `corpse` is pickNearest's. */
export function needleTargets(corpse: TargetCandidate, count: number, enemies: readonly TargetCandidate[]): number[]; // body: return count <= 0 ? [] : pickNearest(corpse, NEEDLE_REACH_CELLS * CELL, enemies, count);

// src/systems/ProjectileSystem.ts — add next to fireCone():
/** A Spray needle from a beam's kill (T0242): a homing bolt in the pellet's thin look. */
fireNeedle(x: number, y: number, target: Enemy, payload: HitPayload, speed: number): void;
// body: this.take().fire(x, y, target, payload, speed, true);   // true = asTracer

// src/systems/enemyHooks/hook.ts — in EnemyHookContext, after `towers(): readonly Tower[];`:
/** The projectile pool (set after it exists, like `towers`): a beam's kill needles fly through it (T0242). */
projectiles(): ProjectileSystem | undefined;
// plus: import type { ProjectileSystem } from '../ProjectileSystem';
```

### Steps
1. Create `src/core/sprayNeedles.ts` exactly as above (bodies inline in one statement, comment on each export).
2. Create `tests/core/sprayNeedles.test.ts` (vitest, model `tests/core/mint.test.ts`).
3. Add `fireNeedle` to `ProjectileSystem` next to `fireCone` (`src/systems/ProjectileSystem.ts:60`).
4. `hook.ts`: add the type import and the `projectiles()` line. `EnemySystem.ts`: add, next to the `towers` field (line 59), `projectiles: () => ProjectileSystem | undefined = () => undefined;` and extend the ctx object (line 72) with `projectiles: () => this.projectiles()` — it must read the field through `this`, exactly like `towers: () => this.towers()`, or the hook keeps seeing the initial empty one. Add `import type { ProjectileSystem } from './ProjectileSystem';`.
5. `GameScene.ts`: after line 112 add `this.enemies.projectiles = () => this.projectiles;`.
6. Create `src/systems/enemyHooks/sprayNeedles.ts`:
```ts
export const sprayNeedles: MakeEnemyHook = ({ enemies, projectiles }) => ({
  onKill({ enemy, source }) {
    if (!source) return;
    const count = needleCount(source.spec);
    if (count <= 0) return;
    const targets = needleTargets(enemy, count, enemies.all);
    if (targets.length === 0) return; // nothing ever fires at nothing
    const pool = projectiles();
    if (!pool) return;
    const payload: HitPayload = { damage: NEEDLE_DAMAGE, splash: 0, splashCap: 0, slow: undefined, root: undefined, pierce: 0, push: 0, mark: undefined, burn: undefined, color: lightOf(PALETTE[towerColor(source.augments) ?? 'faint']), source };
    for (const i of targets) pool.fireNeedle(enemy.x, enemy.y, enemies.all[i]!, payload, source.spec.projectileSpeed * CELL);
  },
});
```
Imports: `CELL` from `../../config`; `PALETTE, lightOf` from `../../content/palette`; `towerColor` from `../../core/augments`; `needleCount, needleTargets, NEEDLE_DAMAGE` from `../../core/sprayNeedles`; `type { HitPayload }` from `../EnemySystem`; `type { MakeEnemyHook }` from `./hook`.
7. `enemyHooks/index.ts`: import `sprayNeedles` next to the `burnLeap` import; add `sprayNeedles,` on its own line right after `burnLeap,`.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `Projectile.fire()` tints the bolt with `payload.color` (pellets get `lightOf` inside `firePellet`): apply `lightOf` once in the hook, don't double-lighten. `fireNeedle` passes `asTracer=true`, so the needle is the thin pellet look, not the chunky bolt token; a homing tracer rotates fine (flat texture).
- The corpse is still `active` in `enemies.all` when `onKill` runs (pool return happens after the hooks): `pickNearest` skips it only by object identity — pass the actual `enemy`, never a copy.
- Don't build a `Projectile` by hand in the hook; the pool and `despawn`/`land`/`hit` path already attribute `payload.source` (panel kills, end-card chips, combo, Mint gold all flow from `kill(e, source)`).
- Homing needles ride the existing `ProjectileSystem.update` — no new `update` loop, no `dt` math to write; the existing `projectiles.stuck` invariant covers a needle that never lands. The hook keeps no state, so no new `INVARIANTS` line is needed.
- The "≈ N/s" line needs no change: `spec.spray` only grows for `kind === 'spray'` (`core/augments.ts:180`); a beam's spec is untouched by added Sprays. Card lines are unchanged too — no content files.
- Cascade (needle kill splits again) is automatic and bounded: the needle's `payload.source` is the beam tower, and each re-split needs a living enemy within 2 cells of the new corpse.

### Tests
- `tests/core/sprayNeedles.test.ts`: `needleCount` — beam + 2 Sprays → 2, plain beam → 0, Spray-first with added Spray → 0, shot tower with added Spray → 0 (build specs with `towerSpec` and `AugmentCopy` copies, as `tests/core/mint.test.ts` does). `needleTargets` — returns [] when nothing within 2 cells; nearest-first with one distinct enemy per needle; skips the corpse (same object in the list); includes an enemy at exactly `2*CELL`, excludes one just past; returns fewer than `count` when fewer are in reach; skips `active: false` entries.
