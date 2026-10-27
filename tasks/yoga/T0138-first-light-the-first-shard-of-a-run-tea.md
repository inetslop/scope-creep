---
id: T0138
title: First light — the first shard of a run teaches the economy
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T19:37:42Z
claimed_at: 2026-10-27T19:46:07Z
designer: yoga
---

## Goal
The shard economy (shoot → shard → level) is the core loop, but nothing marks it the first time. The moment the first shard of a run is picked up it announces itself — a small ink ring and a higher pluck — so a first-time player notices the loop, in the spirit of the enemy marginalia (T0027).

## Details
- Once per run, the first shard to be picked up (any shard, gilt or not) triggers two extras on top of the normal pickup:
  - a small flat ink ring pops at the pickup point — the existing ring FX idiom (the crit ring, T0119): a flat 2 u ink circle growing from ~8 u to ~24 u and fading over 300 ms, no outline or shadow.
  - the pickup pluck (T0003, as pitch-modified by the gilt glint, T0117) plays one octave higher (frequency ×2, same gain).
- If the first shard happens to be gilt (T0112), the gilt glint's +1 semitone (T0117) is replaced by the first-light octave (the bigger lift wins); the yellow "+N" pop (T0117) still prints.
- Once per run: the flag is per-run, like the marginalia first-sighting (T0027) — it resets on every new run and is not persisted between runs.
- Every other pickup is unchanged: normal shards the plain pluck, gilt shards +1 semitone plus the yellow pop. No new HUD element, key, scene, sound or gameplay number.

## Acceptance criteria
- [ ] In a fresh run, the first shard picked up pops a small flat ink ring at the pickup point (growing ~8→24 u, fading over ~300 ms) and plays the pickup pluck one octave higher.
- [ ] The second and later pickups in the same run behave exactly as before (normal: plain pluck; gilt: +1 semitone + yellow "+N" pop).
- [ ] If the first shard is gilt, the pluck is one octave higher (not +1 semitone) and the yellow "+N" pop still prints.
- [ ] A new run repeats the effect (the flag is per-run, not persisted).
- [ ] No new HUD element, key, scene, or gameplay number change.
