---
id: T0308
title: "The record pass gets its note: a quiet rise when the star pops"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T21:22:19Z
claimed_at: 2026-10-30T21:47:59Z
designer: desktop
---

## Goal
Reaching the saved best wave — the wave card's record star (T0296) — is a personal-best moment that is seen but never heard; give it one quiet note.

## Details
- A new `Sfx.recordPass()` in `src/audio/Sfx.ts` (beside T0302's `bossDown()` and T0255's `coinBlip()`): the game's rising pair, E5 then G5, 80 ms sines 90 ms apart, at volume 0.08 — the coin blip's quiet class, a touch below the wave sweep's 0.1.
- Wired exactly where T0296's star pops on the wave card: the note plays at the same moment, under the star's own once-per-run guard — where the star appears the note plays, where the star is silent (waves below the best, and after it has appeared) the note is silent. An Iron run's muted star wears the same note.
- Silent with sound off, like every other Sfx. No visual change: the star already says it.

## Acceptance criteria
- [ ] A run that reaches its saved best wave hears a soft two-note rise (E5→G5, volume 0.08) at the moment the record star pops on the wave card — once.
- [ ] No later wave of the same run plays it, and waves below the saved best play nothing.
- [ ] In an Iron run, the muted star's moment plays the same note.
- [ ] With the pause menu's sound off, the star pops silently.
