---
id: T0094
title: "The card says how many: the owned dot gets a count"
assignee: narcissus
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-29T01:36:24Z
claimed_at: 2026-10-29T03:40:42Z
finished_at: 2026-10-29T04:02:58Z
epic: E4
---

## Goal
The draft's owned mark (T0044) grows a number: "stack this one" vs "branch this one" has a count, not just a dot, so the value of a second copy (Momentum-style stacking, the second pick T0065, a reroll) is read before the name is.

## Details
- A draft card whose augment the run already holds — the owned dot in its top-right corner (T0044) — shows, beside the dot, one small muted "×N": 12 px, muted gray, the same text class as the tier word on the card's name line ("Name · Rare", T0026).
- N = the copies of that augment the run holds: in the hand and in every tower's slots — T0044's "picked at least once, in any tower or the hand", counted.
- The count is shown only for N ≥ 2. At N = 1 the dot stays alone, byte-identical to today.
- The mark is part of the card's face, like the dot: it appears with the reveal flip (T0024), not before; a reroll (T0036) re-rolls the cards and the counts with them; the count is read fresh on every draft, so a copy built into a tower since the last draft changes what the next draft's cards show.
- Closest example: the owned dot (T0044) in the same corner of the same draft card — the count sits beside it, not a new line; the tier word (T0026) for the muted 12 px number style.
- No new line on the card (it does not grow), no rule change, no input, no sound, no pause-screen line.

## Acceptance criteria
- [ ] A draft card for an augment the run holds two copies of (in the hand and/or any towers) shows the dot and a small muted "×2" in the top-right corner; three copies show "×3".
- [ ] A card for an augment the run holds exactly one copy of shows the dot alone, as today.
- [ ] The count spans hand and towers: a card with one copy in the hand and one in a tower reads "×2"; after the run builds a second tower with that augment, the next draft's card reads "×3".
- [ ] A reroll (T0036) shows the counts on the re-rolled cards.
- [ ] Nothing else on the card moves, the card gains no line, no text is below 12 px, and no sound, input or pause-screen line was added.

## Design (architect, cachyos-x8664)

### Files
- edit `src/scenes/DraftScene.ts` - replace the boolean `owns` (line 82) with a copy-count, and in `buildRow` draw a small muted "×N" beside the owned dot when the run holds two or more copies.

### Interfaces
No exported types or module signatures change. One local helper in `create()` changes shape (rename + return type):
```ts
// was: const owns = (id: string): boolean => ...
const ownedCount = (id: string): number =>
  game.run.hand.filter((c) => c.id === id).length +
  game.towers.towers.reduce((n, t) => n + t.augments.filter((a) => a.id === id).length, 0);
```

### Steps
1. In `DraftScene.ts`, replace line 82 `const owns = (id: string): boolean => game.run.hand.some((c) => c.id === id) || game.towers.towers.some((t) => t.augments.some((a) => a.id === id));` with the `ownedCount` helper above.
2. In `buildRow`, replace the existing dot block (lines 117-118):
```ts
        const held = ownedCount(copy.id);
        // The run already has this augment: a small dot in the top-right corner.
        if (held > 0) glyphs.fillStyle(PALETTE.muted, 1).fillCircle(CARD_W / 2 - 14, t + 14, 4);
        // The held copies' count, beside the dot; shown only for two or more.
        if (held >= 2) {
          const heldCount = this.add.text(0, 0, `×${held}`, textStyle(12, PALETTE.muted));
          heldCount.setOrigin(1, 0.5);
          heldCount.setPosition(CARD_W / 2 - 14 - 8, t + 14);
          button.content.add(heldCount);
        }
```
`heldCount` is added to `button.content` (same list as the dot's `glyphs`), so it is hidden on the card's back and revealed with the flip (T0024); `textStyle` is already imported (line 11).

### Pitfalls
- The dot must stay byte-identical at N=1: `held > 0` reproduces the old `owns(...)` exactly (dot drawn at the same `fillCircle(CARD_W / 2 - 14, t + 14, 4)`), and the text is only created when `held >= 2`. Nothing else moves, the card gains no line (no `H`/`towerLine`/`addedLine` change).
- Add `heldCount` to `button.content`, not `button.container`: it must be hidden with `button.content.setVisible(false)` and revealed in the flip's `onYoyo`. Adding it to the container (like the `back` gem) would show it before the flip.
- On a reroll (T0036) `buildRow` is called again and destroys each old `c.button.container` (line 86), so the stale `heldCount` is destroyed with the card — no leak, no stale count. Counts are read fresh from `game.run.hand` + `game.towers.towers` each draft.
- Right-anchor the text (`setOrigin(1, 0.5)`, right edge at `CARD_W / 2 - 14 - 8`, 8 px left of the dot center, vertically centered on it at `t + 14`) so it stays glued to the dot and grows leftward for larger N (×10, …) instead of drifting. No overlap with the top-left key or the centered name/gems.
- No new input, sound, or pause-screen line; the only new text is the 12 px muted "×N".

### Tests
none (UI only, no rule in src/core changes).

## Result (attempt 1, narcissus)

In `src/scenes/DraftScene.ts`, the draft card's owned dot now counts copies: the `owns` check became an `ownedCount` helper that sums the augment's copies in the hand and in every tower's slots, and when the count is two or more a small muted 12 px "×N" (right-anchored next to the dot in the card's top-right corner, part of the card's face so it flips in with it) is shown beside the dot. At exactly one copy the dot renders exactly as before; counts are read fresh on every draft, so rerolls and newly built towers change what later cards show.

- Self-review: APPROVE
- Time: 22.3 min

```
projects/chokepoint/game/src/scenes/DraftScene.ts | 15 +++++++++++++--
 1 file changed, 13 insertions(+), 2 deletions(-)
```
