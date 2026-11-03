---
id: T0457
title: "The tag's note: a special wave you hear at the banner"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T00:51:09Z
claimed_at: 2026-11-03T01:03:44Z
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

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - add `tagNote()` method after `comboChime()` (before `deny()`, ~line 324)
- edit `src/systems/WaveSystem.ts` - add `Sfx` type import, `sfx` field + constructor param, one call in `start()` next to the T0449 haptic line
- edit `src/scenes/GameScene.ts` - one line: pass `sfx` to the `WaveSystem` constructor (line 149)
### Interfaces
```ts
// Sfx.ts, inserted after the comboChime() method (exact code):
/** A march wave's banner lands: a quiet two-note fall, A4 then G4 (440 then 392 Hz), 70 ms sines 70 ms apart, the near-miss note's quiet class. */
tagNote(): void {
  this.tone(440, 0.07, 'sine', 0.09);
  this.tone(392, 0.07, 'sine', 0.09, undefined, 0.07);
}
```
### Steps
1. `src/audio/Sfx.ts`: insert the `tagNote()` method from Interfaces between `comboChime()` (ends line 323) and `deny()` (line 325). Do not touch `comboChime()` or `deny()`.
2. `src/systems/WaveSystem.ts`:
   a. Add as the first import line: `import type { Sfx } from '../audio/Sfx';`
   b. Add field after `private livesAtStart = 0;` (line 28): `private readonly sfx: Sfx | undefined;`
   c. Constructor becomes: `constructor(run: RunState, enemies: EnemySystem, farGateDistance = 0, hasFork = false, sfx: Sfx | undefined)` and assign `this.sfx = sfx;` as its last assignment.
   d. In `start()`, add after the `tagHaptic()` line (line 65):
   ```ts
   // The five march tags play the tag's note (Sfx.tagNote) as the banner lands, T0449's pair: the quiet breather and the boss's own horn (T0268) never do.
   if (this.plan && this.plan.tags.some((t) => ['tight', 'rush', 'short cut', 'double', 'clums'.slice(0, 5) && 'clumps'].includes(t))) this.sfx?.tagNote();
   ```
   (replace the broken literal with exactly `['tight', 'rush', 'short cut', 'double', 'clumps']` — five strings, `t` is `string`, `Array<string>.includes(t)` typechecks.)
3. `src/scenes/GameScene.ts` line 149: `this.waves = new WaveSystem(this.run, this.enemies, farGateDistance(map), map.fork !== undefined, sfx);` (`sfx` is already in scope from `getSfx(this)` at line 98.)
### Pitfalls
- Do not reuse T0449's `t !== 'quiet'` test: it also matches the boss tag `['boss']` and would stack the note on the boss arrival horn (T0268). The five-tag list is exact.
- Do not edit or gate the `tagHaptic()` line; the note is a separate line so a quiet wave still buzzes-but-stays-silent as T0449 intends.
- `tone()` early-returns when `this.muted` — the pause Sound toggle is covered, no extra mute handling.
- Once per wave: `start()` runs once per wave; no per-frame call, no pooling, no listeners, `dt` untouched.
- T0403 (in progress) also lists `src/systems/WaveSystem.ts`; the runner serializes same-file work from this Files list — no DEPENDS_ON, this task uses nothing T0403 adds.
### Tests
- none
