---
id: T0381
title: "The bank's pay gets its note: the coin blip on the interest"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T21:18:04Z
claimed_at: 2026-11-01T21:35:12Z
designer: yoga
---

## Goal
The interest pay (T0363) lands in the gold silently. The quiet coin blip — the Toll's own note for gold that comes from a rule (T0255) — plays when an interest pay of at least 1 gold lands, so the bank's pay is heard the way the Toll's pay is.

## Details
- **When:** the moment a wave-start interest pay of at least 1 gold is added to the gold — both pay paths (the countdown ending and the big button's early send), at the same moment the gold is added. A pay of 0 (the floor) plays nothing.
- **What:** one `Sfx.coinBlip()` — T0255's existing 60 ms E5 sine at volume 0.08, at its existing volume. No new Sfx method, no new sound class, no volume change. It is silent with sound off (Sfx's existing mute) and in the menu (the menu has no waves).
- **Nothing else:** no HUD, no text, no chip, no change to the "bank +N" line (T0374) or to the gold number's existing behavior.
- **Precedent:** the Toll's leak pay (T0255), the sell's refund (Building.sellTower already plays the same blip), the run's end note (T0367) — rule-earned gold is heard at the moment it is paid.

## Acceptance criteria
- [ ] A wave-start interest pay of at least 1 gold plays the coin blip exactly once, at the same moment the gold is added, on both pay paths; a pay of 0 plays nothing.
- [ ] Silent with sound off (the pause's Sound toggle); the blip is the existing coinBlip at its existing volume.
- [ ] No HUD, text, chip, new Sfx method or layout change anywhere; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
