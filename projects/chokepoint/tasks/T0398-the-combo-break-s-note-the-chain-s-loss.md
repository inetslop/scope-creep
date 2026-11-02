---
id: T0398
title: "The combo break's note: the chain's loss is heard"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T01:41:53Z
---

## Goal
A leak already costs a life (the thud, the jolt, the echo) — but it also quietly kills the kill-combo chain (T0207 fades the ×N counter, no sound). That second cost — losing the chain's gold progress and the road to the ×10 milestone — is invisible. A soft, distinct note when a real chain is broken turns a hidden loss into a felt one.

## Details
- A new quiet sound in `src/audio/Sfx.ts` (the file is free): `comboBreak()` — a soft two-note **fall** (E4 → C4, ~70 ms sines each, 40 ms apart, volume 0.08). A fall, not a rise: the chain drops. It sits in the quiet class (the coin blip's 0.08, T0255) and plays on top of the leak thud (which stays at its own volume, untouched).
- A new leak hook in a new file `src/systems/enemyHooks/comboBreakNote.ts` (modeled on the existing leak hook `comboBreak.ts`, T0207, and `leakEcho.ts`, T0250): on every leak, read the current kill-combo chain count from FxSystem (the ×N counter, T0031) **while it is still alive** and, only if the chain had **2 or more kills** (a real chain, not a single kill), play `Sfx.comboBreak()`. A leak with no chain (0) or a lone kill (1) plays nothing.
- Register the new hook in `src/systems/enemyHooks/index.ts` **ahead of** the existing visual combo-break hook (T0207), so it reads the count before that hook resets it to zero.
- It is display-adjacent audio only: no new HUD, mark, key, button or card; the pause screen is untouched. Silent when sound is off.

## Acceptance criteria
- [ ] A leak that breaks a live chain of 2+ kills plays the soft two-note fall (E4 → C4, ~70 ms each, 40 ms apart, volume 0.08) on top of the existing leak thud.
- [ ] A leak with no chain, or that breaks only a single-kill chain, plays no new sound.
- [ ] The visual combo break (the ×N counter fading out, T0207) and the leak thud are unchanged; the note is the only addition.
- [ ] Silent when sound is off; the desktop + mobile smoke run passes.
