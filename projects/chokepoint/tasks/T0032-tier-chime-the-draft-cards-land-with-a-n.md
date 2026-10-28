---
id: T0032
title: "Tier chime: the draft cards land with a note per tier"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T07:16:57Z
epic: E4
---

## Goal
The draft reveal already says the tier with the eye (frame, gems, tier word, the Epic's held flip); let it say the tier with the ear: each offered card plays a short chime as it lands face-up, higher and longer the higher the tier, so an Epic reveal lands as a small hit and a first-time player learns the tier order without reading.

## Details
- Where: the existing draft reveal flip (T0024) — at the moment each of the three offered cards lands face-up, that card plays its chime. The three chimes play in flip order with the existing stagger; the Epic card's chime lands a beat later with its held flip.
- Notes by tier (sine, 80 ms per note):
  - Common: one note — C5 (523 Hz).
  - Rare: two notes — C5 (523), then E5 (659).
  - Epic: three notes — C5 (523), E5 (659), G5 (784).
- Volume: the same soft class as the existing UI blips — never louder than the hit blip. Closest example: `src/audio/Sfx.ts` — add one new method next to `kill()` (the hit blip) and schedule the notes with the existing `tone()`; second closest example for quietness: the leak-warning tick (T0014). Three cards in a row must still sound like a calm reveal, not a fanfare: no extra hits, no swells.
- Files: `src/audio/Sfx.ts` (one new method) and the draft scene that plays the reveal flip (T0024 — confirm the file name when you start). No other files.
- No new input, no new HUD element, no change to the flip animation, its stagger, the Epic's held flip, or the card's look.

## Acceptance criteria
- [ ] In a build phase, opening the draft: each of the three offered cards plays a short chime as it lands face-up, in flip order (the Epic's chime lands a beat later with its held flip).
- [ ] The tiers sound different and ordered: Common is one low note, Rare is two notes with a higher top note, Epic is three notes with the highest top note — a player hears which card is the Epic.
- [ ] The chime is never louder than the other UI blips; three cards revealing in a row still sounds calm.
- [ ] The flip animation, its stagger, the Epic hold and the cards' look are unchanged; no new key, button or HUD element.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — add `import type { Tier } from '../content/types';` (first import, after the doc comment) and one new method `tierChime()` immediately after `kill()`
- edit `src/scenes/DraftScene.ts` — add `getSfx` to the existing `./keys` import; one line inside the flip tween's `onYoyo` callback

### Interfaces
```ts
// src/audio/Sfx.ts, inserted right after kill() (src/audio/Sfx.ts:59-61)
/** The tier chime as a draft card lands face-up: one note per tier step, the top note rising. */
tierChime(tier: Tier): void {
  const notes = tier === 'epic' ? [523, 659, 784] : tier === 'rare' ? [523, 659] : [523];
  notes.forEach((f, n) => window.setTimeout(() => this.tone(f, 0.08, 'sine', 0.1), n * 80));
}
```
DraftScene flip tween (`onYoyo` at src/scenes/DraftScene.ts:105), becomes:
```ts
onYoyo: () => { back.setVisible(false); button.content.setVisible(true); frame?.setVisible(true); getSfx(this)?.tierChime(copy.tier); },
```

### Steps
1. `src/audio/Sfx.ts`: add the type import; insert `tierChime()` after the `kill()` method. Notes are 80 ms sines staggered 80 ms apart (no overlap, no slide); volume 0.1 — the leakWarn class (T0014), never above `kill()`'s 0.18.
2. `src/scenes/DraftScene.ts`: extend `import { getGameScene, onKey, onResize, SCENES } from './keys';` with `getSfx`; append `getSfx(this)?.tierChime(copy.tier);` to the existing `onYoyo` one-liner (it already closes over `copy: AugmentCopy`, whose `.tier` is the `Tier`).

### Pitfalls
- Play the chime in `onYoyo` (the face-up side appears, back hides) — that is the "lands face-up" moment. Do not use `onComplete`, and do not touch `delay: 100 + i * 60` or `leg`: the stagger already plays the three chimes in flip order and the Epic's longer `leg` (350 vs 200) is what makes its chime land a beat later with its held flip.
- Read `copy.tier`, not the augment def `b` (its `tier?` is a restriction, not this copy's tier).
- Scheduling via `window.setTimeout` is fine: `tone()` no-ops when muted or audio locked, so pending notes after the scene stops are harmless.
- T0009 adds its own method to `src/audio/Sfx.ts`; keep the edit to exactly these two insertions, no reformatting, so the merge is clean.
### Tests
none
