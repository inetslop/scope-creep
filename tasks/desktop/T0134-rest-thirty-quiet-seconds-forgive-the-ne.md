---
id: T0134
title: Rest — thirty quiet seconds forgive the next hit
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
claimed_at: 2026-10-27T18:34:56Z
designer: desktop
---

## Goal
Survival should have a rhythm: after 30 seconds without taking damage, the next discrete hit you take is free — the late page learns that peace is a weapon, and banking a quiet moment against a boss bullet or a swarm dive becomes a real decision.

## Details
- The rule: from run start, and after any damage taken (enemy contact, an enemy bullet, or a continuous burn — the Gutter (T0099), the Crop (T0045), The Press's 8/s), 30 seconds without taking any damage puts you at Rest. While at Rest, the next discrete damage instance — enemy contact or an enemy bullet, from any enemy, elite or boss — is fully negated: 0 damage, no kill-streak reset (T0014), no platemark (T0094), no hurt sound; instead the existing low blip (T0101) plays, a small flat ink ring pops at the player's position, and the HUD label pops.
- The 30-second count restarts from the moment of the negated hit — one free hit per 30 seconds of peace, never two in a row.
- Continuous burns are never negated; they only restart the count (standing in the Gutter can never put you at Rest).
- Multiple discrete hits in the same frame: only the first is negated, the rest apply normally.
- HUD: a small-caps "REST" label in the HUD, in the same idiom and position as the "RHYTHM" flash (T0014), ink at ~70% alpha, laid out for 412×915 and 1280×720 like the rest of the HUD. It appears the moment the 30 seconds are up, holds while covered, pops (1.2× → 1.0× over 150 ms) the moment the hit is negated, and disappears the moment the count restarts.
- The rule is a small pure state (time-since-damage, covered, negate-next) with unit tests in the crop/still-life pattern: not covered at 29.9 s, covered at 30.0 s; any damage at any point restarts the count; a negated hit restarts the count exactly (not covered again until 30.0 s after the negation).
- No new key, no new SFX (the blip is reused), no new scene.

## Acceptance criteria
- [ ] A run that takes no damage prints "REST" in the HUD at exactly 0:30; the first hit after that deals 0 damage — no HP loss, no streak reset, no platemark — the label pops, the low blip plays, and the label is gone again until 30 s of peace have passed.
- [ ] Any damage (contact, bullet, or standing in a Gutter/Crop burn) restarts the 30 s count and hides the label until it completes again; burns are never negated.
- [ ] A second discrete hit landing in the same frame as a negated hit applies normally.
- [ ] While not at Rest, every hit behaves byte-identically to before (damage, streak, platemark, hurt sound); no new key, sound or scene.
