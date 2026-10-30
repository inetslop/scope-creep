---
id: T0284
title: "The boss's phase gets its note: a quiet tone when it goes out of reach"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T12:12:05Z
claimed_at: 2026-10-30T12:34:08Z
epic: E5
designer: yoga
---

## Goal
The Colossus's out-of-reach beat (T0253) is seen — a white flash, the dimmed boss bar (T0256) — but the 2.5 s of wasted damage is silent. Give that dead beat a quiet note so the phase the player has to plan around is heard where it is already seen, the way the boss's arrival (T0268) and escape (T0269) already are.

## Details
- The moment the run's out-of-reach boss (today the Colossus, T0253) flashes white and goes out of reach — the start of its untargetable beat, which repeats every 8 s while it is at or below half health — one short muted note plays. It matters now: that phase is already live on wave 10.
- The note: a single 120 ms sine falling 220→180 Hz, volume 0.08 — the quiet single-note class (T0091's last-stand sting reduced to one note, one notch lower and a touch softer). One note per beat; the 2.5 s untargetable window does not repeat it.
- The return to targetable stays silent — no note when the boss comes back in reach.
- At 2× fast-forward (T0019) it plays once per beat, exactly like the arrival horn and the escape note.
- A new small enemy-hook file in `src/systems/enemyHooks/` on the bossArrival hook's pattern (T0268 — the hook that plays the boss's horn when it spawns), plus one new one-note method next to `Sfx.bossHorn()` in `src/audio/Sfx.ts` (the single-note shape is T0091's `Sfx.sting()`). Silent where the sound toggle (T0035) is off.
- No HUD element, no board mark, no text: the flash and the dimmed boss card already show the phase; this only adds the sound. The boss card (T0256) is untouched.

## Acceptance criteria
- [ ] When the Colossus flashes white and goes out of reach, one short muted note (120 ms sine 220→180 Hz, vol 0.08) plays; it plays again on the next beat; the return to targetable plays nothing.
- [ ] With the sound toggle off, no note plays, and the white flash and the dimmed boss bar are unchanged.
- [ ] No HUD element, board mark or text was added; the boss card and its dimmed bar are untouched.
- [ ] `npm run check` passes, and the desktop (1280x720) and mobile (412x915) smoke tests pass.
