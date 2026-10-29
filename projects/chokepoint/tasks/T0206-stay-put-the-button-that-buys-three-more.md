---
id: T0206
title: "Stay put: the button that buys three more build seconds"
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T12:51:15Z
claimed_at: 2026-10-29T19:40:11Z
---

## Goal
A player who is still placing towers can buy time: during the build phase a "Stay put · 5" button spends 5 gold to add 3 seconds to the build countdown — the mirror of Send-them-early (T0077): a player who is ready sells the seconds for gold, one who is not buys them back.

## Details
- A small white card button in the Send button's (T0077) own card look, labeled "Stay put · 5" (coin glyph and label, same language as "Send · +N"), sitting directly under the Send button. Shown only while the build phase runs (including before wave 1) and hidden whenever the Send button is hidden.
- Tap: pays 5 gold and adds 3 seconds to the remaining build time. Everything that reads the countdown follows the new total with no special cases: the teal countdown ring on the next-wave button, the Send button's "+N" (2 gold per whole second left), and the last-three-seconds tick blips (T0090).
- On paying, a small red "−5" pop rises from the button — the Hauler's red "−5" pop look (T0057).
- Once per build phase: after its one use the button stays in place but dims and reads "Stay put · used", untappable — the reroll button's "used" look (T0036). A new build phase shows it fresh.
- While the run's gold is under 5: the price "5" is drawn red and the button is dimmed and untappable — the Send button's short-gold look.
- It composes with Send as normal: the added seconds count in Send's "+N", so a player who buys the three seconds and sends at once nets +1 gold over sending right away. That is the intended trade, not a bug to close.
- No new key: click/tap only. The pause screen's controls list gains one line naming the button and what it does (5 gold, +3 s of build, once per build phase).
- Layout: at 412x915 and 1280x720, the Send and Stay put buttons both fit under the wave preview card without overlapping it, each other or the next-wave button; the tap target matches the Send button's.
- Resume: the save is written when a run enters the build phase (T0042), so a resumed build phase starts with its full countdown and a fresh Stay put; no save field is added.

## Acceptance criteria
- [ ] In every build phase (including before wave 1) a "Stay put · 5" button shows under the Send button in the same card look; between build phases it is hidden with the Send button.
- [ ] Tapping with 5 or more gold: gold drops by 5 with the red "−5" pop at the button, and the countdown grows by 3 seconds — the teal ring, the Send "+N" and the tick blips all reflect the new total.
- [ ] After its one use the button dims, reads "used" and is untappable; the next build phase shows it fresh.
- [ ] With less than 5 gold the price is red, the button dimmed and untappable.
- [ ] The pause screen's controls list the button and its effect in one line; no new key exists.
- [ ] At 412x915 and 1280x720 the two buttons and the wave preview card do not overlap; a resumed run has a fresh Stay put.

## Design (architect, narcissus)

### Files
- CREATE `src/ui/hud/StayPutButton.ts` — new HUD part (code below).
- EDIT `src/config.ts` — one constant after `REROLL_COST` (line 33).
- EDIT `src/systems/RunFlow.ts` — one method after `sendNow()` (+ `STAY_PUT` in the config import on line 2).
- EDIT `src/ui/hud/NextWavePreview.ts` — one line in `place()` (line 95).
- EDIT `src/scenes/HudScene.ts` — one import + one line in `parts`.
- EDIT `src/scenes/PauseScene.ts` — one added line in the Controls string (line 63).

### Interfaces
```ts
// config.ts (next to REROLL_COST)
export const STAY_PUT = { cost: 5, sec: 3 } as const;

// RunFlow.ts (import STAY_PUT from '../config'; method after sendNow())
buyBuildTime(): boolean; // pay STAY_PUT.cost gold for STAY_PUT.sec more build seconds; false unless game scene active in build phase with enough gold

// StayPutButton.ts
export class StayPutButton implements HudPart {
  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview); // same ctor as SendButton
}
```

