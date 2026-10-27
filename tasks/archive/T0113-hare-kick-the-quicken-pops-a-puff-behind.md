---
id: T0113
title: Hare kick — the quicken pops a puff behind it
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0110]
attempts: 1
created: 2026-10-27T13:48:11Z
claimed_at: 2026-10-27T14:52:57Z
finished_at: 2026-10-27T15:17:40Z
---

## Goal
The Hare's quicken (T0103) is only felt right now — a small ink puff pops behind it the moment it steps up a speed, so the kill you are chasing visibly gets faster.

## Details
- Trigger: the Hare's speed step (computed every frame from its HP fraction by `hareSpeed()` in `src/core/hareSpeed.ts`) increases. The Hare's quicken steering (the case T0103 added in `src/entities/Enemy.ts`) is where the step is known each frame: remember the last step per Hare, and when the current step is higher, fire one puff burst and record the new step. A Hare starts at step 0 and steps only rise (HP never recovers), so at most 3 bursts per Hare's life.
- Burst: three flat ink specks (the TEX dot idiom — no outline, no shadow, same style as the streak-break specks (T0101) and the Platen dust (T0110)), radius 3–5 units, spawned at a point 12 units behind the Hare's center, opposite to the direction it is travelling (if it happens to be stationary, fall back to a random angle from the run's seeded RNG).
- Each speck drifts 15–25 units outward within ±30° of that rear direction and fades linearly over 300 ms, then is discarded. Pool the specks in `src/systems/FxSystem.ts` exactly like the existing Platen dust pool (small pool, oldest slot reused) — closest example: the `slamDust` pool from T0110.
- Elite Hares get the same three specks at the same size. Angles, drifts and radii come from the run's seeded RNG, never `Math.random()`.
- No sound. No gameplay change: the Hare's 24 hp, 40 / 52 / 67.6 / 87.9 speed table, 8 contact damage, 2 XP and 100 s unlock are untouched. No HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] The moment a Hare first enters each higher speed step, exactly one burst of three flat ink specks (radius 3–5) pops 12 units behind it, opposite its travel, drifts 15–25 units and is gone within 300 ms.
- [ ] No puffs at any other moment — not on spawn, not on death, not on contact, not for a step already reached.
- [ ] A Hare killed while at full HP produces no puff.
- [ ] No new sound plays, the Hare's hp / speed table / contact damage / XP / unlock are unchanged, and no HUD element, input or scene is added.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/core/hareSpeed.ts` — add `hareStep()`; `hareSpeed` becomes `HARE_STEPS[hareStep(...)]` (identical behavior)
- edit `src/entities/Enemy.ts` — remember last quicken step per Hare; one-shot flag; `consumeQuickenPuff()`
- edit `src/systems/SpawnSystem.ts` — consume flag; rear from velocity; call `fx.quickenPuff()`
- edit `src/systems/FxSystem.ts` — 9-slot speck pool + `quickenPuff()` (platemark-pool idiom; T0110's `slamDust` pool lands first — do not touch it)
- edit `src/scenes/GameScene.ts` — one pool invariant + its name in `INVARIANTS`
- edit `tests/core/hareSpeed.test.ts` — pin the step table

### Interfaces
```ts
// core/hareSpeed.ts
export function hareStep(hp: number, maxHp: number): number; // 0–3
// entities/Enemy.ts
consumeQuickenPuff(): boolean; // exactly once, the frame the step goes up
// systems/FxSystem.ts
quickenPuff(x: number, y: number, rear: number, rng: Rng): void; // (x,y)=Hare center, rear=rearward dir
get quickenSpeckCount(): number;
// systems/SpawnSystem.ts
private performQuickenPuff(e: Enemy): void;
```

### Steps
1. `hareSpeed.ts` — replace the `hareSpeed` body (keep `HARE_STEPS` + header comment):
```ts
/** Quickener step 0–3 at the given HP: one per full quarter of max HP lost. */
export function hareStep(hp: number, maxHp: number): number {
  if (maxHp > 0) {
    if (hp <= maxHp * 0.25) return 3;
    if (hp <= maxHp * 0.5) return 2;
    if (hp <= maxHp * 0.75) return 1;
  }
  return 0;
}

/** Chase speed (world units/second) of the Hare at the given HP. Steps up at ≤75%, ≤50%, ≤25% of max HP. */
export function hareSpeed(hp: number, maxHp: number): number {
  return HARE_STEPS[hareStep(hp, maxHp)];
}
```
2. `Enemy.ts` — import `hareStep` next to `hareSpeed`; add fields `private quickenStep = 0; private quickenPuffPending = false;` (group `// 'quicken' state`), reset both in `spawn()` beside the `slamPending` reset; in `steer()`'s `case 'quicken'` insert before `const s = ...`:
```ts
const step = hareStep(this.hp, this.maxHp);
if (step > this.quickenStep) { this.quickenStep = step; this.quickenPuffPending = true; }
```
and after `consumeSlam()`:
```ts
/** True exactly once, the frame a Hare's quicken step went up. SpawnSystem consumes it. */
consumeQuickenPuff(): boolean {
  const pending = this.quickenPuffPending;
  this.quickenPuffPending = false;
  return pending;
}
```
3. `FxSystem.ts` — after `PLATEMARK_COOLDOWN_MS`: `const QUICKEN_SPECK_MAX = 9; const QUICKEN_SPECK_LIFE_MS = 300;`; add `import type { Rng } from '../core/rng';`; fields `private readonly quickenSpecks: (Phaser.GameObjects.Image | undefined)[] = []; private quickenCursor = 0;`; and these members (pool sits beside T0110's pools, never reusing its names):
```ts
/** Hare quicken kick: three flat ink specks popping 12 units behind the Hare, drifting over `rear` ±30°. Pooled: oldest slot reused. */
quickenPuff(x: number, y: number, rear: number, rng: Rng): void {
  const ox = x + Math.cos(rear) * 12, oy = y + Math.sin(rear) * 12;
  for (let i = 0; i < 3; i += 1) {
    const angle = rear + rng.range(-Math.PI / 6, Math.PI / 6);
    const drift = rng.range(15, 25);
    const slot = this.takeQuickenSpeck();
    this.scene.tweens.killTweensOf(slot);
    slot.setPosition(ox, oy).setAlpha(1).setScale(rng.range(3, 5) / 4).setVisible(true); // TEX.dot is radius 4 at scale 1
    this.scene.tweens.add({ targets: slot, x: ox + Math.cos(angle) * drift, y: oy + Math.sin(angle) * drift, alpha: 0, duration: QUICKEN_SPECK_LIFE_MS, ease: 'Linear', onComplete: () => slot.setVisible(false) });
  }
}

/** Next quicken-speck slot (created lazily; round-robin so the oldest visible is reused first). */
private takeQuickenSpeck(): Phaser.GameObjects.Image {
  const i = this.quickenCursor;
  this.quickenCursor = (i + 1) % QUICKEN_SPECK_MAX;
  let slot = this.quickenSpecks[i];
  if (!slot) slot = this.scene.add.image(0, 0, TEX.dot).setTint(PALETTE.ink).setOrigin(0.5).setDepth(DEPTH.fx).setVisible(false);
  this.quickenSpecks[i] = slot;
  return slot;
}

/** Specks currently on screen (the quicken-specks invariant reads this). */
get quickenSpeckCount(): number { let n = 0; for (const s of this.quickenSpecks) if (s && s.alpha > 0) n += 1; return n; }
```
4. `SpawnSystem.ts` — in `update()` add `if (e.consumeQuickenPuff()) this.performQuickenPuff(e);` after the `consumeSlam` line; after `performSlam`:
```ts
/** A Hare quickened: an ink puff pops behind it, opposite its travel (stationary: random rear). */
private performQuickenPuff(e: Enemy): void {
  const v = (e.body as Phaser.Physics.Arcade.Body).velocity;
  const rear = (Math.hypot(v.x, v.y) > 1 ? Math.atan2(v.y, v.x) : this.run.rng.range(0, Math.PI * 2)) + Math.PI;
  this.fx.quickenPuff(e.x, e.y, rear, this.run.rng);
}
```
5. `GameScene.ts` — in `registerInvariants()` after the `platemark-pool` line: `hook.addInvariant('quicken-specks', () => (this.fx.quickenSpeckCount <= 9 ? null : \`${this.fx.quickenSpeckCount} quicken specks on screen\`));` and add `'quicken-specks'` to the `INVARIANTS` array after `'platemark-pool'`.
6. `tests/core/hareSpeed.test.ts` — import `hareStep`; add:
```ts
it('hareStep: 0–3 at the 75/50/25% thresholds, agreeing with hareSpeed', () => {
  expect(hareStep(24, 24)).toBe(0); expect(hareStep(18, 24)).toBe(1); expect(hareStep(12, 24)).toBe(2); expect(hareStep(6, 24)).toBe(3); expect(hareStep(5, 0)).toBe(0);
  for (const hp of [24, 20, 18, 12, 6, 3, 0]) expect(HARE_STEPS[hareStep(hp, 24)]).toBe(hareSpeed(hp, 24));
});
```
7. Run `npm run check` and `npm run smoke`.

### Pitfalls
- All 9 draws per burst (3 angles, 3 drifts, 3 radii) plus the stationary-rear fallback come from `this.run.rng` — never `Math.random()`.
- Flag sets only when `step > this.quickenStep` and records the new step the same frame: no puff at spawn (reset in `spawn()`), on death, on contact, or for a step already reached; HP never recovers → max 3 bursts per Hare.
- No elite branch: elite Hares get the same three specks at the same size — do not scale by `ELITE`.
- `killTweensOf(slot)` before reusing a slot; specks stay hidden until the tween's `onComplete`; round-robin = oldest reused, never hunt for a free slot.
- Invariant must be added in `registerInvariants` AND named in `INVARIANTS` (removed on shutdown), or it leaks across runs.
- Untouched: hare def (24 hp / 40-52-67.6-87.9 table / 8 dmg / 2 xp / 100 s), all Sfx (no sound), no HUD/input/scene; the 300 ms fade is a time-based tween, no `dt` math.

### Tests
- `tests/core/hareSpeed.test.ts`: the `hareStep` case above (step 0 at full HP, 1/2/3 at exactly 75/50/25%, `HARE_STEPS[hareStep] === hareSpeed` across the table).

## Result (attempt 1, yoga)

The Hare's quicken now kicks up a puff: when its speed step goes up, one burst of three flat ink specks (radius 3–5, the TEX dot idiom) pops 12 units behind it opposite its travel, drifts 15–25 units over the rearward direction ±30° from the run RNG, and fades over 300 ms. Implemented as a per-Hare last-step + one-shot flag in `Enemy.steer()`, a rearward-puff consumer in `SpawnSystem`, a 9-slot speck pool in `FxSystem.quickenPuff()` beside the Platen dust pool, a `hareStep()` step function in `core/hareSpeed.ts` (hareSpeed behavior unchanged, table pinned in the new test case), and a `quicken-specks` pool invariant in GameScene. No sound, no gameplay change, no HUD/input/scene; `npm run check` and `npm run smoke` pass.

- Self-review: APPROVE
- Time: 24.7 min

```
game/src/core/hareSpeed.ts        | 18 +++++++++++-------
 game/src/entities/Enemy.ts        | 19 ++++++++++++++++++-
 game/src/scenes/GameScene.ts      |  3 ++-
 game/src/systems/FxSystem.ts      | 35 +++++++++++++++++++++++++++++++++++
 game/src/systems/SpawnSystem.ts   |  8 ++++++++
 game/tests/core/hareSpeed.test.ts | 11 ++++++++++-
 6 files changed, 84 insertions(+), 10 deletions(-)
```
