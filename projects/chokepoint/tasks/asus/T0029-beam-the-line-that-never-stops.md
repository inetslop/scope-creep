---
id: T0029
title: "Beam: the line that never stops"
assignee: asus
size: L
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-28T06:24:55Z
epic: E4
---

## Goal
The draft can roll a new augment, Beam — the first sustained attack: a continuous line that deals damage per second for as long as the enemy is in range. No shots, no cooldown: a Beam tower holds one enemy down and never lets go until it moves.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Reach (a long single-target attack on the enemy furthest along). **What is new:** no shots at all — a continuous beam that deals per-second damage and retargets the instant its target dies or leaves range — and an added form that is a sustained second target, which no added form does (extra shots, slow, mark, leap, pierce and push all end with the attack).
- **As a tower's first augment (its own attack):** a continuous beam on the enemy furthest along within range. Common: 6 damage per second. Rare: 8. Epic: 10. The beam works within the tower's normal range, so Reach's added +35% range lengthens it. The moment its target dies or leaves range the beam snaps to the next-furthest enemy in range (the same targeting rule as Bolt); with no enemy in range the rod idles.
- **When added to a tower:** a second beam locks on the enemy nearest the tower's main target (the first beam's target if the tower is Beam-first, otherwise the attack's target) and deals half the per-second rate: Common 3, Rare 4, Epic 5. The second beam idles while the main target is absent. The new way: any attack gains a sustained secondary — Bolt + Beam shoots the furthest while a line holds the nearest to it; Splash + Beam bursts the crowd while a line picks one off.
- **Card lines:** Common first: "A continuous beam on the furthest enemy: 6 per second." / added: "A second beam on the nearest enemy: 3 per second." Rare and Epic show 8/4 and 10/5 in the same lines.
- **Look on the tower:** Beam's color is teal — the line, the rod and the dashes are all teal (a body shape and bright color no other augment uses; check the content folder and take the next free pair if one is taken by an in-flight augment). Beam first: the barrel is a long, thin rod (a narrow rounded rectangle) instead of a short one; while beaming, a solid teal line (2 px) runs from the rod's tip to the target — full width on the main target, half width on the second. Every added Beam: one short teal dash on the barrel, the existing tick style. If T0010's tier pips have landed, they stay visible — the dashes never sit on top of the pips.
- **The mark on a beamed enemy:** a small teal flash (60 ms, soft) at the beam's impact point so the sustained damage reads without strobing.
- **The tower-panel line** (the same place Mark's mark line lives): "A continuous beam on the furthest enemy: 6 per second", and for a tower with Beam added, "...and a second beam on the nearest enemy".
- **Sound:** one new Sfx method, a soft lock-on tick, played only when a beam acquires a new target; no sound while beaming, no sound when the beam breaks.
- **Spec-test coverage** closest to the other new augments' tests: the beam's per-second damage per tier, retargeting when the target dies or leaves range, the second beam at half rate and its idle, Reach extending the beam's range, and the card lines per tier.
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Beam as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's per-second rate; the added line reads "A second beam on the nearest enemy: N per second."
- [ ] A lone Common Beam tower holds a solid teal line on the enemy furthest along within range and deals 6 damage per second; the instant that enemy dies or leaves range the line snaps to the next-furthest enemy in range.
- [ ] A Beam-first tower with a second Beam holds two lines: full width on the main target, half width on the enemy nearest to it, at 3/4/5 per second by tier; with no main target the second beam idles.
- [ ] A Reach tower with Beam added holds a beam that reaches Reach's extended range — visibly farther than a plain Beam's line.
- [ ] A Bolt tower with Beam added shoots exactly as before while a teal line holds the enemy nearest its target.
- [ ] The tower shows the long thin rod (Beam first) or one short teal dash per added Beam, visible at 1x zoom at 412x915 and 1280x720.
- [ ] A first-time player can read it from the board alone: the line connects the tower to whatever it is holding down.
