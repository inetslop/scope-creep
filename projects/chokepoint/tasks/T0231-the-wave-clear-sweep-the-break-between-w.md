---
id: T0231
title: "The wave-clear sweep: the break between wave and draft, heard"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T21:12:14Z
---

## Goal
The phase change from wave to draft is seen (the beat, the flipping cards) but never heard. One soft two-note rising sweep in the beat between a wave ending and the draft opening makes the break audible — the phase-change sound E3's level changes and E5's boss intro will lean on.

## Details
- A new `Sfx.waveClear()` in `src/audio/Sfx.ts`: two sine notes, 80 ms each, rising a major third E5→G5 (the coin chime's own interval, T0009) at volume 0.1 — the tier chime's quiet class (T0032/T0091), under the payout chime's 0.18 because the draft's own tier chime follows moments later. Sequenced the way T0091's sting sequences its two notes (tone's delay param).
- It plays once at the moment a wave ends: where the run holds a beat before the draft opens (the clean beat, T0005/T0205), the sweep starts with the beat; where it does not, at the wave's end.
- It plays on every wave end that opens a draft — clean, held, quiet, tight: it marks the phase change, not the result.
- It never plays when the run ends instead of a draft (game over), before wave 1, or on a resumed run entering its build phase (a resume is not a wave end).
- Silent with sound off (T0035). No new HUD, no new input, no change to any existing sound: the draft's flip chime (T0032), the countdown tick (T0090) and the last-stand sting (T0091) are untouched.
- Closest examples: `Sfx.sting()` (T0091) and `Sfx.tierChime()` (T0032) in `src/audio/Sfx.ts` — sequenced sine notes at the quiet UI volume.

## Acceptance criteria
- [ ] Every wave end that opens a draft (any wave kind) plays one soft E5→G5 two-note sweep (80 ms per note, volume 0.1) at the start of the pre-draft beat, or the wave's end — before the draft cards flip; the flip's tier chime (T0032) is unchanged and the two are heard in sequence without overlap.
- [ ] No sweep when the run ends instead of a draft, before wave 1, or on a resumed run's build phase.
- [ ] With sound off (T0035) nothing plays; with sound on, no other sound changes (countdown tick, sting, tier chime, kill and leak sounds all untouched).
- [ ] No new on-screen element, no new input; `src/audio/Sfx.ts` gains exactly one method and one call site (the design names both).
