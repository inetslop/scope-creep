---
id: T0249
title: "The profile remembers your iron run: the iron best wave with its muted star"
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0241]
attempts: 1
created: 2026-10-30T01:33:38Z
claimed_at: 2026-10-30T07:09:19Z
finished_at: 2026-10-30T07:38:19Z
epic: E6
---

## Goal
The start screen's profile card remembers the best iron wave with its own muted star, so the Iron mode's record stands next to the normal best wave.

## Details
- The profile card (src/scenes/menu/ProfileCard.ts, the T0222 sized-from-lines column) gains one line under the "Best wave N" line: "Iron wave N" in the card's muted text, followed by the small star (the T0016 star's shape and size, in the card's muted-ink color — not the yellow record star). N is the best wave reached in an iron run.
- The line is shown exactly when the profile records an iron best wave of at least 1; otherwise the card is byte-identical to today. This task reads the profile field T0241's iron run records — if T0241 does not yet record an iron best wave on the profile, this task adds that one field to the profile's record path (the same place the best wave is written) and the display; nothing else on the profile changes.
- The normal "Best wave N" line and its yellow record star, the runs line and the Recent line are untouched; the card is the sized-from-lines column, so the new line simply adds its height.
- No new input, no sound; the claim card's "Iron" line (T0241) is the run's moment, this line is the record.
- The longest numbers ("Iron wave 128", "Best wave 128") fit at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Before any iron run the profile card is byte-identical to today; after an iron run that reaches wave 7 the card shows the unchanged "Best wave" line plus "Iron wave 7" with the muted star.
- [ ] A later normal run never changes the iron line; a later iron run at a higher wave raises its number; the yellow star appears only on the normal best-wave line, as today.
- [ ] The card fits at 412x915 and 1280x720 with both lines at their longest.

## Design (architect, yoga)

### Files
- edit `src/content/palette.ts` — add one line `mutedDeep: 0x4e5e63,` after the `muted: 0x6f8287,` line (the darker side face for the muted star, matching the `*Deep` twin pattern).
- edit `src/art/textures.ts` — add `export const STAR_MUTED_TEXTURE = 'ui:star-muted';` on the line after `STAR_TEXTURE`.
- edit `src/art/icons.ts` — add a `paintTexture(scene, STAR_MUTED_TEXTURE, 16, 16, ...)` block immediately after the yellow star block, an exact copy of the star geometry recolored to `muted`/`mutedDeep`.
- edit `src/scenes/menu/ProfileCard.ts` — add the "Iron wave N" line with the muted star under the "Best wave" line.

### Interfaces
No new functions or types in T0249. T0249 reads the field T0241 adds to `Profile`: `ironBestWave: number` (best wave reached in an iron run; `0` until an iron run sets one). No other `Profile` field changes.

### Steps
1. `content/palette.ts`: after `muted: 0x6f8287,` add `mutedDeep: 0x4e5e63,`.
2. `art/textures.ts`: after `export const STAR_TEXTURE = 'ui:star';` add `export const STAR_MUTED_TEXTURE = 'ui:star-muted';`.
3. `art/icons.ts`: extend the existing `./textures` import to include `STAR_MUTED_TEXTURE`. After the yellow `paintTexture(scene, STAR_TEXTURE, 16, 16, (ctx) => {...})` block, add the same block with key `STAR_MUTED_TEXTURE` and the two `fillStyle`s swapped to `rgba(PALETTE.mutedDeep, 1)` then `rgba(PALETTE.muted, 1)` (identical `pts`/`roundedPolygon` geometry).
4. `ProfileCard.ts`: extend the `./art/textures` import to include `STAR_MUTED_TEXTURE`. In `buildProfileCard`, after the `star`/`h2` block and before the `runs` text, add:
   `const iron = profile.ironBestWave >= 1 ? scene.add.text(0, 0, `Iron wave ${profile.ironBestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5) : null;`
   `const ironStar = iron ? artScale(scene.add.image(0, 0, STAR_MUTED_TEXTURE)) : null;`
   `if (iron && ironStar) ironStar.setX(iron.width / 2 + 13);`
   Then `const hIron = iron ? iron.height : 0;` and compute `const gaps = (recent ? 3 : 2) + (iron ? 1 : 0);` and `const height = PAD * 2 + h1 + h2 + hIron + h3 + h4 + gaps * LINE_GAP;`.
   In the `put` loop, after `best.setY(c2); star.setY(c2 + 1);` add: `if (iron && ironStar) { const ci = put(hIron); iron.setY(ci); ironStar.setY(ci + 1); }`.
   Replace the final `scene.add.container(0, 0, recent ? [...] : [...])` with: `const kids: Phaser.GameObjects.GameObject[] = [card, coin, coins, best, star]; if (iron && ironStar) kids.push(iron, ironStar); kids.push(runs); if (recent) kids.push(recent.container);` and pass `kids`.
### Pitfalls
- The line is shown only when `profile.ironBestWave >= 1`; with no iron run the card must be byte‑identical to today (same height, same children) — create `iron`/`ironStar` as `null` and skip them in `height`, the `put` loop, and `kids`.
- The muted star must NOT be the yellow `STAR_TEXTURE`; it is the new `STAR_MUTED_TEXTURE` (muted token), placed like the yellow star (`x = text.width/2 + 13`, `y = center + 1`).
- The star is 16px via `artScale` (no bare `setScale`); do not add a size arg.
- `mutedDeep` is a new `PALETTE` color; do not hardcode a hex in `icons.ts`.
- The menu column auto‑fits (`cardH = card.height * cardScale`), so the added line only grows the card height and is absorbed at 412x915 and 1280x720; no menu change needed. "Iron wave 128" is no wider than "Best wave 128".
- `ironBestWave` is T0241's field on `Profile`; if T0241 named it differently, update the single field read in `buildProfileCard`. T0249 does not write the profile.
### Tests
none

## Result (attempt 1, yoga)

The start screen's profile card now shows "Iron wave N" in muted text with a new muted star (a recolored copy of the record star, painted as `STAR_MUTED_TEXTURE`) under the unchanged "Best wave" line, exactly when an iron best wave of at least 1 is recorded. Since T0241's `ironBestWave` profile field did not exist yet, I added that one field to the profile's record path in `core/profile.ts` (same place the best wave is written; only a run with the Iron multiplier counts) and its display in `src/scenes/menu/ProfileCard.ts`, plus the `mutedDeep` palette color and the star texture/painter. The card is otherwise byte-identical with no iron run, the yellow record star and all other lines are untouched, and the menu auto-fits the taller card at both required viewports.

- Self-review: APPROVE
- Time: 29.0 min

```
projects/chokepoint/game/src/art/icons.ts          | 15 ++++++++++++-
 projects/chokepoint/game/src/art/textures.ts       |  1 +
 projects/chokepoint/game/src/content/palette.ts    |  1 +
 projects/chokepoint/game/src/core/profile.ts       |  7 +++++-
 .../chokepoint/game/src/scenes/menu/ProfileCard.ts | 25 ++++++++++++++++------
 .../chokepoint/game/tests/core/profile.test.ts     | 10 ++++-----
 6 files changed, 45 insertions(+), 14 deletions(-)
```
