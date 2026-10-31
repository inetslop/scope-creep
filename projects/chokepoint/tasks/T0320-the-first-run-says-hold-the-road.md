---
id: T0320
title: The first run says hold the road
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T01:28:10Z
epic: E11
---

## Goal
A first-time player builds their first towers and then just watches the wave with nothing naming the point; on the device's very first run, one plain white card under the wave-1 banner says "Hold the road" for the length of wave 1. The third and last of E11's three hints (T0318 is the first, T0319 the second).

## Details
- First run only: the profile's runsPlayed is still 0. A first run resumed after a tab close is still a first run; the hint re-derives from the run's state (T0272's pattern), so a resumed first run that has already cleared wave 1 (wavesCleared ≥ 1) never shows it, and a resumed first run still inside wave 1 does.
- Wave 1 only: shown from the moment the wave phase begins on wave 1 until that wave ends. It appears in exactly one wave — never wave 2 or later, never a later run.
- Position: top-center, in the band just below where the wave banner rests (the banner's own place, T0067; the same band the boss card uses later, T0256), so it reads as the banner's follow-up. Wave 1 has no boss (the first boss is wave 10), so that spot is free — no overlap.
- Look: the HUD's own white card at the teach's scale (the draft-card language, one size below the banner): one line of bold ink, ~14 px, "Hold the road".
- Dismissed by doing: the moment wave 1 ends the card fades out (~150 ms) and never comes back; if the run instead ends on wave 1, the game-over card takes its place. No sound, no input — a teach, not a button (nothing to list on the pause screen).
- One in, one out: first run only, one line, gone by doing, never a permanent mark — the teach's language (T0318's pick, T0319's build, T0272's early send). It names the objective at the exact moment a first-timer first sees the road being defended, and it clears itself.
- Nothing shown twice: the card says a sentence, not a number — the wave number stays on the wave card and the banner, lives and gold on the stats card; none of it is repeated here.
- Untouched: the banner's own ~1 s slide, the wave card, the stats card, the leak warning, and every tower.
- Closest example for the build: the second hint T0319 — a new file in `src/systems/fx/` (a sibling of `src/systems/fx/streakTeach.ts`, T0314's guard-and-re-derive pattern), shown and hidden by one guarded hook in the wave phase's own system (the place the build→wave and wave→draft turns happen), the card in the look of the HUD's white cards — so the board, the draft, and the scene's HUD registration all stay untouched.

## Acceptance criteria
- [ ] On a fresh profile (no finished runs), wave 1 shows the "Hold the road" card under the banner for the whole wave; the moment wave 1 ends it fades out and never reappears in that run or any later run.
- [ ] It never shows on wave 2 or later, in any run with runsPlayed ≥ 1, in a resumed first run that has already cleared wave 1, or after wave 1 has ended.
- [ ] The card says a sentence only (no wave number, lives or gold); the wave banner, wave card, stats card and leak warning all behave exactly as before; the card takes no input and plays no sound.
- [ ] Everything still fits at 412x915 and 1280x720 with the card up during wave 1.

## Design (architect, desktop)

### Files
- create `src/systems/fx/holdRoad.ts` - the "Hold the road" white card: builder, placer, fader (one concern, no FxSystem method)
- edit `src/systems/RunFlow.ts` - `firstRun` in `RunSystems`, `holdBox` field, the one guarded hook `holdRoad()`, two call sites (wave branch of `update()`, `endRun()`)
- edit `src/scenes/GameScene.ts` - one line: `firstRun` in the existing `new RunFlow(...)` object literal (profile read, like the surrounding lines)

### Interfaces
`RunFlow.ts` — in `RunSystems` (after `sfx`):
```ts
  /** The profile still has no finished run (recordRun adds one only at run end): the wave-1 teach may show. */
  firstRun: boolean;
```
`GameScene.ts` — in the literal ending `fx: this.fx, sfx,` add one line after `sfx,`:
```ts
      firstRun: loadProfile(window.localStorage).runsPlayed === 0, // a resumed first run is still first: the profile only counts finished runs
```
(`loadProfile` is already imported there.)

`src/systems/fx/holdRoad.ts` — whole file:
```ts
import { DEPTH, HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';
import { isNarrow } from '../../ui/hud/hud';
import { viewSize } from '../../ui/display';
import type { FxSystem } from '../FxSystem';

const H = 36; // one line of 14 px: the draft-card language, a size below the banner's 48

/** The first run's wave-1 teach, "Hold the road": a plain white card in the band just below where the wave
 *  banner rests (the boss card's band, free on wave 1) — the banner's follow-up. Pops in (~200 ms, like the
 *  boss card). It is the run's, not an effect: the caller keeps the container and ends it with fadeHoldRoad.
 *  No sound, no input. */
export function buildHoldRoad(fx: FxSystem): Phaser.GameObjects.Container {
  const scene = fx.scene;
  const label = scene.add.text(0, 0, 'Hold the road', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
  const card = makeCard(scene, 0, 0, Math.ceil(label.width) + 32, H, 12);
  const box = scene.add.container(0, 0, [card, label]).setDepth(DEPTH.fx);
  placeHoldRoad(box, viewSize(scene).width);
  box.setScale(0.4);
  scene.tweens.add({ targets: box, scale: 1, duration: 200, ease: 'Back.easeOut' });
  return box;
}

/** Top center, below the banner's resting place (the same band BossCard places at). */
export function placeHoldRoad(box: Phaser.GameObjects.Container, width: number): void {
  box.setPosition(width / 2, (isNarrow(width) ? HUD.top + 24 : 12) + 48 + 8 + H / 2);
}

/** Wave 1 ended or the run is over: the card fades out (~150 ms) and is gone. */
export function fadeHoldRoad(fx: FxSystem, box: Phaser.GameObjects.Container): void {
  fx.scene.tweens.killTweensOf(box);
  fx.scene.tweens.add({ targets: box, alpha: 0, duration: 150, ease: 'Quad.easeIn', onComplete: () => box.destroy(true) });
}
```
Add `import type Phaser from 'phaser';` as its first line.

`RunFlow.ts` — field after `buildTotalSec`, method before `clearWave()`, call sites as marked:
```ts
  /** The wave-1 teach's card while it is up; undefined while it fades out. */
  private holdBox: Phaser.GameObjects.Container | undefined;
```
```ts
  /** The first run's wave-1 teach, "Hold the road": re-derived from the run on every wave frame (T0272's
   *  pattern, never stored) — up only while the profile has no finished run and wave 1 is in its wave phase,
   *  so a resumed first run re-shows it only while wave 1 is still going, and it is never up on wave 2+. */
  private holdRoad(): void {
    const on = this.s.firstRun && this.run.wave === 1 && this.run.phase === 'wave';
    if (on) {
      if (!this.holdBox) this.holdBox = buildHoldRoad(this.s.fx);
      else placeHoldRoad(this.holdBox, viewSize(this.scene).width); // a resize mid-wave keeps it centered
    } else if (this.holdBox) {
      fadeHoldRoad(this.s.fx, this.holdBox);
      this.holdBox = undefined;
    }
  }
```
Imports: `import { loadProfile } from '../core/profile';` NOT needed (GameScene passes the flag); add `import { viewSize } from '../ui/display';` and `import { buildHoldRoad, fadeHoldRoad, placeHoldRoad } from './fx/holdRoad';` next to the `streakTeach` import.
Call sites: (1) in `update()`, in the `run.phase === 'wave'` branch, the line `if (this.s.waves.spawningDone && this.s.enemies.aliveCount === 0) this.clearWave();` gets `this.holdRoad();` after it (after, not before: `clearWave()` turns the phase to draft and must trigger the fade in the same frame). (2) in `endRun()`, first statement: `this.holdRoad();` (phase is already `'over'`, so it hides; the game-over card takes its place).

### Steps
1. Create `src/systems/fx/holdRoad.ts` exactly as above (four lines of imports incl. `type Phaser`, `H`, three exported functions).
2. Edit `RunFlow.ts`: add the two imports, the `firstRun` line in `RunSystems`, the `holdBox` field, the `holdRoad()` method, and the two call sites.
3. Edit `GameScene.ts`: the one `firstRun` line in the `RunFlow` literal.
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- `wavesCleared`/`over` are getters over `phase`/`wave`; `phase === 'wave' && wave === 1` already excludes cleared-wave-1 resumes (phase `draft`/`build`), wave 2+ (`wave >= 2`) and run end (`phase === 'over'`) — do not add stored state, do not save anything (T0272: never stored).
- `recordRun` increments `runsPlayed` only when a run finishes, so a resumed first run reads `firstRun === true` from the profile — correct; do not cache it in `RunState` or the save.
- `fadeHoldRoad` must `killTweensOf` first or the pop-in scale tween fights the fade; `box.destroy(true)` or the card image and text leak.
- Per-frame `placeHoldRoad` only runs while `holdBox` exists (wave 1 of a first run) — one `setPosition`, cheap; it is what keeps it centered through a mid-wave resize at both sizes.
- The card lives on GameScene at `DEPTH.fx`, under the HUD scene: it never covers the banner or the wave/stats cards, takes no input (no `setInteractive`), plays no sound; don't register it in `HudScene` and don't add methods to `FxSystem`.
- Wave 1 has no boss (first is wave 10), so the boss card's band is free — no overlap; don't reuse `TopBanner` (its slot lock is for the ~1 s slide, and this card persists the whole wave).

### Tests
- none (no `core/` rule; placement and show/hide are covered by `npm run check` + `npm run smoke`).
