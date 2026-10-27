---
id: T0065
title: Crescendo — the streak turns your fire rate up
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T03:07:33Z
claimed_at: 2026-10-27T03:33:56Z
designer: desktop
---

## Goal
A kill streak stops being decorative: while the streak is 8 or higher, fire rate is +10% and the HUD streak tally turns red. Streaks become a real weapon, rewarding the exact play the "RHYTHM" flash already celebrates.

## Details
- While the run kill streak (T0014, tracked on RunState and locked by the T0057 tests) is 8 or higher, the player's fire rate is multiplied by 1.10. Apply it wherever the fire-rate stat already applies (Point, Line, Arc, and any future firing weapon) — the streak bonus is a temporary multiplier on top of that stat, not a new stat.
- The bonus drops the instant the streak falls below 8 (taking any damage resets the streak to 0, per the T0057-locked rules).
- Stacks multiplicatively with all fire-rate upgrades (Rhythm, Tempo, Allegro, Staccato, Pressure, Ostinato, Glissando, Trill, Pulse): at max Rhythm with streak ≥ 8, fire rate = Rhythm-modified rate × 1.10.
- HUD: while the streak is 8 or higher, the existing kill-streak tally changes from ink to red; it returns to ink when the streak drops below 8. The tally number itself is unchanged.
- No new SFX and no new flash — the existing "RHYTHM" flash at 8 stays exactly as it is.
- If the effective fire-rate multiplier is not already mirrored in the debug hook stats, expose it (same pattern as the T0054 debug stats) so the smoke test can confirm the ×1.10 while active and ×1.0 when the streak is below 8.
- Note: T0054 (score, on desktop-4070) is concurrently editing the HUD and debug hook files — re-read them right before editing and keep both features intact.

## Acceptance criteria
- [ ] After 8 consecutive kills without being hit, volleys fire 10% faster than they did at streak 7 (visible on Point: ~10% shorter time between shots).
- [ ] Taking one hit while streaked immediately returns fire rate to the sub-8 rate.
- [ ] The HUD kill-streak tally is red while the streak is 8 or higher and ink below 8.
- [ ] The bonus multiplies with fire-rate upgrades (e.g. Rhythm maxed: streak ≥ 8 rate = 1.10 × the Rhythm-modified rate, not a flat add).
- [ ] `npm run check` and `npm run smoke` pass.
