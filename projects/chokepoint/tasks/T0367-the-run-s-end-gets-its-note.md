---
id: T0367
title: "The run's end gets its note"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T16:45:37Z
claimed_at: 2026-11-01T17:05:58Z
designer: inet-racing
---

## Goal
The end of a run is heard before it is read: the moment the game-over card lands, one quiet two-note fall plays, so the last life's leak lands as an ending, not as another leak with a score card behind it.

## Details
- Today the run's end is silent after the leak: the existing leak feedback plays (the low thud, the camera jolt, the leak echo), then the game-over card lands with no note of its own — the only sound on the card is the coin chime (T0009), and only from wave 10 on (T0325).
- The moment the game-over card lands, play one soft two-note falling sting, once per run end, on whichever path ended the run (the last leak, or the pause's "End the run?" of T0325).
- The note: a new `Sfx.runEnd()` method in `src/audio/Sfx.ts`, placed next to `sting()` (T0091) — two 80 ms sine notes, 123.47 Hz then 98 Hz (B2→G2: the boss's death horn's own two low notes, T0302, falling instead of rising), 90 ms apart, volume 0.1 (the sting's quiet class), sequenced through `tone()`'s existing delay parameter (the T0290/T0302 pattern).
- The call: one line in the game-over scene (`src/scenes/GameOverScene.ts`), at the card's landing, before the count-up starts. Closest examples: T0290 (a new Sfx method plus one call at the moment) and T0315 (a note on a UI beat).
- It plays on top of the existing leak feedback, never replacing it: the thud, the jolt and the echo are unchanged. If a boss leak ends the run, the boss-leak horn (T0269) plays at the leak and the sting lands with the card ~1 s later — a sequence, not a mix.
- The coin chime (T0009) and the card's count-up, pop and lines (score, coins, by-tower rows, the Flawless mark) are untouched.
- It respects the pause's sound on/off toggle like every other note; it never plays in the menu, in the menu demo, or in any phase before the run ends.
- Nothing on screen changes: no HUD element, no button, no text, no mark.

## Acceptance criteria
- [ ] When the game-over card lands, the B2→G2 sting (two 80 ms sine notes, 90 ms apart, volume 0.1) plays once; it plays on the death path and on the pause's quit path, and never again while the card stays up.
- [ ] With sound off (pause) the note is silent; with sound on it is quieter than the leak thud and the boss horn (volume 0.1, the sting's class).
- [ ] The leak's feedback (thud, jolt, echo), the boss-leak horn (T0269) and the coin chime (T0009) are all unchanged; on a boss-leak death the horn plays at the leak and the sting lands with the card.
- [ ] The game-over card's count-up, pop, score, coins, by-tower rows and the Flawless mark are byte-identical; the screen shows nothing new.
- [ ] No other scene or phase plays the note: the menu, the menu demo, the draft, the build and the wave phases are byte-identical in sound.
