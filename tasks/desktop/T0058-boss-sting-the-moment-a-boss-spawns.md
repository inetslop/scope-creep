---
id: T0058
title: Boss sting — the moment a boss spawns
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
claimed_at: 2026-10-27T02:35:21Z
designer: desktop
---

## Goal
Every boss spawn — The Frame at 5:00, The Grid from 10:00, and every respawn — is announced by one deep bass hit plus a swell in the generative music, so the player hears the danger the instant it arrives instead of just noticing a health bar.

## Details
- New SFX, e.g. `Sfx.bossSting()`: a deep sub-bass thump — sine at about 55 Hz with a fast ~30 ms attack and an exponential decay to silence over ~450 ms, plus a second low tone at about 82 Hz at a quarter of the gain for a dark, slightly dissonant color. Build it from the existing Sfx oscillator/gain-envelope primitives (same style as the other SFX), with its own throttle (`lastBossStingAt`, minimum gap 1000 ms) so it can never overlap itself.
- Music swell: a new method on the Music class (e.g. `swell()`) that raises the music's master gain to 1.6× its normal level over 0.4 s, holds ~0.3 s, then eases back to 1.0× over 2 s. If a second swell is requested mid-swell, it extends the hold rather than stacking gains.
- Trigger: exactly once per boss spawn — when the boss entity actually appears on the page (both The Frame and The Grid, including later respawns at higher HP), not when it is scheduled. The sting and the swell start on the same frame.
- Elite enemies and regular enemies never trigger the sting or the swell. No HUD text, no new art — this is an audio-only moment.

## Acceptance criteria
- [ ] The Frame's spawn at 5:00 plays one deep (~55 Hz) sting and the background music audibly swells, settling back to normal within ~3 s.
- [ ] The Grid's spawn and every later boss respawn (Frame or Grid) get the identical sting + swell.
- [ ] Elite or regular enemy spawns never play the sting or swell the music.
- [ ] Two boss spawns within 1 s produce one sting, not two overlapping ones.
- [ ] `npm run check` and `npm run smoke` pass.
