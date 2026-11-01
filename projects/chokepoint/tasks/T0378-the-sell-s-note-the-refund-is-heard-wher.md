---
id: T0378
title: "The sell's note: the refund is heard where it happens"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T20:21:14Z
claimed_at: 2026-11-01T20:21:20Z
designer: yoga
---

## Goal
Selling a tower is heard where it happens: the moment a tower sells, the quiet coin blip plays with its gold pop — the refund lands in the ear at the same moment it lands on the board.

## Details
- The moment a tower sells — the same point where T0274's sell gold pop and coin trail to the stats card are currently fired (the handler that pays the refund, not the panel's tap line) — play `Sfx.coinBlip()` exactly once, at its existing volume.
- The closest example is the Toll's leak blip (T0255): `Sfx.coinBlip()` — one 60 ms E5 sine at volume 0.08, already in `src/audio/Sfx.ts` next to the coin chime — played from the system side at the payout moment. Reuse it; do not add a new Sfx method and do not change its volume.
- One blip per successful sell (sells only exist in the build phase, as today), none on a failed or absent sell. Silent with sound off — `coinBlip` is an Sfx method, so the muted path already handles it.
- No HUD element, no text, no panel change: the sell line (T0274), the sell price, the gold pop and the coin trail are all untouched.

## Acceptance criteria
- [ ] Selling a tower plays one quiet coin blip at the same moment as its gold pop; a second sell plays it again; no sell, no blip.
- [ ] The blip is the existing `Sfx.coinBlip` at its existing volume — no new Sfx method, no volume or timing change anywhere else.
- [ ] Silent with sound off; the sell line, the sell price, the gold pop and the coin trail are byte-identical; nothing new on screen.
- [ ] Typecheck, lint, unit tests and the desktop/mobile smoke pass.
