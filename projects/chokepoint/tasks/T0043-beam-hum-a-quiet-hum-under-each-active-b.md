---
id: T0043
title: "Beam hum: a quiet hum under each active beam"
size: S
priority: 3
status: design
depends_on: [T0029]
attempts: 0
created: 2026-10-28T11:24:34Z
epic: E4
---

## Goal
A beam is heard as well as seen: a very quiet continuous hum under each active beam, so how many beams are on is felt without looking.

## Details
- A new Sfx sound in the quiet family of the leak warning (T0014) and the tier chime (T0032), below the UI blips: one sustained 110 Hz sine at volume 0.05, with a 200 ms fade in when it starts and a 200 ms fade out when it stops. Sustained — a held oscillator — not a blip; closest example is the short sines of `Sfx.tierChime` (T0032), held instead of released.
- One hum per beam tower: it starts the instant that tower's beam locks onto a target and stops the instant the beam has no target. Retargeting (the beam jumps to the next target the instant its target dies or leaves range, per T0029) keeps the hum continuous — no fade out and back in.
- At most 3 hums at once: the first three beam towers to lock get a hum; a fourth or later tower stays silent until one of the humming towers releases, and the next lock then takes a free slot.
- No visuals, no per-tick sound, no change to any other sound.

## Acceptance criteria
- [ ] A beam tower locks onto a target: a quiet hum (110 Hz, ~0.05 volume) is audible within ~200 ms and continues for as long as the beam stays on.
- [ ] The beam's target dies and the beam retargets instantly: the hum never stops or fades.
- [ ] The beam's target leaves range with no new target in range: the hum fades out over ~200 ms.
- [ ] A second and a third beam tower locking on each adds its own hum.
- [ ] A fourth beam locking on adds no new hum; when one of the first three releases, the next lock takes its place.
- [ ] Non-beam towers make no hum, and all other sounds are unchanged.
