---
id: T0077
title: "Send them early: start the wave now, paid in gold for the seconds left"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-28T22:13:10Z
claimed_at: 2026-10-29T00:50:13Z
finished_at: 2026-10-29T02:02:03Z
epic: E1
---

## Goal
The break between waves stops being free time: a player who is ready can start the wave early and be paid for the countdown they gave up, so every build phase ends in a decision — spend the time on building, or sell it for gold.

## Details
- A white card button under the wave preview card (T0015), visible exactly while the preview card is visible (the build phase, including the one before wave 1); hidden during the wave, after the wave ends and before the preview returns.
- Label: "Send · +N" with the HUD's small coin glyph before the number. N = 2 × the whole seconds left on the build countdown (floored), recomputed every second — the price visibly falls while the player waits, so the trade is seen without reading.
- The button is a large tap target in the reroll button's class (T0036); while N is more than the run's gold it is dimmed and the number is red (the buy-slot and reroll language), re-enabling live as the countdown brings N within reach.
- Press: the run's gold gains N (a gold pop at the button, the kill-gold pop's style), and the wave starts immediately on the same path the countdown end uses — the planned wave is unchanged (same enemies, same order), and the wave banner (T0067), the phase change and everything the countdown end does happen as usual. A press in the last partial second (N = 0) just starts the wave.
- No new hotkey — the button is the whole input. The pause screen lists it with the other controls: "Send — start the wave now, +2 gold per second left".
- Layout: the button sits in the preview card's width, below it, at 412x915 and 1280x720; it never covers the stats card, the coin line or the speed button (T0019, wave phase only).

## Acceptance criteria
- [ ] During the build phase, a "Send · +N" button sits under the wave preview card and N updates every second to 2 × the whole seconds left; with 30 s left it reads "+60" and falls by 2 each second.
- [ ] While gold < N the button is dimmed with a red number, and it enables live when the countdown brings N within the gold; pressing it then pays N (gold pop at the button) and starts the wave immediately.
- [ ] After the press the wave is exactly the planned wave (banner, enemies and order unchanged) and the build UI (preview card, button) is gone; a second press is impossible.
- [ ] The button is absent during the wave phase and in the beat after the wave ends.
- [ ] The pause screen lists "Send — start the wave now, +2 gold per second left".
- [ ] At 412x915 and 1280x720 the button fits under the preview card without covering the stats card, the coin line or the speed button.

## Design (architect, desktop)

