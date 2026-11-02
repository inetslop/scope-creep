---
id: T0390
title: "The sell's note: the coin blip at the refund (the T0378 re-file)"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T23:40:10Z
claimed_at: 2026-11-02T00:00:31Z
designer: desktop-4070
---

## Goal
The refund is heard where it happens: selling — the reverse of building, and the action the tower branch's nodes just made richer — gets the same quiet coin note the Toll's leak pays.

## Details
- The existing quiet coin blip (Sfx.coinBlip, T0255: one 60 ms E5 sine at volume 0.08) plays exactly once when a tower sells, at the same moment as the sell's gold pop. No new sound method, no change to the blip's pitch, length or volume.
- The blip is tied to the sell's commit: building, a kill and a Toll leak keep their own notes; nothing plays a second blip.
- Silent with sound off, through Sfx's own guard; no HUD, card or price change — the sell's refund, Soft sell's 80% and the panel line are untouched.

## Acceptance criteria
- [ ] Selling a tower plays Sfx.coinBlip once, at the same moment as the gold pop; no other sound joins the sell.
- [ ] A build, an augment commit, a kill and a Toll leak play no extra blip (the Toll's own unchanged).
- [ ] With sound off the sell is silent; no screen, card or price change anywhere.
