---
id: T0223
title: "One start button: the big one banks the early-send gold, the Send button and the wave-gold line go"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T17:00:35Z
claimed_at: 2026-10-29T18:21:18Z
---

## Goal
The build phase has two buttons that start the wave. The big round one (and Space/Enter) starts it and pays nothing; the small "Send · +N" card under the wave preview starts it and banks 2 gold per whole second left. That is redundant, and the better one is the less visible one. The Send card's corners also differ from the round-ended preview card above it. Keep one: the big button starts the wave and banks the gold, and shows how much on it. Also clean up the wave preview card:
- drop its "+N gold" line (the wave's clear bonus), which looks awkward above the enemy counts and isn't worth the room;
- fix its one-time teach line ("quiet: fewer, double gold"), which runs past the card's bottom edge and its sides.

## Details
- **Remove `src/ui/hud/SendButton.ts`** (a `DELETE:` line) and everything that only it used: its part in the HUD (`src/scenes/HudScene.ts` / `src/ui/hud/hud.ts`) and `SEND_BTN`.
- **One way to start early:** the big button (`src/ui/hud/NextWaveButton.ts`) and Space/Enter (`src/input/hotkeys.ts`) do what Send did: bank 2 gold per whole second left (`RunState.bankSend`), then start the wave (`RunFlow.sendNow`'s steps). Fold `startWaveNow` and `sendNow` into one `RunFlow` method that both call. In the last partial second it banks 0 and just starts the wave. It is a gain, never a cost: no "can't afford" dimming, no red number.
- **The gold on the big button:** while the build phase runs and the bank is above 0, a small badge on the button's rim shows the coin icon beside "+N" (bold, 13-14 px), N falling by 2 each second. The badge is a white pill with fully round ends, like the preview card, and never overlaps the "Wave N" title, the hint, the preview card or the speed button, on wide or narrow screens. It goes when the bank reaches 0 and during the wave. On press, the "+N" gold pop rises from the button (the pop Send had).
- **The wave preview card (`src/ui/hud/NextWavePreview.ts`):**
  - Remove the "+N gold" line (`payLine`).
  - Lay the card out from its content: the counts row, then the teach line under it when there is one. Its height is the content plus the same padding top and bottom; its width is the widest line plus the padding. The teach line sits inside the card, never on or past its edge.
  - It now sits directly above the big button's ring or title, in the space Send used to take.
- **The pause screen's key list** (`src/scenes/PauseScene.ts`) says once that Space or the big button starts the wave early for +2 gold per second left, and drops the "Send" line.
- **Keep:** the countdown ring and its blips, the counts and the quiet/tight chips, the teach line's once-per-run rule, the card's pop-in, its hiding on narrow screens while the tower panel is open, `RunState.waveBonus` (the clear still pays it, just not shown here).

## Acceptance criteria
- [ ] There is one start-wave button. Pressing it, or Space/Enter, with 8 s left banks +16 gold and starts the wave; with under 1 s left it banks nothing and starts the wave.
- [ ] The badge shows "+N" on the big button during the build phase, falls by 2 each second, and is gone during the wave. It overlaps nothing at 1280x720 or 412x915.
- [ ] The preview card shows no "+N gold" line. On a quiet or tight wave's first preview, the teach line sits inside the card at both sizes.
- [ ] The Send button is gone from the game and its file is deleted. The tests for banking (`tests/core/run.test.ts`) still pass, and a test covers the folded start method.

## Design (architect, inet-racing)

### Files
- delete `src/ui/hud/SendButton.ts` — `DELETE: src/ui/hud/SendButton.ts`
- edit `src/ui/hud/hud.ts` — delete the `SEND_BTN` const and its comment (lines 19–20); keep `EDGE`, `CARD`, `NEXT_SIZE`, `isNarrow`
- edit `src/scenes/HudScene.ts` — delete the `SendButton` import (line 12) and the `new SendButton(this, game, preview),` line (48); keep the `preview` variable in `parts`
- edit `src/systems/RunFlow.ts` — delete `sendNow()`, change `startWaveNow()` to its body, returning the banked gold
- edit `src/ui/hud/NextWaveButton.ts` — onClick banks and pops; add the `+N` badge
- edit `src/ui/hud/NextWavePreview.ts` — drop `payLine` and the `rect` getter; content-sized card; no `SEND_BTN` offset
- edit `src/scenes/PauseScene.ts` — one start-wave line in the key list
- create `tests/systems/runFlow.test.ts` — covers the folded start method

### Interfaces
```ts
// RunFlow (replaces both startWaveNow(): void and sendNow(): number)
startWaveNow(): number; // banks run.bankSend(), then waves.start() + sfx?.waveStart(); 0 when not in build or scene inactive

// NextWavePreview: remove `get rect()`; private fields `cardW`, `cardH` (cardH is new, both set in build(), used by place()/fitScale())
```
No other public signatures change: hotkeys and the big button already call `startWaveNow`; `RunState.bankSend`/`waveBonus` stay untouched.

### Steps
1. `RunFlow.ts`: delete `sendNow` (lines 90–97) and replace `startWaveNow` (85–88) with:
```ts
  /** "Next wave" button / Space: bank the build countdown — 2 gold per whole second left — then start the wave the way the countdown end does.
   * Returns the gold banked (0 in the last partial second: it just starts the wave). */
  startWaveNow(): number {
    if (this.run.phase !== 'build' || !this.scene.scene.isActive()) return 0;
    const banked = this.run.bankSend();
    this.s.waves.start();
    this.s.sfx?.waveStart();
    return banked;
  }
```
2. `hud.ts`: delete `SEND_BTN`; `HudScene.ts`: delete its two lines; delete `src/ui/hud/SendButton.ts`.
3. `NextWavePreview.ts`: imports — drop `SEND_BTN` from the `./hud` import, make the run import `import type { RunState } from '../../core/run';`. Delete const `H` and `LINE`; add `const LINE_H = 20; const ROW_GAP = 6; const TEACH_H = 18;` (keep `PAD = 16`, `GROUP_GAP = 8`). Add field `private cardH = 0;`. Delete the `rect` getter. `place()`: last line becomes `box.setScale(this.fitScale()).setPosition(x, above - this.cardH / 2);` (drop `- SEND_BTN.height - SEND_BTN.gap`; keep `above` as is). In `build()`: keep the chip + counts loop exactly (pieces at y = 0, y fixed after), then:
```ts
    const countsW = Math.ceil(cursor);
    let teachText: Phaser.GameObjects.Text | undefined;
    if (teach) teachText = scene.add.text(0, 0, teach, textStyle(14, PALETTE.muted)).setOrigin(0.5);
    this.cardW = Math.max(countsW, teachText ? Math.ceil(teachText.width) : 0) + PAD * 2;
    this.cardH = LINE_H + (teach ? ROW_GAP + TEACH_H : 0) + PAD * 2;
    const contentH = this.cardH - PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of countsPieces) { p.x += left; p.y += -contentH / 2 + LINE_H / 2; }
    if (teachText) teachText.setPosition(0, -contentH / 2 + LINE_H + ROW_GAP + TEACH_H / 2);
    const pieces: Phaser.GameObjects.GameObject[] = [...countsPieces];
    if (teachText) pieces.push(teachText);
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, this.cardH, this.cardH / 2)); // pill, like before
    return scene.add.container(0, 0, pieces);
```
(name the earlier row `countsPieces`; delete the old `payLine`, old shift loop and old `makeCard` line). Keep the pop-in, the teach-once rule and the narrow-hide as is.
4. `NextWaveButton.ts`: add `import { artScale, COIN_TEXTURE } from '../../art/textures';`, `import { CARD_RES, cardTexture } from '../card';`, extend the palette import to `import { cssColor, PALETTE }`. Add `private readonly scene: Phaser.Scene;` (set in constructor), `private readonly badge: Phaser.GameObjects.Container;`, `private readonly badgeCard: Phaser.GameObjects.Image;`, `private readonly badgeCoin: Phaser.GameObjects.Image;`, `private readonly badgeText: Phaser.GameObjects.Text;`, `private badgeW = 0;`, and `const BADGE_H = 24;` at file top. In the constructor, after the button: change its onClick to `() => { const banked = game.flow.startWaveNow(); if (banked > 0) this.popGold(banked); }`, then build the badge:
```ts
    this.badgeCard = scene.add.image(0, 0, cardTexture(scene, 40, BADGE_H, BADGE_H / 2)).setScale(1 / CARD_RES);
    this.badgeCoin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    this.badgeText = scene.add.text(0, 0, '+0', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.badge = scene.add.container(0, 0, [this.badgeCard, this.badgeCoin, this.badgeText]).setVisible(false);
```
In `update()`, build branch (before `return;`): `this.refreshBadge(Math.max(0, Math.floor(run.buildLeftSec)) * 2);` — last line of the other branch: `this.refreshBadge(0);`. Add:
```ts
  /** The "+N" pill on the rim: N gold the press would bank; gone at 0. */
  private refreshBadge(n: number): void {
    if (n <= 0) { this.badgeW = 0; this.badge.setVisible(false); return; }
    this.badgeText.setText(`+${n}`);
    const w = 6 + 12 + 4 + 7 + this.badgeText.width; // pad L, coin, gap, pad R, text
    if (w !== this.badgeW) {
      this.badgeW = w;
      this.badgeCard.setTexture(cardTexture(this.scene, w, BADGE_H, BADGE_H / 2));
      this.badgeCoin.x = -w / 2 + 12;
      this.badgeText.x = -w / 2 + 22;
    }
    this.badge.setVisible(true).setPosition(this.button.container.x + 10, this.button.container.y - 35); // top rim, right of centre
  }

  /** The "+N" pop that rises from the button when a press banks gold (the Send button's pop). */
  private popGold(banked: number): void {
    const b = this.button.container;
    const y = b.y - NEXT_SIZE / 2 - 18;
    const t = this.scene.add.text(b.x, y, `+${banked}`, textStyle(22, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }
```
The badge at (+10, −35) clears the title (wide: left of the button; narrow: bottom edge at y−60), the preview card (bottom at y−55 wide / y−90 narrow) and the speed button (far left); its right edge stays inside the screen at both 1280×720 and 412×915. Keep `fadeWhenDisabled: false`; never dim or recolor the button (banking is a gain).
5. `PauseScene.ts` line 64: replace the two first lines of the key text with one: `'Space or the big button — start the wave early, +2 gold per second left\nF — fast-forward (2x) during waves\n1-9 — pick a card from the hand\n+ / - — zoom the board'`.
6. `tests/systems/runFlow.test.ts` (model the stubbing on `tests/systems/enemyHooks.test.ts`):
```ts
import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { START } from '../../src/config';
import { RunState } from '../../src/core/run';
import { RunFlow, type RunSystems } from '../../src/systems/RunFlow';

/** A flow with only what startWaveNow touches; the wave start and sound are recorded. */
function fakeFlow(active: boolean) {
  const run = new RunState(1);
  run.startBuild(8);
  const state = { started: 0, sound: 0 };
  const flow = new RunFlow(
    { scene: { isActive: () => active } } as unknown as Phaser.Scene,
    run,
    { waves: { start: () => (state.started += 1) }, sfx: { waveStart: () => (state.sound += 1) } } as unknown as RunSystems,
  );
  return { run, flow, state };
}

describe('RunFlow.startWaveNow, the one start-wave path', () => {
  it('banks 2 gold per whole second left and starts the wave', () => {
    const { run, flow, state } = fakeFlow(true);
    expect(flow.startWaveNow()).toBe(16); // 8 s left
    expect(run.gold).toBe(START.gold + 16);
    expect(run.buildLeftSec).toBe(0);
    expect(state).toEqual({ started: 1, sound: 1 });
  });
  it('banks nothing with under a second left and still starts the wave', () => {
    const { run, flow, state } = fakeFlow(true);
    run.buildLeftSec = 0.4;
    expect(flow.startWaveNow()).toBe(0);
    expect(run.gold).toBe(START.gold);
    expect(state.started).toBe(1);
  });
  it('does nothing when the scene is not active or the phase is not build', () => {
    const { flow, state } = fakeFlow(false);
    expect(flow.startWaveNow()).toBe(0);
    expect(state.started).toBe(0);
    const idle = new RunFlow({ scene: { isActive: () => true } } as unknown as Phaser.Scene, new RunState(1), { waves: { start: () => (state.started += 1) } } as unknown as RunSystems);
    expect(idle.startWaveNow()).toBe(0);
    expect(state.started).toBe(0);
  });
});
```
`tests/core/run.test.ts` is untouched (it tests `bankSend`, which is unchanged).

### Pitfalls
- Grep `SEND_BTN` and `SendButton` after the deletions: three import sites (hud.ts const, NextWavePreview, HudScene) — a leftover import fails `npm run check`.
- `place()` must use the new content-driven `cardH` (not the old `H`), or the card floats where Send used to sit.
- The badge's width changes with N ("+2" vs "+60"); `cardTexture` caches per size, so re-set the texture and re-place coin/text only when the width changes; the card image keeps its `1 / CARD_RES` scale when you `setTexture`.
- The pop text is scene-level (not a button child) and is destroyed in the tween's `onComplete`; the tween is killed on scene shutdown, so no manual cleanup.
- `floor(buildLeftSec)` is what makes N fall by 2 each whole second — don't round or ceil.
- Don't touch `RunState`, `hotkeys.ts` or `core/run.ts` — the folded method keeps both existing call sites working unchanged.
- Keep the preview card's pop-in (`killTweensOf` before destroy) and the narrow-screen hide-while-panel-open path; only its size and anchor change.

### Tests
- `tests/systems/runFlow.test.ts` as above (the folded start method: banks then starts; 0 in the last partial second; no-op when inactive/not build). Existing `tests/core/run.test.ts` bank tests must pass unchanged.
