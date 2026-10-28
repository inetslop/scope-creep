---
id: T0007
title: "The menu shows what you have: a profile card"
assignee: narcissus
size: M
priority: 2
status: done
depends_on: [T0001]
attempts: 1
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T02:39:41Z
finished_at: 2026-10-28T03:11:26Z
epic: E1
---

## Goal
The menu shows your profile at a glance: coins, best wave, runs played, and your last result.

## Details
- A new white rounded card on the menu, placed between the title and the start button (the live demo keeps running behind everything, as today):
  - a row: a yellow coin icon (rounded circle, ~24px) and the total coins in large bold type
  - a line: "Best wave 14"
  - a line: "Runs 32"
  - a line in gray, only after at least one finished run: "Last: wave 9 · +17 coins"
- Values come from the saved profile (T0001). Before any run: coin total 0, "Best wave 0", "Runs 0", no Last line.
- Layout: at 412x915 the card sits between title and start button and must not cover the button; at 1280x720 it sits centered above (or beside) the start button.

## Acceptance criteria
- [ ] After a finished run, the menu shows the updated coin total, best wave and runs count, and the Last line.
- [ ] On a fresh device (no saved profile) the card shows 0 coins, "Best wave 0", "Runs 0" and no Last line.
- [ ] The card does not overlap the start button or the title at 412x915 or 1280x720.
- [ ] Starting a run from this menu state works as before.

## Design (architect, desktop)

### Files
- create `src/scenes/menu/ProfileCard.ts` — the menu's profile card (white card, coin icon, four lines), built from the saved `Profile`; sits next to `MenuDemo.ts` since it's menu-only
- edit `src/scenes/MenuScene.ts` — replace the old "Best: wave N · M runs" line with the card, new layout offsets, road scale also respects short screens

No other files: the coin texture (`ui:coin`) already exists (`art/icons.ts`), the profile loader already exists (`core/profile.ts`), no new scene key, no new input, no content, `main.ts` untouched.

### Interfaces
```ts
// src/scenes/menu/ProfileCard.ts (Profile is the existing type from core/profile.ts)
export const PROFILE_CARD_W = 300;
export const PROFILE_CARD_H = 124;
export function buildProfileCard(scene: Phaser.Scene, profile: Profile): Phaser.GameObjects.Container;
```
Exact content of `ProfileCard.ts`:
```ts
import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { PALETTE } from '../../content/palette';
import type { Profile } from '../../core/profile';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';

/** The card size in pixels; it is scaled down to fit very narrow screens. */
export const PROFILE_CARD_W = 300;
export const PROFILE_CARD_H = 124;

/**
 * The menu's profile card: total coins (coin icon and big number), best wave, runs played, and
 * the last run (only once there is one). The menu is relaunched after every run, so it always
 * shows the saved profile fresh.
 */
export function buildProfileCard(scene: Phaser.Scene, profile: Profile): Phaser.GameObjects.Container {
  const card = makeCard(scene, 0, 0, PROFILE_CARD_W, PROFILE_CARD_H, 20);
  const coin = artScale(scene.add.image(-116, -36, COIN_TEXTURE), 1.4);
  const coins = scene.add.text(-92, -36, String(profile.coins), textStyle(30, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
  const best = scene.add.text(0, 0, `Best wave ${profile.bestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const runs = scene.add.text(0, 24, `Runs ${profile.runsPlayed}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const last = scene
    .add.text(0, 48, profile.lastRun ? `Last: wave ${profile.lastRun.wave} · +${profile.lastRun.coins} coins` : '', textStyle(15, PALETTE.faint))
    .setOrigin(0.5);
  return scene.add.container(0, 0, [card, coin, coins, best, runs, last]);
}
```

### Steps
1. Create `src/scenes/menu/ProfileCard.ts` with the code above.
2. In `MenuScene.ts`, after `import { MenuDemo } from './menu/MenuDemo';` add: `import { buildProfileCard, PROFILE_CARD_W } from './menu/ProfileCard';`
3. In `MenuScene.create()`, delete the two lines that build `bestLine` and `bestText` (lines 61–62). After the `how` text line, before `const button = makeButton(...)`, add: `const profileCard = buildProfileCard(this, p);` (keep the existing `const p = loadProfile(window.localStorage);`).
4. Change the entrance-tween list from `[how, button.container, hint, bestText]` to `[profileCard, how, button.container, hint]`.
5. Replace the `layout` function (lines 75–89) exactly with:
```ts
    const layout = (width: number, height: number): void => {
      const cx = width / 2;
      const k = Math.min(1.4, (width - 24) / MENU_ROAD_SIZE.width, Math.max(0.6, (height - 460) / MENU_ROAD_SIZE.height));
      const block = MENU_ROAD_SIZE.height * k + 460;
      const top = Math.max(16, (height - block) / 2);
      this.demo.layout(cx, top, k);
      const y = top + MENU_ROAD_SIZE.height * k + 40;
      const textScale = Math.min(1, (width - 32) / 420);
      this.titleY = y;
      this.title.setPosition(cx, y);
      profileCard.setPosition(cx, y + 104).setScale(Math.min(1, (width - 32) / PROFILE_CARD_W));
      how.setPosition(cx, y + 213).setScale(textScale);
      button.container.setPosition(cx, y + 290);
      hint.setPosition(cx, y + 343);
    };
```
Stack top→bottom: title (y), card (y+104), how-to-play (y+213), Play (y+290), hint (y+343).

### Pitfalls
- Coin icon: use `artScale(img, 1.4)`, never a bare `setScale()` (textures are painted at 3x; bare scale makes the size depend on pixel density). The coin texture is 28 units with an 18-unit circle, so 1.4 → a ~25 px coin.
- The card is display-only: do not make it interactive and do not add pointer listeners — nothing to clean up on shutdown.
- Do not reuse the old `+ 330` block constant or old offsets (y+172 button, y+218 hint, y+250 best): the whole stack moved down; at 412x915 and 1280x720 the new `k` equals the old width-based `k`, so the demo road position is unchanged there.
- The `·` in the Last line is a literal middle-dot character, same as existing lines.
- Fresh device: `loadProfile` already returns zeros and `lastRun: null`, so the Last line is an empty string — no special-casing needed.

### Tests
- none (menu UI only; no `core/` rule added or changed)

## Result (attempt 1, narcissus)

The menu now shows a white profile card between the title and the Play button, built in a new file `src/scenes/menu/ProfileCard.ts`: a yellow coin icon (`ui:coin` at 1.4 scale) with the total coins in large bold type, plus "Best wave N", "Runs N", and a faint "Last: wave N · +N coins" line that only appears after at least one finished run. `MenuScene.ts` now builds this card from the already-loaded saved profile (replacing the old single "Best: wave N · M runs" text line), includes it in the entrance tween, and uses the new layout stack — title, card, how-to-play, Play, hint — with the road scale also respecting short screens so nothing overlaps at 412x915 or 1280x720. A fresh device shows 0 coins, "Best wave 0", "Runs 0" and no Last line via `loadProfile`'s existing zeros; starting a run is unchanged.

- Self-review: APPROVE
- Time: 31.8 min

```
projects/chokepoint/game/src/scenes/MenuScene.ts   | 18 +++++++--------
 .../chokepoint/game/src/scenes/menu/ProfileCard.ts | 27 ++++++++++++++++++++++
 2 files changed, 36 insertions(+), 9 deletions(-)
```
