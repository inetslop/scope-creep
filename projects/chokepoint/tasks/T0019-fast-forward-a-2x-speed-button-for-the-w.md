---
id: T0019
title: "Fast-forward: a 2x speed button for the wave phase"
assignee: narcissus
size: M
priority: 2
status: done
depends_on: [T0015]
attempts: 1
created: 2026-10-28T03:52:49Z
claimed_at: 2026-10-28T15:07:23Z
finished_at: 2026-10-28T19:57:01Z
---

## Goal
Waves between builds can drag. A fast-forward button lets the player press 2x and burn through slow moments so a run stays in flow. It makes the game feel good from the first run and sets up the longer multi-level runs E3 will bring.

## Details
- A small round button in the HUD, next to the wave / lives card. It shows "2x".
- Tap / click to toggle between 1x and 2x. When 2x is active, the button is filled yellow and still reads "2x" so the player can see it is on. Tapping again returns to 1x and the button goes back to a plain white card.
- At 2x the whole wave phase runs twice as fast: enemy movement, tower firing, projectile flight, hit flashes and kill bursts. Apply it to the simulation step (delta time), so gold, lives, score and kills all accrue consistently — nothing desyncs or double-counts.
- Fast-forward only acts during the wave phase. When a build phase starts, it automatically resets to 1x and the button un-fills.
- A keyboard shortcut toggles it on desktop: **F**. If F is already taken, pick the nearest free key and use that same key everywhere it is shown.
- Discoverability: the button is visible in the HUD where it is used, and the pause screen lists it with the other controls: "F — fast-forward (2x) during waves."
- If the player opens the pause screen while at 2x, the game pauses as normal; on resume it stays at 2x.

## Acceptance criteria
- [ ] A "2x" button appears in the HUD during a wave; tapping it switches to 2x and the button fills yellow to show it is on; tapping again returns to 1x and it un-fills.
- [ ] At 2x, enemies move and towers fire at a clearly faster (2x) pace, and gold, lives, score and kills all accrue correctly with no desync or double-counting.
- [ ] The moment a build phase begins, fast-forward resets to 1x and the button un-fills.
- [ ] Pressing F on desktop toggles 2x exactly like tapping the button.
- [ ] The pause screen lists the fast-forward control (button + F key) alongside the other controls.
- [ ] The game is fully playable and passes the desktop and mobile smoke test at both 1x and 2x.

## Design (architect, desktop)

### Files
- create `src/systems/WaveSpeed.ts` — the 1x/2x state; scales the simulation dt, resets to 1 outside the wave phase
- create `src/ui/hud/SpeedButton.ts` — the round "2x" button, left of the NextWaveButton (bottom right); white card, yellow fill when 2x
- edit `src/scenes/GameScene.ts` — import + `speed!` field + construct + scale dt in `update()` (wiring only; `RunFlow` is NOT touched — T0011/T0005/T0015 edit it)
- edit `src/scenes/HudScene.ts` — import line + `new SpeedButton(this, game)` in the `parts` list, after `NextWaveButton`
- edit `src/input/hotkeys.ts` — one line for F (F is free; verified against `HOTKEYS`)
- edit `src/scenes/PauseScene.ts` — taller panel + a "Controls" list that includes the fast-forward line
- edit `src/debug/runChecks.ts` — one invariant line + one `syncHookStats` line
- edit `src/debug/testHook.ts` — `speed` in `HookStats` (interface + init), so the smoke harness can read it

### Interfaces
```ts
// src/systems/WaveSpeed.ts — no imports
export class WaveSpeed {
  speed = 1; // 1 or 2
  /** Toggle 1x/2x; only honoured while the wave phase runs (build/draft/over ignore it). */
  toggle(inWave: boolean): void { if (!inWave) return; this.speed = this.speed === 1 ? 2 : 1; }
  /** The dt to simulate this frame; outside the wave phase the speed resets to 1. */
  scale(dt: number, inWave: boolean): number { if (!inWave) this.speed = 1; return dt * this.speed; }
}
```
`SpeedButton implements HudPart` (constructor `(scene: Phaser.Scene, game: GameScene)`, `layout(width, height)`, `update(game)`), same pattern as `NextWaveButton`.

