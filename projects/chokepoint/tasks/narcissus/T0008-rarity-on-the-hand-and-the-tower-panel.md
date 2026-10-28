---
id: T0008
title: Rarity on the hand and the tower panel
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: [T0002]
attempts: 0
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T02:38:43Z
epic: E4
designer: desktop
---

## Goal
The tier is visible everywhere an augment is visible: the hand cards and the tower panel match the draft cards from T0002.

## Details
- The hand cards (the augment picked, before placement) and the tower-panel cards (the list of a selected tower's augments) get the same look as the draft cards (T0002):
  - frame: Common plain white, Rare a 2px blue frame, Epic a 2px purple frame
  - gem row under the title: 1 light gray gem (Common), 2 blue gems (Rare), 3 purple gems (Epic)
- Each tower-panel line also shows the tier name: "Rapid · Rare".
- Card text shows the tier's numbers, exactly as the draft does for the same augment and tier.

## Acceptance criteria
- [ ] A Rare augment in the hand shows a blue frame and 2 blue gems; the same augment in the tower panel shows the same frame, gems and "Rapid · Rare"-style line.
- [ ] A tower-panel card's numbers match the draft card for the same augment and tier (same text).
- [ ] Common cards in the hand and panel look exactly as they do today.
- [ ] The hand strip fits its cards at 412x915 and the tower panel fits at 1280x720 without overlapping other elements.
