---
id: T0249
title: "The profile remembers your iron run: the iron best wave with its muted star"
size: S
priority: 2
status: designing
depends_on: [T0241]
attempts: 0
created: 2026-10-30T01:33:38Z
claimed_at: 2026-10-30T02:14:07Z
epic: E6
designer: yoga
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
