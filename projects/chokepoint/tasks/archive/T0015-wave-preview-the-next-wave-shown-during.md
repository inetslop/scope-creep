---
id: T0015
title: "Wave preview: the next wave shown during the build phase"
assignee: narcissus
size: M
priority: 2
status: done
depends_on: []
attempts: 3
created: 2026-10-28T02:08:37Z
claimed_at: 2026-10-28T13:11:27Z
finished_at: 2026-10-28T15:02:34Z
---

## Goal
The build phase is for planning, not guessing: during the build phase a small card shows what the next wave sends — each enemy's shape and its count.

## Details
- During the build phase (the countdown before a wave), a small white rounded card (the game's card style) appears near the existing build-phase countdown display (closest example: the UI that shows the seconds until the next wave): the next wave's composition, e.g. "Dot ×8 · Dart ×3".
- Each enemy type appears as its small shape icon (the same shape and color as on the board, ~16 px) followed by its count. Only types the wave actually sends appear — no ×0 lines.
- The preview reads the wave's own data; it never lists enemy types by hand, so when new enemies join the waves later (e.g. the Sprinter, T0006) they show up here automatically.
- The card pops in over 200 ms (the existing card pop) when the build phase starts and is gone by the time the wave starts. It never covers the road, the countdown, or the hand strip.
- No new inputs, no pause-screen change.

## Acceptance criteria
- [ ] During the build phase the preview card shows exactly the next wave's enemy types and counts; a type with 0 count is absent.
- [ ] The card's icons match the on-board enemy shapes and colors at a glance.
- [ ] The card pops in at the build phase start and is gone at wave start; at 412x915 and 1280x720 it covers nothing else.
- [ ] No enemy type is hardcoded: after T0006 lands, Sprinters appear in the preview with no further change to this task's code.

## Design (architect, desktop)

- The next wave's plan **doesn't exist yet** during the build phase — `WaveSystem.start()` calls `planWave()` only when the countdown ends (`src/systems/WaveSystem.ts:21-27`). The preview can't re-plan with `run.rng` (that would desync the RNG and change the actual wave), so the wave must be planned once at build start, stored, and consumed by `start()`.
- Enemy tokens are already painted textures (`enemyTexture(id)`, `art/entities.ts:12-16`), so the preview reuses them — no new painter, no conflict with T0006's `art/shapes.ts` work, and Sprinters show up automatically.
- The countdown display is `NextWaveButton` (bottom right, `height - HUD.bottom/2`), so the card goes above it: above the "Wave N · Xs" words on narrow screens, above the button's ring on wide.
- The game's existing pop is a scale-up with `Back.easeOut` (`entities/Tower.ts:59`); the task asks for 200 ms.
- A pure `waveCounts()` in `core/waves.ts` keeps the "counts, no zeros, first-arrival order" rule unit-testable.

DESIGN:
### Files
- create `src/ui/hud/NextWavePreview.ts` — the HUD part: the white card with the next wave's enemy tokens and counts (full code below)
- edit `src/core/waves.ts` — add pure `waveCounts(plan)` (appended after `planWave`)
- edit `src/systems/WaveSystem.ts` — plan the next wave at build start and expose it; `start()` consumes the stored plan
- edit `src/systems/RunFlow.ts` — one line in `finishDraft()`: call `waves.planNext()`
- edit `src/scenes/HudScene.ts` — import + one line in `parts`, after `NextWaveButton`
- edit `src/debug/runChecks.ts` — one invariant line after `run.ledger`
- edit `tests/core/waves.test.ts` — `waveCounts` test (add `waveCounts` to the existing import line)

### Interfaces
```ts
// core/waves.ts (append after planWave)
export function waveCounts(plan: WavePlan): { id: string; count: number }[];

// systems/WaveSystem.ts
get nextPlan(): WavePlan | undefined;  // the wave the build phase leads to
planNext(): void;                      // plans wave run.wave + 1, stores it in `private planned`

// ui/hud/NextWavePreview.ts
export class NextWavePreview implements HudPart { constructor(scene: Phaser.Scene); layout(width: number, height: number): void; update(game: GameScene): void; }
```

### Steps
1. `core/waves.ts`: append —
```ts
/** What a wave sends: each enemy type it sends, and how many (no zeros), in first-arrival order. */
export function waveCounts(plan: WavePlan): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of plan.spawns) counts.set(s.enemy, (counts.get(s.enemy) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count }));
}
```
2. `systems/WaveSystem.ts`: add field `private planned: WavePlan | undefined;` after `private timer = 0;`. Add before `start()`:
```ts
  get nextPlan(): WavePlan | undefined {
    return this.planned;
  }

  /** Plans the run's next wave; RunFlow calls it when the build phase starts. */
  planNext(): void {
    this.planned = planWave(this.run.wave + 1, this.run.rng, ENEMIES);
  }
```
In `start()`, replace `this.plan = planWave(this.run.wave, this.run.rng, ENEMIES);` with `this.plan = this.planned ?? planWave(this.run.wave, this.run.rng, ENEMIES);` and add `this.planned = undefined;` on the next line.
3. `systems/RunFlow.ts`: in `finishDraft()`, add `this.s.waves.planNext();` directly after `this.run.startBuild(seconds);`.
4. Create `src/ui/hud/NextWavePreview.ts`:
```ts
import type Phaser from 'phaser';
import { CELL, HUD } from '../../config';
import { getEnemy } from '../../content/enemies';
import { PALETTE } from '../../content/palette';
import { waveCounts, type WavePlan } from '../../core/waves';
import { artScale, enemyTexture } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';

const H = 44;
const PAD = 16;
const GROUP_GAP = 8;

/**
 * Above the countdown while the build phase runs: what the next wave sends, straight from its
 * plan (game.waves.nextPlan), so a new enemy shows up here with no change to this file. Each type
 * is its on-board token (~16 px) and its count. Pops in at the build phase's start, gone by the
 * wave's.
 */
export class NextWavePreview implements HudPart {
  private readonly scene: Phaser.Scene;
  private box: Phaser.GameObjects.Container | undefined;
  private cardW = 0;
  private size = { width: 0, height: 0 };
  private planNumber = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  layout(width: number, height: number): void {
    this.size = { width, height };
    if (this.box) this.place();
  }

  update(game: GameScene): void {
    const plan = game.run.phase === 'build' ? game.waves.nextPlan : undefined;
    if (!plan) {
      if (this.box) {
        this.scene.tweens.killTweensOf(this.box);
        this.box.setVisible(false);
      }
      return;
    }
    if (this.planNumber !== plan.number) {
      this.planNumber = plan.number;
      if (this.box) {
        this.scene.tweens.killTweensOf(this.box);
        this.box.destroy();
      }
      this.box = this.build(plan);
      this.place();
      this.box.setScale(0.4); // pop in like a new tower does
      this.scene.tweens.add({ targets: this.box, scale: 1, duration: 200, ease: 'Back.easeOut' });
    }
  }

  /** Above the countdown: above the words on narrow screens, above the button's ring on wide. */
  private place(): void {
    const box = this.box;
    if (!box) return;
    const { width, height } = this.size;
    const bottom = height - HUD.bottom / 2;
    const x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - this.cardW / 2);
    const above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10;
    box.setPosition(x, above - H / 2);
  }

  private build(plan: WavePlan): Phaser.GameObjects.Container {
    const scene = this.scene;
    const counts = waveCounts(plan);
    const pieces: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
    let cursor = 0;
    counts.forEach((c, i) => {
      if (i > 0) {
        const dot = scene.add.text(0, 0, '·', textStyle(14, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5);
        dot.setPosition(cursor + GROUP_GAP + dot.width / 2, 0);
        pieces.push(dot);
        cursor += GROUP_GAP * 2 + dot.width;
      }
      const icon = artScale(scene.add.image(0, 0, enemyTexture(c.id)), 8 / (getEnemy(c.id).look.size * CELL));
      icon.setPosition(cursor + 8, 0);
      pieces.push(icon);
      cursor += 16;
      const count = scene.add.text(0, 0, `×${c.count}`, textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      count.setPosition(cursor + 5, 0);
      pieces.push(count);
      cursor += 5 + count.width;
    });
    this.cardW = Math.ceil(cursor) + PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of pieces) p.x += left;
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, H, H / 2)); // card under the row
    return scene.add.container(0, 0, pieces);
  }
}
```
5. `scenes/HudScene.ts`: add `import { NextWavePreview } from '../ui/hud/NextWavePreview';` after the `NextWaveButton` import; add `new NextWavePreview(this),` after `new NextWaveButton(this, game),` in `parts`.
6. `debug/runChecks.ts`: after the `run.ledger` line add —
```ts
  ['waves.next', (g) => (g.run.phase !== 'build' || g.waves.nextPlan?.number === g.run.wave + 1 ? null : `build phase plans wave ${g.waves.nextPlan?.number ?? 'nothing'}, not ${g.run.wave + 1}`)],
```
7. `tests/core/waves.test.ts`: add `waveCounts` to the `core/waves` import, and append:
```ts
describe('waveCounts', () => {
  it('lists each type the wave sends, once, in first-arrival order', () => {
    for (const seed of [1, 7, 42]) {
      for (let wave = 1; wave <= 20; wave++) {
        const plan = planWave(wave, new Rng(seed * 100 + wave), ENEMIES);
        const counts = waveCounts(plan);
        expect(counts.reduce((n, c) => n + c.count, 0)).toBe(plan.spawns.length);
        const firstSeen: string[] = [];
        for (const s of plan.spawns) if (!firstSeen.includes(s.enemy)) firstSeen.push(s.enemy);
        expect(counts.map((c) => c.id)).toEqual(firstSeen);
        for (const c of counts) expect(c.count).toBeGreaterThan(0);
      }
    }
  });
});
```
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Never plan the wave twice.** The HUD must only *read* `game.waves.nextPlan`. Calling `planWave()` again in the HUD or in `start()` consumes `run.rng` a second time: the actual wave would no longer match the preview and every later random event shifts.
- The pop tween must be killed (`scene.tweens.killTweensOf`) before hiding and before `box.destroy()`, or a tween targets destroyed objects.
- `place()` uses the stored `cardW`, not `box.width` (container width includes the pop scale and would be wrong mid-tween on a resize).
- `pieces` must be typed `Image | Text` so `p.x` typechecks; the card goes in with `unshift` so it draws under the row.
- Icons reuse `enemyTexture(id)` (painted at boot for every entry of `ENEMIES`) — do not paint new shapes; that keeps this task clear of T0006's `art/shapes.ts` edits and makes Sprinters appear automatically.
- Shared files: T0002/T0011 also edit `RunFlow.ts` (their work is in `openDraft`, not `finishDraft`) and T0014/T0006 add lines to `runChecks.ts`; keep the edits single lines in different spots.
- No new input, no scene listeners — `HudScene` already drives `layout()`/`update()`, so there is nothing to clean up on shutdown.

### Tests
- `tests/core/waves.test.ts`: the `waveCounts` case above (sum of counts = spawn count, each type once, first-arrival order, no zeros).
- `npm run check` and `npm run smoke` must pass (smoke plays build phases where the card pops and disappears).

## Attempt 1 interrupted (narcissus)

The runner stopped mid-task (crash, restart or reboot). Requeued.

## Attempt 2 interrupted (narcissus)

The runner stopped mid-task (crash, restart or reboot). Requeued.

## Result (attempt 3, narcissus)

Added a build-phase "next wave" preview card (src/ui/hud/NextWavePreview.ts) that pops in above the countdown showing each incoming enemy's board token and count ("×N"), driven by a new pure `waveCounts()` in core/waves.ts. WaveSystem now plans the next wave once at build start (`planNext()`, called from RunFlow.finishDraft) and consumes that stored plan in `start()`, so the preview and the real wave are identical with no double RNG use. Registered one line in HudScene, one invariant (`waves.next`) in runChecks, and a unit test for `waveCounts`; no enemy types are hardcoded, so future enemies appear automatically. `npm run check` and `npm run smoke` (desktop + phone) both pass.

- Self-review: APPROVE
- Time: 111.1 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/core/waves.ts         |   7 ++
 projects/chokepoint/game/src/debug/runChecks.ts    |   1 +
 projects/chokepoint/game/src/scenes/HudScene.ts    |   2 +
 projects/chokepoint/game/src/systems/RunFlow.ts    |   1 +
 projects/chokepoint/game/src/systems/WaveSystem.ts |  16 +++-
 .../chokepoint/game/src/ui/hud/NextWavePreview.ts  | 105 +++++++++++++++++++++
 projects/chokepoint/game/tests/core/waves.test.ts  |  18 +++-
 7 files changed, 147 insertions(+), 3 deletions(-)
```
