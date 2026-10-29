---
id: T0218
title: "The wave card remembers a held wave: held · N"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T16:16:13Z
---

## Goal
A wave that let lives through costs the run, and its only trace is the lives number falling (a leaked Block costs 2, so even the count doesn't match). The wave card — where the wave number lives — wears the finished wave's cost, so "how did that wave go" is answered at a glance.

## Details
- What exists: the wave card (top right, left of the pause button) shows the wave number, "Ready" before the first wave. A wave's leaks are shown nowhere: the stats card shows the lives total, the exit's green chip celebrates the no-leak waves (T0005), the claim card shows run totals. A player who missed a leak while zoomed on a corner has no record of what the wave cost.
- The change: when a wave ends with one or more lives lost, the wave card wears a small tag under the number: "held · N", where N is the lives at the start of the wave minus the lives at its end (a leaked Block counts 2; a leaked Hauler counts its 1 life — its 5-gold cost keeps its own red "−5" pop, T0057). The wave's system, which tracks the wave's remaining enemies, records the lives lost the moment the wave ends and exposes it to the HUD; the card wears the tag from that moment until the next wave starts, so it is read in the build phase that follows.
- The tag wears the muted-gray chip look of the wave tags (T0080's banner chip, T00108's "tight" chip): a small rounded chip in muted ink on the white card, one ~150 ms scale-in, no sound. The card grows to fit it (the T0136 pattern), tag and line inside the card, staying clear of the pause button and the zoom buttons at 412x915 and 1280x720.
- A wave that lost no lives wears no tag — the green clean chip at the exit already celebrates those. The wave's own tag chips (quiet, tight) are untouched: a quiet wave that leaked shows its chip and the held tag together.
- The run's first held wave teaches the tag once (T0092's pattern): a small muted line under the number in the same card — "held: lives lost this wave" — shown with the first held tag and never again in the run; taught from the run's counters (a held wave is a cleared wave not in the clean count), so a resumed run past its first held wave never re-teaches.
- Resume: the tag is session state — a resumed run starts without it (the save keeps board, towers, wave and gold as today; no save field). No new input; the pause screen is untouched.

## Acceptance criteria
- [ ] A wave that ends with lives lost: the wave card shows a muted-gray "held · N" chip under the number, N = the lives that wave cost (a leaked Block counts 2), from the moment the wave ends until the next wave starts.
- [ ] A clean wave: the card wears no tag, and the green clean chip at the exit is unchanged.
- [ ] The first held wave of a run shows the muted line "held: lives lost this wave" in the card, once; it never shows again in the run, and a resumed run past its first held wave does not show it.
- [ ] A quiet or tight wave that leaked shows its usual tag chips and the held tag together; "Ready" before the first wave is unchanged.
- [ ] The tag and line fit the white card at 412x915 and 1280x720 with no overlap of the pause button or the zoom buttons; no new sound, no new input, no save field.

## Design (architect, inet-racing)

### Files
- edit `src/systems/WaveSystem.ts` - record the wave's lives cost: new public field `heldLost`, private `livesAtStart` (set in `start()`, with `heldLost = 0`), and new method `waveEnded()`.
- edit `src/systems/RunFlow.ts` - one line in `clearWave()`: call `this.s.waves.waveEnded();` right after `const bonus = this.run.clearWave();` (lives are final then).
- edit `src/ui/hud/WaveCard.ts` - rewrite the part: worn "held · N" chip + one-time teach line, card grows down (top stays at y=12), chip scale-in.
- edit `src/debug/runChecks.ts` - one invariant line after the `['waves.next', …]` line.

### Interfaces
```ts
// src/systems/WaveSystem.ts — additions to the existing class
/** What the wave that just ended cost in lives (0 until a wave ends, 0 for a clean wave). The wave card wears it. */
heldLost = 0;
private livesAtStart = 0;
// in start(), after this.run.startWave(); (and anywhere else in that method):
this.livesAtStart = this.run.lives;
this.heldLost = 0;
/** The wave's last enemy is gone: record the lives its leaks took. RunFlow calls it as the wave ends. */
waveEnded(): void {
  this.heldLost = Math.max(0, this.livesAtStart - this.run.lives);
}
```
`WaveCard` keeps its `HudPart` surface (`layout(width, height)`, `update(game)`); no new exports.

