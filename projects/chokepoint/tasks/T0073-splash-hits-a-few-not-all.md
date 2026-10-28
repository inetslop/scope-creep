---
id: T0073
title: "Splash hits a few, not all: 3 enemies per Splash"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-28T21:08:30Z
---

## Goal
Splash's blasts hit every enemy in their area, which makes its combos (extra shots, Rapid, Mark, Ember) far stronger than any other tower. Cap how many enemies a Splash blast hits, and let the cap grow with every Splash in the tower: more Splash means more of the pack, not all of it from the first copy.

## Details
- **The rule:** a Splash blast hits at most **3 enemies per Splash in the tower** (1 Splash: 3, 2: 6, 3: 9), counting copies in any slot and at any tier.
- **Splash as a tower's first augment (its pulse):** hits the up-to-N enemies in range that are **furthest along the road** (the same choice the other attacks make), not everything in range.
- **Splash added to a shooting tower (its bursts):** each hit still strikes its own target; the burst then strikes at most N - 1 other enemies inside the burst radius, **nearest to the struck enemy first**. Pierce is unaffected.
- **Splash added to a tower whose first augment is another pulse** (Frost, Anchor, Push): unchanged. It still widens that pulse's reach, and the pulse still affects everything in it (those pulses already hit everyone in range and aren't the damage problem).
- **Tiers are unchanged:** Rare and Epic still burst wider and hit harder (radius 1.5 / 2 cells, their damage and cadence); the count only grows with copies.
- **Card lines (Common):** first: "Blasts the 3 furthest around it." Added: "Hits burst over 1 cell, to 2 more enemies." Rare and Epic show their own radius in the added line ("over 1.5 cells", "over 2 cells"); the counts are the same at every tier.
- **Tower panel line:** says the tower's count, e.g. "blasts the 6 furthest" for a tower with two Splash, "its hits burst to 2 more" for a Bolt with one Splash added.
- No new visuals or sounds: the pulse ring and the burst ring look as they do today.

## Acceptance criteria
- [ ] A Splash tower with 6 enemies in range damages exactly the 3 furthest along; with a second Splash in it, all 6.
- [ ] A Bolt with Splash added: each hit damages its target plus at most 2 others inside the burst radius, the nearest first; with two Splash added, at most 5 others.
- [ ] Frost, Anchor and Push towers with Splash added still reach further and affect every enemy in their wider range.
- [ ] A Rare or Epic Splash still bursts wider and hits harder than a Common one; the counts don't change by tier.
- [ ] The draft cards and the tower panel show the counts.
- [ ] Unit tests cover the counts (1, 2 and 3 Splash; first and added) and the furthest-along / nearest-first choice.
