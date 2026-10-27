---
id: T0109
title: Gutter slap — the sweep announces itself
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T13:34:04Z
designer: desktop
---

## Goal
The moment a gutter band enters the page, a soft paper slap plays — the sweep (T0099) is heard as well as seen, so a player not watching the boundary still knows the ink is coming.

## Details
- One new SFX method in the SFX module (`src/audio/Sfx.ts`; closest examples in the same file: the noise-based hit and level-up sounds from T0003, and the throttled `critHit()` blip from T0019): a short filtered noise burst — about 80 ms, low-passed around 800 Hz, gain about half of the normal hit, fast attack, quick decay. A paper "slap": no new tone, no pitch movement.
- Where it plays: the Gutter system (the one that draws the sweeping band and the red rule; its pure timing lives in `src/core/gutter.ts`) — at the moment the band starts its 4.0 s crossing, i.e. when the band's leading edge crosses into the safe area. That is 1.5 s after the red rule telegraph begins, not at the telegraph's start.
- One slap per sweep entry. Sweeps are 20 s apart, so no throttling is needed; the Gutter is inactive before 14:00, so nothing plays until the first sweep.
- No gameplay change: the Gutter's 40-unit width, 4.0 s crossing, 20 s cadence, 4 damage/s burn and the 1.5 s telegraph are all untouched. No HUD, no input, no new key. The slap obeys the existing mute (M) like all other SFX.

## Acceptance criteria
- [ ] The moment a gutter band starts its crossing (1.5 s after the red rule telegraph begins), one soft paper slap plays — audible under the music, clearly quieter than a normal hit, with no new tone.
- [ ] No slap while the Gutter is inactive (before 14:00) or during the 20 s between sweeps, and no second slap during a band's 4.0 s crossing.
- [ ] The Gutter's width, crossing time, cadence, burn and telegraph are unchanged, and no HUD element, input or key is added.
- [ ] `npm run check` and `npm run smoke` pass.
