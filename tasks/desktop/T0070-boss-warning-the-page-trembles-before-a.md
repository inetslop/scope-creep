---
id: T0070
title: Boss warning — the page trembles before a boss lands
assignee: desktop
size: M
priority: 2
status: done
depends_on: [T0064]
attempts: 1
created: 2026-10-27T03:53:41Z
claimed_at: 2026-10-27T12:08:11Z
finished_at: 2026-10-27T12:23:51Z
---

## Goal
Five seconds before any boss spawn (The Frame, The Grid, The Palette — whatever the rotation schedules next — including scaled HP respawns), the player gets a warning: the arena boundary pulses red, "SOMETHING HEAVY APPROACHES" flashes in the HUD, and one soft low thud plays — so the boss sting (T0058) and the nameplate (T0064) land on top of a build-up instead of out of nowhere.

## Details
- The warning window is exactly the 5 seconds before a scheduled boss spawn: from spawnTime − 5 s to spawnTime.
- Visual: a red ink line (2 u thick) drawn along the current safe-area boundary (it must follow the crop marks from T0045, not the old full-arena edge). Its opacity pulses 0 → 0.6 → 0 over 1 s, repeating until the boss spawns. No other new persistent art.
- HUD: "SOMETHING HEAVY APPROACHES" in red small caps, top-center of the page just below where the boss nameplate (T0064) is printed; fades out over 2 s. Reuse the existing HUD flash pattern ("ERASED", "RHYTHM").
- Audio: one soft low thud (~60 Hz, ~200 ms decay) at the start of the window, throttled to at most one per warning. The spawn itself keeps the existing T0058 boss sting; do not change the sting.
- If the run is paused, the countdown and the pulse pause with the game and resume without a jump.
- The warning must fire for every boss in the rotation — The Frame, The Grid, and The Palette (T0097) once it lands — for first spawns and every later respawn. The schedule is BossTimer-driven, so it fires for whatever boss is next; do not special-case boss ids.

## Acceptance criteria
- [ ] In a run, exactly 5 s before The Frame's 5:00 spawn the boundary starts pulsing red, the HUD flash appears, and the low thud plays.
- [ ] The pulse has stopped and the flash is gone by the moment the boss sting plays at spawn.
- [ ] The same warning plays before The Grid's 10:00 spawn, before The Palette's 15:00 spawn (T0097), and before a boss respawn; the red line follows the cropped boundary when the crop is active (after 12:00).
- [ ] No warning appears when no boss spawn is scheduled within the next 5 s.
- [ ] Pausing the game pauses the pulse; resuming continues it with no jump or double thud.

## Design (architect, desktop)

