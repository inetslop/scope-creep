---
id: T0067
title: "Wave banner: 'Wave N' slides in at the top when a wave starts"
size: S
priority: 2
status: todo
depends_on: [T0015]
attempts: 0
created: 2026-10-28T13:54:28Z
---

## Goal
The start of a wave is a moment, not a blip: "Wave N" lands at the top of the screen as the wave begins — and this task puts the game's shared top-center slide-and-fade card in place, which the last stand banner (T0060) reuses with its own lines.

## Details
- **When:** the moment a wave starts (the build phase ends and the wave's first spawns are queued), a small white rounded card (~140 px wide, the game's card look with its soft shadow) slides in from above at the top-center of the screen: "Wave N" in bold rounded type, one line, N the wave that just started.
- **Motion:** slides in over ~200 ms, holds ~500 ms, fades out over ~300 ms — ~1 s total. It is transient: it never blocks the board or input, it is never queued (at most one at a time, and a new wave cannot start while one is up), and it is not a control (no pause-screen line).
- **Shared pattern:** this task lands the top-center card and its motion; the last stand banner (T0060) builds on it with its own two lines — no second card system.
- **Position:** top-center, clear of the stats card on both layouts (at 412x915 it sits just under the top HUD row, at 1280x720 it hangs centered from the top edge). The wave preview (T0015) is already gone by wave start, so the two never overlap.
- No sound (the wave-clear sweep stays a separate audio idea), no new key.

## Acceptance criteria
- [ ] At the start of every wave a "Wave N" card slides in at the top-center, holds, and fades out in ~1 s, with the right N.
- [ ] At 412x915 and 1280x720 the card sits top-center clear of the stats card; it blocks no input and takes no taps.
- [ ] Pausing while the banner is up leaves no stuck card — it resumes and fades (or finishes frozen and disappears on resume; never a permanent card).
- [ ] The card is the game's white rounded card (soft shadow, no outline, no gradient); every other HUD element, phase and sound is unchanged.

## Design (architect, yoga)

### Files
- create `src/ui/hud/topBanner.ts` — the shared top-center slide-and-fade card (class `TopBanner`): card + one text, home position, `show(lines)`. T0060's last stand banner reuses it with its own lines — no second card system.
- create `src/ui/hud/WaveBanner.ts` — the `HudPart`: owns a `TopBanner`, shows `Wave ${n}` the moment `run.wave` goes up.
- edit `src/scenes/HudScene.ts` — one import + one `parts` list line (next to `WaveCard`, not at the end).

### Interfaces
```ts
// topBanner.ts
export class TopBanner {
  constructor(scene: Phaser.Scene);
  layout(width: number): void;            // home: x = width/2, top = isNarrow(width) ? HUD.top + 24 : 12
  show(lines: string[]): void;            // slide in ~200ms, hold ~500ms, fade ~300ms; no-op while playing
}
// WaveBanner.ts
export class WaveBanner implements HudPart { constructor(scene: Phaser.Scene); }
```

### Steps
1. Create `src/ui/hud/topBanner.ts` exactly (model: `WaveCard.ts` for `makeCard`/`textStyle`, `NextWaveButton.ts` for `isNarrow`):
```ts
import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { isNarrow } from './hud';

const W = 140;

/**
 * Top-center card that slides in from above, holds, and fades out (~1 s total) — the wave's
 * moment ("Wave N", from WaveBanner) and, the same way, the last stand banner's two lines:
 * no second card system. Blocks nothing, takes no input; at most one at a time.
 */
export class TopBanner {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.Text;
  private playing = false;
  private top = 12;
  private h = 48;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.card = makeCard(scene, 0, 0, W, 48, 24);
    this.text = scene.add.text(0, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.box = scene.add.container(0, 0, [this.card, this.text]).setVisible(false);
  }

  /** Top center: hanging from the top edge, or clear of the top HUD row on narrow screens. */
  layout(width: number): void {
    this.top = isNarrow(width) ? HUD.top + 24 : 12;
    this.box.setPosition(width / 2, this.top + this.h / 2);
  }

  /** Slides in from above (~200 ms), holds (~500 ms), fades out (~300 ms). No-op while playing. */
  show(lines: string[]): void {
    if (this.playing) return;
    this.playing = true;
    this.h = lines.length > 1 ? 72 : 48; // 72 tall is for T0060's two lines
    this.card.setTexture(cardTexture(this.scene, W, this.h, 24));
    this.text.setText(lines.join('\n'));
    this.box.alpha = 1;
    this.box.setVisible(true);
    const y = this.top + this.h / 2;
    this.box.y = y + 96;
    this.scene.tweens.add({ targets: this.box, y, duration: 200, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.box, alpha: 0, delay: 700, duration: 300, onComplete: () => { this.playing = false; this.box.setVisible(false); } });
  }
}
```
2. Create `src/ui/hud/WaveBanner.ts` exactly:
```ts
import type Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/** "Wave N" top-center as a wave starts: the shared card slides in, holds, fades (~1 s). */
export class WaveBanner implements HudPart {
  private readonly banner: TopBanner;
  private seenWave = 0; // so each wave number shows once, as it starts

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    if (game.run.wave > this.seenWave) {
      this.seenWave = game.run.wave;
      this.banner.show([`Wave ${game.run.wave}`]);
    }
  }
}
```
3. Edit `src/scenes/HudScene.ts`: add `import { WaveBanner } from '../ui/hud/WaveBanner';` between the `TowerPanel` and `WaveCard` import lines, and `new WaveBanner(this),` directly after the `new WaveCard(this),` line in the `parts` list. No other edits.
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- Pause safety: only GameScene pauses (`openPause`), so HudScene and its scene tweens keep running — the card finishes and fades even while paused; never a stuck card. Quit stops HudScene, which destroys the objects and their tweens.
- The `playing` guard drops a show while one is up; a new wave cannot start while one is up anyway (build phase between waves).
- `run.wave` is incremented by `RunState.startWave()` inside `WaveSystem.start()` (called by `RunFlow.update` when the build countdown hits 0, incl. Space / next-wave), so `n` is the wave that just started; `seenWave = 0` means wave 1 shows and the run's opening (wave 0, draft) does not.
- Card must not be interactive (`makeCard`'s image is not): taps reach the board; it takes no input.
- Fade tween `delay: 700` = 200 slide + 500 hold, so total is 200 + 500 + 300 = ~1 s. Do not change it to 500.
- Resize mid-banner snaps the card to the new top-center for the rest of that ≤1 s; acceptable, do not "fix" it.
- `cardTexture` caches per size, so both 140x48 and 140x72 are fine; the card is the standard white rounded card with its soft shadow (no outline, no gradient).
- Layouts: 412x915 → top 96 (just under the top row, which ends at 84), centered x; 1280x720 → top 12, centered x — clear of StatsCard/WaveCard on both.

### Tests
none

## Note (by hand, 2026-10-28)

No longer waits on T0019: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.
