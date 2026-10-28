---
id: T0060
title: "Last stand banner: the card that teaches the rule"
assignee: cachyos-x8664
size: S
priority: 3
status: done
depends_on: [T0054, T0067]
attempts: 1
created: 2026-10-28T13:29:40Z
claimed_at: 2026-10-28T23:17:33Z
finished_at: 2026-10-29T00:04:51Z
epic: E1
---

## Goal
The moment a run drops to one life, a small white card slides in at the top — "Last stand · kills pay double" — so T0054's rule is taught where it triggers, not just seen as a red number.

## Details
- Every time a leak brings the run's lives to exactly 1 — the moment T0054's last stand turns on — the wave banner's shared top-center card (T0067: "Wave N") slides in from above at the top-center of the screen, holds, and fades out with its own motion (~1 s: ~200 ms in, ~500 ms hold, ~300 ms out), this time with two lines instead of one.
- Two centered lines: "Last stand" in bold ink, muted "kills pay double" below it.
- It shows on every re-entry into the state: a later leak back to 1 (after T0045's streak paid a life back) shows it again. It never shows when lives are 2 or more.
- Top-center sits clear of the stats card; the card is transient — it never blocks the board or input, and it is not a control (no pause-screen row).
- Shared pattern: the wave banner (T0067) lands the top-center slide-and-fade card first ("Wave N" at each wave start); this banner reuses that card and motion with its own two lines — it adds no second card system. The green "Clean" chip's pop (T0005) stays the other transient family.
- No sound, no new key, no change to T0054's red lives number or its wave-start pulse.

## Acceptance criteria
- [ ] A leak that brings lives to exactly 1 shows the top-center white card — "Last stand" bold, muted "kills pay double" below — sliding in from above and fading out with the shared card's motion (~1 s).
- [ ] A later leak back to 1 (after the streak's +1 life) shows it again; a leak that leaves lives at 2 or more shows nothing.
- [ ] The card blocks nothing and takes no input; the red lives number, the wave-start pulse, the double-gold rule and all sounds are unchanged.
- [ ] Fits 412x915 and 1280x720 (top-center, clear of the stats card).

## Design (architect, desktop)

**PO correction (cycle 35):** T0067 lands first (this task waits on it), and it creates the shared card — `src/ui/hud/topBanner.ts`, class `TopBanner`, `show(lines: string[])`, ~140 px, 200 ms in / ~500 ms hold / 300 ms out, the two-line height already in. Do not create `TopBanner.ts` or a second card system. Create only `LastStandBanner.ts`: it owns one `TopBanner` and, the moment the run enters `lives === 1` (the `wasOne` edge logic below), shows the two lines — "Last stand" in bold ink, "kills pay double" in muted — so extend `topBanner.ts` minimally for a title + muted-sub two-line mode (13 px muted below the title, the look the original design had), keeping T0067's single-line "Wave N" call byte-identical. The banner takes the shared card's motion (~1 s) and size; the rest of this design — the HudPart, the HudScene line — stands as written.

### Files
- reuse + minimally extend `src/ui/hud/topBanner.ts` (T0067, lands first: class `TopBanner`, `show(lines)`, ~140 px, the two-line height 72) — add the muted sub-line mode above; no second card file
- create `src/ui/hud/LastStandBanner.ts` — the `HudPart` that shows it: "Last stand" / "kills pay double" on every entry into `lives === 1`.
- edit `src/scenes/HudScene.ts` — one import, one line in the `parts` list. Nothing else anywhere.

### Interfaces
Exact file 1, `src/ui/hud/TopBanner.ts` (model the imports on `ui/hud/StatsCard.ts`):
```ts
import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { makeCard } from '../card';
import { textStyle } from '../text';

/** Top-center slide-and-fade card for transient messages: white HUD card, ~220 px, bold ink title,
 * muted line below. Slides in from above (200 ms), holds, fades (300 ms): ~1.5 s total.
 * Display-only, never takes input. Owned by a HUD part (LastStandBanner now; T0067's wave banner
 * reuses it). */
export class TopBanner {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly sub: Phaser.GameObjects.Text;
  private restY = HUD.top + 48; // card top at HUD.top + 16: just under the top bar, clear of the stats card (ends at y 84)

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.title = scene.add.text(0, -12, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.sub = scene.add.text(0, 14, '', textStyle(13, PALETTE.muted)).setOrigin(0.5);
    this.box = scene.add.container(0, 0, [makeCard(scene, 0, 0, 220, 64, 24), this.title, this.sub]).setVisible(false);
  }

  /** Top center; a hidden card sits at its resting spot (mid-slide, only x follows a resize). */
  layout(width: number): void {
    this.restY = HUD.top + 48;
    this.box.setX(width / 2);
    if (!this.box.visible) this.box.setY(this.restY);
  }

  show(title: string, sub: string): void {
    this.box.removeAllTweens();
    this.title.setText(title);
    this.sub.setText(sub);
    this.box.setAlpha(1).setY(this.restY - 160).setVisible(true); // starts fully off the top edge
    this.scene.tweens.add({ targets: this.box, y: this.restY, duration: 200, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.box, alpha: 0, delay: 1200, duration: 300, ease: 'Quad.easeIn', onComplete: () => this.box.setVisible(false) });
  }
}
```
Exact file 2, `src/ui/hud/LastStandBanner.ts`:
```ts
import type Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './TopBanner';

/** The last-stand banner: the moment a leak brings the run to 1 life, the top-center card teaches
 * the rule where it triggers. Shows on every entry into 1 life (a later leak back to 1 shows it
 * again); never when lives are 2 or more. */
export class LastStandBanner implements HudPart {
  private readonly banner: TopBanner;
  private wasOne = false;

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    const one = game.run.lives === 1;
    if (one && !this.wasOne) this.banner.show('Last stand', 'kills pay double');
    this.wasOne = one;
  }
}
```

### Steps
1. Create `src/ui/hud/TopBanner.ts` exactly as above.
2. Create `src/ui/hud/LastStandBanner.ts` exactly as above.
3. `src/scenes/HudScene.ts`: add `import { LastStandBanner } from '../ui/hud/LastStandBanner';` directly after the `HandBar` import (alphabetical order of that import block), and in the `parts` array add `new LastStandBanner(this), // last on purpose: slides in over the other cards` as the final entry, after `new TowerPanel(this),`.
4. Run `npm run check` and `npm run smoke`.
The trigger is a value edge in `update()`: HudScene updates after GameScene each frame, so it sees the same frame's `run.lives`; a 2→1 or 3→1 leak (block costs 2) shows it, a +1 life (T0045, 1→2) or a 1→0 death does not.

### Pitfalls
- The `parts` line stays at the end: HudScene draws in creation order and the banner must sit over the cards. The comment says why; do not re-sort it.
- `this.wasOne = one;` runs every frame, after the `if` — if it only ran inside the `if`, the banner never left the state.
- Two leaks in one frame (3→1→0) miss the banner; the run is over that frame — do not special-case it.
- No `setInteractive` anywhere: the smoke test clicks at random and everything must pass through; it is not a control, so no hotkey, no pause-screen mention, no sound.
- Touch nothing else: no edits to `StatsCard`, `RunFlow`, `EnemySystem`, `Sfx`, `core/run.ts` — those are the "unchanged" criterion and T0054/T0045's territory.
- T0067 (wave banner, still designing) must reuse `ui/hud/TopBanner.ts`; if its card lands first, fold it into `TopBanner` — one card system.
- No cleanup code: on run end the HUD scene stops and Phaser destroys the container and its tweens with it; no `onResize`/`onKey` needed (HudScene already drives `layout()`).

### Tests
- none (UI/transient; no core rule added — invariant lists are for `systems/`, HUD parts add none).

## Result (attempt 1, cachyos-x8664)

Added the last-stand banner: the moment a leak brings the run to 1 life, the shared top-center card slides in from above with "Last stand" (bold ink) over "kills pay double" (muted), holds ~1s, and fades out. Created `ui/hud/LastStandBanner.ts` — a HudPart owning one TopBanner that fires on the wasOne edge, so it shows on every entry into 1 life and never at 2 or more. Registered it as the last part in `scenes/HudScene.ts` (so it draws over the other cards) and minimally extended `ui/hud/topBanner.ts` with a 13px muted sub-line for the two-line card, keeping the single-line "Wave N" call byte-identical. It reuses T0067's card and motion and adds no second card system, key, sound, or pause-screen row.

- Self-review: APPROVE
- Time: 47.3 min

```
projects/chokepoint/game/src/scenes/HudScene.ts    |  2 ++
 .../chokepoint/game/src/ui/hud/LastStandBanner.ts  | 29 ++++++++++++++++++++++
 projects/chokepoint/game/src/ui/hud/topBanner.ts   | 10 +++++---
 3 files changed, 38 insertions(+), 3 deletions(-)
```
