---
id: T0037
title: The Recent line stars your best run
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T09:20:45Z
claimed_at: 2026-10-28T09:42:25Z
epic: E1
---

## Goal
The menu's Recent line (T0018) already lists your last four runs so you can see your trend; now the run that set your record is marked with the same small yellow star the profile card already uses (T0016), so you can see at a glance which recent run was your best.

## Details
- The menu's profile card lists your last four finished runs as short entries (wave + coins), most recent first. This task adds one visual element to those entries: a small yellow five-point star.
- Any Recent entry whose wave equals your all-time best wave gets the star, drawn exactly like the profile card's "Best wave" star (T0016): same five-point shape, same yellow, same size, sitting to the right of that entry's numbers on the same baseline.
- If two of the last four runs both reached your best wave, both entries get the star. If none of the last four reached it (the record is older than four runs), no entry gets a star — the profile card's best-wave line still shows the number either way.
- The star appears or disappears on its own as runs finish and the list shifts; there is no interaction, no new key or button, and the pause screen is unchanged.
- It is a menu-screen touch only: no change to the run itself, the HUD, the rewards screen, the profile's saved data, or the star on the profile card.

## Acceptance criteria
- [ ] In the menu, a Recent entry whose wave equals your best wave shows the small yellow star to the right of its numbers; entries below best wave show no star.
- [ ] Two Recent entries at the same best wave both show the star.
- [ ] After a run that does not beat your best wave, the star stays on the entry that holds the best wave (and simply disappears from the list if that entry scrolls out of the four).
- [ ] The star matches the profile card's star (T0016) in shape, size, yellow, and baseline, and nothing else on the profile card or Recent entries changes.

## Design (architect, yoga)

### Files
- create `src/scenes/menu/RecentLine.ts` - the menu's Recent line as a row of entry texts plus the best-wave stars (sibling of `src/scenes/menu/ProfileCard.ts`)
- edit `src/scenes/MenuScene.ts` - build the line with `buildRecentLine` instead of one word-wrapped text; fade, scale and position its container

### Interfaces
```ts
export interface RecentLine {
  container: Phaser.GameObjects.Container;
  width: number;
}
export function buildRecentLine(scene: Phaser.Scene, profile: Profile): RecentLine | null;
```

### Steps
1. Create `src/scenes/menu/RecentLine.ts` exactly:
```ts
import type Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../../art/textures';
import { PALETTE } from '../../content/palette';
import type { Profile } from '../../core/profile';
import { textStyle } from '../../ui/text';

/** The built row and its width, so the menu can scale it to fit narrow screens. */
export interface RecentLine {
  container: Phaser.GameObjects.Container;
  width: number;
}

/**
 * The menu's Recent line: `Recent` and your last four runs (wave + coins), most recent first.
 * An entry at your best wave gets the small yellow star to the right of its numbers, drawn
 * like the profile card's star (ProfileCard.ts): STAR_TEXTURE, centre 13 px past the entry's
 * right edge and 1 px below the text centre.
 */
export function buildRecentLine(scene: Phaser.Scene, profile: Profile): RecentLine | null {
  if (!profile.recent.length) return null;
  const style = textStyle(12, PALETTE.muted);
  const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  let x = 0;
  const label = scene.add.text(0, 0, 'Recent', style).setOrigin(0, 0.5);
  kids.push(label);
  x += label.width + 8;
  profile.recent.forEach((r, i) => {
    const entry = scene.add.text(x, 0, `W${r.wave} +${r.coins}`, style).setOrigin(0, 0.5);
    kids.push(entry);
    x += entry.width;
    if (r.wave === profile.bestWave) {
      kids.push(artScale(scene.add.image(x + 13, 1, STAR_TEXTURE)));
      x += 21;
    }
    if (i < profile.recent.length - 1) {
      const sep = scene.add.text(x, 0, ' · ', style).setOrigin(0, 0.5);
      kids.push(sep);
      x += sep.width;
    }
  });
  return { container: scene.add.container(0, 0, kids), width: x };
}
```
2. In `MenuScene.ts`: add `import { buildRecentLine } from './menu/RecentLine';` after the ProfileCard import; replace the `const recent = p.recent.length ? this.add.text(...) : null;` block with `const recent = buildRecentLine(this, p);`; in the `if (recent)` fade-in block use `recent.container` for `setAlpha(0)` and as the tween target; in `layout()`, before the existing `setPosition(...)` (keep that expression unchanged), add `recent.container.setScale(Math.min(1, (width - 32) / recent.width));`.

### Pitfalls
- No wordWrap on the row: it is one line, kept inside the screen only by the fit-scale in `layout()` (a 4-starred row is ≈425 px vs 380 px available at 412×915, so it shrinks only when stars make it wider; desktop stays scale 1).
- The star must go in the `kids` array (so it lives in the container and fades in with the row) and use `artScale` (the texture is painted 3×); keep the offsets 13 / 1 / 21 exactly — `ProfileCard.ts:22` is the reference for shape, size, yellow and baseline.
- `entry.width` is measured at text creation; do not hardcode widths. Two starred entries fall out of the same `r.wave === profile.bestWave` check; no entry → `null` → line hidden, as today.
- The menu is relaunched after every run (Rewards/GameOver → menu), so the star appears/disappears by rebuild — no reactivity, no listener. Do not touch `ProfileCard.ts`, the profile card star, `core/profile.ts` or saved data; no invariant (no new system).
### Tests
none
