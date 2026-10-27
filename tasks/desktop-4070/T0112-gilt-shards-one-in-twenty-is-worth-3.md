---
id: T0112
title: Gilt shards — one in twenty is worth 3×
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T13:24:32Z
claimed_at: 2026-10-27T14:31:21Z
finished_at: 2026-10-27T14:45:23Z
---

## Goal
The shard economy gets a small gamble: 5% of the shards you collect are gilt and worth 3× XP, so a run starts to feel like a treasure hunt — without a new pickup type, HUD element or sound.

## Details
- Roll: every shard instance rolls exactly once at spawn, with the existing seeded Rng: 5% of all dropped shards become gilt. No per-source special cases — normal, elite and boss drops all use the same roll. Keep the roll as a pure, unit-testable helper in `src/core/` — the closest example is the pure rule module `src/core/underexposure.ts` — and store the result as a `gilt` flag on the shard (entity: `src/entities/Shard.ts`).
- Look: a gilt shard is identical to a normal shard in shape, size, motion and pickup radius (Gravity), with a 2 u yellow (PALETTE.yellow) outline and a small yellow center dot at 40% of the shard body's radius — flat Bauhaus, no glow or gradient. Normal shards render exactly as today.
- Value: a gilt shard is worth exactly 3× the XP a normal shard of the same drop would be worth. The existing pickup multiplier (the Composition upgrade's `xpMul`) applies on top, in the same order as today. XP math lives in the pickup path (`src/systems/Pickup.ts` is the closest existing file).
- No new SFX (the pickup sound is unchanged), no new HUD element, no new input, no new scene. The HUD score and the kill feed (T0106) are untouched — shards and score stay separate.

## Acceptance criteria
- [ ] The gilt roll is deterministic under a fixed seed, and over 1000 seeded rolls the gilt fraction lands between 0.03 and 0.07 — locked by unit tests (new test file, model on `tests/core/underexposure.test.ts`)
- [ ] A gilt shard looks like a normal shard with a 2 u yellow outline and a small yellow center dot; normal shards are unchanged
- [ ] Picking up a gilt shard grants exactly 3× the XP a normal shard of the same drop grants, with the Composition multiplier applied on top exactly as today
- [ ] Pickup radius, pickup sound and shard motion are identical for both kinds
- [ ] Elite and boss kills drop shards exactly as today, with the same 5% roll per shard
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop-4070)

### Files
- create `src/core/gilt.ts` - pure rule (no Phaser): gilt chance/multiplier, the roll, and the XP helper
- edit `src/entities/Shard.ts` - new `gilt` field; texture swap in `drop()`
- edit `src/systems/PickupSystem.ts` - one seeded roll per drop; 3× applied at collect on both paths
- edit `src/art/textures.ts` - new `TEX.shardGilt` key + boot draw call
- create `tests/core/gilt.test.ts` - deterministic 1000-roll test, parameter pins

### Interfaces
```ts
// src/core/gilt.ts (new file)
export const GILT_CHANCE = 0.05;
export const GILT_MULTIPLIER = 3;
export function rollGilt(rng: Rng): boolean;                    // rng.chance(GILT_CHANCE) — exactly one draw
export function shardXp(value: number, gilt: boolean): number;   // gilt ? value * GILT_MULTIPLIER : value

// src/entities/Shard.ts
gilt = false;                                // new field, reset in drop()
drop(x: number, y: number, value: number, gilt: boolean): void  // param required, no default
```

