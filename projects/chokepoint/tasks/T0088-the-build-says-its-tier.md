---
id: T0088
title: The build says its tier
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T00:22:08Z
claimed_at: 2026-10-29T00:51:11Z
epic: E4
designer: desktop
---

## Goal
Rarity is heard where it is spent: the moment an augment lands in a tower, the tier chime says which tier it is — the draft's ear (T0032) extended to the build.

## Details
- The moment an augment is committed to a tower — a new tower's first card, as the drop-in bounce lands, or an added copy filling a free slot — the tier chime (T0032's `tierChime`) plays once at its existing volume: one low note Common, two a third higher Rare, three the highest Epic.
- The chime starts on the commit, at the same instant the drop-in bounce / slot fill happens. It never plays on a failed placement (gold short, no free slot, a cell not beside the road), never on the draft reveal (T0032's reveal chime is untouched), and there is no sell or remove to chime yet.
- No new sound: T0032's chime is reused as-is. No visual change, no input, no new HUD element.
- Closest example: the tier chime (T0032) for the sound and its volume; the build commit in the building system (where the drop-in bounce is triggered) for the timing.

## Acceptance criteria
- [ ] Building a Common tower plays one soft note as it lands; adding a Rare augment to an existing tower plays the two-note chime as the slot fills; an Epic placement plays the three-note chime.
- [ ] An unaffordable or invalid placement plays nothing, and the button's dimmed states are unchanged.
- [ ] The draft reveal chime (T0032) is unchanged; desktop 1280x720 and mobile 412x915 smoke pass.
