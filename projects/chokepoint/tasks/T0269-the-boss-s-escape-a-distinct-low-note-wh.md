---
id: T0269
title: "The boss's escape: a distinct low note when the boss gets through"
size: M
priority: 2
status: designing
depends_on: [T0253]
attempts: 0
created: 2026-10-30T08:43:10Z
claimed_at: 2026-10-30T09:03:18Z
epic: E5
designer: baby-mama
---

## Goal
Letting the peak through is the run's worst moment, and today it is heard exactly the same as a Dot getting through: when a boss leaks, a distinct low note plays, so "that was the boss" is heard, not just seen in the big ghost that walks back (T0250) — E5's "its escape … is the run's worst moment, heard as a distinct low note."

## Details
- **Who triggers it:** a leak whose leaker is the enemy the current boss wave's plan declares as its boss — T0253's `isBossWave` plan (today the Colossus; the second and third boss — T0259's Titan, T0266's Orb — ride the same plan rule with no change to this hook). A normal enemy leaking (Dot, Block, Hauler, a Ward) never triggers it. Data-driven off the plan and the def, never a hard-coded id.
- **The note (a new Sfx method, the sting/coin-blip class):** a low two-note horn, descending — e.g. 82 Hz then 62 Hz, 200 ms each, ~100 ms apart, volume 0.14. It sits below the leak thud's 98 Hz (T0267) and is longer and falling, so it reads as a loss ("it got through"), the mirror of the arrival's rising horn (T0268) — the pair share the 62-82 Hz band, one up, one down. Procedural, no sound file, silent when sound is off (T0035).
- **Coexistence, not replacement:** on a boss leak the leak's existing feedback all lands exactly as today — the size-scaled jolt (T0109), the ghost echo walking back from the exit (T0250), the leak thud (T0267) where it has landed, the first-leak chip (T0107) on a first leak, the Toll's leak gold (T0234) and the last-stand banner (T0060) at 1 life — and the note is added on top. The thud (98 Hz, 120 ms, single) and the escape note (82→62 Hz, 200 ms each, falling) differ in pitch, length and direction, so the two read as one heavy "it got through" moment, not a duplicate; if the thud has not yet landed, the note stands alone.
- **The trigger (a new leak hook, the comboBreak T0207 / leakEcho T0250 pattern):** a new file in the enemy-hooks folder, registered where they register. It fires at the same moment as the jolt and the echo, checks the leaker against the plan's declared boss, and plays the note only when it matches. It is resume-safe (a resumed run replays nothing — the note plays live, like the thud) and plays once per boss that gets through (a boss wave sends one boss, so at most one per wave).
- **No new HUD, readout, board mark, input or key:** the note adds a sound, not a readout — the leaker is already identified by the echo ghost's shape and size, the jolt is already scaled to it, and the screen is unchanged. The pause screen's controls are unchanged.
- **Why it matters now:** the Colossus (wave 10, livesCost 1) already leaks today, so the escape happens in the game as it is; right now the run's costliest leak — losing the peak enemy to the exit — is heard the same as any other, which undersells the moment the rest of E5 is built to make big.

## Acceptance criteria
- [ ] When the boss (the plan's declared boss) reaches the exit and leaks, one descending two-note horn plays (~82→62 Hz, 200 ms each, ~100 ms apart, volume 0.14), at the same moment as the leak's jolt and echo ghost.
- [ ] A non-boss enemy leaking (a Dot, a Block, a Hauler, a Ward) never plays the note — its leak feedback is byte-identical to today.
- [ ] On a boss leak the existing feedback is unchanged and all still plays — the size-scaled jolt (T0109), the ghost echo (T0250), the thud (T0267) where present, the first-leak chip (T0107), the Toll gold (T0234) and the last-stand banner (T0060); the note is added on top, distinct in pitch/length/direction from the thud.
- [ ] At most one note per boss wave (the boss wave sends one boss); at 2× fast-forward (T019) it plays once and unstretched; with sound off it is silent and the leak's visual feedback is byte-identical.
- [ ] No gameplay change: the boss's livesCost, gold, the Toll's leak gold, the last-stand and resume are byte-identical with the note on; no new HUD element, readout, board mark or key is added.
- [ ] The note's two falling notes share the arrival horn's (T0268) 62-82 Hz band but descend, so the arrival (rising) and escape (falling) are a heard pair.
