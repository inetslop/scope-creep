---
id: T0255
title: "The leak pays its Toll: one quiet coin blip at the exit"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T04:48:47Z
claimed_at: 2026-10-30T04:57:21Z
epic: E4
designer: yoga
---

## Goal
Toll — the first augment whose income comes from losing (T0234) — gets its own note: the moment a leak pays its gold, one small muted coin blip plays at the exit, so the payout on the loss is heard where the gold pop already shows it.

## Details
- One 60 ms sine at the coin chime's low note (E5, T0009), volume 0.08 (just under the tier chime's quiet class, T0032). A new one-note method in the Sfx module (`src/audio/Sfx.ts`) next to the coin chime.
- Played once per leak that pays — from the same code path that pays the Toll gold (T0234's rule in `src/core/toll.ts` and its call in the leak flow), so the blip and the gold pop at the exit are one event. A leak with three Toll towers pays the summed gold (T0234) but plays one blip; a leak with no Toll tower on the board plays none.
- A Hauler's own leak cost (a life plus 5 gold, T0057) plays exactly as today; the blip marks only the Toll's payment on top of it.
- Silent when sound is off (T0035). Procedural, no sound file. No new HUD or board mark: the gold pop already says the amount.

## Acceptance criteria
- [ ] A leak that pays Toll gold (at least one Toll tower standing) plays one 60 ms blip (volume 0.08) at the exit, together with T0234's gold pop.
- [ ] A leak with no Toll tower on the board plays no blip (and no gold pop, as today).
- [ ] Two or more Toll towers: still one blip per leak, and the gold pop pays the summed amount as today (T0234).
- [ ] A Hauler's leak plays its own cost as today; the blip plays only when a Toll also stands.
- [ ] With sound off (T0035) the gold pop still shows and the blip is silent.
