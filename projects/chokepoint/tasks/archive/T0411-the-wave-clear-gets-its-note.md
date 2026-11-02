---
id: T0411
title: The wave clear gets its note
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T06:19:02Z
claimed_at: 2026-11-02T06:24:22Z
finished_at: 2026-11-02T06:33:33Z
---

## Goal
A clean wave is seen — the green chip, the sweep — but a perfectly held wave is the run's core good beat and it is silent; one soft two-note rise marks the moment the chip pops, so the clean clear is heard as well as seen.

## Details
- When a wave ends with zero leaks — the clean chip's own moment, where the chip pops at the exit gate (T0005) — one soft two-note rise plays: sine C5 then E5, 80 ms each, volume 0.1 (the tier chime's own volume, T0032) — a step below the claim's coin chime (T0009, E5→G5 at 0.18).
- Once per clean wave clear. A held wave (any leak) plays nothing at all — the leak's own thud already spoke, and a second note would argue with it.
- The note plays in every mode (Play and Iron; the storm when it lands is covered automatically — the clean chip's moment is mode-blind).
- Silent with sound off (the pause's own toggle, T0035).
- Exact file and closest example: one new method on the run's sound file, `src/audio/Sfx.ts`, modeled on the streak's note (T0290 — the quiet two-note rise) and the tier chime (T0032 — the 0.1 volume). The single play call goes at the clean chip's own show path — the clean branch of the wave-clear flow where the chip pops (T0005) — one line, next to the chip. No new HUD element, key, button or board mark; the chip and the sweep are untouched.

## Acceptance criteria
- [ ] A wave that ends clean plays one soft two-note rise (C5→E5, 80 ms each, vol 0.1) at the clean chip's moment, once per clean wave.
- [ ] A wave with any leak plays no such note; the leak thud is unchanged.
- [ ] With sound off (the pause's toggle) the note is silent; the chip, the sweep and every other sound are unchanged.
- [ ] `npm run check` and the desktop + mobile smoke pass.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — one new method `cleanClear()` on the `Sfx` class, placed immediately after `waveClear()` (its body ends at line 248, right before `waveSweep()` at line 250).
- edit `src/systems/RunFlow.ts` — one line in `clearWave()`, inside the existing `if (clean) {` branch, right after `this.s.fx.cleanLines(cx, cy + 40, second);` (line 241).

### Interfaces
```ts
// Sfx.ts — the new method, exact code (modeled on techBuy(), lines 95-98: same 80 ms sines, same spacing):
/** A wave ends clean: one soft two-note rise, C5 then E5, 80 ms each, the tier-chime's quiet volume. */
cleanClear(): void {
  this.tone(523, 0.08, 'sine', 0.1);
  this.tone(659, 0.08, 'sine', 0.1, undefined, 0.08);
}
```

### Steps
1. In `src/audio/Sfx.ts`, after the closing `}` of `waveClear()` (line 248), add the `cleanClear()` method above.
2. In `src/systems/RunFlow.ts` `clearWave()`, in the `if (clean) {` block (line 238), add exactly one line after `this.s.fx.cleanLines(cx, cy + 40, second);`:
   `this.s.sfx?.cleanClear();`
   Nothing else: no changes to the `else` branch, the chip, the sweep, or any other call.

### Pitfalls
- The call must live inside the `if (clean) {` branch only — a held wave (any leak) takes the `else` branch and must play nothing (the leak thud is unchanged).
- Keep the `?.` optional chain exactly like the neighboring lines (`this.s.sfx?.waveClear();` line 231); `tone()` already early-returns while muted, so the pause's sound-off (T0035) stays silent for free.
- `clearWave()` is the single wave-clear path for every mode (Play, Iron, storm) — mode-blind by construction; do not add mode checks.
- Do not touch `waveClear()`/`waveSweep()`/`streakPay()` or the clean lines' visual (`cleanLines`) — same shape as T0392's one-method-one-call pattern.

### Tests
- none (audio polish).

## Result (attempt 1, yoga)

A perfectly held wave now has its own quiet note to go with the green chip and the sweep: a soft two-note rise (sine C5 then E5, 80 ms each, volume 0.1 — a step below the claim's coin chime). One new method `cleanClear()` on `Sfx`, called from the clean branch of `RunFlow.clearWave()` at the chip's pop — mode-blind, once per clean wave, silent when sound is off, and nothing plays on a held wave. `npm run check` and desktop + mobile smoke pass.

- Self-review: APPROVE
- Time: 9.2 min

```
projects/chokepoint/game/src/audio/Sfx.ts              | 6 ++++++
 projects/chokepoint/game/src/systems/RunFlow.ts        | 1 +
 projects/chokepoint/game/tests/systems/runFlow.test.ts | 2 +-
 3 files changed, 8 insertions(+), 1 deletion(-)
```
