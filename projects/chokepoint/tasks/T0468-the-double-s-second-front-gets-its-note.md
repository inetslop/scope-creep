---
id: T0468
title: "The double's second front gets its note"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T03:26:12Z
claimed_at: 2026-11-03T04:10:12Z
epic: E22
---

## Goal
The double tag (T0447) is two fronts with a 6 s lull between them, and the second front walks in faster (1.2×). The lull is the tag's tactical heart — a beat of quiet, then a quicker wave. The player should hear that turn, so the second front is never a surprise.

## Details
- When a double-tagged wave's second front begins — the exact moment its 6 s lull ends and the faster front starts to walk in — play one quiet note, once per double wave.
- The note is a soft two-note rise (the tower-milestone note's own class, T0464: two short sines ~30 ms apart, rising), at the tag-note's own volume (T0457's level, never above the hit blip). It is the audio twin of the banner note: the banner note (T0457) still plays at the wave's start for the first front; this one plays 6 s later for the second.
- It plays on every platform and is silent with the pause's Sound toggle off (Sfx's existing mute check).
- It is audio only: no new HUD, no chip, no haptic (the double's own haptic, T0449, stays at the banner).
- The closest examples to copy are the tag note (T0457) and the tower-milestone note (T0464): one small new module that plays the note, plus one new method in `src/audio/Sfx.ts`. The double tag's schedule lives in `core/waves.ts` (the T0447 tag); hook the note to the second front's start there.
- Everything else is byte-identical: the quiet breather and every other tag, and the banner note and haptic, are untouched.

## Acceptance criteria
- [ ] A double-tagged wave plays one quiet two-note rise the moment its 6 s lull ends and its second front starts; it plays once per double wave.
- [ ] The note plays on every platform and is silent with Sound off.
- [ ] The banner note (T0457) and the double's haptic (T0449) are unchanged, and no other tag, wave or sound changes.
- [ ] No new HUD element, chip or haptic.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - add the `secondFront()` method (the double's second-front note), right after `tagNote()`.
- edit `src/systems/WaveSystem.ts` - in `update()`, play the note the moment the split spawn is sent.

### Interfaces
```ts
// src/audio/Sfx.ts — new method, inserted after tagNote() (line 342), before deny():
/** The double wave's second front: one quiet two-note rise, E4 then G4 (330 then 392 Hz), 60 ms sines ~30 ms apart, the tag note's volume (T0457). */
secondFront(): void {
  this.tone(330, 0.06, 'sine', 0.09);
  this.tone(392, 0.06, 'sine', 0.09, undefined, 0.03);
}
```
The note is T0464's shape (two short sines ~30 ms apart, rising: E4→G4, 60 ms, delay 0.03) at T0457's volume (0.09, never above a hit blip). `tone()` already no-ops when `this.muted`, so the pause's Sound toggle silences it with no extra check.

### Steps
1. In `src/audio/Sfx.ts`, insert the `secondFront()` method (exact code above) after the `tagNote()` method (which ends at line 342) and before `deny()`.
2. In `src/systems/WaveSystem.ts`, in `update()`, inside the `while` loop, immediately after `this.timer -= spawn.delaySec;` (line 99) and before the fork-lane comment, add:
```ts
      // The double's second front (core/waves.ts): its first spawn is the lull's end — the note plays here, once per double wave.
      if (this.next === doubleAt) this.sfx?.secondFront();
```

### Pitfalls
- Once per double wave: `this.next` strictly increases through the plan's indices, so `this.next === doubleAt` fires exactly once per wave. On a non-double wave `doubleAt` is `Infinity`, so it never matches. No extra state, so nothing to reset between runs.
- The trigger is the split spawn's send, which is exactly the lull's end (the split spawn's `delaySec` is `DOUBLE_LULL_SEC`): the faster front walks in from that spawn on. It scales with 2× fast-forward because it is tied to the simulation-time lull, not real time.
- Do not touch the banner note (`this.sfx?.tagNote()` in `start()`) or the haptic (`tagHaptic()` in `start()`) — they stay byte-identical. Do not change `doubleAt`'s computation or any other tag/wave/sound.
- No new HUD, chip, or haptic: the change is one `Sfx` method and one `WaveSystem` line only.

### Tests
- none
