---
id: T0311
title: The record pass gets its note (the T0308 re-file)
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T23:07:23Z
claimed_at: 2026-10-30T23:34:11Z
---

## Goal
The run's one proud moment — the record star popping on the wave card (T0296) — is heard as well as seen, so a first-time player notices a record without reading.

## Details
- The moment the wave card's record star pops (the run reaching the saved best wave), one quiet two-note rise plays: E5→G5 sines, 80 ms each, 90 ms apart, volume 0.08 — the streak note's own shape (T0290) at the tier-chime's quiet class (T0032).
- Once per run, under the star's own guard: an Iron run's muted star plays the same note. A resumed run that re-shows the star without the live pop plays nothing.
- Silent with sound off (the pause toggle). The star's timing and look, the wave card and the pause record star (T0069) are otherwise untouched.

## Acceptance criteria
- [ ] In a fresh run that reaches the saved best wave, the two-note rise plays exactly once, at the moment the record star pops on the wave card.
- [ ] No further note plays for the rest of the run, and an Iron run's muted star plays the same note.
- [ ] Resuming a run at or above the saved best wave re-shows the star silently.
- [ ] With sound off the note never plays, and nothing else in the wave card changes.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - rewrite `recordNote()` (line 202): change the two `tone` calls and the doc comment. Nothing else in the file.

### Interfaces
No type or signature changes: `recordNote(): void` keeps its exact signature. Only the body changes, from:
```ts
  /** The run's wave number becomes its saved best: the wave sweep's rise, G5 then B5, 80 ms sines 90 ms apart, the sting's quiet volume. */
  recordNote(): void {
    this.tone(784, 0.08, 'sine', 0.1);
    this.tone(988, 0.08, 'sine', 0.1, undefined, 0.09);
  }
```
to:
```ts
  /** The run's wave number becomes its saved best: the streak note's rise, E5 then G5, 80 ms sine each, 90 ms apart, volume 0.08. */
  recordNote(): void {
    this.tone(659, 0.08, 'sine', 0.08);
    this.tone(784, 0.08, 'sine', 0.08, undefined, 0.09);
  }
```
(659 = E5, 784 = G5 — the same numbers `streakPay()` at line 208-211 uses; delay 0.09 is the 90 ms apart.)

### Steps
1. In `src/audio/Sfx.ts`, replace exactly those 5 lines (comment + body) of `recordNote()`. Leave `streakPay()`, `waveSweep()`, `comboChime()` and every other method byte-identical.
2. Verify: `npm run check`.

No other file changes. The play site is already correct and must not be touched: `WaveCard.record()` (`src/ui/hud/WaveCard.ts:57-68`) calls `getSfx(game)?.recordNote()` exactly once per run (the `recordAt` guard sets it to -1 after firing), plays the same note for an Iron run's muted star (mode only picks the star texture), plays nothing on a resumed run at/above best (`recordAt` computes to -1, so the star is only re-shown statically by `PauseScene`), and `Sfx.tone()` returns early while muted, so the pause sound-off toggle silences it.

### Pitfalls
- E5 is 659 and G5 is 784 — do not transpose or "correct" the numbers; `streakPay()` is the shape to copy.
- Volume is 0.08 (the tier-chime's quiet class minus), not the 0.1 of the current body; the delay argument stays `0.09`.
- Do not touch `WaveCard.ts`, `PauseScene.ts`, or any star texture/timing — the acceptance bar is only the note.
- This is a juice change: no unit test, no invariant.

### Tests
none
