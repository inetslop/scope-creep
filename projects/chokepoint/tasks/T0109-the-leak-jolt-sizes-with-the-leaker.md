---
id: T0109
title: The leak jolt sizes with the leaker
assignee: baby-mama
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T08:16:41Z
---

## Goal
Pillar 5, priced by the cost: the board's jolt when an enemy leaks scales with the leaker's size, so a Hauler slipping through — the one that also costs 5 gold (T0057) — is felt where it is seen.

## Details
- The existing leak jolt (the board shake when an enemy reaches the exit) scales its amplitude by the leaker's token size factor: amplitude × (1 + (size − 1) × 1.5). A size-1.0 shape (Dot, Dart, Block, Mute, Splinter, Sprinter at its base size, Splitter's children) stays byte-identical to today (1.0×); a Hauler (1.3) lands at 1.45×; the Bulwark (1.25, T0102) at 1.375×.
- The jolt's shape (the quick offset that eases back) and its trigger (the leak moment) are unchanged; only the amplitude scales with the leaker's size.
- Pure juice: no sound, no HUD, no rule change, no pause-screen line.

## Acceptance criteria
- [ ] A size-1.0 enemy (e.g. a Dot) leaking jolts the board exactly as it does today.
- [ ] A Hauler leaking jolts visibly harder (~1.45× the amplitude) with the same shape and timing.
- [ ] No enemy ever jolts less than today; the leak warning, the lives number and any leak sound are untouched.

## Design (architect, desktop)

### Files
- edit `src/systems/EnemySystem.ts` — the only file: one module constant, one changed line in `leak()`.

### Interfaces
No new types, exports, or signatures. Pure juice inside the existing `private leak(e: Enemy): void`.

### Steps
1. In `src/systems/EnemySystem.ts`, immediately before `export class EnemySystem` (line 47, after the `HitPayload` interface), add exactly:
   ```ts
   /** The standard enemy token's radius in cells (Block's 0.26): the leak jolt's baseline size. */
   const JOLT_BASE_SIZE = 0.26;
   ```
2. In `leak()` (lines 173–181), replace line 179 `this.scene.cameras.main.shake(140, 0.005);` with exactly:
   ```ts
       // The jolt scales with the leaker's token size: the bigger it slips through, the harder the board shudders.
       const size = Math.max(1, e.def.look.size / JOLT_BASE_SIZE);
       this.scene.cameras.main.shake(140, 0.005 * (1 + (size - 1) * 1.5));
   ```
   Keep `this.sfx?.leak();` (line 178) and `e.despawn();` (line 180) exactly as they are.
3. Run `npm run check` and `npm run smoke`; both must pass.

### Pitfalls
- Only the shake's **second** argument (amplitude) changes; the 140 ms duration is unchanged, so the jolt's shape and timing stay identical.
- The `Math.max(1, ...)` floor is required: without it, a Dot (0.22) would jolt at 0.77× — weaker than today, which the task forbids. With it, every current enemy with `look.size ≤ 0.26` computes to exactly `0.005` (Dot, Dart, Dasher, Block, Mute, Splinter, Sprinter, Splitter's children — byte-identical calls).
- The Splitter parent (0.264) lands at ≈1.023× — slightly stronger than today, and that is correct per spec (only its children are promised 1.0×). Do not "fix" it to 1.0.
- Hauler: 0.34/0.26 ≈ 1.308 → amplitude ≈0.00731 (~1.45× per spec's rounding). Use 0.26 (Block), not 0.22 (Dot or `TOWER_BODY`) — any other baseline changes every number.
- Don't move the shake into an enemy hook or `FxSystem`: the trigger is unchanged, and `haulerLeak.ts`'s comment assumes the jolt stays the usual leak's. Don't touch `run.leak()`, `fx.ring`, `fx.popText`, the lives number or any sound.
- No new listener, timer or object: nothing to clean up on shutdown; `shake()` is duration-based, no frame-rate assumption.

### Tests
none (pure juice; no rule in `src/core` added or changed).
