---
id: T0106
title: The exit shows what is left
assignee: asus
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T11:10:48Z
finished_at: 2026-10-29T11:42:19Z
---

## Goal
A board readout where the wave ends: a small white chip above the exit gate counts the enemies still alive or still to come this wave, so the wave's size is seen at the exit and the last few going through are watched.

## Details
- During a wave, a small white rounded chip — the name tag's chip look (T0085: rounded white card, bold muted-ink text) — sits just above the exit gate, at the spot the leak warning already paints its copy (T0014), holding one muted-gray number about 14 px: the enemies still alive on the board plus the enemies still to come this wave (the wave's own plan, the T0015/T0079 read — plan total minus killed minus leaked).
- Hidden (not painted at all) when the count reaches 0, between waves (build phase, draft), and under the pause overlay.
- A board-space element (it scales with the board like the leak warning, not like the HUD cards), so it sits right at 412x915 and 1280x720 alike; it never collides with the leak warning's pulsing red copy.
- No rule change, no input, no sound; a new HUD file on the ExitWarning pattern (T0014), so it lands in its own file.

## Acceptance criteria
- [ ] During a wave, the chip above the exit gate shows plan total − killed − leaked (e.g. a wave of 5 with 2 killed and 1 leaked shows 2).
- [ ] The chip disappears the moment the count reaches 0, during the build phase, during the draft, and under the pause overlay.
- [ ] The number updates live as enemies spawn, die and leak; the wave's actual composition, gold and bonus are untouched.
- [ ] At both resolutions the chip sits just above the gate and never overlaps the leak warning's pulsing copy.

## Design (architect, yoga)

### Files
- create `src/systems/ExitCount.ts` — the board-space chip above the exit gate showing `flow.enemiesLeft` (same read as the next-wave button, `RunFlow.enemiesLeft`: plan total − killed − leaked).
- edit `src/scenes/GameScene.ts` — import, field, construction, `update()` call, `hide()`/`show()` from `openPause()`/`closePause()`.
- edit `src/debug/runChecks.ts` — one invariant line next to `exitWarn.valid`.

### Interfaces
```ts
export class ExitCount {
  constructor(scene: Phaser.Scene, board: Board, flow: RunFlow);
  update(): void;          // repainted every frame from GameScene.update
  hide(): void;            // pause overlay opened
  show(): void;            // pause overlay closed
  broken(): string | undefined;
}
```

### Steps
1. Create `src/systems/ExitCount.ts` — model `src/systems/ExitWarning.ts` (position, `broken()`) and `src/systems/fx/nameLabel.ts` (chip look). Exact contents:
```ts
import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import type { Board } from './Board';
import type { RunFlow } from './RunFlow';

/**
 * The wave's enemies still to come or alive, at the exit: during a wave a small white chip sits
 * just above the exit gate (where the leak warning paints its copy) with the same number the
 * "next wave" button shows — the wave's plan total minus killed minus leaked. Not painted at all
 * when that count reaches 0 (between waves, draft), or under the pause overlay. Board space: it
 * scales with the board like the leak warning, so it sits right at both resolutions.
 */
export class ExitCount {
  private readonly flow: RunFlow;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly chip: Phaser.GameObjects.Container;
  private shown = -1;
  private hiddenByPause = false;

  constructor(scene: Phaser.Scene, board: Board, flow: RunFlow) {
    this.flow = flow;
    this.g = scene.add.graphics();
    // No ui/text.ts import (it drags in debug/flags -> window): same inline style as nameLabel.
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: cssColor(PALETTE.muted),
      resolution: 1 / scene.scale.zoom,
    });
    this.label.setOrigin(0.5);
    const pts = board.path.points; // the leak warning's spot (ExitWarning.ts)
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2 - 56; // just above it, clear of its pulse
    this.chip = scene.add.container(x, y, [this.g, this.label]);
    this.chip.setDepth(DEPTH.fx).setVisible(false);
  }

  /** One frame of the wave, driven by GameScene. */
  update(): void {
    const n = this.flow.enemiesLeft;
    if (n !== this.shown) {
      this.shown = n;
      if (n > 0) {
        // The name tag's chip look: white card over its dark side face, bold muted number.
        this.label.setText(String(n));
        const w = this.label.width + 14;
        this.g.clear();
        this.g.fillStyle(PALETTE.cardDeep, 1);
        this.g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
        this.g.fillStyle(PALETTE.card, 1);
        this.g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
      }
    }
    this.chip.setVisible(!this.hiddenByPause && n > 0);
  }

  /** The pause overlay opened: the board is dimmed under it, the chip goes with it. */
  hide(): void {
    this.hiddenByPause = true;
  }

  /** The pause overlay closed: the next frame repaints the chip if the count is above 0. */
  show(): void {
    this.hiddenByPause = false;
  }

  /** Invariant: a visible chip has a finite position. */
  broken(): string | undefined {
    if (!this.chip.visible) return undefined;
    return Number.isFinite(this.chip.x) && Number.isFinite(this.chip.y)
      ? undefined
      : `exit count at (${this.chip.x}, ${this.chip.y})`;
  }
}
```
2. `GameScene.ts`, six lines:
   - import `import { ExitCount } from '../systems/ExitCount';` (before the `ExitWarning` import);
   - field `exitCount!: ExitCount;` after `exitWarn!: ExitWarning;`;
   - after the `this.flow = new RunFlow(...)` block: `this.exitCount = new ExitCount(this, this.board, this.flow);` (NOT next to `exitWarn` — `this.flow` must exist first);
   - in `update()`, after `this.exitWarn.update(simDt);`: `this.exitCount.update();`;
   - in `openPause()` after the guard: `this.exitCount.hide();`; in `closePause()`: `this.exitCount.show();` (all pause open/close goes through these two methods).
3. `runChecks.ts`, after `['exitWarn.valid', (g) => g.exitWarn.broken()],`: `['exitCount.valid', (g) => g.exitCount.broken()],`.

### Pitfalls
- Count is `flow.enemiesLeft` (`waves.remaining + enemies.aliveCount`), NOT a new killed/leaked tally — it is the exact same read the next-wave button shows, so it can never disagree with it; it also counts splitter children (alive on the board), which is intended.
- GameScene is paused under draft/pause, so `update()` cannot hide the chip itself — that is why `hide()`/`show()` exist and must be wired to `openPause`/`closePause`.
- Text is board space: keep `resolution: 1 / scene.scale.zoom` (camera scales it); a 14px label at y−56 stays clear of the warning's max pulse (chip bottom −44, warning top −40.5) at any zoom.
- Redraw the two `fillRoundedRect`s only when the number changes (`n !== shown`); read `label.width` after `setText` so a 2-digit number widens the chip.
- No listeners, no `onResize`, nothing to clean up; nothing is added to `EnemySystem`, `RunFlow` or the pause scene.

### Tests
none

## Result (attempt 1, asus)

During a wave, a small white chip now sits just above the exit gate counting the enemies still alive or still to come (plan total − killed − leaked, the same number the next-wave button shows). It updates live, vanishes the moment the count hits 0 or between waves/in the draft, and hides under the pause overlay. It lives in a new `src/systems/ExitCount.ts` (name-tag chip look, ExitWarning position), with six wiring lines in `GameScene.ts` and one invariant in `runChecks.ts`. Verified with `npm run check` and `npm run smoke` (desktop + phone).

- Self-review: APPROVE
- Time: 31.5 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/debug/runChecks.ts   |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts  |  6 ++
 projects/chokepoint/game/src/systems/ExitCount.ts | 79 +++++++++++++++++++++++
 3 files changed, 86 insertions(+)
```