### Steps
1. Create `src/core/gilt.ts`:
```ts
import type { Rng } from './rng';

/** Gilt shards: GILT_CHANCE of dropped shards are gilt and worth GILT_MULTIPLIER × the same drop's XP. */
export const GILT_CHANCE = 0.05;
export const GILT_MULTIPLIER = 3;

/** One seeded roll per shard, taken once at drop time (exactly one rng draw). */
export function rollGilt(rng: Rng): boolean {
  return rng.chance(GILT_CHANCE);
}

/** XP awarded on collect. `value` is the base drop value; xpMul is applied afterwards in run.addXp. */
export function shardXp(value: number, gilt: boolean): number {
  return gilt ? value * GILT_MULTIPLIER : value;
}
```
2. In `src/art/textures.ts`, after line 31 (`shard: 'shard',`) add:
```ts
  /** XP pickup, gilt variant: ink fill with yellow outline + center dot, worth 3× XP. */
  shardGilt: 'shardGilt',
```
and after line 81 (the `TEX.shard` draw call) add:
```ts
  graphicsTexture(scene, TEX.shardGilt, 18, 18, (g) => {
    drawShape(g, 'diamond', 8, 8, 7, PALETTE.ink, { outline: PALETTE.yellow, outlineWidth: 2, shadow: true });
    drawShape(g, 'circle', 8, 8, 2.8, PALETTE.yellow, { outlineWidth: 1.5, shadow: false }); // dot = 40% of body radius 7
  });
```
3. In `src/entities/Shard.ts`, add field `gilt = false;` after `vy = 0;` and replace `drop()`:
```ts
  drop(x: number, y: number, value: number, gilt: boolean): void {
    this.setPosition(x, y).setActive(true).setVisible(true).setDepth(DEPTH.pickups);
    this.value = value; // base value drives scale — size must stay identical to normal
    this.gilt = gilt;
    this.setTexture(gilt ? TEX.shardGilt : TEX.shard);
    this.magnetized = false;
    this.vx = 0;
    this.vy = 0;
    this.setScale(1 + Math.min(value, 12) * 0.07);
    this.setRotation(0);
  }
```
4. In `src/systems/PickupSystem.ts` import `{ rollGilt, shardXp }` from `'../core/gilt'`. In `drop()`: first line `const gilt = rollGilt(this.run.rng);`, pool-full branch becomes `this.collect(shardXp(value, gilt));`, else `s.drop(x, y, value, gilt);`. In `update()` at the collect site: `this.collect(shardXp(s.value, s.gilt));`. Nothing else changes.
5. Create `tests/core/gilt.test.ts` (model `tests/core/underexposure.test.ts`):
```ts
import { describe, expect, it } from 'vitest';
import { GILT_CHANCE, GILT_MULTIPLIER, rollGilt, shardXp } from '../../src/core/gilt';
import { Rng } from '../../src/core/rng';

describe('gilt shard rule', () => {
  it('is deterministic under a fixed seed', () => {
    const a = new Rng(1);
    const b = new Rng(1);
    const ra = Array.from({ length: 1000 }, () => rollGilt(a));
    expect(ra).toEqual(Array.from({ length: 1000 }, () => rollGilt(b)));
  });

  it('gilt fraction is in [0.03, 0.07] over 1000 seeded rolls', () => {
    const rng = new Rng(1);
    let gilt = 0;
    for (let i = 0; i < 1000; i++) if (rollGilt(rng)) gilt += 1;
    expect(gilt / 1000).toBeGreaterThanOrEqual(0.03);
    expect(gilt / 1000).toBeLessThanOrEqual(0.07);
  });

  it('takes exactly one rng draw per roll', () => {
    const a = new Rng(7);
    const b = new Rng(7);
    for (let i = 0; i < 50; i++) expect(rollGilt(a)).toBe(b.next() < GILT_CHANCE);
  });

  it('pins the roll parameters', () => {
    expect(GILT_CHANCE).toBe(0.05);
    expect(GILT_MULTIPLIER).toBe(3);
  });

  it('multiplies the drop, not a flat bonus', () => {
    expect(shardXp(1, false)).toBe(1);
    expect(shardXp(2, true)).toBe(6);
    expect(shardXp(0.5, true)).toBe(1.5);
  });
});
```

### Pitfalls
- `Shard.value` must stay the BASE value: it drives `setScale(...)` — gilt shards must render at normal size. The ×3 happens only in `shardXp` at collect, so `run.addXp` still applies xpMul last, same order as today. Do not multiply anywhere else.
- The pool-full branch of `drop()` (when `this.shards.get(x, y)` returns null) must also award gilt value via `shardXp(value, gilt)`, or 5% of full-pool drops are worth less than spec.
- The roll happens exactly once, in `PickupSystem.drop()` — normal, elite and boss drops all flow through it already. No re-roll on collect; no new rolls in CombatSystem/BossSystem; leave both files untouched.
- Texture must keep the exact 18×18 geometry (diamond r=7 at (8,8)) so size, motion, magnet and `COLLECT_DISTANCE` are identical for both kinds. Leave the normal `TEX.shard` line byte-for-byte untouched. The center dot needs `shadow: false` (no doubled offset shadow on a 5.6 px dot).
- Make `gilt` required in `Shard.drop()` (no default) so any missed call site fails typecheck; there is exactly one caller (`PickupSystem.drop`).
- No changes to Sfx, HUD, kill feed (T0106), pickup radius or magnet constants — both kinds must be identical there.

### Tests
- `tests/core/gilt.test.ts` as above: determinism under fixed seed, gilt fraction in [0.03, 0.07] over 1000 seeded rolls, exactly-one-draw, parameter pins, exact ×3 XP.
- If the fraction band assertion fails at seed 1, change only that test's seed constant (try 2); never change `GILT_CHANCE` — it is pinned by a separate assertion.
- `npm run check` and `npm run smoke` must pass; `tests/content.test.ts` is unaffected (no new content).

## Result (attempt 1, desktop-4070)

Gilt shards landed per the design: new pure rule module `src/core/gilt.ts` (`GILT_CHANCE = 0.05`, `rollGilt` as exactly one seeded draw, `shardXp` for the ×3), a `gilt` field plus required-gilt `drop()` on `src/entities/Shard.ts` that swaps to a new 18×18 `TEX.shardGilt` texture (ink diamond, 2 u yellow outline, yellow center dot, identical geometry and motion), and one roll per drop in `src/systems/PickupSystem.ts` applied at both collect paths so the Composition `xpMul` still stacks on top in the same order. Elite and boss drops flow through the same roll untouched; no SFX, HUD, input or scene changes. Locked by new `tests/core/gilt.test.ts`; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 14.0 min

```
game/src/art/textures.ts         |  6 ++++++
 game/src/core/gilt.ts            | 15 +++++++++++++++
 game/src/entities/Shard.ts       |  8 ++++++--
 game/src/systems/PickupSystem.ts |  8 +++++---
 game/tests/core/gilt.test.ts     | 37 +++++++++++++++++++++++++++++++++++++
 5 files changed, 69 insertions(+), 5 deletions(-)
```
