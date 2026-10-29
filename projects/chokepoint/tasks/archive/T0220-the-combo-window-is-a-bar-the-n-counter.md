---
id: T0220
title: "The combo window is a bar: the ×N counter's clock you can see"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T16:54:18Z
claimed_at: 2026-10-29T18:56:27Z
finished_at: 2026-10-29T19:12:10Z
---

## Goal
The kill-combo chain (T0031) breaks 1.5 s after the last kill, and nothing on the board shows that clock — a player can't tell how much tempo is left before the ×N, and its gold milestone (T0066), dies. The counter wears a thin bar that empties with the window, so the chain's life is read at a glance.

## Details
- What exists: the ×N kill-combo counter (T0031) — a rising muted-ink "×2, ×3" above the last kill, driven by the chain's state in `src/systems/FxSystem.ts`; at ×10 and up the counter wears the milestone yellow (T0034); the chain window is 1.5 s, refilled by each kill, and runs on the run's simulation clock (so at 2x speed it passes twice as fast, T0019).
- The change: while the counter is visible, a thin bar sits just under it, centered on it: about 26 px wide, 4 px tall, 2 px rounded ends. A track in the muted ink at about 20% alpha, and a fill in the counter's own color (the muted ink; the milestone yellow at ×10 and up, matching the counter, T0034) that drains from full to empty over the chain's 1.5 s window. A new kill (the counter rising to the next ×N) snaps the fill back to full. The bar appears and fades exactly with the counter — no bar while the counter is gone, no bar on a single kill.
- It is a draw, not a new timer: it reads the chain's existing window state (the six chain fields T0031 added to FxSystem), so the bar empties at exactly the moment the chain would break, and it stays honest at 2x (the fill drains twice as fast, as the window does). FxSystem gains no new state.
- New file: the bar's draw lives in its own small file (the Push wind-up ring's pattern, T0058 — a thin time-driven draw that sits beside the thing it describes), called from FxSystem where the counter is already drawn; the exact file placement is the architect's.
- Display only: the counter, the chain, the combo gold (T0066), the milestone (T0034) and everything else behave exactly as before. No sound, no input, no HUD card — the bar is a board-space readout that zooms and pans with the board, the way the counter does.
- Closest examples: the kill-combo counter (T0031) for the anchor and the colors; the Push wind-up ring (T0058) for the thin time-driven draw.

## Acceptance criteria
- [ ] While the ×N counter is visible, a thin rounded bar sits just under it: full right after a kill, draining to empty over the 1.5 s window; a new kill snaps it back to full.
- [ ] The bar is the counter's color (muted ink, milestone yellow at ×10 and up) over a ~20%-alpha muted-ink track, and it appears and fades exactly with the counter — no bar on a single kill or once the chain is gone.
- [ ] The bar empties at exactly the moment the chain breaks, and it drains twice as fast during the 2x speed, so it always agrees with the counter at 1x and 2x.
- [ ] No new state in the chain logic, no sound, no input, no HUD card; the counter, the combo gold and the milestone behave exactly as before, and the smoke test passes on desktop and mobile.

## Design (architect, yoga)

### Files
- create `src/systems/ComboBar.ts` - the drain bar under the ×N counter: one persistent `Graphics`, redrawn in place, reads the chain state off `FxSystem`
- edit `src/systems/FxSystem.ts` - expose the chain state the bar reads: two read-only getters after `get chain()` (line 44). No new state.
- edit `src/scenes/GameScene.ts` - wire it: import, `comboBar!` field, `new ComboBar(this, this.fx)`, `this.comboBar.update()`
- edit `src/debug/runChecks.ts` - one invariant line next to `pushWindup.valid`