### Files
- create `src/ui/hud/SendButton.ts` — the "Send · +N" HUD part: white card button under the preview card, banks 2 gold/whole second left, starts the wave.
- edit `src/ui/hud/NextWavePreview.ts` — add a `rect` getter (card's screen rect while visible) and shift the card up by the Send button's row in `place()`.
- edit `src/ui/hud/hud.ts` — add `SEND_BTN` size constants next to `NEXT_SIZE`.
- edit `src/scenes/HudScene.ts` — pull `NextWavePreview` into a local `const preview`, add `new SendButton(this, game, preview)` right after it in `parts`, one import line.
- edit `src/systems/RunFlow.ts` — add `sendNow()` next to `startWaveNow()`.
- edit `src/core/run.ts` — add `bankSend()` on `RunState` next to `startBuild()`.
- edit `src/scenes/PauseScene.ts` — add the Send line to the Controls text, `panelH` 434 → 458, and shift the Resume/Quit/Sound rows down 24.
- edit `src/debug/runChecks.ts` — one invariant line after `waves.next`.
- edit `tests/core\run.test.ts` — tests for `bankSend()`.

### Interfaces
```ts
// core/run.ts — on RunState, after startBuild():
bankSend(): number; // build phase only; = 2 * floor(buildLeftSec) (0 for none/NaN); gold += banked; buildLeftSec = 0; returns banked

// systems/RunFlow.ts — after startWaveNow():
sendNow(): number; // returns 0 unless run.phase === 'build' && this.scene.scene.isActive(); else bankSend(), this.s.waves.start(), this.s.sfx?.waveStart()

// ui/hud/hud.ts — after NEXT_SIZE:
export const SEND_BTN = { height: 48, gap: 10 } as const;

// ui/hud/NextWavePreview.ts — new getter:
get rect(): { x: number; y: number; width: number; height: number } | undefined; // box?.visible ? { x: box.x, y: box.y, width: this.cardW, height: H } : undefined

// ui/hud/SendButton.ts:
export class SendButton implements HudPart {
  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview);
  layout(width: number): void; // store screen width for edge clamping (WaveCard-style short signature)
  update(game: GameScene): void;
}
```

### Steps
1. `core/run.ts`, after `startBuild()`:
```ts
/** "Send" the wave early: bank the build countdown, 2 gold per whole second left. Returns the gold banked. */
bankSend(): number {
  if (this.phase !== 'build') return 0;
  const secs = Math.floor(this.buildLeftSec);
  const banked = (Number.isFinite(secs) && secs > 0 ? secs : 0) * 2;
  this.gold += banked;
  this.buildLeftSec = 0;
  return banked;
}
```
2. `systems/RunFlow.ts`, after `startWaveNow()`:
```ts
/** The "Send" button under the wave preview: bank the countdown's gold, then start the wave the way the countdown end does. */
sendNow(): number {
  if (this.run.phase !== 'build' || !this.scene.scene.isActive()) return 0;
  const banked = this.run.bankSend();
  this.s.waves.start();
  this.s.sfx?.waveStart();
  return banked;
}
```
3. `ui/hud/hud.ts`: add `export const SEND_BTN = { height: 48, gap: 10 } as const;` after `NEXT_SIZE`.
4. `ui/hud/NextWavePreview.ts`: import `SEND_BTN` from `./hud`; add the `rect` getter; in `place()` change the last line to `box.setPosition(x, above - H / 2 - SEND_BTN.height - SEND_BTN.gap);` (leaves the Send row between card and countdown). Nothing else moves.
5. Create `ui/hud/SendButton.ts` (model the row on `DraftScene`'s reroll, lines 162-182):
```ts
import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { cssColor, PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { textStyle } from '../text';
import { EDGE, SEND_BTN, type HudPart } from './hud';
import type { NextWavePreview } from './NextWavePreview';

const MIN_W = 140; // the "Send · +N" row needs this even when the preview card is one enemy wide

/** Under the wave preview card while the build phase runs: "Send · +N" starts the wave now and banks
 * 2 gold per whole second left (N falls by 2 each second). Dimmed with a red number while N is more
 * gold than the run has (the reroll's can't-afford look); the wave is the planned one. */
export class SendButton implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly game: GameScene;
  private readonly preview: NextWavePreview;
  private row: { button: Button; word: Phaser.GameObjects.Text; coin: Phaser.GameObjects.Image; price: Phaser.GameObjects.Text } | undefined;
  private builtW = 0;
  private width = 0;

  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview) {
    this.scene = scene;
    this.game = game;
    this.preview = preview;
  }

  layout(width: number): void {
    this.width = width;
  }

  update(game: GameScene): void {
    const rect = this.preview.rect; // the card's screen rect, or none while it is hidden
    if (!rect) {
      this.row?.button.container.setVisible(false);
      return;
    }
    const w = Math.max(rect.width, MIN_W);
    if (!this.row || this.builtW !== w) this.rebuild(w);
    const r = this.row!;
    r.button.container.setVisible(true);
    r.button.container.setPosition(Math.min(rect.x, this.width - EDGE - w / 2), rect.y + rect.height / 2 + SEND_BTN.gap + SEND_BTN.height / 2);
    const n = Math.max(0, Math.floor(game.run.buildLeftSec)) * 2; // 30 s left reads "+60", falls by 2 each second
    r.price.setText(`+${n}`);
    const afford = game.run.gold >= n;
    r.button.setEnabled(afford);
    r.price.setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
    r.button.content.setAlpha(afford ? 1 : 0.6);
    const rw = 12 + 8 + r.word.width + 6 + r.price.width;
    r.coin.x = -rw / 2 + 6;
    r.word.x = -rw / 2 + 20;
    r.price.x = r.word.x + r.word.width + 6;
  }

  private rebuild(w: number): void {
    this.row?.button.container.destroy(); // card, ring and the whole row are its children
    const scene = this.scene;
    const button = makeButton(scene, 0, 0, '', () => this.press(), { width: w, height: SEND_BTN.height, fadeWhenDisabled: false });
    const word = scene.add.text(0, 0, 'Send ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    const price = scene.add.text(0, 0, '+0', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    button.content.add([word, coin, price]);
    this.row = { button, word, coin, price };
    this.builtW = w;
  }

  private press(): void {
    const banked = this.game.flow.sendNow(); // 0 in the last partial second: just starts the wave
    if (banked <= 0) return;
    const b = this.row?.button;
    if (!b) return;
    const y = b.container.y - SEND_BTN.height / 2 - 18;
    const t = this.scene.add.text(b.container.x, y, `+${banked}`, textStyle(22, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() }); // the kill-gold pop
  }
}
```
6. `scenes/HudScene.ts`: import `SendButton`; in `create()` make `const preview = new NextWavePreview(this);` before the array, put `preview,` where the old entry was and `new SendButton(this, game, preview),` on the next line (before `HandBar`).
7. `scenes/PauseScene.ts`: `panelH` 434 → 458; in the `keys` text insert the new line right after the Space line — `'Space — start the wave early\nSend — start the wave now, +2 gold per second left\nF — ...'` — and change its y offset `+ 150` → `+ 158`; Resume `+ 234` → `+ 258`, Quit `+ 302` → `+ 326`, Sound `+ 374` → `+ 398`.
8. `debug/runChecks.ts`, after the `waves.next` line: `['send.countdown', (g) => (g.run.phase !== 'build' || (Number.isFinite(g.run.buildLeftSec) && g.run.buildLeftSec > 0) ? null : `build countdown is ${g.run.buildLeftSec}`)],`
9. `tests/core\run.test.ts`, after the "keeps the run ledger" test:
```ts
it('banks the build countdown when the wave is sent early: 2 gold per whole second left', () => {
  const run = new RunState(1);
  run.startBuild(30);
  expect(run.bankSend()).toBe(60); // 30 s left reads "+60"
  expect(run.gold).toBe(START.gold + 60);
  expect(run.buildLeftSec).toBe(0);
});

it('banks whole seconds only; the last partial second and a second send bank nothing', () => {
  const run = new RunState(1);
  run.startBuild(2.9);
  expect(run.bankSend()).toBe(4);
  expect(run.bankSend()).toBe(0);
  run.startBuild(0.4);
  expect(run.bankSend()).toBe(0);
  expect(run.gold).toBe(START.gold + 4);
});
```

### Pitfalls
- Gold direction: a press **adds** N (`gold += N`, the run pays the player); the `gold < N` dim/red look is only the can't-afford gate (the reroll's language) — it must never subtract gold. Do not "fix" it into a purchase.
- Start the wave with the countdown-end's exact two lines (`waves.start()` + `sfx?.waveStart()`), not `startWaveNow()`'s one-frame-delayed zeroing; the phase leaves `build` so a second press or the same frame's `update()` cannot start it twice. The banner, sfx and plan are untouched by design (`waves.start()` uses the planned wave).
- `N` is recomputed every frame from `buildLeftSec` — no per-second timer (frame-rate drift).
- The button is rebuilt only when the preview card's width changes (per wave plan); `container.destroy()` takes the label, coin and price with it — don't keep references to a rebuilt row.
- The preview card's upward shift must use `SEND_BTN` from `hud.ts` in both files; don't hardcode 48/10 in either.
- The Send row must not overlap: play button (10 px gap above it), the narrow "Wave N · Ns" title (14 px), the faded speed button (never — different y band), or the hand bar.
- No hotkey: Space keeps starting the wave for free on the round play button; don't touch `NextWaveButton` or `HOTKEYS`.
- `core/run.ts` may not import Phaser (lint); the button may not import `core/` beyond existing HUD imports.

### Tests
- `tests/core\run.test.ts`: the two `bankSend` cases above (rate 2/whole second, floor, partial second, repeated send).

## Result (attempt 1, asus)

Added the "Send · +N" early-wave button under the wave preview card: `RunState.bankSend()` banks 2 gold per whole second of build countdown left, `RunFlow.sendNow()` pays it and starts the planned wave via the countdown-end path, and the new `SendButton` HUD part (one line in `HudScene`) shows the falling price with the reroll's can't-afford dim/red gate, a kill-gold-style pop on press, and hides with the preview card (which gained a `rect` getter and shifted up by the button's row). The pause screen lists the control, a `send.countdown` invariant guards the build phase, and two unit tests cover the banking math. One deviation from the design: the pause panel's "Panic" caption (y=122) was not mentioned in the design and would have overlapped the shifted Quit button, so I moved it to y=134 to keep its original 3 px spacing.

- Self-review: APPROVE
- Time: 71.8 min

```
projects/chokepoint/game/src/core/run.ts           | 10 +++
 projects/chokepoint/game/src/debug/runChecks.ts    |  1 +
 projects/chokepoint/game/src/scenes/HudScene.ts    |  5 +-
 projects/chokepoint/game/src/scenes/PauseScene.ts  | 12 ++--
 projects/chokepoint/game/src/systems/RunFlow.ts    |  9 +++
 .../chokepoint/game/src/ui/hud/NextWavePreview.ts  | 10 ++-
 projects/chokepoint/game/src/ui/hud/SendButton.ts  | 77 ++++++++++++++++++++++
 projects/chokepoint/game/src/ui/hud/hud.ts         |  3 +
 projects/chokepoint/game/tests/core/run.test.ts    | 18 +++++
 9 files changed, 136 insertions(+), 9 deletions(-)
```
