---
id: T0133
title: "A new look for the Beam tower: an emitter, not a flat slab"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
epic: E4
---

## Goal
The Beam tower's current barrel, a short flat wide head lying on the plinth, reads as a slab and doesn't say "this tower shoots a continuous line". Replace it with an emitter that looks like it focuses a beam and shows when it is on.

## Details
- **Shape (Beam first):** replace the flat wide head with an emitter: a thick round ring (outer diameter about 60% of the plinth, ring width about 25% of its radius) in Beam's own color, with a white disc in its center (about 40% of the ring's inner diameter) and one short, round-ended nozzle (about half the ring's radius long, a third as wide) pointing at the target, turning with it like the other barrels. The beam line leaves from the nozzle tip. Chunky, rounded, soft shadow like the other barrels; no theme.
- **While the beam is on:** the white center disc pulses (scale 1.0 to 1.15 and back, 0.4 s, ease in-out). Off: still. Respect the game's reduced-motion setting if there is one.
- **Beam added to the tower:** keep one small flat tick per added Beam, now placed around the ring (evenly spaced on its outer edge) instead of beside the old head.
- **Beam added to other towers:** unchanged (their barrels keep the ticks).
- Remove the old flat head texture and its key; nothing else uses it.
- Check at 412x915 and 1280x720 that the emitter reads as different from every other tower's barrel at a glance.

## Acceptance criteria
- [ ] A Beam-first tower shows the ring, white center disc and one nozzle that turns toward its target; the old flat head is gone.
- [ ] The beam line starts at the nozzle tip.
- [ ] The center disc pulses only while a beam is on.
- [ ] Added Beams show as ticks around the ring.
- [ ] The smoke screenshots on desktop and mobile show the new emitter.