### Steps
1. `src/systems/WaveSystem.ts`: add the field and method exactly as above (comment style as in the file).
2. `src/systems/RunFlow.ts` `clearWave()`: insert `this.s.waves.waveEnded();` after the `const bonus = this.run.clearWave();` line. Nothing else.
3. `src/ui/hud/WaveCard.ts` — replace the whole file:
```ts
import type Phaser from 'phaser';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const W = 120;
const H_NUM = 48; // the number's row, as today
const GAP = 6;
const CHIP = 18;
const LINE = 16; // one line of the 11px teach

/** Top right, left of the pause button: the wave number ("Ready" before the first), and, from the moment a wave
 *  ends with lives lost until the next starts, a muted "held · N" chip for what the wave cost, with a one-time
 *  teach line on the run's first held wave. The card's top stays at y = 12 and it grows down to fit. */
export class WaveCard implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Image;
  private readonly wave: Phaser.GameObjects.Text;
  private chip: Phaser.GameObjects.Container | undefined;
  private teach: Phaser.GameObjects.Text | undefined;
  private width = 0;
  private h = H_NUM;
  private shownLost = 0;
  private shownTeach = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.wave = scene.add.text(0, 1, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.card = makeCard(scene, 0, 0, W, H_NUM, 24);
    this.box = scene.add.container(0, 0, [this.card, this.wave]);
  }

  layout(width: number): void {
    this.width = width;
    this.place();
  }

  update(game: GameScene): void {
    const lost = game.waves.heldLost;
    const teach = lost > 0 && game.run.wavesCleared - game.run.cleanWaves === 1; // the run's first held wave
    this.wave.setText(game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready');
    if (lost !== this.shownLost || teach !== this.shownTeach) this.wear(lost, teach);
  }

  /** Top edge at y = 12, right edge 10 px left of the pause button; the card grows down. */
  private place(): void {
    this.box.setPosition(this.width - EDGE - 48 - 10 - W / 2, 12 + this.h / 2);
  }

  private wear(lost: number, teach: boolean): void {
    const scene = this.scene;
    if (this.chip) this.scene.tweens.killTweensOf(this.chip);
    this.chip?.destroy();
    this.chip = undefined;
    this.teach?.destroy();
    this.teach = undefined;
    const hasTag = lost > 0;
    this.h = H_NUM + (hasTag ? GAP + CHIP + (teach ? GAP + LINE * 2 : 0) : 0);
    this.card.setTexture(cardTexture(scene, W, this.h, 24));
    this.wave.setY(-this.h / 2 + 25);
    if (hasTag) {
      const label = scene.add.text(0, 0, `held · ${lost}`, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.muted, 1);
      g.fillRoundedRect(-(label.width + 14) / 2, -CHIP / 2, label.width + 14, CHIP, CHIP / 2);
      this.chip = scene.add.container(0, -this.h / 2 + H_NUM + GAP + CHIP / 2, [g, label]);
      this.chip.setScale(0); // ~150 ms scale-in
      scene.tweens.add({ targets: this.chip, scale: 1, duration: 150, ease: 'Quad.easeOut' });
      if (teach) {
        this.teach = scene.add.text(0, -this.h / 2 + H_NUM + GAP + CHIP + GAP + LINE, 'held: lives lost\nthis wave', textStyle(11, PALETTE.muted)).setOrigin(0.5);
      }
      this.box.add(this.chip);
      if (this.teach) this.box.add(this.teach);
    }
    this.shownLost = lost;
    this.shownTeach = teach;
    this.place();
  }
}
```
4. `src/debug/runChecks.ts`: after the `['waves.next', …]` line add:
```ts
['waves.held', (g) => (Number.isInteger(g.waves.heldLost) && g.waves.heldLost >= 0 && g.waves.heldLost <= START.lives + 1 + g.techLife ? null : `held lost ${g.waves.heldLost}`)],
```
(`START` is already imported there.)

### Pitfalls
- Never re-center the card at `HUD.top / 2` when it grows: at h=110 the top would go off-screen. Keep the top at y=12 (`12 + h/2`), exactly like `StatsCard`.
- The teach text is two hard-wrapped lines (`\n`), not one: a single 11px line (~110 px) would not fit the 120 px card at 412x915 without overlapping `StatsCard` (which ends at x=212; the card starts at 218). Width stays 120; growth is vertical only, and pause/zoom buttons live at x ≥ `width-64`, so they can't be touched.
- Teach is derived, never stored: `wavesCleared - cleanWaves === 1` while the tag is worn is exactly "first held wave", and the counters come from the save, so a resumed run past its first held wave never re-teaches. No save field, no session flag.
- `heldLost` resets in `start()`, not only in `waveEnded()`; a clean wave records 0 and wears nothing (the exit's green chip is untouched — do not touch `FxSystem.cleanChip` or `RunFlow`'s clean branch).
- Kill the chip's scale-in tween before destroying the chip on re-wear (the rebuild happens exactly when the tag appears or vanishes).
- Do not change `update()`'s per-frame `setText` on the number, and do not touch `WaveBanner`/`NextWavePreview` chips: a quiet/tight leaked wave shows its banner chips and this held tag independently.

### Tests
- none (UI + systems only; no `src/core` rule changes). Verify with `npm run check` and `npm run smoke`.
