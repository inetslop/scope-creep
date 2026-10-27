---
id: T0130
title: Boss count-in — the page counts the boss in
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T17:13:57Z
claimed_at: 2026-10-27T17:45:41Z
---

## Goal
The 5 s pre-boss warning (T0070) counts down in the existing low thud — one on each of the last four whole seconds — so a sharp ear feels the boss landing on the beat, not just seeing the red pulse.

## Details
- The warning already plays one low thud at its start (T0070, 5 s before the boss lands). Add the same thud once on each of the 4 whole seconds before the boss lands — at 4.0 s, 3.0 s, 2.0 s and 1.0 s out — 1 s apart, so a steady once-per-second pulse leads into the spawn sting (T0058), which lands where the next thud would have.
- Reuse the warning's existing low thud — no new tone, no new SFX method argument; it is mute-gated like all SFX and plays nothing while the game is paused (the run clock pauses).
- One pulse train per warning, including respawns (which already re-warn via T0070). Nothing changes about the warning's red boundary pulse, the "SOMETHING HEAVY APPROACHES" flash, or its 5 s length.

## Acceptance criteria
- [ ] During any boss warning (The Frame, The Grid, The Palette, The Press, and every respawn), the low thud plays 5 times — once at the warning's start exactly as today, then once on each of the 4 whole seconds before the boss lands, 1 s apart.
- [ ] No new SFX tone is added; the thuds honor the existing mute and none plays while paused.
- [ ] The warning's visuals (boundary pulse, flash) and its 5 s length are unchanged, and no other system's audio or timing is touched.

## Design (architect, yoga)

### Files
- edit `src/systems/BossSystem.ts` - add the count-in: a private `approachThudTimer`, re-armed in `startApproach()`, ticked in `update()`'s `'approach'` branch calling the existing `this.sfx.bossApproach()` once per run-second
- edit `src/audio/Sfx.ts` - one doc-comment word on `bossApproach()` (line 219) so it stops claiming the thud only plays "at the start" of the window

### Interfaces
None. No exported types, signatures, or content change. The only new member is `private approachThudTimer = 1;` in `BossSystem`.

### Steps
1. In `BossSystem.ts`, right after `private phaseTimer = 0;` (line 88), add:
```ts
  /** Seconds until the next count-in thud; only read while in the 'approach' phase. */
  private approachThudTimer = 1;
```
2. Replace `startApproach()` (lines 179-186) with:
```ts
  /** Opens the 5 s approach window: the page trembles (BossApproachSystem) and the thud count-in starts. */
  private startApproach(): void {
    this.def = bossForKill(this.run.bossKills);
    this.run.bossId = this.def.id;
    this.phase = 'approach';
    this.run.bossApproach = true;
    this.sfx.bossApproach();
    this.approachThudTimer = 1; // the window's own thud just played; the next one is 1 s later
  }
```
3. Replace the `'approach'` branch of `update()` (lines 161-165) with — the `due` check must stay first:
```ts
    if (this.phase === 'approach') {
      // The approach ends when the spawn is due, never on its own timer: no gap, no overlap with the warning.
      if (this.timer.due(this.run.timeSec, this.run.bossAlive)) this.startWarning();
      else {
        // Count-in: one low thud per whole second of the window; the first already played in startApproach.
        this.approachThudTimer -= dt;
        if (this.approachThudTimer <= 0) {
          this.sfx.bossApproach();
          this.approachThudTimer = 1;
        }
      }
      return;
    }
```
4. In `Sfx.ts` line 219 change only the doc comment to: `/** One soft low thud of the boss approach count-in: 60 Hz sine decaying over 200 ms. One per second, never overlaps itself. */` — do not touch the method body.

Result: thuds at window start + 0, 1, 2, 3, 4 s (5 total, 1 s apart in run time), for every warning of every boss and respawn; the 1 s nameplate phase and the sting are untouched.

### Pitfalls
- The due-check-first order is the correctness point: the window is exactly 5 s, so a countdown checked *after* the due test would fire a 6th thud on the closing frame (and drop the 4th one otherwise). Never swap the two blocks.
- Drive the thud from the dt countdown, never from `performance.now()`/`setInterval`: the countdown stops while the scene is paused (LevelUp, Pause, endRun all stop `GameScene.update`), matching the run clock; `Sfx.bossApproach()`'s own 1 s real-time throttle can never wrongly block, since 1 run-s takes at least 1 real-s.
- Do not touch `Sfx.bossApproach()`'s body, `BossApproachSystem` (red boundary pulse), the "SOMETHING HEAVY APPROACHES" text, `WARNING_SEC` or `BOSS_WARNING_SEC` — visuals, flash and the 5 s length are unchanged.
- `BossSystem.ts` is a hot file (T0119/T0120/T0121/T0122 edit it): keep the three hunks (field, `startApproach`, approach branch) in place and re-apply verbatim after any merge; do not move other lines.
- `approachThudTimer` only ever decrements by clamped `dt` (≤ 0.05 s) and resets to 1: no NaN, no negatives that escape the `<= 0` branch.

### Tests
none
