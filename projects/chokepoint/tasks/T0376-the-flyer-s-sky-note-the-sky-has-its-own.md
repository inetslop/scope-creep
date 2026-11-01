---
id: T0376
title: "The Flyer's sky note: the sky has its own quiet sound"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T19:38:40Z
claimed_at: 2026-11-01T19:38:44Z
epic: E10
designer: desktop
---

## Goal
The sky gets its own sound: while any regular Flyer is in the air, one soft sustained tone plays, so the crossing is heard as distinct from the road's thuds.

## Details
- A single soft sustained tone plays for as long as at least one regular (non-boss) Flyer is alive in the sky: it fades in over ~200 ms when the first regular Flyer spawns, and fades out over ~200 ms when the last one dies or leaks.
- The tone is a held sine, quiet — volume 0.03, the beam hum's class (T0112) — and airy: one 660 Hz sine. The closest example is the beam hum's held tone, but here it is one shared tone for all Flyers at once (a refcount over regular Flyers), so it never gets louder as more cross.
- It rides the existing audio system: silent with sound off, in the menu, and whenever no regular Flyer is present.
- The wave-50 boss Flyer is excluded — it keeps its own arrival horn and death notes (T0312/T0302), unchanged.
- No HUD element, no text, no new button; nothing on the pause screen changes (it is ambient, like the beam hum and the beds).

## Acceptance criteria
- [ ] The moment a regular Flyer spawns, a soft sustained tone fades in (~200 ms) and holds until the last regular Flyer dies or leaks, then fades out (~200 ms).
- [ ] With several regular Flyers in the sky at once, the tone stays at its single 0.03 volume (it refcounts, it does not stack).
- [ ] The tone is silent with sound off, in the menu, and while no regular Flyer is present.
- [ ] The wave-50 boss Flyer is untouched (no sky note for it; its arrival horn and death notes are unchanged).
- [ ] No HUD element, text, or gameplay change; the rest of the game is byte-identical.
- [ ] Typecheck, lint, unit tests, and the desktop/mobile smoke pass.
