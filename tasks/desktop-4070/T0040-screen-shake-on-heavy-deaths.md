---
id: T0040
title: Screen shake on heavy deaths
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-27T07:30:13Z
---

## Goal
Heavy impacts should land physically: when a Block, an elite, or a boss dies, the camera jolts, so big kills feel like they hit the page (pillar 4: juice through form).

## Details
- A new camera-shake effect triggered by death events. It moves only the camera view (a random jitter of the camera offset that decays smoothly to zero, ease-out), never the world.
- Three magnitudes, by what died:
  - A Block (the heavy yellow block) dies: small shake — amplitude 4, duration 0.15 s.
  - Any elite dies: medium shake — amplitude 8, duration 0.3 s.
  - Any boss dies (The Frame now, The Grid later): large shake — amplitude 14, duration 0.5 s.
- If several heavy deaths happen in the same instant, combine them so the total amplitude never exceeds 20.
- Normal enemy deaths (Wedge, Dart, Mote, Sentry, etc., non-elite) do NOT shake.
- Add a `screenShake: boolean` flag to the stats/flags in `debug/testHook.ts` (default true) so the smoke test and the future settings page (M4) can disable shakes.
- No HUD change, no new SFX (the existing death sound is enough).

## Acceptance criteria
- [ ] Killing a Block produces a small camera jolt (~0.15 s); killing any elite a bigger one (~0.3 s); killing The Frame a large one (~0.5 s)
- [ ] The camera returns exactly to center after each shake — no permanent offset
- [ ] Killing a normal (non-elite, non-Block, non-boss) enemy produces no shake
- [ ] Setting the `screenShake` debug flag to false disables all shakes
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/core/shake.ts` - pure `CameraShake` state machine (exact code in Interfaces)
- create `tests/core/shake.test.ts` - unit tests for `CameraShake` (see Tests)
- edit `src/debug/testHook.ts` - add `screenShake: boolean;` to `HookStats` (after `enemiesAlive`) and `screenShake: true,` to the initializer object
- edit `src/systems/FxSystem.ts` - replace built-in shake with custom decaying shake: new `shake(amplitude, durationMs)`, `updateShake(dtMs)`, `shakeMs` getter (Interfaces); in `playerHit` replace `this.scene.cameras.main.shake(140, 0.006)` with `this.shake(4, 140)`
- edit `src/systems/CombatSystem.ts` - in `killEnemy` replace `if (size >= 24) this.fx.shake(90, 0.003);` with the two trigger lines (Interfaces); keep `size` (still used by `fx.death`/`sfx.enemyDeath`)
- edit `src/systems/BossSystem.ts` - in `killBoss` replace `this.fx.shake(600, 0.02);` with `this.fx.shake(14, 500);`
- edit `src/scenes/GameScene.ts` - `onPostUpdate` becomes `(_time: number, delta: number)` and ends with `this.fx.updateShake(Math.min(delta, 50));`; in `endRun` replace `this.fx.shake(400, 0.012);` with `this.fx.shake(16, 400);`; add the `camera-shake` invariant (Interfaces) and append `'camera-shake'` to the `INVARIANTS` array
### Interfaces
`src/core/shake.ts` (pure — no Phaser import):
```ts
export class CameraShake {
  private amp = 0; // combined amplitude, screen px, capped at 20
  private totalMs = 0;
  private leftMs = 0;
  get remainingMs(): number { return this.leftMs; }
  add(amplitude: number, durationMs: number, maxAmp = 20): void {
    if (amplitude <= 0 || durationMs <= 0) return;
    this.amp = Math.min(maxAmp, this.amp + amplitude);
    this.totalMs = Math.max(this.totalMs, durationMs);
    this.leftMs = Math.max(this.leftMs, durationMs);
  }
  /** Advances dtMs; returns current amplitude in screen px (eased out), or null when idle. */
  update(dtMs: number): number | null {
    if (this.leftMs <= 0) return null;
    this.leftMs -= dtMs;
    if (this.leftMs <= 0) { this.leftMs = 0; this.amp = 0; this.totalMs = 0; return null; }
    const t = this.leftMs / this.totalMs;
    return this.amp * t * t; // ease-out: full at the start, settling to zero
  }
}
```
`FxSystem` (add imports: `CameraShake` from `'../core/shake'`, `hook` from `'../debug/testHook'`):
```ts
private readonly shake = new CameraShake();
private lastShakeX = 0;
private lastShakeY = 0;
shake(amplitude: number, durationMs: number): void {
  if (!hook.stats.screenShake) return;
  this.shake.add(amplitude, durationMs);
}
get shakeMs(): number { return this.shake.remainingMs; }
/** Called from GameScene's POST_UPDATE, after the camera follow has run. */
updateShake(dtMs: number): void {
  const cam = this.scene.cameras.main;
  cam.scrollX -= this.lastShakeX; cam.scrollY -= this.lastShakeY; // remove last frame's jitter so it can't accumulate
  this.lastShakeX = 0; this.lastShakeY = 0;
  const amp = this.shake.update(dtMs);
  if (amp === null) return; // scroll is now exactly the follow position
  this.lastShakeX = ((Math.random() * 2 - 1) * amp) / cam.zoom; // screen px -> world units
  this.lastShakeY = ((Math.random() * 2 - 1) * amp) / cam.zoom;
  cam.scrollX += this.lastShakeX; cam.scrollY += this.lastShakeY;
}
```
`CombatSystem.killEnemy` (replaces the `size >= 24` line):
```ts
if (e.def.id === 'block') this.fx.shake(4, 150);
if (e.elite) this.fx.shake(8, 300);
```
`GameScene.registerInvariants`:
```ts
hook.addInvariant('camera-shake', () => {
  const cam = this.cameras.main;
  if (!Number.isFinite(cam.scrollX) || !Number.isFinite(cam.scrollY)) return `camera scroll (${cam.scrollX}, ${cam.scrollY})`;
  return this.fx.shakeMs > 500 ? `shake stuck at ${this.fx.shakeMs} ms` : null;
});
```
### Steps
1. Create `src/core/shake.ts` exactly as above.
2. Create `tests/core/shake.test.ts` (see Tests); run `npm run test`.
3. Edit `src/debug/testHook.ts`, `src/systems/FxSystem.ts`, `src/systems/CombatSystem.ts`, `src/systems/BossSystem.ts`, `src/scenes/GameScene.ts` as listed in Files.
4. Run `npm run check`, then `npm run smoke`.
### Pitfalls
- Do NOT use Phaser's built-in `cameras.main.shake()`: it holds full amplitude the whole duration (no ease-out) and ignores new calls while running (can't combine). All five old call sites are replaced above.
- The first two lines of `updateShake` (removing `lastShake`) are mandatory: without them the random jitter accumulates as a random walk and leaves a permanent camera offset.
- Drive `updateShake` from POST_UPDATE, not `update()`: camera follow runs in the render step (after POST_UPDATE), so the jitter lands on the post-follow scroll; and POST_UPDATE still fires when `update()` early-returns during `endRun`, so the player-death shake still animates.
- Amplitudes are screen px: divide by `cam.zoom` before writing scroll so 412×915 (zoom ~0.64) and 1280×720 (zoom ~1.1) shake the same size.
- `Math.random` in `updateShake` is intentional (cosmetic, not gameplay randomness; Phaser's own shake does the same) and `FxSystem` has no `run` reference — do not switch to `run.rng`.
- An elite Block fires both rules (4+8 → combined 12) — that is the intended combining behavior.
- T0015 (also on desktop) will append its own fields to `HookStats` in `testHook.ts`: only append `screenShake`, don't reformat the file.
### Tests
`tests/core/shake.test.ts` (vitest; `import { CameraShake } from '../../src/core/shake'`):
- fresh `CameraShake`: `update(16)` is null, `remainingMs` is 0; `add(0, 300)` and `add(8, 0)` leave it idle
- `add(8, 300)`: `update(16)` `toBeCloseTo(8 * ((300 - 16) / 300) ** 2)`; keep calling `update(16)` until it returns null
- `add(4, 150)`: nine `update(16)` calls non-null, tenth null (150/16 = 9.375 frames)
- `add(14, 500); add(8, 300)`: first `update(16)` `toBeCloseTo(20 * ((500 - 16) / 500) ** 2)` — 22 capped to 20, duration takes the longer

## Attempt 1 discarded (desktop-4070)

Stopped by hand after 3.5 hours: the session timed out after writing only a standalone CameraShake helper and its test, never wired into the game (no heavy death triggers a shake). The gate passed because nothing used the new code. The local commit was discarded, nothing reached main; attempts reset.
