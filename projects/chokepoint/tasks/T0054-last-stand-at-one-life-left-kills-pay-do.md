---
id: T0054
title: "Last stand: at one life left, kills pay double gold"
size: M
priority: 2
status: todo
depends_on: [T0045, T0039]
attempts: 0
created: 2026-10-28T13:04:03Z
epic: E1
---

## Goal
A losing run becomes a loud, high-stakes comeback: while the run has exactly 1 life left, every kill pays double gold, so the last stretch is a gold rush — the risk is priced where it is taken, and it ends the moment a life comes back.

## Details
- **State:** last stand is on whenever the run's lives are exactly 1, and off whenever they are 2 or more. It engages the moment a leak brings lives to 1, and disengages the moment the clean streak's payback (T0045) raises them to 2 — if they later fall back to 1, it turns back on. It is a state, never a one-shot.
- **Effect:** while on, every kill pays 2× the normal kill gold, and the gold pop at the kill spot shows the doubled amount (the "+N" the player sees is twice the usual number, so the rule reads itself). Mint's +1 per copy (T0021, popped by T0039) is paid on top of the doubled kill gold and is never doubled. Wave bonus, starting gold, slot prices, the run's coin formula (T0001) and the score are untouched.
- **Readable:** while on, the lives number in the stats card is the same red the leak warning uses (T0014), and it pulses once at the start of every wave — scale 1.15 back to 1.0 over ~150 ms, the same pop timing as the coin tally's pop (T0017). The moment the state is off, the number returns to its normal ink. No banner, no sound, no new card in this task.

## Acceptance criteria
- [ ] A run at 1 life: every kill's gold pop shows 2× the usual amount, and the lives number in the stats card is red.
- [ ] While at 1 life, the red lives number pulses once at the start of each wave; at 2 or more lives the number is in its normal ink and does not pulse.
- [ ] The streak payback (T0045) that raises lives 1 → 2 immediately returns kill gold to normal and the number to normal ink; a later leak back to 1 turns double gold back on.
- [ ] A kill in a Mint tower's range while last stand is on pays the doubled kill gold plus the usual +1 per Mint (never a doubled +1), with Mint's "+1" pop (T0039) unchanged.
- [ ] Wave bonus, slot prices, the coin tally, the score, sounds and all other HUD are unchanged; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/core/lastStand.ts` — pure last-stand rule (no Phaser): is it on, and what does a kill pay
- create `tests/core/lastStand.test.ts` — unit tests for the rule
- edit `src/systems/EnemySystem.ts` — double the enemy's own kill gold in `strike()` (one import, two lines)
- edit `src/ui/hud/StatsCard.ts` — lives number red while on, pulse once at each wave start

### Interfaces
```ts
// src/core/lastStand.ts
import type { RunState } from './run';
/** Last stand: on while the run has exactly one life left; off at two or more. A state, re-checked everywhere. */
export function isLastStand(run: RunState): boolean {
  return run.lives === 1;
}
/** The kill's own gold (the enemy's bounty), doubled while last stand is on. Mint's +1 per copy is added on top by the caller and never doubled. */
export function killGold(run: RunState, base: number): number {
  return isLastStand(run) ? base * 2 : base;
}
```
Nothing changes in `RunState`, `HitPayload`, `HudPart`, or the HUD parts list (no new element, no wiring in GameScene/HudScene, no hotkey, no sound, no banner — that is T0060).

### Steps
1. Create `src/core/lastStand.ts` exactly as above.
2. Create `tests/core/lastStand.test.ts` (vitest, model on `tests/core/mint.test.ts`): `new RunState(1)` starts with 20 lives; set `r.lives = 1` / `r.lives = 2` directly (public field). Cover: on at exactly 1, off at 2 and 3, back on at 1 again; `killGold(r, 4)` is 4 normally and 8 at 1 life. Run `npm run check`.
3. In `EnemySystem.ts` add `import { killGold } from '../core/lastStand';` next to the `mintGoldBonus` import (line 6), and in `strike()` replace line 113 with:
```ts
    // Last stand (core/lastStand.ts): at one life the enemy's own gold doubles; the mint bonus on top stays whole.
    const paid = this.run.addKill(killGold(this.run, e.def.gold) + (cell ? mintGoldBonus(this.towers(), cell, payload.source) : 0));
```
Keep line 112 (`const cell = ...`) and the existing comment above it. The existing `popText(e.x, e.y - 20, `+${paid}`)` then shows the doubled number for free — do not add a second pop.
4. In `StatsCard.ts` add `import { isLastStand } from '../../core/lastStand';`, two fields `private lastWave = -1;` and `private livesPulsing = false;`, and in `update()` (after `this.lives.setText(...)`):
```ts
    this.lives.setColor(isLastStand(game.run) ? PALETTE.red : PALETTE.ink);
```
and at the end of `update()` (after the coin `lastN` block):
```ts
    if (this.lastWave < 0) this.lastWave = game.run.wave; // first frame (also for resumed runs): no pulse
    else if (game.run.wave !== this.lastWave) {
      this.lastWave = game.run.wave; // run.wave only moves in startWave()
      if (isLastStand(game.run)) this.pulseLives();
    }
```
plus a private method next to `pop()`, same timing as the coin pop:
```ts
  /** Last stand: the red lives number pops once at each wave start, same timing as the coin pop. */
  private pulseLives(): void {
    if (this.livesPulsing) return;
    this.livesPulsing = true;
    this.scene.tweens.add({ targets: this.lives, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.livesPulsing = false; this.lives.setScale(1); } });
  }
```
5. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Mint never doubles: `killGold()` wraps only `e.def.gold`; the `mintGoldBonus(...)` term stays outside it. Doubling the whole `addKill` argument would break the Mint acceptance criterion.
- The pop shows `paid` returned by `addKill` — never hardcode `2 * e.def.gold` in the pop text (wrong whenever Mint is around).
- `lastWave` starts at −1 (lazy init), not 0: a new run (wave 0) must not pulse at game start, and a resumed run (T0042) with wave > 0 must not pulse on its first frame.
- `setColor()` with a `PALETTE` number works on Phaser Text; the number returns to ink the frame lives hit 2, because `update()` sets it every frame.
- Wave bonus, `spend()`, prices, `goldEarned`, and `run.score` (waves+kills) are untouched — do not edit `core/run.ts` (T0045 owns it).
- No `dt`, no pooling, no layout change: the HUD change is a text color and a tween, so 412x915 and 1280x720 are unaffected; nothing to clean up on shutdown (tween targets die with the scene).

### Tests
- `tests/core/lastStand.test.ts` as in step 2 (the 2×-only-the-bounty rule is the kind a later change could silently break).

## Note (by hand, 2026-10-28)

No longer waits on T0030: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.
