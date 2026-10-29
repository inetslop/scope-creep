---
id: T0107
title: The first leak says what it costs
assignee: narcissus
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T16:55:09Z
---

## Goal
Pillar 8 at the moment of paying: the run's first leak shows a small chip at the exit naming the price, so "a leak costs a life" is learned where it is first paid, not discovered by a number dropping.

## Details
- The first time this run's lives drop below its starting lives (the run's first leak), a small white chip — the name tag's chip look (T0085: rounded white card, bold 12 px muted ink) — pops at the exit gate with the text "leaks cost a life".
- Motion: ~200 ms in, ~1 s hold, ~300 ms out (the name tag's ~1.5 s total).
- Once per run: later leaks in the same run show nothing. A resumed run re-derives: a run whose lives are already below its starting lives has already seen it (no chip); a resumed run at its starting lives still gets the chip on its first leak.
- A Hauler's extra red "−5" gold pop (T0057) stays exactly as is: the chip names the life, the pop names the gold, and both can appear together on a first Hauler leak. The leak warning (T0014), the leak jolt and the lives number are untouched.
- No sound, no input, no rule change; a new small system file that watches the run's lives (the ExitWarning pattern, T0014 — a system that reads state, with no changes to the enemy or run flow), so it lands in its own file.

## Acceptance criteria
- [ ] The run's first leak (lives first below the starting value) shows the "leaks cost a life" chip at the exit for ~1.5 s; no later leak in the same run shows it.
- [ ] A run resumed below its starting lives never shows the chip; one resumed at its starting lives shows it on its first leak.
- [ ] A Hauler's first-leak case still shows the red "−5" pop alongside the chip; the leak warning and the lives number behave exactly as today.

## Design (architect, baby-mama)

### Files
- create `src/systems/LeakCost.ts` — class that watches `run.lives`; when it first falls below `START.lives`, shows the chip at the exit; once per run
- create `src/systems/fx/leakCost.ts` — the white "leaks cost a life" chip effect (nameLabel's look, 200 ms in / 1 s hold / 300 ms out)
- edit `src/scenes/GameScene.ts` — 4 lines: import, field, construction, update call
- edit `src/debug/runChecks.ts` — one invariant line

### Interfaces
```ts
// src/systems/fx/leakCost.ts — copy fx/nameLabel.ts's body, change only the text and the last tween:
export function leakCost(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const label = fx.scene.add.text(0, -1, 'leaks cost a life', {
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: cssColor(PALETTE.muted),
    resolution: 1 / fx.scene.scale.zoom,
  });
  label.setOrigin(0.5);
  const g = fx.scene.add.graphics();
  const w = label.width + 14;
  g.fillStyle(PALETTE.cardDeep, 1);
  g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
  g.fillStyle(PALETTE.card, 1);
  g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
  const chip = fx.scene.add.container(x, y, [g, label]);
  chip.setDepth(DEPTH.fx).setScale(0);
  fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' }); // hold 1 s, out 300 ms
}

// src/systems/LeakCost.ts
import { START } from '../config';
import type { RunState } from '../core/run';
import type { Board } from './Board';
import type { FxSystem } from './FxSystem';
import { leakCost } from './fx/leakCost';

export class LeakCost {
  private readonly run: RunState;
  private readonly fx: FxSystem;
  private readonly x: number;
  private readonly y: number;
  private seen: boolean | null = null; // decided on the FIRST update, see note
  constructor(run: RunState, fx: FxSystem, board: Board) {
    this.run = run;
    this.fx = fx;
    const pts = board.path.points; // same exit anchor as ExitWarning's constructor
    this.x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    this.y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
  }
  update(_dt: number): void {
    if (this.seen === null) this.seen = this.run.lives < START.lives; // resumed below start => already seen
    if (this.seen || this.run.lives >= START.lives) return;
    this.seen = true;
    leakCost(this.fx, this.x, this.y);
  }
  broken(): string | undefined {
    return Number.isFinite(this.x) && Number.isFinite(this.y) ? undefined : `leak cost at (${this.x}, ${this.y})`;
  }
}
```

### Steps
1. Create `src/systems/fx/leakCost.ts` exactly as above (imports `DEPTH` from `../../config`, `PALETTE, cssColor` from `../../content/palette`, type `FxSystem` from `../FxSystem`).
2. Create `src/systems/LeakCost.ts` exactly as above.
3. `src/scenes/GameScene.ts`: import `LeakCost` between the FxSystem and ProjectileSystem imports; field `leakCost!: LeakCost;` after `exitWarn!`; `this.leakCost = new LeakCost(this.run, this.fx, this.board);` right after the `new ExitWarning(...)` line; `this.leakCost.update(simDt);` right after `this.exitWarn.update(simDt);`.
4. `src/debug/runChecks.ts`: add `['leakCost.valid', (g) => g.leakCost.broken()],` right after the `exitWarn.valid` line.

### Pitfalls
- **Do not** initialize `seen` in a field or the constructor: `RunSave.restore` sets `run.lives` after the system is built (GameScene line 94 vs 75), so a resumed run below its starting lives would otherwise be mis-read as "not seen" and chip again. The first-update latch handles fresh, resumed-below, and resumed-at-start runs with no stored flag.
- The chip is a scene tween (freezes while paused, as ExitWarning's does); the system only polls state, so the speed toggle can't re-trigger it and the latched `seen` guarantees once-per-run even if lives later climb back (streak +1).
- Chip objects are auto-destroyed by `fx.track()` and guarded by `fx.full`; add nothing to EnemySystem — the red "−5" Hauler pop, the leak warning, the jolt and the lives number are untouched and can co-occur.

### Tests
none
