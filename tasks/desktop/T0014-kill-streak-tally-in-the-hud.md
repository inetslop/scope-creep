---
id: T0014
title: Kill-streak tally in the HUD
assignee: desktop
size: M
priority: 2
status: done
depends_on: [T0005, T0006]
attempts: 1
created: 2026-10-26T18:39:20Z
claimed_at: 2026-10-26T22:48:26Z
finished_at: 2026-10-26T22:58:36Z
---

## Goal
A kill-streak tally in the HUD: consecutive kills without taking damage. Aggressive, clean play becomes visibly rewarded, and the run's rhythm is something to chase.

## Details
- Streak = the number of enemies the player has killed in a row without taking damage. Every kill counts, from any source (projectiles, Orbit contact). Any damage taken (enemy contact or enemy shots) resets the streak to 0.
- HUD: when the streak is 2 or more, show a small ink-colored text "×N" in the top-right of the HUD (N = current streak), in the same font style as the other HUD numbers, placed so it does not overlap the HP bar. Hidden when the streak is below 2.
- When the streak reaches exactly 8 — and every multiple of 8 after (16, 24…) — the tally flashes red for 0.8 s and the word "RHYTHM" appears next to it in red for 0.8 s.
- When the streak resets because the player was hit, the tally fades out over 0.3 s instead of disappearing instantly.
- The GameOver screen shows the best streak reached this run as a small line next to the existing stats, e.g. "BEST STREAK ×12".

## Acceptance criteria
- [ ] Killing 2 enemies without taking damage shows a small ink "×2" in the top-right of the HUD, growing with each kill
- [ ] Taking any damage makes the tally fade out; the next kill starts the streak over (hidden until ×2)
- [ ] At exactly 8 consecutive kills the tally and the word "RHYTHM" flash red for ~0.8 s, and again at 16 and 24
- [ ] The GameOver screen shows the best streak reached this run
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - streak state on `RunState` (pure, unit-testable)
- edit `src/systems/CombatSystem.ts` - one line in `killEnemy()`
- edit `src/scenes/HudScene.ts` - the "×N" tally + "RHYTHM" text and per-frame logic
- edit `src/scenes/GameScene.ts` - `RunSummary.bestStreak`, streak invariant
- edit `src/scenes/GameOverScene.ts` - "Best streak" line
- edit `tests/core/core.test.ts` - streak tests

### Interfaces
```ts
// src/core/run.ts — add to RunState
streak = 0;        /** Consecutive kills without taking damage. */
bestStreak = 0;    /** Highest streak reached this run. */
registerKill(): void;  // streak += 1; bestStreak = max(bestStreak, streak)

// src/scenes/GameScene.ts
export interface RunSummary { timeSec: number; level: number; kills: number; bestStreak: number; seed: number; }

// src/scenes/HudScene.ts — new private method
private updateStreak(run: RunState, width: number): void;
```
All kills already funnel through `CombatSystem.killEnemy()` (projectiles at CombatSystem.ts:65, orbit via the `(e) => this.combat.killEnemy(e)` callback) and all player damage through `run.takeDamage()` (contact :73, enemy shots :82) — those two are the only hooks needed.

