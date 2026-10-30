---
id: T0240
title: "The wave-clear sweep: E5→G5 at the beat before the draft"
assignee: inet-racing
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T23:53:23Z
claimed_at: 2026-10-30T00:21:33Z
finished_at: 2026-10-30T00:31:00Z
---

## Goal
The phase change from wave to draft is heard as well as seen: a soft two-note rising sweep in the beat between a wave ending and its draft opening, so the run's rhythm — build, fight, pick — is felt without a new mark anywhere.

## Details
- A new method in `src/audio/Sfx.ts` — the closest example is `Sfx.tierChime` (T0032: one 80 ms sine per note, the same quiet class): two 80 ms sine notes, E5 then G5 (the coin chime's interval, T0009), the second starting 90 ms after the first, volume 0.1 (the tier chime's volume).
- It plays once, at the moment a wave ends and the run moves to the draft — the same beat the exit's "Clean" chip waits for (T0005). It never plays when the run ends instead: the game over keeps its own coin chime (T0009) and nothing else.
- Silent with the sound off (T0035). No new HUD element, no input; the coin chime, tier chime and every other sound stay byte-identical.

## Acceptance criteria
- [ ] When a wave ends and the draft opens, one soft two-note rise plays: E5 → G5, 80 ms each, sine, 90 ms apart, volume 0.1.
- [ ] It plays exactly once per wave end that opens a draft; it never plays on the run's end (the game over keeps only the coin chime); it is silent with the sound off (T0035).
- [ ] No new HUD element, no input, no change to any existing sound; check and smoke pass on desktop and mobile.

## Design (architect, inet-racing)

### Files
- edit `src/audio/Sfx.ts` — add one method `waveSweep()` next to `waveClear()` (after the method that ends at line 159, before `deny()`).
- edit `src/systems/RunFlow.ts` — add one call to the new method inside `clearWave()`, right after `this.s.sfx?.waveClear();` (line 142).

### Interfaces
Nothing new in types. One new public method on `Sfx`:
```ts
waveSweep(): void
```

### Steps
1. In `src/audio/Sfx.ts`, insert between the `waveClear()` method and the `deny()` method (i.e. after line 159, before line 161):
```ts
  /** A wave clears and the draft opens: a soft two-note rise, E5 then G5, 90 ms apart, the tier-chime's quiet volume. */
  waveSweep(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
  }
```
(659 = E5, 784 = G5 — the same notes `chime()` and `techBuy()` already use; `tone(freq, durSec, type, volume, slideTo?, delaySec?)`, so `undefined, 0.09` = no slide, 90 ms gap. Do not edit any other method.)

2. In `src/systems/RunFlow.ts`, in `clearWave()`, add one line immediately after `this.s.sfx?.waveClear();` (line 142):
```ts
    this.s.sfx?.waveSweep();
```
This is the only place a wave end opens a draft; `endRun()` (run's end) never calls `clearWave()`, so the sweep never plays when the run ends.

### Pitfalls
- Place the method between `waveClear()` and `deny()`, not at the end of the class (other tasks append there).
- The gap is 0.09 s (90 ms), not the 0.08 s that `chime()`/`techBuy()` use — copy the shape of `techBuy()` but keep 0.09.
- Call it only in `clearWave()`, not in `openDraft()` (that would also fire on the run's opening draft) and not in `endRun()` (game over keeps only the coin chime).
- Muting is already handled by `tone()` (`this.muted` check), so the sweep is silent with sound off (T0035) for free.

### Tests
none (audio task; `npm run check` and `npm run smoke` cover it).

## Result (attempt 1, inet-racing)

Added a soft two-note rising sweep — E5 then G5, 80 ms sine each, 90 ms apart, volume 0.1 — as `Sfx.waveSweep()` in `src/audio/Sfx.ts` (placed between `waveClear()` and `deny()`), played once from `RunFlow.clearWave()` at the moment a wave ends and the draft opens. It never plays on the run's end, stays silent when sound is off, and changes no other sound, HUD element or input. Check and smoke pass on desktop and mobile.

- Self-review: APPROVE
- Time: 9.4 min

```
projects/chokepoint/game/src/audio/Sfx.ts       | 6 ++++++
 projects/chokepoint/game/src/systems/RunFlow.ts | 1 +
 2 files changed, 7 insertions(+)
```
