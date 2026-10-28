---
id: T0040
title: "Lead: the shot that aims where the enemy will be"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T10:05:34Z
claimed_at: 2026-10-28T10:05:37Z
epic: E4
designer: desktop
---

## Goal
The game's first predictive attack: Lead fires a heavy shot at where the enemy is going, not where it is. Added to any tower, its shots bank a longer lead — the counter to Sprinters, and a new way any first augment's attack can combine.

## Details
- New pool augment (all tiers; offered from the opening draft, like the other pool augments). **Closest existing:** Reach (slow, heavy, long range). **What is new:** the aim — the shot lands where the enemy will be, using the enemy's current speed. No existing augment predicts, and no added form changes where an attack aims.
- **As a tower's first augment (its own attack):** shoots the enemy furthest along, like Bolt, with a slow heavy green dart: 16/20/24 damage by tier (Common/Rare/Epic) every 1.2/1.05/0.9 s, range 4.5 cells.
- **The intercept:** the shot aims at the point the enemy will occupy when the shot arrives — lead = the shot's travel time × the enemy's current speed. Sprinter's ramped speed and Frost's slow both count (a hit-ramped Sprinter is led more, a slowed one less). The lead is capped at 1.2 cells ahead of the enemy's current position, so against a still or slow enemy the lead is small or zero and the shot lands on it — a Lead tower never whiffs at a Block or Dot.
- **When added to a tower (any first augment, including a second Lead):** each Lead beyond the first in the tower raises the lead cap by +0.6 cells (1.2 → 1.8 → 2.4). A Bolt tower with one Lead added gains the full intercept: its shots lead by travel time up to the 1.2 cap. The added form applies to the tower's aimed shots only — a first augment with no aimed shot (Splash's burst, Frost's aura) is unaffected by an added Lead.
- **The fizzle:** against a full-ramp Sprinter, a single-Lead tower's 1.2 cap can be shorter than the true lead: the shot lands ahead of the enemy, fizzles (a small quiet gray puff at the impact point, no damage, no sound), and stops missing once enough Leads are added that the cap covers the lead — stacking Lead is the visible answer.
- **Card lines:** asTower: "Aims where the enemy will be: heavy shot." (Rare and Epic show their own damage, 20 and 24, in the same line). asAdded: "Shots lead +0.6 cells per extra Lead." (same at every tier).
- **Look on the tower:** Lead's color is green everywhere (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). Lead first: a long slim barrel — the thinnest, longest barrel in the game, like a Reach barrel in Lead's green — tipped with a small chevron, the Sprinter's chevron shape, so the tower reads "chases runners". Each added Lead: one small green chevron tick on the barrel face, the existing tick style. The shot itself is a small heavy green dart, visibly slower than a Bolt shot.
- **Sound:** the Lead shot reuses the existing heavy-shot sound (Reach's). The fizzle is silent. No new Sfx method.
- **Spec-test coverage** closest to Ember's (`tests/core/lead.test.ts`): the lead formula (still enemy → 0; constant-speed enemy → travel time × speed; over the cap → the cap), the tier specs, the added form through a Bolt tower (cap 1.2) and a two-Lead tower (cap 1.8), and the card lines per tier.
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Lead as Common, Rare and Epic (frame and gem row per T0002); the card shows the tier's damage and the added line "Shots lead +0.6 cells per extra Lead."
- [ ] A lone Common Lead tower shoots the enemy furthest along within 4.5 cells: 16 damage every 1.2 s (20/1.05 s and 24/0.9 s for Rare and Epic), and the tower shows the long slim green barrel with the chevron tip.
- [ ] Against a still enemy (Block) and steady enemies (Dart, Dot) the shot always lands on the enemy — the lead is small or zero and no shot ever flies past a still or steady target.
- [ ] Against a moving enemy the shot visibly lands ahead of where the enemy is and still connects (hit flash on the enemy); a hit-ramped Sprinter is led more than an unhurried Dart.
- [ ] A Bolt tower with one Lead added leads its shots the same way (shots on a moving Dart land ahead and connect), and its barrel gains one green chevron tick per Lead.
- [ ] A full-ramp Sprinter that outruns the 1.2 cap makes a single-Lead tower's shots fizzle ahead of it (small gray puff, no damage); adding Leads until the cap covers the lead makes them connect again.
- [ ] Every other augment, enemy and scene is unchanged; a run with a Lead in the pool passes the desktop and mobile smoke tests.