### Files
- create `src/systems/BossApproachSystem.ts` - one `Graphics` that draws the pulsing red line along the safe boundary while `run.bossApproach` is set
- edit `src/core/boss.ts` - add `BOSS_WARNING_SEC` constant and `BossTimer.inWarningWindow()` (pure, tested)
- edit `src/core/run.ts` - add `bossApproach` flag next to `bossWarning` (line 37)
- edit `src/systems/BossSystem.ts` - new `'approach'` phase before `'warning'`; `startApproach()`; clear flag in `startWarning()`
- edit `src/audio/Sfx.ts` - `bossApproach()` soft low thud
- edit `src/scenes/HudScene.ts` - "SOMETHING HEAVY APPROACHES" flash below the nameplate line, 2 s fade
- edit `src/scenes/GameScene.ts` - construct/update `BossApproachSystem`, register invariant + add its name to the `INVARIANTS` array (line 362)
- edit `tests/core/boss.test.ts` - window tests (append; don't touch existing cases)

### Interfaces
```ts
// core/boss.ts
export const BOSS_WARNING_SEC = 5;
// method on BossTimer:
inWarningWindow(timeSec: number, bossAlive: boolean): boolean; // !bossAlive && timeSec >= this.nextAt - BOSS_WARNING_SEC && timeSec < this.nextAt

// core/run.ts (after bossWarning)
bossApproach = false; // true only during the 5 s window; BossSystem writes, BossApproachSystem + HudScene read

// systems/BossApproachSystem.ts
export class BossApproachSystem {
  constructor(scene: Phaser.Scene, run: RunState); // graphics at DEPTH.arena + 1, initially invisible
  get pulseVisible(): boolean; // g.visible
  get pulseAlpha(): number;    // 0..0.6
  update(dt: number): void;
}

// audio/Sfx.ts
bossApproach(): void; // 60 Hz sine, 0.2 s decay, vol 0.3; 1000 ms throttle (lastBossApproachAt), like bossSting

// systems/BossSystem.ts
type Phase = 'off' | 'approach' | 'warning' | 'entering' | 'fighting';
private startApproach(): void;
```
`startApproach()`: `this.def = bossForKill(this.run.bossKills); this.run.bossId = this.def.id; this.phase = 'approach'; this.run.bossApproach = true; this.sfx.bossApproach();`
In `update()`: in `'off'`, after the `due()` check add `else if (this.timer.inWarningWindow(this.run.timeSec, this.run.bossAlive)) this.startApproach();`; add branch `if (this.phase === 'approach') { if (this.timer.due(this.run.timeSec, this.run.bossAlive)) this.startWarning(); return; }`. In `startWarning()` add `this.run.bossApproach = false;` (first line after `this.def`). `startEntering()` and the sting stay untouched.

`BossApproachSystem.update(dt)`:
```ts
if (!this.run.bossApproach) { if (this.started) { this.started = false; this.alpha = 0; this.g.clear().setVisible(false); } return; }
if (!this.started) this.age = 0;
this.started = true;
this.age += dt;
const t = this.age % 1;
this.alpha = 0.6 * (1 - Math.abs(2 * t - 1)); // 0 -> 0.6 -> 0 over 1 s
const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
this.g.clear().setVisible(true);
this.g.lineStyle(2, PALETTE.red, this.alpha);
this.g.strokeRect(-half, -half, 2 * half, 2 * half);
```

HudScene: create `this.bossApproachText = this.add.text(0, 0, 'SOMETHING HEAVY APPROACHES', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(0.5, 0).setAlpha(0);` (same style as RHYTHM/ERASED). Fields `private approachEdge = false; private approachAge = 0;` — reset both in `create()` (scene instance survives stop/launch). In `update()` after the `bossWarnText` line:
```ts
const nameTop = (narrow ? PAD + 40 : PAD) + 26; // the boss nameplate line
if (run.bossApproach && !this.approachEdge) {
  this.approachEdge = true; this.approachAge = 0;
  this.tweens.killTweensOf(this.bossApproachText);
  this.tweens.add({ targets: this.bossApproachText, scale: 1.15, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
}
if (!run.bossApproach) this.approachEdge = false;
if (this.approachEdge) {
  if (this.scene.isActive(SCENES.game)) this.approachAge += dt; // pause with the game
  const a = Phaser.Math.Clamp(1 - this.approachAge / 2, 0, 1);
  this.bossApproachText.setPosition(width / 2, nameTop + 20).setAlpha(a);
  if (a <= 0) this.approachEdge = false;
} else this.bossApproachText.setAlpha(0);
```

GameScene invariant (and add `'boss-approach-pulse'` to `INVARIANTS`):
```ts
hook.addInvariant('boss-approach-pulse', () => {
  const p = this.bossApproach;
  if (p.pulseVisible !== this.run.bossApproach) return `pulse visible ${p.pulseVisible} but bossApproach ${this.run.bossApproach}`;
  if (!Number.isFinite(p.pulseAlpha) || p.pulseAlpha < -1e-6 || p.pulseAlpha > 0.6 + 1e-6) return `pulse alpha ${p.pulseAlpha}`;
  return null;
});
```

### Steps
1. `core/boss.ts`: add `BOSS_WARNING_SEC` + `inWarningWindow()` (+ doc comment on `BossTimer`).
2. `core/run.ts`: add the flag.
3. `tests/core/boss.test.ts`: append the window tests (below); run `npx vitest run tests/core/boss.test.ts`.
4. `Sfx.ts`: add `lastBossApproachAt` field + `bossApproach()` next to `bossWarn()`.
5. Create `BossApproachSystem.ts` (code above; `import type Phaser`, `ARENA_SIZE`/`DEPTH` from config, `PALETTE`, `cropSafeFraction`, `type RunState`).
6. `BossSystem.ts`: phase union, `update()` branches, `startApproach()`, flag clear in `startWarning()`, import `BOSS_WARNING_SEC` is not needed (timer method uses the constant) — update the class doc to mention the 5 s approach phase.
7. `GameScene.ts`: field `private bossApproach!: BossApproachSystem;`, construct right after `this.boss = new BossSystem(...)` (line 100), `this.bossApproach.update(dt);` right after `this.boss.update(dt);` (line 139), invariant + `INVARIANTS` entry.
8. `HudScene.ts`: text, fields, create() resets, update() block.
9. `npm run check`.

### Pitfalls
- Do NOT move the sting or the existing 1 s `'warning'` phase: `'approach'` ends when `timer.due()` fires, so the window is exactly [nextAt−5, nextAt) in run time and the pulse/flash are gone before the sting. Never drive the end from a phase timer.
- T0064 (dep) rewrites the same BossSystem warning code, the HudScene boss block and adds the nameplate: rebase onto it; if its nameplate line moved, use its y for `nameTop`.
- T0040 (in progress, other machine) adds shake calls in BossSystem/GameScene/FxSystem — keep those edits; your diff only touches `update()` branches and `startWarning`/`startApproach`.
- HudScene keeps running while the Game scene is paused — gate the flash age with `this.scene.isActive(SCENES.game)` or the fade finishes during pause. The pulse freezes automatically (dt-driven in GameScene). Thud fires only in `startApproach` + 1 s Sfx throttle → no double thud on resume.
- The invariant name MUST be in the `INVARIANTS` array or it leaks across runs (shutdown removes by that list).
- Boundary must use `cropSafeFraction(this.run.timeSec)` recomputed each frame (follows the 12:00+ crop; full arena edge before). No camera shake — that is T0040's territory and not in the spec.
- Graphics starts `setVisible(false)` and is cleared+hidden when idle → "no other new persistent art".

### Tests
- `tests/core/boss.test.ts` (append): `describe('inWarningWindow')` — (a) `BOSS_WARNING_SEC === 5`; default timer: false at 294.9, true at 295 and 299.9, false at 300; (b) never true with `bossAlive` true (295, 299); (c) respawns: `onBossKilled(300)` → false at 594.9, true at 595, false at 600; `onBossKilled(600)` → true at 895, false at 900. No engine-side unit tests (smoke covers the pulse via the new invariant).

## Result (attempt 1, desktop)

Added the 5 s pre-boss warning: `BossTimer.inWarningWindow()` + `BOSS_WARNING_SEC` in core (tested), a new `BossApproachSystem` that pulses a 2 u red line along the crop-aware safe boundary (0→0.6→0 per second, hidden when idle), a `'approach'` phase in BossSystem that opens the window and plays one throttled 60 Hz thud via new `Sfx.bossApproach()`, and a "SOMETHING HEAVY APPROACHES" red flash in HudScene anchored below the T0064 nameplate line with a 2 s pause-safe fade. The window ends exactly when the spawn is due, so the pulse and flash are gone before the existing sting, and everything fires for every boss in the rotation and every respawn with no id special-casing. `npm run check` and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 15.7 min
- Self-review made fixes (kept; checks pass).

```
game/src/audio/Sfx.ts                  | 10 ++++++
 game/src/core/boss.ts                  | 10 +++++-
 game/src/core/run.ts                   |  2 ++
 game/src/scenes/GameScene.ts           | 12 ++++++-
 game/src/scenes/HudScene.ts            | 31 ++++++++++++++++++
 game/src/systems/BossApproachSystem.ts | 59 ++++++++++++++++++++++++++++++++++
 game/src/systems/BossSystem.ts         | 31 ++++++++++++++----
 game/tests/core/boss.test.ts           | 30 ++++++++++++++++-
 8 files changed, 176 insertions(+), 9 deletions(-)
```
