---
id: T0434
title: "The profile remembers the storm's best wave"
size: S
priority: 2
status: designing
depends_on: [T0403]
attempts: 0
created: 2026-11-02T16:14:55Z
claimed_at: 2026-11-02T16:22:04Z
epic: E17
designer: yoga
---

## Goal
The menu's profile card says how far a storm has carried the player, in the Iron line's own language — the third mode reads on the card that already reads the first two.

## Details
- The profile (src/core/profile.ts) stores the best wave reached in a Storm run, next to the Iron's own field (the T0249 pattern): updated only by a finished Storm run whose wave beats the stored value (the first such run sets it); normal and Iron runs and ghost replays never move it, and the saved best wave is untouched.
- The profile card shows a muted "Storm wave N" line under the "Iron wave N" line, N the stored storm best wave, wearing the muted star (the record star's muted copy, T0249's own star, the Iron line's own size and baseline). The line appears under exactly the visibility rule the Iron line wears, applied to Storm runs.
- The card grows one line; the menu's fit sum keeps every option on screen at 412x915 and 1280x720 (the T0222 rule) with all three lines — best, Iron, storm — shown at once.
- Nothing else changes: the claim card (T0403's "Storm" line), the pause's mode word (T0413) and the history (E18's storm rows, its own slice) keep their own reads — the profile line is the best wave reached in a storm, shown nowhere else on the menu (nothing shown twice).

## Acceptance criteria
- [ ] After a finished Storm run meeting the Iron line's own visibility rule, the profile card shows a muted "Storm wave N" line with the muted star under the Iron line; N is the best Storm wave.
- [ ] A later Storm run to a higher wave moves the line; a lower one leaves it; a normal or Iron run never moves it.
- [ ] With no qualifying Storm run, the card is byte-identical to today.
- [ ] The menu column still fits at 412x915 and 1280x720 with the best, Iron and storm lines all shown.