### Steps
1. `run.ts`: add the two fields after `kills = 0;`; add `registerKill()` after `heal()`; in `takeDamage()` add `this.streak = 0;` after the `this.hp = ...` line (the early return means this only runs when damage is actually dealt).
2. `CombatSystem.killEnemy()`: add `this.run.registerKill();` right after `this.run.kills += 1;`.
3. `GameScene.ts`: add `bestStreak: number;` to `RunSummary`; in `endRun()` set `bestStreak: this.run.bestStreak` in the summary object; in `registerInvariants()` add `hook.addInvariant('streak', () => (this.run.streak >= 0 && this.run.bestStreak >= this.run.streak ? null : `streak ${this.run.streak} / best ${this.run.bestStreak}`));` and append `'streak'` to the `INVARIANTS` array.
4. `GameOverScene.ts`: append `` `Best streak  ×${summary.bestStreak}` `` to the `lines` array (double space, matching the other lines).
5. `HudScene.ts`: import `cssColor` from `../content/palette` and `import type { RunState } from '../core/run';`. Add fields: `streakText!`, `rhythmText!` (Text), `streakShown = false`, `lastStreak = 0`, `flashUntil = 0`, `rhythmUntil = 0`, `flashRed = false`. In `create()` after `killText`: `this.streakText = this.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(1, 0.5).setVisible(false);` and `this.rhythmText = this.add.text(0, 0, 'RHYTHM', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(1, 0.5).setVisible(false);`. In `update()` call `this.updateStreak(run, width);` after the `killText` line.
6. Add the method (exact body):
```ts
private updateStreak(run: RunState, width: number): void {
  const s = run.streak;
  const now = this.time.now;
  if (s >= 2 && !this.streakShown) {
    this.streakShown = true;
    this.tweens.killTweensOf(this.streakText); // cancel a fade-out still running
    this.streakText.setVisible(true).setAlpha(1);
  } else if (s < 2 && this.streakShown) {
    this.streakShown = false;
    this.rhythmUntil = 0;
    this.tweens.killTweensOf(this.streakText);
    this.tweens.add({ targets: this.streakText, alpha: 0, duration: 300, ease: 'Linear', onComplete: () => this.streakText.setVisible(false) });
  }
  if (s > this.lastStreak && Math.floor(s / 8) > Math.floor(this.lastStreak / 8)) {
    this.flashUntil = now + 800;
    this.rhythmUntil = now + 800;
    this.tweens.killTweensOf(this.streakText);
    this.streakText.setAlpha(1);
    this.tweens.add({ targets: this.streakText, alpha: 0.3, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    this.tweens.killTweensOf(this.rhythmText);
    this.rhythmText.setScale(1).setAlpha(1);
    this.tweens.add({ targets: this.rhythmText, alpha: 0.35, scale: 1.2, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }
  this.lastStreak = s;
  if (s >= 2) {
    this.streakText.setText(`×${s}`);
    const red = now < this.flashUntil;
    if (red !== this.flashRed) {
      this.flashRed = red;
      this.streakText.setColor(cssColor(red ? PALETTE.red : PALETTE.ink));
    }
  }
  const y = PAD + 60;
  this.streakText.setPosition(width - PAD, y);
  this.rhythmText.setPosition(width - PAD - this.streakText.width - 8, y);
  this.rhythmText.setVisible(s >= 2 && now < this.rhythmUntil);
}
```
7. `tests/core/core.test.ts`, inside `describe('RunState')`:
```ts
it('tracks kill streak and best streak, reset by damage', () => {
  const run = new RunState(1);
  run.registerKill();
  run.registerKill();
  expect(run.streak).toBe(2);
  expect(run.bestStreak).toBe(2);
  run.takeDamage(5);
  expect(run.streak).toBe(0);
  expect(run.bestStreak).toBe(2);
  for (let i = 0; i < 5; i++) run.registerKill();
  expect(run.streak).toBe(5);
  expect(run.bestStreak).toBe(5);
});
```
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Tween fights**: every branch that animates `streakText`/`rhythmText` alpha must `killTweensOf` first (as written), or a leftover fade tween drags a re-shown tally's alpha back to 0.
- **Multi-kill in one frame** (pierce/orbit) can jump the streak 7→9, skipping 8 — that's why the flash test compares `Math.floor(s / 8)`, never `s % 8 === 0`.
- **HUD state is per scene instance** (`lastStreak` etc. are class fields); it resets correctly when the HUD relaunches on a new run. Don't move it to module scope or the hook.
- **Layout**: `y = PAD + 60` sits below the 44 px pause button (which ends at `PAD + 44`) and right-aligned at `width - PAD`; the HP bar (max width 260, left side) never overlaps it at 412 px or 1280 px. `RHYTHM` is placed left of the tally using `streakText.width` *after* `setText`.
- **Do not touch** `src/audio/Sfx.ts` (T0011) or `src/debug/testHook.ts` (T0005) — no sound is required, and the invariant goes through GameScene's existing `hook.addInvariant`/`INVARIANTS` pattern.
- All timing is ms via `this.time.now` and tweens — frame-rate independent; no `dt` math needed.
- The `×` is U+00D7; keep the file UTF-8 (it already is).

### Tests
- `tests/core/core.test.ts`: the `RunState` streak test above (kill increments, damage resets, best streak survives reset).

## Result (attempt 1, desktop)

Added a kill-streak tally: `RunState` now tracks `streak`/`bestStreak` (kills via `registerKill()` in `CombatSystem.killEnemy()` cover every kill source; any dealt damage in `takeDamage()` resets it), the HUD shows an ink "×N" top-right from ×2 up with a 0.3 s fade-out on reset and a 0.8 s red "RHYTHM" flash at every 8th consecutive kill, and the GameOver screen reports "Best streak ×N". Also registered a `streak` invariant in GameScene, added a unit test in `tests/core/core.test.ts`, and — one deviation from the design — reset the HUD's streak fields in `create()` because Phaser reuses the scene instance across runs (verified in `SceneManager.getScene`), which otherwise would leak `lastStreak` and skip the RHYTHM flash at 8 in a new run. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 10.2 min

```
game/src/core/run.ts             | 11 ++++++++
 game/src/scenes/GameOverScene.ts |  2 +-
 game/src/scenes/GameScene.ts     |  6 +++--
 game/src/scenes/HudScene.ts      | 58 +++++++++++++++++++++++++++++++++++++++-
 game/src/systems/CombatSystem.ts |  1 +
 game/tests/core/core.test.ts     | 14 ++++++++++
 6 files changed, 88 insertions(+), 4 deletions(-)
```
