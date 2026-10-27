---
id: T0141
title: Low-HP vignette — the page reads your danger
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T19:57:25Z
claimed_at: 2026-10-27T21:54:42Z
finished_at: 2026-10-27T22:05:09Z
---

## Goal
When you are close to being erased, the page itself warns you: the paper's edges fall into a warm shadow and a thin red rule pulses along the boundary, so how close you are to death is readable at a glance without checking the HP bar.

## Details
- A new danger state on the player, owned by a **pure rule module in `src/core/`** (the crop/rest pattern) with unit tests.
- The vignette turns **on** the moment the player's current HP is at or below **25%** of their max HP, and turns **off** only when it rises back **above 30%** of max HP (a small hysteresis so it does not flicker on and off while Balance regen climbs back across the threshold). It is latched: between 25% and 30% it stays in whatever state it was in.
- While on, two things are drawn, both fading in over 200 ms on turning on and out over 200 ms on turning off:
  - Four flat **warm-shadow bands** darken the four paper edges — a single flat shade a step darker and warmer than the paper (a new flat palette tone; flat, no gradient, no glow), ~40 u thick on each edge.
  - A **2 u red** (PALETTE.red) rule pulses along the crop-safe boundary — the same boundary the BossApproach red line tracks (T0070), so it stays correct through the Crop shrink (T0045) and the Tide breathing edge (T0127) — alpha **0.25 → 0.75 → 0.25** over a **1.0 s** cycle.
- It is **pure readability**: it deals no damage and changes no stat, spawn, hazard, weapon, run clock or music.
- The pure rule module exposes the state transition given a previous state and the current HP fraction, and unit tests lock: off above 30%, on at exactly 25%, latched on between 25% and 30% (holding the state in both directions), off again above 30%, and on→off ordering.
- No new key, sound, HUD element, scene or marginalia.

## Acceptance criteria
- [ ] With HP below 25% of max, the four paper edges show flat warm-shadow bands and a 2 u red rule pulses along the safe boundary on a 1.0 s alpha cycle; both fade in over ~200 ms.
- [ ] Healing back above 30% of max HP removes both the bands and the red rule (fading out over ~200 ms); between 25% and 30% the vignette stays in its current state (no flicker).
- [ ] The vignette changes no gameplay: no damage, stat, spawn, hazard, weapon, clock or music change — it is visual only.
- [ ] The red rule follows the crop-safe boundary as it shrinks (Crop) and breathes (Tide), exactly like the BossApproach red line.
- [ ] Correctly laid out and legible at both 412×915 (mobile portrait) and 1280×720 (desktop).
- [ ] A pure rule module with unit tests for the 25%/30% hysteresis (on at ≤25%, latched, off above 30%); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.

## Design (architect, desktop)

### Files
- create `src/core/vignette.ts` - pure danger latch: `VIGNETTE` constants + `VignetteState` (crop/rest pattern, engine-free)
- create `src/systems/VignetteSystem.ts` - draws the four warm-shadow edge bands + pulsing 2 u red rule; owns the 200 ms fade
- create `tests/core/vignette.test.ts` - unit tests locking the 25%/30% hysteresis
- edit `src/content/palette.ts` - add one flat tone after `paperDark: 0xe2d6bc,`: `paperShade: 0xd9c69f,` (one step darker and warmer than paper; flat, no gradient)
- edit `src/core/run.ts` - add `import { VignetteState } from './vignette';` (after the `./stats` import) and, directly after the `readonly fermata = new Fermata();` line: `readonly vignette = new VignetteState();` with comment `/** The low-HP vignette (core/vignette.ts): latched on at 25% HP, off above 30%; VignetteSystem reads it. */`
- edit `src/scenes/GameScene.ts` - wiring only, six insertions (Steps 6a-6f)

### Interfaces
```ts
// src/core/vignette.ts (whole file body)
export const VIGNETTE = { onAt: 0.25, offAt: 0.3 } as const;

export class VignetteState {
  /** True while the page shows the danger vignette. */
  on = false;
  /** Advances the latch given the current HP fraction (0..1). */
  tick(hpFraction: number): void {
    if (hpFraction <= VIGNETTE.onAt) this.on = true;
    else if (hpFraction > VIGNETTE.offAt) this.on = false;
    // between onAt and offAt (inclusive of offAt): hold — no flicker while regen climbs back
  }
}

// src/systems/VignetteSystem.ts
export class VignetteSystem {
  fade: number;                    // 0..1, public so the 'low-hp-vignette' invariant can read it
  constructor(scene: Phaser.Scene, run: RunState);
  update(dt: number): void;        // ticks run.vignette, advances fade by dt/0.2, draws bands + rule
}
```