### Steps
1. Create `WaveSpeed.ts` as above (one-line file doc: wave speed, fast-forward, dt scaling).
2. Create `SpeedButton.ts`:
```ts
import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { cardTexture } from '../card';
import { textStyle } from '../text';
import { EDGE, NEXT_SIZE, isNarrow, type HudPart } from './hud';

export class SpeedButton implements HudPart {
  private readonly button: Button;
  private readonly card: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly white: string;
  private readonly yellow: string;
  private narrow = false;
  private fast = false;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.button = makeButton(scene, 0, 0, '2x', () => game.speed.toggle(game.run.phase === 'wave'), { width: 48, height: 48, radius: 24, fontSize: 15 });
    this.card = this.button.container.children.getAt(0) as Phaser.GameObjects.Image;
    this.white = cardTexture(scene, 48, 48, 24);
    this.yellow = cardTexture(scene, 48, 48, 24, PALETTE.yellow);
    this.hint = scene.add.text(0, 0, 'F', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5, 0);
  }

  layout(width: number, height: number): void {
    this.narrow = isNarrow(width);
    const x = width - EDGE - NEXT_SIZE / 2 - 4 - NEXT_SIZE / 2 - 10 - 24; // 10 px gap left of the next-wave button
    this.button.container.setPosition(x, height - HUD.bottom / 2);
    this.hint.setPosition(x, height - HUD.bottom / 2 + 30); // just under the button, inside the bottom bar
  }

  update(game: GameScene): void {
    const inWave = game.run.phase === 'wave';
    this.button.setEnabled(inWave);
    this.hint.setVisible(inWave && !this.narrow);
    const fast = inWave && game.speed.speed === 2;
    if (fast !== this.fast) {
      this.fast = fast;
      this.card.setTexture(fast ? this.yellow : this.white);
    }
  }
}
```
3. `GameScene.ts`: add `import { WaveSpeed } from './systems/WaveSpeed';` (before the `WaveSystem` import); field `speed!: WaveSpeed;` after `flow!: RunFlow;`; `this.speed = new WaveSpeed();` right after the `this.flow = new RunFlow(...)` block; and replace `update()` with:
```ts
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const simDt = this.speed.scale(dt, this.run.phase === 'wave');
    this.flow.update(simDt);
    this.exitWarn.update(simDt);
    syncHookStats(this);
  }
```
4. `HudScene.ts`: import `SpeedButton` (after the `PauseButton` import) and add `new SpeedButton(this, game),` after `new NextWaveButton(this, game),`.
5. `hotkeys.ts`: after the Space line add `{ keys: ['f', 'F'], run: (g) => g.speed.toggle(g.scene.isActive() && g.run.phase === 'wave') },`.
6. `PauseScene.ts`: change `panelH = 260` to `380`; title offset `+ 48` → `+ 54`; then between title and resume button add `const heading = this.add.text(0, -panelH / 2 + 96, 'Controls', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);` and `const keys = this.add.text(0, -panelH / 2 + 150, 'Space — start the wave early\nF — fast-forward (2x) during waves\n1-9 — pick a card from the hand\n+ / - — zoom the board', textStyle(12, PALETTE.muted, { align: 'center', lineSpacing: 6 })).setOrigin(0.5);`; resume offset `+ 124` → `+ 234`, quit `+ 196` → `+ 302`; add `heading, keys,` to the container list after `title`; import `textStyle` alongside `titleStyle`.
7. `runChecks.ts`: after the `'run.ledger'` line add `['speed.value', (g) => (g.speed.speed === 1 || g.speed.speed === 2 ? null : `speed is ${g.speed.speed}`)],`; in `syncHookStats` after the zoom line add `s.speed = game.speed.speed;`.
8. `testHook.ts`: add `/** The wave's speed: 1 or 2 (fast-forward). */ speed: number;` to `HookStats` after `zoom`, and `speed: 1,` to the `stats` init after `zoom: 1,`.

