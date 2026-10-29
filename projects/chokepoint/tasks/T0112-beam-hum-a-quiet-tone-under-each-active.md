---
id: T0112
title: "Beam hum: a quiet tone under each active beam (the T0043 re-file)"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T09:55:07Z
epic: E4
---

## Goal
A beam is heard as well as seen: a very quiet continuous hum under each active beam, so how many beams are on is felt without looking. This re-files the failed T0043, whose wait (the Beam, T0073) has landed.

## Details
- A new Sfx sound in the quiet family of the leak warning (T0014) and the tier chime (T0032), below the UI blips: one sustained 110 Hz sine at volume 0.05 (pre-master, the T0043 convention — do not renormalize), with a 200 ms fade in when it starts and a 200 ms fade out when it stops. Sustained — a held oscillator, not a blip — the short sines of `Sfx.tierChime` (T0032) held instead of released.
- One hum per beam tower: it starts the instant that tower's beam locks onto a target and stops the instant the beam has no target. Retargeting (the beam jumps to the next target the instant its target dies or leaves range, T0073) keeps the hum continuous — no fade out and back in.
- At most 3 hums at once: the first three beam towers to lock get a hum; a fourth or later tower stays silent until one of the humming towers releases, and the next lock then takes a free slot.
- Silent when sound is off (T0035). All hums stop when the game scene goes away (game over, quit to menu), so the pool is never clogged for the next run.
- No visuals, no per-tick sound, no change to any other sound.
- The complete design already exists in the failed task's archive (`tasks/archive/T0043-beam-hum-a-quiet-hum-under-each-active-b.md`): the Sfx `beamHums` pool with start/stop/stopAll, the call-sites in the beam system's per-tower target pass (none→target: start; target→none: stop; retarget to a different target: no call), and one line in the scene's shutdown handler. T0043's three attempts were blocked only because the Beam had not landed yet — it has now (T0073, 2026-10-29). **Re-check the design's file names against the landed code first**: the design assumed `src/systems/BeamSystem.ts`; the landed beam system may be named differently (the system inventory lists it as "Beam") — the call-sites are the same, the landed file wins.

## Acceptance criteria
- [ ] A beam tower locks onto a target: a quiet hum (110 Hz, ~0.05 volume) is audible within ~200 ms and continues for as long as the beam stays on.
- [ ] The beam's target dies and the beam retargets instantly: the hum never stops or fades.
- [ ] The beam's target leaves range with no new target in range: the hum fades out over ~200 ms.
- [ ] A second and a third beam tower locking on each adds its own hum.
- [ ] A fourth beam locking on adds no new hum; when one of the first three releases, the next lock takes its place.
- [ ] Non-beam towers make no hum; all other sounds are unchanged; with sound off (T0035) no hum is heard; a run after game over starts with no hum.