### Steps
1. Add `paperShade: 0xd9c69f,` to `PALETTE` in `src/content/palette.ts`, on its own line directly after the `paperDark` line.
2. Create `src/core/vignette.ts` exactly as in Interfaces, with a header comment in the style of `core/rest.ts` naming `src/systems/VignetteSystem.ts` as the engine side.
3. Create `src/systems/VignetteSystem.ts`:
```ts
import type Phaser from 'phaser';
import { ARENA_SIZE, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { cropSafeFraction } from '../core/crop';
import type { RunState } from '../core/run';

const FADE_SEC = 0.2;        // fade in/out
const PULSE_MIN = 0.25;      // rule alpha range while fully faded in
const PULSE_MAX = 0.75;
const PULSE_PERIOD_SEC = 1;  // one 0.25 -> 0.75 -> 0.25 cycle
const BAND_UNITS = 40;       // band thickness at each paper edge

export class VignetteSystem {
  fade = 0;
  private readonly run: RunState;
  private readonly bands: Phaser.GameObjects.Graphics;
  private readonly rule: Phaser.GameObjects.Graphics;
  private pulseAge = 0;

  constructor(scene: Phaser.Scene, run: RunState) {
    this.run = run;
    this.bands = scene.add.graphics().setDepth(DEPTH.floor + 3).setVisible(false); // above crop margin + gutter band, below arena walls
    this.rule = scene.add.graphics().setDepth(DEPTH.arena + 1).setVisible(false);  // same depth as the boss-approach rule
  }

  update(dt: number): void {
    const run = this.run;
    run.vignette.tick(run.hp / run.stats.maxHp);
    this.fade = Math.max(0, Math.min(1, this.fade + (run.vignette.on ? 1 : -1) * dt / FADE_SEC));
    if (this.fade <= 0) {
      this.bands.setVisible(false);
      this.rule.setVisible(false);
      return;
    }
    const a = ARENA_SIZE / 2;
    this.bands.clear().setVisible(true);
    this.bands.fillStyle(PALETTE.paperShade, this.fade);
    this.bands.fillRect(-a, -a, 2 * a, BAND_UNITS);
    this.bands.fillRect(-a, a - BAND_UNITS, 2 * a, BAND_UNITS);
    this.bands.fillRect(-a, -a + BAND_UNITS, BAND_UNITS, 2 * a - 2 * BAND_UNITS);
    this.bands.fillRect(a - BAND_UNITS, -a + BAND_UNITS, BAND_UNITS, 2 * a - 2 * BAND_UNITS);
    this.pulseAge += dt;
    const t = (this.pulseAge % PULSE_PERIOD_SEC) / PULSE_PERIOD_SEC;
    const pulse = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * (1 - Math.abs(2 * t - 1)); // 0.25 -> 0.75 -> 0.25 over 1 s
    const half = (ARENA_SIZE / 2) * cropSafeFraction(run.timeSec); // the crop-safe boundary, exactly as BossApproachSystem
    this.rule.clear().setVisible(true);
    this.rule.lineStyle(2, PALETTE.red, this.fade * pulse);
    this.rule.strokeRect(-half, -half, 2 * half, 2 * half);
  }
}
```
Class header comment: "The low-HP vignette (pure readability): ... latched with 25%/30% hysteresis (core/vignette.ts) ... deals no damage and changes no stat, spawn, hazard, weapon, clock or music."
4. Wire `GameScene.ts` — insert each line beside the named neighbor, never at the end of a list:
   a. `import { VIGNETTE } from '../core/vignette';` between the `core/vec` and `core/warmStart` imports.
   b. `import { VignetteSystem } from '../systems/VignetteSystem';` between the `Underdrawing` and `WeaponSystem` imports.
   c. Field `private vignette!: VignetteSystem;` directly after `private bossApproach!: BossApproachSystem;`.
   d. Construction `this.vignette = new VignetteSystem(this, this.run);` directly after `this.bossApproach = new BossApproachSystem(this, this.run);`.
   e. In `update()`, `this.vignette.update(dt);` directly after `this.gutter.update(dt);`.
   f. In `registerInvariants()`, directly after the `'boss-approach-pulse'` invariant:
```ts
hook.addInvariant('low-hp-vignette', () => {
  const f = this.run.hp / this.run.stats.maxHp;
  if (f <= VIGNETTE.onAt && !this.run.vignette.on) return `vignette off at hp fraction ${f}`;
  if (f > VIGNETTE.offAt && this.run.vignette.on) return `vignette on at hp fraction ${f}`;
  if (!Number.isFinite(this.vignette.fade) || this.vignette.fade < -1e-6 || this.vignette.fade > 1 + 1e-6) return `vignette fade ${this.vignette.fade}`;
  return null;
});
```
5. Create `tests/core/vignette.test.ts` (style of `tests/core/rest.test.ts`): `expect(VIGNETTE).toEqual({ onAt: 0.25, offAt: 0.3 })`; off above 30% (`tick(0.31)` → false, also from an on state); on at exactly 25% (`tick(0.2500001)` → false, `tick(0.25)` → true); latched in both directions between the thresholds (`tick(0.27)` holds on when on, holds off when off); holds on at exactly `tick(0.3)`, releases at `tick(0.3000001)`; on→off ordering (0.2 → on, 0.35 → off, 0.2 → on again).
6. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Overlapping band rects: filling the 40×40 corners twice at partial alpha darkens the corners. Use exactly the four non-overlapping rects above (left/right strips span only `2*a - 2*BAND_UNITS`).
- The system file uses `import type Phaser`; do not call `Phaser.Math.Clamp` (type-only import has no runtime value) — the code uses `Math.max`/`Math.min`.
- Never assert `on === (fade > 0)` in the invariant: the fade lags the latch by up to 200 ms. Only the two hard boundaries (≤0.25 ⇒ on, >0.3 ⇒ off) plus fade∈[0,1] are checkable between frames.
- No gameplay writes: the system must not call `run.takeDamage`/`drain`/`heal`, `Sfx`, or `Music`, and must not touch `hook.stats`.
- `maxHp` is always ≥ 1 (`STAT_LIMITS`), so `hp / maxHp` is division-safe; `NaN` fractions would be latched-hold, not a crash.
- If T0127 (Tide) lands and changes the safe-boundary source, change the `cropSafeFraction(run.timeSec)` line in `VignetteSystem.update` the same way it changed `BossApproachSystem` — keep both lines identical.
- GameScene is hot (T0127, T0132, T0119, T0120… all edit it): keep the six insertions single-line/beside-neighbors so merges are trivial; do not reorder existing lines.

### Tests
- `tests/core/vignette.test.ts` as specified in Step 5 (the hysteresis is a rule a later change could silently break — e.g. someone "tidying" the thresholds).

## Result (attempt 1, desktop)

Added the low-HP danger vignette: a pure 25%/30%-hysteresis latch in `src/core/vignette.ts` (unit-tested, latched on `RunState`), a new flat `paperShade` palette tone, and `src/systems/VignetteSystem.ts` which draws four 40 u warm-shadow edge bands plus a 2 u red rule pulsing 0.25→0.75→0.25 over 1 s along the same crop-safe boundary as the BossApproach line, fading in/out over 200 ms; wired into `GameScene` with six single-line insertions and a `low-hp-vignette` invariant. Pure readability — no damage, stat, spawn, hazard, weapon, clock or music changes; both 412×915 and 1280×720 smoke runs pass.

- Self-review: APPROVE
- Time: 10.5 min
- Self-review made fixes (kept; checks pass).

```
game/src/content/palette.ts        |  1 +
 game/src/core/run.ts               |  3 ++
 game/src/core/vignette.ts          | 21 ++++++++++++
 game/src/scenes/GameScene.ts       | 15 +++++++++
 game/src/systems/VignetteSystem.ts | 63 +++++++++++++++++++++++++++++++++++
 game/tests/core/vignette.test.ts   | 68 ++++++++++++++++++++++++++++++++++++++
 6 files changed, 171 insertions(+)
```
