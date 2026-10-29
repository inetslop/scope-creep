---
id: T0133
title: "A new look for the Beam tower: a tower with a circle on top"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
claimed_at: 2026-10-29T11:34:09Z
epic: E4
designer: desktop
---

## Goal
The Beam tower's current barrel, a short flat wide head lying on the plinth, reads as a slab and doesn't say "this tower shoots a continuous line". Replace it with a tower that has a circle on top, an orb the beam comes out of, which shows when the beam is on.

## Details
- **Shape (Beam first):** a tower with a circle on top. A short, thick round post rises from the plinth in Beam's own colour, with the darker side face giving it height the way other bodies get thickness. On top sits a large circle (an orb, about 60% of the plinth's width) in Beam's colour, with a white disc in its centre (about 40% of the orb's diameter). No nozzle and no turning barrel: the beam line leaves from the orb's centre toward the target. Chunky, rounded, a soft shadow like the other barrels, no theme.
- **While the beam is on:** the white centre disc pulses (scale 1.0 to 1.15 and back, 0.4 s, ease in-out). When the beam is off it stays still. Respect the game's reduced-motion setting if there is one.
- **Beam added to the tower:** keep one small flat tick per added Beam, now spaced evenly around the orb's outer edge instead of beside the old head.
- **Beam added to other towers:** unchanged (their barrels keep the ticks).
- Remove the old flat head texture and its key; nothing else uses it.
- Check at 412x915 and 1280x720 that the tower reads as different from every other tower's barrel at a glance.

## Acceptance criteria
- [ ] A Beam-first tower shows a post topped by an orb with a white centre disc. The old flat head is gone.
- [ ] The beam line starts at the orb's centre.
- [ ] The center disc pulses only while a beam is on.
- [ ] Added Beams show as ticks around the orb.
- [ ] The smoke screenshots on desktop and mobile show the new Beam tower.