### Pitfalls
- Scale the capped dt once in `GameScene.update`, never the raw `deltaMs` (a tab stall must stay ≤ 0.1 s of sim; `PathLine.pointAt` clamps, so overshoot can't NaN). Pass the same scaled dt to `flow.update` AND `exitWarn.update` — nothing else moves.
- Don't pass `fill: PALETTE.yellow` to `makeButton` (it would paint the label white and stay yellow always). Default white fill keeps "2x" in ink, readable on yellow; only swap the cached card textures, and only when the state actually changes.
- Outside a wave the button is `setEnabled(false)` (faded, unclickable — the ZoomButtons/NextWaveButton pattern), never hidden. The fill requires `phase === 'wave' && speed === 2`, so it un-fills the instant a wave clears even though the state resets one frame later in `scale()`.
- Paused scenes still deliver keydowns: keep the `g.scene.isActive()` guard in the hotkey (same as `RunFlow.startWaveNow`). Don't reset speed in `PauseScene` — 2x must survive pause/resume.
- The "F" hint is a separate text, so it doesn't inherit the button's fade — sync its visibility in `update()`.
- Don't edit `RunFlow.ts`, `HandBar.ts` (T0008) or `Sfx.ts` (T0009) — no toggle sound is required. Put every new registry line next to its kin (never at list end): T0015/T0006 add lines to the same `parts` and `INVARIANTS` lists. If T0015's `NextWavePreview` lands in the slot left of NextWaveButton, shift the button one 10 px gap further left, same row.
- 48 px ≥ 44 px touch target; the smoke test's random clicks can hit the button, so 2x must simply keep the invariants green (it will: one dt per frame, per-event values unchanged).

### Tests
none (no rule in `src/core` changes; `WaveSpeed` lives in `systems/`)

## Result (attempt 1, narcissus)

Added 2x fast-forward for the wave phase: a new `WaveSpeed` system scales the simulation dt in GameScene so enemies, towers, projectiles and all wave effects run twice as fast at once, driven by a new `SpeedButton` HUD part (bottom right, left of the next-wave button; white card at 1x, filled yellow while active, tappable only during a wave) plus an F hotkey, with a `speed.value` invariant and hook stat, and the pause screen now lists "F — fast-forward (2x) during waves" among the controls. This fix round addressed two blockers: the wiring edits that make `game.speed` exist (GameScene field/initialization, HudScene parts list, hotkey, pause panel, invariants, hook stats) had not been applied, and Phaser 3.90 types a Container's children as a plain typed `list` array rather than `.children`/`.getChildren()`, so the card is now reached via `container.list[0]` (the button's first child, confirmed in `ui/button.ts`). Two minimal deviations from the design: I kept `rally.update()` on the scaled simDt (the rally banner ticks with the wave) and added a wide-screen x-offset so the 2x button clears the next-wave button's text label. Both `npm run check` and `npm run smoke` (desktop + phone) now pass.

- Self-review: APPROVE
- Time: 289.6 min
- Gate failed at "check"; fix round 1.

```
projects/chokepoint/game/src/debug/runChecks.ts    |  2 +
 projects/chokepoint/game/src/debug/testHook.ts     |  3 ++
 projects/chokepoint/game/src/input/hotkeys.ts      |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts   | 10 +++--
 projects/chokepoint/game/src/scenes/HudScene.ts    |  2 +
 projects/chokepoint/game/src/scenes/PauseScene.ts  | 14 +++---
 projects/chokepoint/game/src/systems/WaveSpeed.ts  | 20 +++++++++
 projects/chokepoint/game/src/ui/hud/SpeedButton.ts | 50 ++++++++++++++++++++++
 8 files changed, 93 insertions(+), 9 deletions(-)
```
