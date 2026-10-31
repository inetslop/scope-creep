---
id: T0316
title: Beam added is a damage boost (the T0280 re-file)
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T00:35:25Z
epic: E4
---

## Goal
The beam stops splitting its attention: an added Beam no longer grows a second, quiet beam — it fattens the beam that is already firing, so every beam interaction (the burn it carries, its marks, its kill needles) rides on one fatter line. (T0280's re-file: the earlier file failed three times on a weak machine, so this spec is deliberately narrow — one form change and its fallout.)

## Details
- **The added form, per tier:** a flat per-second addition to the main beam's own rate — Common +5/s, Rare +7/s, Epic +9/s — additive per copy, no cap. The main beam's rate is unchanged: 14 / 20 / 28 per second (Common / Rare / Epic).
- **The second beam is gone:** no second line on the nearest enemy, no second beam damage, no second hum — removed from everywhere it appears.
- **Card lines (exact):**
  - description: "A continuous beam on the furthest enemy. Added: the beam deals 5 more per second."
  - asAdded — Common: "The beam deals 5 more per second." · Rare: "The beam deals 7 more per second." · Epic: "The beam deals 9 more per second."
  - asTower is unchanged, per tier.
- **On every attack kind:** beam — the flat addition above, per copy. shot, spray, pulse, burn, mark, rally — a Beam added to any of them does nothing: a tower without a beam has nothing to fatten. Acceptable: the card's line says exactly where it works, in the draft, the hand and the panel, so the pick is never a surprise, and the offer's other cards always carry the play.
- **The beam's interactions ride on the main beam only, unchanged in form:** the carried Ember burn, Anchor root, Push shove and Mark (T0132), the Lance pierce along the main line (T0210), the beam kill's one needle per added Spray (T0242), the Bolt ray and the Rapid/Rally feed (T0130) — all keep their existing behavior; only the beam's own rate grows. The beam hum (T0112) is one voice, on the main beam.
- **On the tower:** the beam line grows one visible step in width per added Beam — thicker with each copy, the beam's own read; no new ring, pip or mark.
- **Nothing new on screen:** the panel's added line, the "≈ N/s" line (T0084), the codex card (T0221) and the what-if preview (T0096) all carry the change from the def in their existing language.
- **Worked examples (pin these):** a Common Beam tower with one Common added Beam ticks 19/s, with two 24/s; a Rare Beam with one Epic added Beam ticks 29/s; a Bolt tower with any added Beam deals the same damage at the same rate as the same Bolt tower without it.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Beam | the beam's own rate (its first form) and the removed second beam | the added form is now a flat per-second addition to the main beam per copy; the second beam — its own target, its own hum — stops existing |
| Rapid | an added form that changes damage | Rapid re-times every attack it joins, faster and lighter; this adds only to the beam's own tick rate and touches no other attack kind |
| Mark | an added form that raises damage taken | Mark marks one enemy and multiplies every tower's damage to it; this fattens only this tower's beam, on whatever enemy it holds |
| Ember | an added form that adds ticking damage | Ember's burn ticks off the beam for 3 s on a struck target; this raises the beam's own tick rate — the burn the beam carries is unchanged |

## Acceptance criteria
- [ ] A beam tower's rate is its own tier's rate plus the flat addition of every added Beam in it (14+5, 14+5+5, 20+9, 28+9…); unit tests pin the worked examples.
- [ ] No second beam exists anywhere: no second line renders, no second beam deals damage, and no system (carried effects, the Lance pierce, the Spray needles, the hum) reads a second beam; a multi-Beam beam tower is one line, one visible step thicker per added copy.
- [ ] A Beam added to a non-beam tower (shot, spray, pulse, burn, mark or rally host) deals no damage and has no effect — the tower is byte-identical to the same tower without it.
- [ ] The card lines read exactly as above, per tier, on the draft, the hand, the tower panel and the codex (each tier line within the 56-char cap).
- [ ] The "≈ N/s" line and the codex show the boosted rate from the def; the beam hum stays one voice.
- [ ] npm run check passes and the desktop 1280×720 / mobile 412×915 smoke passes.
