---
id: T0420
title: "The game over's bed: a quiet beat under the game-over card"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T11:17:53Z
---

## Goal
The run's audio beds cover the wave, the build, the draft, the menu and the claim — the game-over card, the last screen a run ends on, is still after its one run-end note (T0367). A quiet beat under it makes the end of the run a resting place like every other: the run's coda, heard.

## Details
- One quiet generative bed, the sixth of the run's: the menu bed's own three notes (E2, B2, E3) as a sine loop at 1.8 s steps with a rest in the beat — the claim bed's own shape (T0408) slowed past the menu bed's 1.6, the calmest of the beds; the beds' shared 0.02 volume and 0.6 s fades.
- It starts on the game-over card's land — the run-end note (T0367) plays on top of the fade-in, unchanged — and keeps playing while the card is shown, Iron or not (no mode form, like the claim bed).
- Leaving the card (to the claim, or to the menu) fades the bed out over ~300 ms into the next scene's own bed — the claim bed's own hand-off pattern (T0408): never a hard cut, never two beds at full volume.
- A new audio file on the claim bed's own file shape (the closest example: `src/audio/claimBed.ts`) and one ownership in the game-over scene (the menu bed's pattern, T0397: constructed on the scene's create, stopped when it is left). No change to the card's look, the run-end note, the claim's flow or any other bed.
- Silent with sound off (Sfx's own guard); no new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The moment the game-over card lands, a quiet three-note beat (E2/B2/E3, 1.8 s steps, 0.02 volume) fades in over ~0.6 s and keeps playing while the card is shown; the run-end note still plays on the land, on top of the fade-in
- [ ] Leaving the card fades the beat out over ~300 ms into the next scene's own bed (the claim's or the menu's) — the claim bed's own hand-off (T0408): no hard cut, and never a moment where two beds play at full volume
- [ ] With sound off, nothing plays; the game-over card's look and note, the claim's flow and the menu are byte-identical to before
- [ ] No new key, button, HUD element or board mark; `npm run check` and the desktop + mobile smoke pass
