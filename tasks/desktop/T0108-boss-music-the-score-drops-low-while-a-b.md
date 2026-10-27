---
id: T0108
title: Boss music — the score drops low while a boss is alive
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T13:28:38Z
designer: desktop
---

## Goal
While a boss is alive, the generative score drops from the run tempo into a slow 64 BPM low pulse with a dissonant second voice — you hear the fight begin and end without looking up. The boss's tempo becomes the page's heartbeat.

## Details
- Applies to any boss — The Frame, The Grid, and The Palette (T0097, on asus) alike — keyed to the same boss-alive state the boss bar and the boss sting (T0058) already use.
- While a boss is alive: the score's tempo holds at 64 BPM regardless of the run tempo curve (80→120 BPM). The existing low pulse continues, and a second voice plays a tone one semitone (half step) above the pulse on alternating beats — a dissonant pair built from the existing voices/oscillators; no new instrument, no new sound file.
- At the moment the boss spawn event fires (the same moment the T0058 sting plays), the tempo glides from the run's current tempo down to 64 BPM over 1.5 s, and the dissonant second voice enters once the 64 BPM hold begins.
- At the moment the boss dies (the same death moment the heavy-death screen shake, T0040, already uses), the dissonant second voice stops and the tempo glides from 64 BPM back to the run tempo curve's value at that moment over 1.5 s.
- If a new boss spawn event fires while a return glide is in progress, the glide re-targets to 64 BPM (rare — bosses are 5 minutes apart).
- The boss warning (T0070), the boss sting (T0058) and its music swell are unchanged. The score obeys the existing mute (M) exactly like everything else in it.
- Keep the boss-tempo logic (64 BPM hold, 1.5 s glide on both edges, return to the curve value) in the pure music module (`src/core/music.ts`) and unit-test it in the existing `tests/core/music.test.ts` in the same style as the `bpmForTime` pins: 64 while a boss is alive, glide values mid-transition, and the run curve value on return.
- Music only: no SFX changes, no HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] While any boss is alive (after the 1.5 s spawn glide), the music plays at 64 BPM — clearly slower than the run tempo at that point in the run — with a dissonant second tone a semitone above the pulse on alternating beats.
- [ ] At the boss spawn event the tempo glides down over 1.5 s (the T0058 sting and its swell still play as before); at the boss's death the second voice stops and the tempo glides back to the run tempo curve value over 1.5 s.
- [ ] With no boss alive, the score plays the run tempo curve exactly as today — no 64 BPM residue after the return glide.
- [ ] The boss tempo logic is locked by unit tests in `tests/core/music.test.ts` (64 BPM hold, 1.5 s glides on both edges, return to the curve value).
- [ ] Mute (M) silences the boss score like all other audio; no SFX, HUD, input or scene changes.
- [ ] `npm run check` and `npm run smoke` pass.
