---
id: T0103
title: Add the Hare enemy — it quickens as it weakens
assignee: desktop-4070
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T10:47:29Z
---

## Goal
A new enemy that rewards burst damage instead of chip damage: the Hare is a small green circle that starts sluggish and runs faster every quarter of its HP it loses, so the kill you are chasing gets quicker the longer it survives.

## Details
- New enemy in its own content data file, a sibling of the existing `src/content/enemies/*.ts` files (closest examples: the Dart and Wedge chasers). Register it in the spawn roster like every other director-spawnable enemy.
- Shape and look: small green circle (PALETTE.green), radius 12, no spin.
- Stats: 24 hp, 8 contact damage, 2 XP, threat 2, spawn weight 4, `unlockAtSec` 100 (first possible at 1:40), knockbackResist 0.1.
- Movement: `chase` — it runs straight at the player (like the Wedge), but its speed is not fixed. It starts slow and quickens in four steps as it takes damage:
  - Speed = 40 × 1.3^n, where n is the number of full 25%-of-max-HP steps it has lost (n = 0, 1, 2, 3, capped at 3).
  - So: 40 u/s at full HP → 52 after it loses a quarter → 67.6 after two quarters → 87.9 after three quarters (its top speed, reached at 25% HP and below, including 1 hp).
  - The step-up is the new behavior: no existing enemy changes its own speed based on the damage it has taken — the wounded Hare is the fast one.
- Closest existing enemy: the Wedge (a straight-line chaser). What is new: the Wedge's speed never changes; the Hare's speed rises in four steps (40 / 52 / 67.6 / 87.9) as its HP crosses below 75% / 50% / 25% of max.
- Marginalia: on its first sighting in a run, the dry note "QUICKER AS IT WEAKENS" fades in beside it, like every other new enemy type.
- Keep the speed rule in a pure function (unit-tested) that maps HP-fraction → speed, so the four steps are locked to the numbers above.
- The enemy pool moves from 7/10 to 8/10 — no existing enemy is removed or changed.

## Acceptance criteria
- [ ] No Hare spawns before 1:40; at and after 100 s it can spawn as a small green circle.
- [ ] A full-health Hare chases at a sluggish 40 u/s; as it drops to 75% / 50% / 25% of max HP its chase speed steps up to 52 / 67.6 / 87.9 u/s — visibly harder to lose the longer it lives.
- [ ] Its first sighting in a run prints the marginalia "QUICKER AS IT WEAKENS."
- [ ] It deals 8 contact damage and is worth 2 XP; on death it shatters into fragments and drops shards like any other enemy.
- [ ] A unit test pins the speed to HP fraction: 40 while above 75% max HP, 52 at 75% down to above 50%, 67.6 at 50% down to above 25%, and 87.9 at 25% and below (reached while it still has 1 hp).

## Design (architect, desktop)

1. **The task's "7/10 → 8/10" count is stale** — the roster already has 8 enemies (Platen landed in T0091). Adding the Hare makes 9/10, still under the content bar. Not a reject.
2. **The formula `40 × 1.3^n` contradicts the pinned numbers**: `40 × 1.3³ = 87.88`, not 87.9. The acceptance criteria pin 40 / 52 / 67.6 / 87.9, so the pure function must use a literal table, not the power formula.

DESIGN:
### Files
- create `src/core/hareSpeed.ts` - pure HP→speed rule (no Phaser imports, like `core/slam.ts`)
- create `src/content/enemies/hare.ts` - the Hare `EnemyDef` data, sibling of `wedge.ts`
- create `tests/core/hareSpeed.test.ts` - unit test pinning the four steps
- edit `src/content/types.ts` - add `'quicken'` to the `EnemyBehavior` union
- edit `src/content/enemies/index.ts` - import `hare` and append it to `ENEMIES`
- edit `src/entities/Enemy.ts` - import `hareSpeed` and add a `case 'quicken'` in `steer()`

No changes needed to textures (generated automatically from `ENEMIES` in `art/textures.ts`), Marginalia (reads `def.note` on `run.firstSighting`), SpawnSystem (director gates on `unlockAtSec`), FxSystem (death shatter/shards are generic), HUD, audio, or pool sizes.

