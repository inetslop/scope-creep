---
id: T0016
title: "A \\\\\\\\\\\\\\\"Best\\\\\\\\\\\\\\\" star on the profile card"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T03:39:38Z
claimed_at: 2026-10-28T04:18:12Z
epic: E1
---

## Goal
When the run you just finished reached your best wave, the menu should make that obvious: a small celebration mark on the profile card.

## Details
- The profile card (the white card on the menu, added by T0007) already shows a "Best wave N" line and a "Last: wave N · +N coins" line. When the player's most recent finished run reached the current best wave, add a small yellow star immediately to the right of the "Best wave N" text, on the same line.
- The star is a small yellow five-point star, about the height of the "Best wave" text. It is the only new thing on the card.
- The condition is: the last finished run's wave equals the best wave the card already shows. The card already reads both values from the saved profile, so no new data is needed — this is display only.
- A fresh profile (no finished runs) shows no star.
- The star does not change the card's size or any other line; it sits on the existing "Best wave N" line.
- It must fit the card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Finish a run whose wave equals your best wave; the profile card shows a small yellow star to the right of the "Best wave N" line.
- [ ] Finish a run that does not reach your best wave; no star is shown.
- [ ] A fresh profile (no runs) shows no star.
- [ ] The card's size and its other lines are unchanged; the star fits at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- edit `src/art/textures.ts` - one line after `LIFE_TEXTURE` (line 22): `export const STAR_TEXTURE = 'ui:star';`
- edit `src/art/icons.ts` - paint the star in `paintIconTextures()` after the LIFE block; extend the two existing imports: add `rgba` to the `'../content/palette'` import, `roundedPolygon` to the `'./paint'` import, `STAR_TEXTURE` to the `'./textures'` import
- edit `src/scenes/menu/ProfileCard.ts` - the star image on the card, placed right of the "Best wave" text; add `STAR_TEXTURE` to the existing `art/textures` import

### Interfaces
No new types or signatures. New texture key `STAR_TEXTURE = 'ui:star'` (16x16, painted in `art/icons.ts`). No data changes — `Profile.lastRun` already has `wave`.

### Steps
1. In `src/art/icons.ts`, after the `LIFE_TEXTURE` block in `paintIconTextures()`, add:
```ts
paintTexture(scene, STAR_TEXTURE, 16, 16, (ctx) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 8 : 3.6;
    return { x: 8 + Math.cos(a) * r, y: 8 + Math.sin(a) * r };
  });
  roundedPolygon(ctx, pts.map((p) => ({ ...p, y: p.y + 1.5 })), 1.6);
  ctx.fillStyle = rgba(PALETTE.yellowDeep, 1);
  ctx.fill();
  roundedPolygon(ctx, pts, 1.6);
  ctx.fillStyle = rgba(PALETTE.yellow, 1);
  ctx.fill();
});
```
(the first fill is the darker side face, exactly like `paintToken` does it; no shadow, like the coin.)
2. In `buildProfileCard` (`src/scenes/menu/ProfileCard.ts`), right after the `best` text (line 21), add:
```ts
const star = artScale(scene.add.image(best.width / 2 + 13, 1, STAR_TEXTURE));
star.setVisible(profile.lastRun !== null && profile.lastRun.wave === profile.bestWave);
```
3. In the final `return`, add `star` to the container list after `best`: `[card, coin, coins, best, star, runs, last]`.

### Pitfalls
- `ctx.fillStyle` must be a string: use `rgba(PALETTE.yellow, 1)` / `rgba(PALETTE.yellowDeep, 1)` — never the raw `PALETTE` number, and don't forget to import `rgba`.
- No star `Shape` exists: do not use `paintToken`/`shapePath`; the 10-point star polygon + `roundedPolygon` (imported from `./paint`) is the path.
- The star's x uses `best.width`, so it must be created after `best` exists; `best.width` is valid synchronously at creation.
- `setVisible` handles the fresh profile (`lastRun === null`) — no conditional array needed. Card size and all other lines are untouched: the star's right edge is at x≈69, far inside the 300px card at scale 1 (412px and 1280px both use scale 1).
- The menu is relaunched each run, so the card rebuilds with fresh profile data — no cleanup needed.

### Tests
- none
