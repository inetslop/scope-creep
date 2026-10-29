---
id: T0082
title: "The run's richest minute"
assignee: narcissus
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-29T01:32:41Z
finished_at: 2026-10-29T02:03:27Z
epic: E1
---

## Goal
The quiet wave inside the last stand is the run's richest minute (kill gold ×4 — the product of quiet ×2 and last stand ×2, already built in T0071/T0054): the gold tally says so while it lasts.

## Details
- While the current wave is a quiet wave (T0071) **and** the run is in the last stand (T0054: exactly 1 life), the stats card's gold number wears one small muted-yellow tag to its right: "×4" — the milestone color (T0034), the stats card's small text size (~12 px).
- The tag appears the moment the quiet wave starts in the state and is gone the moment the wave ends or the last stand turns off (the clean streak's payback, T0045, raising lives above 1).
- Display only: no gold value, multiplier, gold pop, coin trail (T0061) or sound changes — the ×4 product already happens in the kill flow; this only names it where the money lands. No input.
- Closest example: the coin tally's own pop (T0017) for the tag's placement and scale language, and the milestone color's first use (T0034's yellow combo counter).

## Acceptance criteria
- [ ] At exactly 1 life, when a quiet wave (4, 8, 12, …) starts, a muted-yellow "×4" appears next to the gold number for the rest of the wave.
- [ ] A quiet wave with more than 1 life shows no tag; a non-quiet wave at 1 life shows no tag.
- [ ] The tag is gone the instant the wave ends; gold values, the gold pops and the coin trail are byte-identical to before.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with the tag shown and hidden.

## Design (architect, desktop)

### Files
- edit `src/ui/hud/StatsCard.ts` - the only file: a "×4" tag to the right of the gold number, shown only while the current wave is a quiet wave in the last stand

### Interfaces
No new types. One new private method on `StatsCard`:
```ts
private goldTagRow(rich: boolean): void
```
and one new field `private readonly goldTag: Phaser.GameObjects.Text;` plus promoting the row-1 coin icon from a local `const` to `private readonly coinIcon: Phaser.GameObjects.Image;`.

### Steps
1. Add import `import { isQuietWave } from '../../core/waves';` right after the `core/lastStand` import (line 6). `isLastStand` is already imported.
2. Constructor: change line 32 `const coinIcon = artScale(scene.add.image(14, -14, COIN_TEXTURE), 1.25);` to `this.coinIcon = artScale(...)` (same expression); declare the field next to `coinTallyIcon`. After `this.gold = ...` add:
```ts
this.goldTag = scene.add.text(32, -13, '×4', textStyle(13, PALETTE.yellow, { fontStyle: 'bold' })).setOrigin(0, 0.5);
this.goldTag.setVisible(false);
```
and insert `this.goldTag,` into the container's child list right after `this.gold,` (line 36).
3. In `update()`, right after `this.gold.setText(String(game.run.gold));` (line 51) add:
```ts
this.goldTagRow(game.run.phase === 'wave' && isQuietWave(game.run.wave) && isLastStand(game.run));
```
4. Add the method after `update()`:
```ts
/** The run's richest minute: a quiet wave in the last stand pays ×4 kill gold (quiet ×2, last stand ×2).
 * The tag sits right of the gold number; when a long number would push it past the card's right edge,
 * the coin icon, number and tag shift left as one unit (the lives number is "1" in the last stand, so the left side is clear). */
private goldTagRow(rich: boolean): void {
  if (!rich) {
    if (this.goldTag.visible) {
      this.goldTag.setVisible(false);
      this.coinIcon.x = 14;
      this.gold.x = 32;
    }
    return;
  }
  this.goldTag.visible = true;
  const shift = Math.max(0, 32 + this.gold.width + 6 + this.goldTag.width - (196 / 2 - 4)); // 196 = card width, 4 px right padding
  this.coinIcon.x = 14 - shift;
  this.gold.x = 32 - shift;
  this.goldTag.x = this.gold.x + this.gold.width + 6;
}
```
### Pitfalls
- **`phase === 'wave'` is required**: `run.wave` keeps the last wave's number during the draft (core/run.ts:21), so `isQuietWave(run.wave)` alone would leave the tag up after the wave ends. The three-part condition also drops the tag when a payback (T0045) raises lives above 1, and when the run ends.
- Do not touch the `statsGold` registry (line 43) or the coin pop — the kill coin trail (T0061) targets the layout-time position and must stay byte-identical.
- Use the multiplication sign × (U+00D7), not "x4", like the combo counter (FxSystem.ts:147).
- Color is `PALETTE.yellow` via `textStyle` (it css-converts); do not use `goldText` or `muted`.
- The tag is a child of `this.box`, so scene shutdown destroys it; it has no tweens or listeners to clean up. Everything is recomputed from `game.run` each frame — no stored flag to desync on pause/resume.
- Do not widen the card or move `WaveCard`: the 412-px top row has no slack (StatsCard ends at 212, WaveCard starts at 218).
### Tests
- none (display-only; no core rule changes). Smoke at 1280x720 and 412x915 with the tag shown (1 life, wave 4/8/…) and hidden (2+ lives or non-quiet wave).

## Result (attempt 1, narcissus)

While a quiet wave (every 4th) runs in the last stand (exactly 1 life), the stats card's gold number now wears a small bold muted-yellow "×4" tag to its right, naming the ×4 kill-gold product (quiet ×2, last stand ×2) where the money lands; if a long gold number would push the tag past the card's right edge, the coin icon, number and tag shift left as one unit. The tag appears/disappears purely from run state each frame (wave phase + quiet wave + 1 life), so it is gone the instant the wave ends or lives recover, and no gold values, pops or coin trail changed. One file changed: `src/ui/hud/StatsCard.ts` — new `goldTag` text plus promoted `coinIcon` field and a private `goldTagRow(rich)` method, exactly per the design; check (typecheck + lint + 171 unit tests) and smoke on desktop and mobile all pass.

- Self-review: APPROVE
- Time: 30.8 min

```
projects/chokepoint/game/src/ui/hud/StatsCard.ts | 29 ++++++++++++++++++++++--
 1 file changed, 27 insertions(+), 2 deletions(-)
```