### Interfaces
```ts
// src/core/hareSpeed.ts
export const HARE_STEPS: readonly number[]; // [40, 52, 67.6, 87.9]
/** Chase speed (world units/second) of the Hare at the given HP. Steps up at ≤75%, ≤50%, ≤25% of max HP. */
export function hareSpeed(hp: number, maxHp: number): number {
  let n = 0;
  if (maxHp > 0) {
    if (hp <= maxHp * 0.75) n = 1;
    if (hp <= maxHp * 0.5) n = 2;
    if (hp <= maxHp * 0.25) n = 3;
  }
  return HARE_STEPS[n];
}

// src/content/types.ts — append to EnemyBehavior:
  /** Chases the player, but quickens as it weakens: speed steps up when HP crosses ≤75% / ≤50% / ≤25% of max (the Hare). Speed from core/hareSpeed.ts. */
  | 'quicken'

// src/entities/Enemy.ts — new case in steer(), next to 'chase':
      case 'quicken': {
        const s = hareSpeed(this.hp, this.maxHp);
        vx = toTarget.x * s;
        vy = toTarget.y * s;
        break;
      }
```
`hare.ts` data (exact values): `id 'hare'`, `name 'Hare'`, `note 'QUICKER AS IT WEAKENS'`, `hp 24`, `speed 40`, `contactDamage 8`, `xp 2`, `threat 2`, `spawnWeight 4`, `unlockAtSec 100`, `behavior 'quicken'`, `knockbackResist 0.1`, `look: { shape: 'circle', radius: 12, body: PALETTE.green, accent: PALETTE.ink }` (no `spin`).

### Steps
1. Create `src/core/hareSpeed.ts` exactly as above.
2. Create `tests/core/hareSpeed.test.ts` (below); run `npm run check` — the rule is green before any game code touches it.
3. Edit `src/content/types.ts`: add the `'quicken'` member to `EnemyBehavior` (keep the doc-comment style of the other members).
4. Create `src/content/enemies/hare.ts` with the data above, modeled line-for-line on `wedge.ts`.
5. Edit `src/content/enemies/index.ts`: `import { hare } from './hare';` and append `hare` to the `ENEMIES` array (roster becomes 9/10).
6. Edit `src/entities/Enemy.ts`: add `import { hareSpeed } from '../core/hareSpeed';` (next to the `core/slam` import) and the new `steer()` case.
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Do not compute `40 * Math.pow(1.3, n)`** — the fourth step is 87.88 (with float noise), not the pinned 87.9. Use the literal table. The "× 1.3" in the brief is descriptive only.
- **Boundaries are ≤**: at exactly 75% (18/24) the speed is already 52; at exactly 25% (6/24) it is 87.9. `0.75/0.5/0.25` are exact binary fractions, so `hp <= maxHp * 0.75` needs no epsilon and works for elite/late-game Hares whose `maxHp` differs (thresholds scale automatically — `spawn()` sets `this.maxHp`).
- Add **no new fields to `Enemy`** — there is nothing to reset in `spawn()`/`despawn()`; the speed is derived from `hp`/`maxHp` every frame. Pooled reuse stays correct.
- The `'quicken'` case must **not** read `def.speed`; `speed: 40` in the def is documentation plus the `content.test.ts` requirement (`speed >= 0`).
- `content/types.ts` and `entities/Enemy.ts` are also touched by open T0098 (shape aspect). Edit only the `EnemyBehavior` union and the `steer()` switch; keep hunks minimal.
- The brief's "7/10 → 8/10" is stale (Platen already landed): the roster goes 8 → 9. Do not remove or alter any existing enemy.
- No new system, scene, input or HUD element: no invariants, listeners, or layout work. Death shatter, shard drops, marginalia note, elite ring, and first-sighting handling all come for free from the existing data-driven paths.

### Tests
- `tests/core/hareSpeed.test.ts` (vitest, modeled on `tests/core/slam.test.ts`): assert `HARE_STEPS` equals `[40, 52, 67.6, 87.9]` (use `toBe`, not `toBeCloseTo` — the function returns the table literals); with `maxHp = 24`: 40 for hp 24/21/20/19; 52 for hp 18/17/15/13; 67.6 for hp 12/10/8/7; 87.9 for hp 6/3/1/0; with `maxHp = 48` (elite): 40 at 48, 52 at 36, 67.6 at 24, 87.9 at 12; and `hareSpeed(5, 0)` returns a value from `HARE_STEPS` (no NaN).
- `tests/content.test.ts` validates the new def automatically (all-caps note, radius in [4,80], knockbackResist in [0,1]) — no edits needed there.