`StayPutButton.ts` — mirrors `SendButton.ts` line for line; full class:
```ts
import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { cssColor, PALETTE } from '../../content/palette';
import { STAY_PUT } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { textStyle } from '../text';
import { EDGE, SEND_BTN, type HudPart } from './hud';
import type { NextWavePreview } from './NextWavePreview';

const MIN_W = 140; // same footprint as the Send row above

/** Under the Send button while the build phase runs: "Stay put · 5" buys 3 more build seconds, once per
 * build phase. Red number while the run has less than 5 gold (Send's can't-afford look); spent it reads
 * "used" (the reroll's look) until the next build phase. */
export class StayPutButton implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly game: GameScene;
  private readonly preview: NextWavePreview;
  private row: { button: Button; word: Phaser.GameObjects.Text; coin: Phaser.GameObjects.Image; price: Phaser.GameObjects.Text } | undefined;
  private builtW = 0;
  private width = 0;
  private used = false;
  private lastPhase = '';

  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview) { this.scene = scene; this.game = game; this.preview = preview; }
  layout(width: number): void { this.width = width; }

  update(game: GameScene): void {
    if (game.run.phase === 'build' && this.lastPhase !== 'build') this.used = false; // each build phase gets its one buy
    this.lastPhase = game.run.phase;
    const rect = this.preview.rect; // hidden whenever the Send button above is
    if (!rect) { this.row?.button.container.setVisible(false); return; }
    const w = Math.max(rect.width, MIN_W);
    if (!this.row || this.builtW !== w) this.rebuild(w);
    const r = this.row!;
    r.button.container.setVisible(true);
    r.button.container.setPosition(Math.min(rect.x, this.width - EDGE - w / 2), rect.y + rect.height / 2 + SEND_BTN.gap * 2 + SEND_BTN.height * 1.5);
    const afford = game.run.gold >= STAY_PUT.cost;
    r.price.setText(this.used ? 'used' : String(STAY_PUT.cost));
    r.word.setColor(cssColor(this.used ? PALETTE.muted : PALETTE.ink));
    r.price.setColor(cssColor(this.used ? PALETTE.muted : afford ? PALETTE.ink : PALETTE.red));
    r.button.setEnabled(!this.used && afford);
    r.button.content.setAlpha(this.used ? 0.5 : afford ? 1 : 0.6); // reroll's used / can't-afford looks, no fade (fadeWhenDisabled: false)
    const rw = 12 + 8 + r.word.width + 6 + r.price.width;
    r.coin.x = -rw / 2 + 6;
    r.word.x = -rw / 2 + 20;
    r.price.x = r.word.x + r.word.width + 6;
  }

  private rebuild(w: number): void { // SendButton.rebuild, word/price differ
    this.row?.button.container.destroy();
    const scene = this.scene;
    const button = makeButton(scene, 0, 0, '', () => this.press(), { width: w, height: SEND_BTN.height, fadeWhenDisabled: false });
    const word = scene.add.text(0, 0, 'Stay put ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    const price = scene.add.text(0, 0, String(STAY_PUT.cost), textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    button.content.add([word, coin, price]);
    this.row = { button, word, coin, price };
    this.builtW = w;
  }

  private press(): void { // SendButton.press, "-5" in red (the Hauler leak look), in screen space
    if (!this.game.flow.buyBuildTime()) return;
    const b = this.row?.button;
    if (!b) return;
    const y = b.container.y - SEND_BTN.height / 2 - 18;
    const t = this.scene.add.text(b.container.x, y, `-${STAY_PUT.cost}`, textStyle(22, PALETTE.red, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }
}
```

### Steps
1. `config.ts`: add the `STAY_PUT` line after `REROLL_COST` (line 33).
2. `RunFlow.ts`: extend the line-2 import with `STAY_PUT`; add after `sendNow()`:
```ts
/** The "Stay put" button under Send: pay for STAY_PUT.sec more build seconds, once per build phase. */
buyBuildTime(): boolean {
  if (this.run.phase !== 'build' || !this.scene.scene.isActive()) return false;
  if (!this.run.spend(STAY_PUT.cost)) return false;
  this.run.buildLeftSec += STAY_PUT.sec;
  this.buildTotalSec += STAY_PUT.sec;
  return true;
}
```
3. Create `StayPutButton.ts` (class above).
4. `HudScene.ts`: import it (alphabetical, after the `StatsCard` import line) and add `new StayPutButton(this, game, preview),` right after the `new SendButton(...)` line (48).
5. `NextWavePreview.place()`, line 95: change `above - H / 2 - SEND_BTN.height - SEND_BTN.gap` to `above - H / 2 - (SEND_BTN.height + SEND_BTN.gap) * 2` — shifts the card (and the Send row, anchored on `rect`) up one row so the new button fits with the same 10 px clearance above the next-wave ring.
6. `PauseScene.ts` line 63: in the Controls string insert after the "Send —" line: `\nStay put — 5 gold buys +3 s of building, once per build phase`.

### Pitfalls
- Grow `buildTotalSec` by the same 3 as `buildLeftSec` — it is the teal ring's denominator (NextWaveButton), Send "+N", and the blips all read live, so nothing else needs touching; forgetting it clips/overflows the ring.
- Payment only via `RunFlow.buyBuildTime()` — its guard covers pause (`!this.scene.scene.isActive()`) and wrong phase; the HUD must not spend gold itself.
- Reset `used` on the phase change *into* `'build'`, never per frame, and never store it (resume rebuilds the HUD fresh — the spec wants that).
- Set enabled/color/alpha together in `update()` every frame (they interlock: `used` beats can't-afford).
- Pop text goes on the HUD scene in screen pixels (SendButton precedent), never through `FxSystem` (board coords); it self-destroys via the tween.

### Tests
None required — no pure core logic or content changed. Verify in a real browser at 412x915 and 1280x720: row under Send, both layouts clear of the ring; gold < 5 → red "5"; pay → red "-5", "+N" jumps +6, ring intact; second tap dimmed "used"; fresh after the next draft.
