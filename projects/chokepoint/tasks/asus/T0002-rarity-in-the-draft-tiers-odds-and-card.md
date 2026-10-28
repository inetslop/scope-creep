---
id: T0002
title: "Rarity in the draft: tiers, odds, and card frames"
assignee: asus
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E4
---

## Goal
Sometimes a draft card is something special: every augment now comes in a tier — Common, Rare or Epic — and the draft shows which. This task is the tier data and the draft presentation only; the hand and tower panel (T0008) and the tower pips (T010) build on it.

## Details
- Tiers: Common (the numbers the augment has today), Rare, Epic. Each augment's tier values are stored with the augment so later tasks (and future augments) read them from one place.
- Exact tier values (Rare then Epic, applied to the card text the player reads):
  - Bolt: Rare — damage x1.3, cooldown x0.85. Epic — damage x1.7, cooldown x0.70. The added "+1 shot" is unchanged in all tiers.
  - Rapid: Rare — damage x1.3, cooldown x0.85, added line becomes "attacks 65% faster, hits 25% lighter". Epic — damage x1.7, cooldown x0.70, added line "attacks 85% faster, hits 25% lighter".
  - Reach: Rare — damage x1.3, cooldown x0.85, range x1.15, added line "45% more range". Epic — damage x1.7, cooldown x0.70, range x1.35, added line "55% more range".
  - Splash: Rare — damage x1.3, cooldown x0.85, added line "hits burst over 1.5 cells". Epic — damage x1.7, cooldown x0.70, added line "hits burst over 2 cells".
  - Frost: Rare — slow 50% (was 40%), cooldown x0.85. Epic — slow 60%, cooldown x0.70.
- The draft rolls each of its three cards independently: 70% Common, 25% Rare, 5% Epic.
- The draft card header shows the current odds in small gray text: "Common 70 · Rare 25 · Epic 5".
- Card look: Common keeps the current plain white frame. Rare gets a blue frame (2px) around the card. Epic gets a purple frame (2px). Under the card title, a gem row of small rounded diamonds: 1 light gray gem (Common), 2 blue gems (Rare), 3 purple gems (Epic).
- Card text shows the tier's numbers, so a Rare Rapid card literally reads 65% faster. The card name is unchanged.
- The tier only affects that copy of the augment: a tower built from a Rare Rapid is a Rare Rapid for the rest of the run.

## Acceptance criteria
- [ ] Repeated drafts eventually produce Rare and Epic cards; the odds line always reads "Common 70 · Rare 25 · Epic 5".
- [ ] A Rare Rapid card reads "attacks 65% faster" and its damage number is 30% above the Common card's.
- [ ] Rare cards show a blue frame and 2 blue gems; Epic a purple frame and 3 purple gems; Common is visually unchanged.
- [ ] A tower built from a Rare Rapid behaves with the Rare numbers (verify: attack faster than a Common Rapid tower).
- [ ] The odds line and gem row fit the draft cards at 412x915 and 1280x720 without overlapping the card text.
