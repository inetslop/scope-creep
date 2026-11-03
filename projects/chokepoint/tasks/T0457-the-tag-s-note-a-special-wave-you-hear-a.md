---
id: T0457
title: "The tag's note: a special wave you hear at the banner"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T00:51:09Z
claimed_at: 2026-11-03T00:51:46Z
designer: yoga
---

## Goal
A special wave is heard before it happens, on every platform: the march tags already buzz the phone (T0449); now they also play one quiet note, so a desktop player gets the same heads-up at the same moment.

## Details
- The moment: when the wave banner lands (topBanner's slide-in, the same instant T0449's haptic fires) on a wave tagged tight, rush, short cut, double or clumps — the five march tags — one quiet note plays, once per wave.
- Never on a quiet wave (the breather stays silent, the haptic's own rule), never on a plain untagged wave, and never on a boss wave (the boss has its own arrival horn, T0268 — no second voice on top of it).
- The sound: a new `Sfx.tagNote()` next to `comboChime()` in the Sfx module — two 70 ms sine notes, 440 Hz (A4) then 392 Hz (G4), 70 ms apart, volume 0.09 (the near-miss note's quiet class, a step under the wave clear's 0.1). The falling contour is the point: every "good thing happened" note in the run rises (wave clear's C5→E5, the sweep, the chimes), so a small fall reads as "this wave is different", not as a clear, a sting or a pay.
- It respects the pause's Sound toggle exactly like every other note in the run.
- No HUD, no text, no chip: the banner's chip already names the tag; the note only makes the moment audible. On mobile the note and the existing buzz play together (the boss death already pairs a note with its buzz, T0428).

## Acceptance criteria
- [ ] A tight, rush, short cut, double or clumps wave plays the A4→G4 note once, at the banner's moment, on desktop and mobile.
- [ ] A quiet wave, a plain untagged wave and a boss wave play no note.
- [ ] With the pause's Sound toggle off, the note is silent.
- [ ] No new HUD element, chip or text; the banner, its chip and T0449's haptic are unchanged.
