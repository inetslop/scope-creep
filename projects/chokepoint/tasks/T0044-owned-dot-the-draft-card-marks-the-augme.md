---
id: T0044
title: "Owned dot: the draft card marks the augment you already have"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T11:47:03Z
epic: E4
---

## Goal
The draft's core decision — stack what you have or branch into something new — reads at a glance: an offered card whose augment the run already carries shows a small dot, so what you own behind the three cards is visible without counting towers.

## Details
- On each of the three offered draft cards, when the run already has that augment — picked at least once this run, in any tower or in the hand — a small solid dot appears in the card's top-right corner: an 8 px circle in the muted gray the cards already use for secondary text, inset 10 px from the top and right edges of the card.
- The dot appears with the card's contents on the reveal flip (T0024) — it is not on the face-down back — and it is recomputed for the reroll's new offer (T0036).
- No other change to the card: the name line, numbers, gem row and frame stay exactly as they are; no text is added, nothing shifts.
- Closest example: the tier word on the name line (T0026) — another small mark on the same draft card. The card is drawn in `src/scenes/DraftScene.ts` (the file T0041's shimmer and T0026's tier word touch), with the shared card look from T0008.

## Acceptance criteria
- [ ] A run that has picked Bolt twice (a Bolt tower and a second Bolt) sees the dot on a Bolt card whenever the draft offers one, and no dot on the other offered cards.
- [ ] A run that has never picked an offered augment sees no dot on that card.
- [ ] The dot is not visible while a card is face-down and appears as the card lands face-up; on the next draft's face-down cards it is gone.
- [ ] After the once-per-run reroll, dots on the new offer reflect the run's augments as they are.
- [ ] The card's name line, numbers, gem row and frame are unchanged and nothing shifts; the dot is visible at both 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` - in `buildRow`, mark each offered card the run already carries (augment in hand or in a tower) with a small muted-gray dot in its top-right corner.

### Interfaces
No new types or signatures. Two additions, both local:
- `const owns: (id: string) => boolean` in `DraftScene.create()`.
- One `fillCircle` into the per-card `glyphs` graphics.

### Steps
1. In `create()`, directly above `const buildRow = (copies: AugmentCopy[]): void => {` (line 72), add:
   `const owns = (id: string): boolean => game.run.hand.some((c) => c.id === id) || game.towers.towers.some((t) => t.augments.some((a) => a.id === id));`
2. In the `buildRow` map callback, directly after `button.content.add([icon, name, ...gems, glyphs, towerLine, addedLine, key]);` (line 97), add:
   `// The run already has this augment: a small dot in the top-right corner.`
   `if (owns(copy.id)) glyphs.fillStyle(PALETTE.muted, 1).fillCircle(CARD_W / 2 - 14, -CARD_H / 2 + 14, 4);`

### Pitfalls
- Draw the dot into the per-card `glyphs` graphics (a member of `button.content`): it is hidden while face-down, appears with the reveal flip's `onYoyo`, and is destroyed on pick/reroll. Not into `back`, `frame` or `shade`.
- Match by augment `id`, never tier (an Epic Bolt card dots when the run has any Bolt).
- The 8 px dot is radius 4: center 14 px from the top and right edges (10 px inset + 4 px radius), mirroring the `key` number at top-left.
- Do not touch `layout()`, the name line, gems or frame: the dot is in fixed card-local coordinates, nothing shifts; 8 px is visible at 412x915 and 1280x720.
- The reroll needs no manual update: `buildRow` destroys the old cards and recomputes `owns` for the new offer; the next draft is a fresh scene.

### Tests
none
