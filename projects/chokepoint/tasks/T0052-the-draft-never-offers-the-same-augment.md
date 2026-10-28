---
id: T0052
title: The draft never offers the same augment twice in a row
size: S
priority: 2
status: designing
depends_on: [T0048]
attempts: 0
created: 2026-10-28T12:34:55Z
claimed_at: 2026-10-28T12:45:21Z
epic: E4
designer: yoga
---

## Goal
Every offer has something new in it: an augment the draft just offered is not offered again in the next offer, so every pick always has a fresh branch to consider.

## Details
- The offer roll (T0002) excludes any augment that appeared in the immediately previous offer of this run.
- A reroll (T0036) excludes the offer it replaces — rerolling a draft re-rolls from the augments not in that offer.
- The pre-wave-1 offer has no previous offer: it keeps the Common Bolt floor (T0048) and otherwise rolls normally.
- Tier odds (T0002, T0011), card frames and gems, the flip (T0024), the tier chime (T0032), the tier word (T0026) and the owned dot (T0044) are all unchanged.
- If the exclusions ever left fewer than three eligible augments (not possible with the current eleven-augment pool), the rule relaxes for that offer only; the roll must never hard-fail as the pool grows.

## Acceptance criteria
- [ ] In one run, no augment appears in two consecutive draft offers.
- [ ] A reroll never offers an augment from the offer it replaces.
- [ ] The first draft of a fresh run still includes a Common Bolt (T0048).
- [ ] Card frames, gems, tier word, flip, chime and owned dot behave exactly as before on offers that obey the new rule.
