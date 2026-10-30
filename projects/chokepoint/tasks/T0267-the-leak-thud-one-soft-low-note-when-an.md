---
id: T0267
title: "The leak thud: one soft low note when an enemy gets through"
size: S
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-30T08:00:10Z
claimed_at: 2026-10-30T08:00:54Z
finished_at: 2026-10-30T08:11:47Z
design_attempts: 1
---

## Goal
The run's costliest moment gets a note: the moment an enemy leaks, a soft low thud plays, so a leak is heard as well as seen — the exit already ticked its warning, the board already jolted, the echo already walked back, but the leak itself is silent.

## Details
- One soft low thud: a 120 ms sine at 98 Hz (G2), volume 0.12 — below the hit-blip class (T0009's 0.18), above the coin blip (T0255's 0.08), the sting's quiet shape (T0091) as a single low note. A new `leakThud()` method in the Sfx module (`src/audio/Sfx.ts`), next to `coinBlip()`.
- Played once per leak from a new leak hook in `src/systems/enemyHooks/` (pattern: `comboBreak` (T0207) and `leakEcho` (T0250), registered where they register): it fires at the same moment as the jolt (T0109) and the echo ghost (T0250).
- A Hauler leak (a life plus 5 gold) plays the thud once — its red "−5" pop and the Toll's coin blip (T0255) are unchanged. The leak that brings the run to 1 life plays the thud and the last-stand sting (T0091) together — two different notes, neither replaced. Several leaks in one wave thud once each: the count of thuds is the count of lives lost.
- At 2× fast-forward (T019) the thud plays once, never stretched (WebAudio real time, the T0254 note). Procedural, no sound file. Silent when sound is off (T0035).
- No new HUD, no board mark, no input: the jolt, the echo, the first-leak chip (T0107), the Toll's gold and the last-stand banner all land exactly as they do today — the thud adds a note, not a readout.

## Acceptance criteria
- [ ] The moment an enemy leaks, one 98 Hz thud plays (120 ms sine, volume 0.12), at the same moment as the jolt and the echo ghost.
- [ ] Exactly one thud per leak: a Hauler leak plays it once, and the leak that brings the run to 1 life plays the thud and the sting, both unchanged.
- [ ] At 2× fast-forward (T019) the thud plays once and unstretched; with sound off (T0035) it is silent and the leak's visual feedback is byte-identical.
- [ ] No gameplay change: lives, gold, damage, waves and resume are byte-identical with the sound on.

## Rejected by architect (yoga)

the premise contradicts the code — every leak already plays a prominent low thud (Sfx.leak(), 140→70 Hz sawtooth, 0.3 s, volume 0.25, called at EnemySystem.ts:217 at the jolt), so "the leak itself is silent" is false, and the task never says whether the new 98 Hz thud replaces that sound or stacks under it — as written it would build a double thud (the 0.12 sine masked by the 0.25 sawtooth), so the product owner must decide: re-file as "replace the leak sound with the 98 Hz thud" or drop it.