### Interfaces
`FxSystem` gains (placed after `get chain()`), reusing existing `get chain()` for the count:
```ts
get counterText(): Phaser.GameObjects.Text | null { return this.comboText; }
get comboLastKill(): number { return this.lastKill; }
```
`src/systems/ComboBar.ts` (model on `systems/PushWindup.ts`; board units; one `Graphics`):
```ts
import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { FxSystem } from './FxSystem';

export class ComboBar {
  private readonly scene: Phaser.Scene;
  private readonly fx: FxSystem;
  private bar: Phaser.GameObjects.Graphics | null = null;
  private static readonly Y = 15; // bar centre under the counter centre; board units

  constructor(scene: Phaser.Scene, fx: FxSystem) { this.scene = scene; this.fx = fx; }

  update(): void {
    const t = this.fx.counterText;
    if (!t) { if (this.bar) this.bar.clear(); return; }
    if (!this.bar) this.bar = this.scene.add.graphics().setDepth(DEPTH.fx);
    const g = this.bar;
    // The chain window is on the scene clock (the same clock FxSystem.killCount uses),
    // so the fill empties at exactly the moment the chain breaks, at 1x and 2x alike.
    const frac = Math.min(1, Math.max(0, 1 - (this.scene.time.now - this.fx.comboLastKill) / 1500));
    g.clear();
    g.fillStyle(PALETTE.muted, 0.2);
    g.fillRoundedRect(-13, -2, 26, 4, 2); // track
    if (frac > 0.001) {
      g.fillStyle(this.fx.chain >= 10 ? PALETTE.yellow : PALETTE.muted, 1);
      g.fillRoundedRect(-13, -2, 26 * frac, 4, Math.min(2, (26 * frac) / 2)); // fill, drains right→left
    }
    g.setPosition(t.x, t.y + ComboBar.Y);
    g.setAlpha(t.alpha); // appears and fades exactly with the counter
  }

  broken(): string | undefined {
    if (this.bar && (!Number.isFinite(this.bar.x) || !Number.isFinite(this.bar.y))) return 'combo bar off-board';
    return undefined;
  }
}
```

### Steps
1. Create `src/systems/ComboBar.ts` as above.
2. `FxSystem.ts`: add the two getters after `get chain()` (line 44).
3. `GameScene.ts`: after the `PushWindup` import add `import { ComboBar } from '../systems/ComboBar';`; after `windup!: PushWindup;` (line 60) add `comboBar!: ComboBar;`; after `this.windup = new PushWindup(...)` (line 117) add `this.comboBar = new ComboBar(this, this.fx);`; after `this.windup.update(simDt);` (line 175) add `this.comboBar.update();`.
4. `runChecks.ts`: after `['pushWindup.valid', ...]` (line 50) add `['comboBar.valid', (g) => g.comboBar.broken()],`.

### Pitfalls
- THE CLOCK (do not get this wrong): the task text says the window "runs on the simulation clock" and "drains twice as fast at 2x". The code does NOT do that — `killCount` uses `this.scene.time.now` (real time) and `WaveSpeed.scale()` only scales the `dt` handed to systems, not `scene.time`. So the counter's 1.5 s window is 1.5 s of REAL time even at 2x. The bar MUST read `this.scene.time.now` (as above) so it agrees with the counter exactly. Do NOT drive the fill from `dt`/a sim clock: that would make the bar drain 2x faster and empty BEFORE the counter breaks — disagreeing with it, the opposite of the point. "Stays honest" = matches the counter's real-time window, at 1x and 2x.
- Fill is left-anchored (`x=-13` fixed, width shrinks) so it drains right→left; clamp radius `min(2, w/2)` so a near-empty fill isn't a degenerate blob; skip drawing it when `frac <= 0.001`.
- The bar repositions to `counterText` and copies `counterText.alpha` every frame, so it appears, tracks (each kill moves the counter up 8 px) and fades in lock-step — including the 400 ms end fade and the 200 ms leak fade. No bar on a single kill (counter only exists from ×2) and none once `counterText` is null. Color is the counter's own: muted, milestone yellow from ×10.
- It's a persistent draw (one `Graphics`), NOT an `fx.track()` one-shot and NOT counted in `fx.live`; `clear()` it (don't destroy) when the counter is gone. No new state in `FxSystem` (only the two read-only getters); no sound, input or HUD.

### Tests
none

## Result (attempt 1, yoga)

Added a thin 26×4 drain bar under the ×N kill-combo counter, so the chain's 1.5 s window is readable at a glance. New file `src/systems/ComboBar.ts` (one persistent Graphics, the Push windup ring's pattern) draws the fill in the counter's own color (muted ink, milestone yellow from ×10) over a ~20%-alpha muted-ink track; it drains right-to-left over the window driven by `scene.time.now` — the same real-time clock the counter uses — so it empties at exactly the moment the chain breaks and agrees with the counter at 1x and 2x. `FxSystem` gains only two read-only getters (`counterText`, `comboLastKill`); `GameScene` instantiates and updates the bar, and `runChecks` gets its invariant line. Check and smoke pass on desktop and mobile.

- Self-review: APPROVE
- Time: 15.7 min

```
projects/chokepoint/game/src/debug/runChecks.ts  |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts |  4 ++
 projects/chokepoint/game/src/systems/ComboBar.ts | 52 ++++++++++++++++++++++++
 projects/chokepoint/game/src/systems/FxSystem.ts | 10 +++++
 4 files changed, 67 insertions(+)
```
