---
id: T0115
title: Tempo change — the score reads your build
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T14:14:52Z
claimed_at: 2026-10-27T14:36:21Z
designer: cachyos-x8664
---

## Goal
A run that keeps levelling up gets audibly faster: every upgrade you pick nudges the generative score +2 BPM, so your build is heard in the music, not just seen. This is the first time the score responds to what you do rather than only to the clock.

## Details
- The run tempo (no boss alive) becomes the existing base curve plus a build nudge: `effectiveTempo(t) = min(120, baseCurve(t) + 2 × picks)`.
- `baseCurve(t)` is the tempo curve that already ships (T0011, pinned by T0095): 80 BPM at 0:00, rising to 120 BPM at 10:00, clamped at 120 BPM after. It is unchanged by this task.
- `picks` = the number of upgrade cards the player has picked this run. Each confirmed level-up pick counts one — including re-picking a card you already own for another level, and including weapon cards (Line, Orbit, Arc, Counterpoint). The moment that counts is the same moment the level-up pulse fires (T0102) and the Index updates (T0104).
- The nudge is capped at the 120 BPM clamp (the top of the base curve) — it only lets a fast-building run get ahead of the natural ramp, never past 120. A run that levels quickly reaches 120 BPM well before the 10:00 ramp would, so a busy build feels like the score is rushing.
- The change is a plain retarget: a +2 BPM step is inaudible as a jump, so the next beats simply use the new tempo — no special glide, no hard cut, no new sound.
- Boss composition (T0108): while a boss is alive the 64 BPM dissonant hold still takes priority and the nudge is suspended for the duration; on the boss's death the tempo glides back to the *effective* run tempo at that moment (base curve + the current nudge), not just the bare curve. The boss warning (T0070), sting (T0058) and nameplate (T0064) are untouched.
- Do NOT edit `BossSystem.ts` — asus is on it for the Palette boss (T0097). Keep the pick-count plumbing on the music side (`src/core/music.ts` + `src/audio/Music.ts` + the pick moment), so this task never touches a file asus is editing.
- The existing `bpmForTime` pins (T0011, T0095) and the existing boss-tempo pins (T0108) must keep passing untouched; the build nudge is an additive pure function.
- Music only: no new HUD, no new input, no new SFX, no new scene, no content file. The score obeys the existing mute (M) exactly like everything else in it.

## Acceptance criteria
- [ ] With no boss and 0 picks the tempo equals the base curve exactly — the existing pins still pass (80 BPM at 0:00, 120 at 10:00, 120 at 15:00).
- [ ] A new pure tempo function is locked by unit tests in `tests/core/music.test.ts`: at base 80 (t=0) → 80 / 100 / 120 / 120 for 0 / 10 / 20 / 30 picks; at base 100 (t=300) → 110 / 120 for 5 / 10 picks; at base 120 (t=600) → 120 for any pick count.
- [ ] Picking a card mid-run raises the tempo by 2 BPM with no audible jump or new sound; after several picks the score at the same clock time is clearly faster than a run with no picks.
- [ ] While a boss is alive the tempo holds at 64 BPM regardless of picks (T0108 unchanged); on boss death it glides back to the effective run tempo (base + current nudge), not the bare curve — a pin shows the return target is the nudged value.
- [ ] No edit to `BossSystem.ts`; no HUD, input, SFX, scene or content changes; the existing `bpmForTime` and boss-tempo pins still pass.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.
