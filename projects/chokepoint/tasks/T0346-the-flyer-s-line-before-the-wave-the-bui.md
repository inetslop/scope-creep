---
id: T0346
title: "The flyer's line before the wave: the build phase shows where it crosses"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: [T0317]
attempts: 1
created: 2026-11-01T07:42:15Z
claimed_at: 2026-11-02T11:21:28Z
epic: E10
---

## Goal
The Flyer (T0317) punishes a build that only covers the road, but its route is telegraphed at the wave's start — after the build is done. The build phase before the flyer's wave shows the flyer's route on the board, so the cover for the crossing is chosen in the build, not learned at the wave's door.

## Details
- **When:** during the build phase, whenever the next wave's plan declares the Flyer as its boss (today: wave 50, exactly one Flyer). The decision is a pure function of the plan — no run state, no save field: a resumed run that enters the build phase before the flyer's wave shows the line, and an Iron run shows it too. When the regular Flyer enters the wave mix (E10's next slice), that task extends this element to the mix waves it introduces; this task stays exact to the boss wave.
- **What:** the flyer's own first line — the board's seeded route (T0317's `flyRouteFor`) from the off-board spawn point to the exit gate, in the telegraph's own shape: 2 px, the flyer's red, ~50% alpha (T0317's wave-start line; the telegraph is the enemy's own language, the Dasher's). The bank's line is not shown: the bank is the wave's own beat, telegraphed in-wave by T0317.
- **Life:** the line is up for the whole build phase — it appears when the build phase opens (after the draft, and on a resume into the build) — and the moment the wave starts (the countdown ending or the early send), it fades out over 0.3 s and is destroyed; T0317's wave-start telegraph continues the same line for its 3 s, so the route reads from the build through the crossing's start and leaves no mark.
- **Nothing else:** no HUD card, no chip, no sound, no input, no change to the preview card (the boss chip and the tag's teach line already name the wave; the line is the new information). The board's own draw is untouched — the line is a scene object at the telegraph's depth, on the pattern of T0317's flyLine hook and the ExitWarning system.
- **Why the screen has room (board bar):** it is not a painted hint, teach or mark — it is the enemy's own route, a transient telegraph in the enemy's own language (the Dasher's stop, T0317's wave-start line), the same class as the range ring while placing (Pillar 1): a line that exists to inform a placement, gone the moment the placement is made.

## Acceptance criteria
- [ ] The build phase before wave 50 shows the flyer's route on the board (the spawn → exit line, the flyer's red, 2 px, ~50% alpha); every other build phase shows no line, and the board is otherwise byte-identical.
- [ ] The line is up for the whole build phase — it is there when the build opens after the draft, and when a resume enters the build before the flyer's wave — and it follows the board's seeded route (same seed, same line, the T0317 route).
- [ ] The moment the wave starts (the countdown ending or the early send), the line fades out over 0.3 s and is gone; T0317's wave-start telegraph continues the same line for its 3 s, and no line or mark remains after it.
- [ ] Unit test on the gate: the pure plan check is true for the wave-50 plan and false for the wave-49 and wave-51 plans (the seeded plans stay byte-identical, and no other wave plan declares the Flyer).
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass (the line is on the board, so no card fit is needed).

## Design (architect, desktop)

### Files
- create `src/core/flyTelegraph.ts` - pure gate: does the plan declare the Flyer as its boss
- create `src/systems/FlyTelegraph.ts` - the build-phase line on the board, on the ExitWarning pattern
- create `tests/core/flyTelegraph.test.ts` - gate unit test
- edit `src/scenes/GameScene.ts` - one import, one field, one construction, one update call (wiring only)
- edit `src/debug/runChecks.ts` - one invariant line

### Interfaces
```ts
// src/core/flyTelegraph.ts
import type { WavePlan } from './waves';
/** True only when the plan declares the Flyer as its boss (today: wave 50, exactly one Flyer). */
export function isFlyerBossPlan(plan: WavePlan | undefined): boolean {
  return !!plan && plan.tags.includes('boss') && plan.spawns.length === 1 && plan.spawns[0]!.enemy === 'flyer';
}

// src/systems/FlyTelegraph.ts
export class FlyTelegraph {
  constructor(scene: Phaser.Scene, board: Board, run: RunState, waves: WaveSystem);
  update(dt: number): void; // up during a flyer-boss build; fades over 0.3 s once the wave starts
  broken(): string | undefined;
}
```

### Steps
1. Create `src/core/flyTelegraph.ts` exactly as above. It only reads the plan — never touches `core/waves.ts` or the rng, so seeded plans stay byte-identical.
2. Read `src/systems/enemyHooks/flyLine.ts` (T0317, built before this task): note its exact `flyRouteFor(...)` call (the points), and the telegraph's color, width (2), alpha (~0.5) and depth.
3. Create `src/systems/FlyTelegraph.ts`. `update(dt)`: `const show = this.run.phase === 'build' && isFlyerBossPlan(this.waves.nextPlan);` — if `show`: make the line if `!this.line || !this.line.active`, reset `fadeT = 0`, `line.setLineStyle(2, COLOR, ALPHA)`, `line.setVisible(true)`, return. Else if `this.line && this.line.active && this.line.visible`: `fadeT += dt`; `line.setLineStyle(2, COLOR, ALPHA * Math.max(0, 1 - fadeT / 0.3))`; when `fadeT >= 0.3`: `line.destroy(); this.line = undefined;`. `makeLine()`: `this.scene.add.line(points, COLOR, ALPHA)` with the step-2 points, `.setLineWidth(2)`, `.setDepth(<flyLine's depth>)`, stored in `this.line`. `broken()`: undefined unless `this.line.visible`, then undefined only while every `line.points` entry has finite x/y, else `'the fly line has a non-finite point'`.
4. Edit `src/scenes/GameScene.ts` (four small edits): import `import { FlyTelegraph } from '../systems/FlyTelegraph';` right before the `FxSystem` import; field `flyTelegraph!: FlyTelegraph;` right after `exitWarn!: ExitWarning;`; `this.flyTelegraph = new FlyTelegraph(this, this.board, this.run, this.waves);` right after `this.waves = new WaveSystem(this.run, this.enemies);`; `this.flyTelegraph.update(simDt);` right after `this.flow.update(simDt);` (after it: `flow.update` is what calls `waves.start()` when the countdown ends, so the fade starts the same frame; the early send goes through the same `waves.start()`).
5. Edit `src/debug/runChecks.ts`: `['flyLine.valid', (g) => g.flyTelegraph.broken()],` right after the `['exitWarn.valid', ...]` line.
6. Create `tests/core/flyTelegraph.test.ts` (vitest, modeled on `tests/core/waves.test.ts`, `planWave(w, new Rng(w), ENEMIES)`): gate true for the wave-50 plan; false for the wave-49 and wave-51 plans; false for `undefined` and for the wave-10, wave-20 and wave-30 boss plans; and a loop over waves 1..60 except 50 asserting false (no other wave plan declares the Flyer).
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Continuity is the point: the build line must be the same points, color, width, alpha and depth as T0317's wave-start telegraph, or the 0.3 s fade over the 3 s wave-start line reads as two lines. Copy the values from flyLine.ts, do not re-derive them.
- Phaser `Line` has no `setAlpha()` — fade through `setLineStyle(width, color, alpha)` or the build won't compile.
- No tweens, no `Math.random`: the fade uses the `dt` (simDt) GameScene passes, so it freezes with the pause and ends in exactly 0.3 s.
- No stored "last wave" state: `show` re-derives each frame and is false the moment `waves.start()` clears `planned`, so the line can't re-appear mid-fade; a new run builds a fresh system and a destroyed line is never touched again.
- A resume saved mid-wave-50 calls `waves.start()` in `restore()` without `planNext()`, so `nextPlan` is undefined and the line correctly does not flash; a resume into the build before wave 50 calls `planNext()`, so it shows from frame 1.
- Nothing else changes: no HUD part, no sound, no input, no Board/ExitWarning/RunFlow edits.

### Tests
- `tests/core/flyTelegraph.test.ts` per step 6 (the gate is a new core rule that E10's mix-wave extension could silently widen).
