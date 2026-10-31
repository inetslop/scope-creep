---
id: T0315
title: The speed toggle gets its note
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
---

## Goal
The 2x fast-forward (T0019) is the run's loudest control — the wave rushes by — but its toggle is silent; a small blip says which speed is running, heard where the control is used.

## Details
- When the wave speed flips 1x → 2x (the button fills yellow, by tap or F), one 60 ms sine blip at G5, volume 0.1 (the quiet UI-blip class, T0032's tier chime).
- When it flips back 2x → 1x (the button un-fills, by tap or F), one 60 ms sine blip at E5, volume 0.1.
- Played from the one place the wave-speed state flips, so the button and F can never double-play; the un-fill when a wave ends and the speed resets itself plays no sound (otherwise every wave end would blip).
- Silent with sound off (the Sfx guard, T0035's toggle); nothing else changes — the button's fill, the F key, the 2x scaling and the pause are untouched.
- Closest example for the build: a new small method in `src/audio/Sfx.ts` (a sibling of `streakPay()`, T0290 — one quiet sine note) and the single call site where the speed flips (the closest: the single call site of `WaveCard.record()`, T0311).

## Acceptance criteria
- [ ] Tapping the speed button or pressing F during a wave plays the G5 blip as the button fills; flipping back to 1x plays the E5 blip as it un-fills.
- [ ] No blip when a wave ends and the button un-fills itself, and no blip outside a wave.
- [ ] With sound off, the toggle is silent; the 2x behavior, the F key and the button's look are unchanged.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - new `speedBlip(fast: boolean)` method, inserted directly after `streakPay()` (line 211), no other changes
- edit `src/systems/WaveSpeed.ts` - take the run's `Sfx` in the constructor and play from `toggle()` (the one flip point)
- edit `src/scenes/GameScene.ts` - line 145 only: `new WaveSpeed()` → `new WaveSpeed(sfx)` (`sfx` is the `getSfx(this)` const from line 84)

### Interfaces
```ts
// Sfx.ts, after streakPay():
  /** The wave-speed toggle: G5 to 2x, E5 back to 1x, 60 ms sines, the tier-chime's quiet volume. */
  speedBlip(fast: boolean): void {
    this.tone(fast ? 784 : 659, 0.06, 'sine', 0.1);
  }
```
```ts
// WaveSpeed.ts: add `import type { Sfx } from '../audio/Sfx';` at top, then:
  private readonly sfx: Sfx | undefined;
  constructor(sfx: Sfx | undefined) {
    this.sfx = sfx;
  }
```
and in `toggle()`, after the `this.speed = this.speed === 1 ? 2 : 1;` line: `this.sfx?.speedBlip(this.speed === 2);`

### Steps
1. Add the `speedBlip()` method in `src/audio/Sfx.ts` between `streakPay()` and `comboChime()`, exactly as above.
2. In `src/systems/WaveSpeed.ts`: add the import line, the `sfx` field + constructor (model the constructor style on `WaveSystem.ts:20-23`), and the one `speedBlip` call inside `toggle()` after the flip (a 1→2 flip ends with `speed === 2` → G5; 2→1 ends with 1 → E5).
3. In `src/scenes/GameScene.ts` change only line 145 to `this.speed = new WaveSpeed(sfx);`.
Do not touch `SpeedButton.ts`, `hotkeys.ts`, the button fill, or `scale()`.

### Pitfalls
- The wave-end auto un-fill (`scale()` resetting to 1) must stay silent — only `toggle()` plays, and it returns early when `!inWave`, so no blip outside a wave either.
- One call site only: the button tap and the F key both call `toggle()`, so the sound can never double-play; do not add sfx calls in `SpeedButton.ts`/`hotkeys.ts`.
- Silence-with-sound-off comes from `tone()`'s `this.muted` guard — do not add your own.
- Do not touch the 2x scaling, F key, or button look.

### Tests
- none
