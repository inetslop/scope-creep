---
id: T0341
title: "The Sprinter shows its ramp: a notch on each hit that speeds it up"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T05:22:57Z
claimed_at: 2026-11-01T05:23:03Z
designer: yoga
---

## Goal
A first-time player sees the Sprinter's trap as it happens: each hit that speeds it up pops a small orange notch at its base, so its own line — "melt it before it takes off" — is read on the board instead of learned by watching it get away.

## Details
- Display only. The Sprinter's ramp is untouched: it gains 0.28 cells/s per damaging hit, 2.52 up to its cap of 5.32 (10 steps). This task adds no behavior, no numbers, no wave-mix or art-file change.
- The moment a hit raises the Sprinter's speed — exactly when the existing ramp rule applies, whatever source it counts — one small notch in the Sprinter's own orange pops at the chevron's base: scales in over ~150 ms, holds ~100 ms, fades over ~150 ms, gone within 0.4 s. About a third of the token's wide (the Hauler coin's scale, T0098). The hit's white flash stays exactly as it is.
- A Sprinter at its cap shows no notches on further hits — the notches stopping reads as "it is already at top speed."
- Re-derived every frame from the enemy's current speed (the buildTeach pattern, T0319): an enemy seen for the first time — spawn, or a resumed run loading a mid-ramp Sprinter — sets the baseline silently, so nothing replays on load.
- Per enemy: two Sprintsers on the board notch independently.
- No sound, no text, no input, nothing on the HUD or cards; the notch is a transient board mark like the hit flash, never a permanent one.
- Closest examples: the Dasher's streak (T0328) and the Ward's ring (T0335) — display-only reactions re-derived each frame. New file: `src/systems/fx/sprinterRamp.ts` (the architect confirms the directory and the registration point; the quiet tower dot, T0233, shows where such a system is constructed and updated).

## Acceptance criteria
- [ ] Hitting a Sprinter below its cap pops one small orange notch at its base per hit that raises its speed; the notch is gone within ~0.4 s and the white hit flash is unchanged.
- [ ] A Sprinter at its cap (5.32 cells/s) shows no notch on further hits.
- [ ] No notch on spawn, and none when a run with mid-ramp Sprintsers resumes.
- [ ] Each Sprinter on the board notches independently.
- [ ] No new HUD element, card line, sound or text; the Sprinter's numbers and the wave mix are byte-identical.
