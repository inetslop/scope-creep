---
id: T0101
title: Streak break — the tally shatters when it goes
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T10:32:47Z
---

## Goal
The moment your kill streak resets (you get hit), the HUD streak tally shatters — a small ink burst plus a short low blip — so you can see and hear the Crescendo fire-rate bonus (T0065) go, and why.

## Details
- When the kill streak (T0014) drops from 1 or higher to 0 because the player takes a hit, the streak tally shatters: 4–6 tiny ink specks (2–3 u flat dots, PALETTE.ink, no outline) fly outward from the tally 20–40 u in scattered directions and fade linearly over 400 ms.
- At the same moment one short low blip plays: a single ~150 Hz sine tick, ~80 ms, at a gain lower than the crit sting. Nearest example: `Sfx.critHit()` from T0019, with the same one-shot throttle pattern (`lastCritHitAt`-style) so blips can never stack.
- If the streak was already 0 when the hit lands, nothing plays and nothing scatters — there is nothing to break.
- Pure juice: the streak logic, the Crescendo rule (T0065) and the tally's normal rendering are all unchanged; this only adds a transient burst + sound on the existing reset event. Nearest visual examples: the FxSystem transient effects — the crit ring (T0019) and the floating damage numbers pool (T0004).
- No new HUD element, no input, no scene, no content file. Identical on desktop and mobile.

## Acceptance criteria
- [ ] Taking a hit while the kill streak is 1 or higher scatters 4–6 tiny ink specks from the streak tally (flying 20–40 u, fading over ~400 ms) and plays one short low blip.
- [ ] Taking a hit while the streak is already 0 plays nothing and scatters nothing.
- [ ] Blips never stack — at most one per streak reset.
- [ ] The streak number, the Crescendo fire-rate rule and the tally's normal rendering are unchanged.
- [ ] `npm run check` and `npm run smoke` pass.
