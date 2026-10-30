---
id: T0290
title: "The streak's pay gets its note: the life-back heard"
assignee: inet-racing
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T16:07:56Z
claimed_at: 2026-10-30T17:08:48Z
---

## Goal
The run's one life-back (the clean streak, T0045) is seen today as the lives number's green pop under the wave sweep; give the once-per-run reward its own note, so it is heard as its own moment.

## Details
- A new quiet method in src/audio/Sfx.ts next to `waveSweep()` (T0240) and `sting()` (T0091): one soft two-note rise, the wave sweep's notes (E5 then G5, 80 ms sine each, 90 ms apart) at the sting's volume (0.1).
- It plays exactly when the streak pays: the same moment the lives readout's green pop plays (the existing payback feedback), on top of the wave sweep that clean wave already plays.
- Once per run (the streak pays once per run); a resumed run that has already paid never plays it. Silent with sound off.
- No HUD, no board mark, no new text.

## Acceptance criteria
- [ ] The clean streak's life-back plays the wave sweep and the new two-note rise; a clean wave that does not pay the streak plays only the sweep, exactly as before.
- [ ] The rise plays at most once per run, and never on a resumed run that has already paid.
- [ ] With sound off, nothing plays.
- [ ] The gate passes (typecheck, lint, unit tests, browser smoke test).

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — new quiet method `streakPay()`, one line in `clearWave()` of `src/systems/RunFlow.ts` triggers it
- edit `src/systems/RunFlow.ts` — play the note exactly when the streak pays
- edit `src/core/saveRun.ts` — persist `streakPaid` in the save so a resumed run that already paid can't pay (or ring) again
- edit `src/systems/RunSave.ts` — one line in `persist()`, one line in `restore()`
- edit `tests/core/saveRun.test.ts` — field in `sample()` + round-trip case

### Interfaces
```ts
// Sfx, immediately after waveSweep() (the body duplicates waveSweep's two tones, like comboChime does)
/** The streak pays its one life back: the wave sweep's rise, E5 then G5, 80 ms sine each, 90 ms apart, the sting's volume. */
streakPay(): void {
  this.tone(659, 0.08, 'sine', 0.1);
  this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
}
```
SavedRun gains `streakPaid: boolean;` (after `cleanWaves: number;`): `streakPaid: p.streakPaid === true,` in `loadSavedRun`'s returned object, and `if (typeof p.streakPaid !== 'undefined' && typeof p.streakPaid !== 'boolean') return undefined;` after the `bgen` check. No new signatures elsewhere.

### Steps
1. `src/audio/Sfx.ts`: insert the `streakPay()` method above, directly after `waveSweep()` (before `comboChime()`). Do not alter `waveSweep()`.
2. `src/systems/RunFlow.ts` `clearWave()`: after the `this.s.sfx?.waveSweep();` line (144) insert: `if (!streakPaidBefore && this.run.streakPaid) this.s.sfx?.streakPay(); // the one pay: the note on top of the sweep`
3. `src/core/saveRun.ts`: add the interface field after `cleanWaves: number;`, the reject line after the `bgen` reject (91), and `streakPaid: p.streakPaid === true,` after `cleanWaves: p.cleanWaves,` in the returned object.
4. `src/systems/RunSave.ts`: `persist()` add `streakPaid: run.streakPaid,` after the `cleanWaves` line; `restore()` add `run.streakPaid = saved.streakPaid;` after `run.cleanWaves = saved.cleanWaves;`.
5. `tests/core/saveRun.test.ts`: `sample()` add `streakPaid: false,` after `cleanWaves: 2,`; add: `it('round-trips a streak-paid save, and a save written without the key loads as unpaid', ...)` — `saveRun(store, sample({ streakPaid: true }))` → `toEqual(sample({ streakPaid: true }))`; delete the key from a copy, write, expect `toEqual(sample())`; plus `broken({ streakPaid: 'x' });`.

### Pitfalls
- Trigger belongs in `RunFlow.clearWave()`, not in `StatsCard.popLives()` — the green pop fires on ANY life gain (tech life buys too); the run's `!streakPaidBefore && streakPaid` is the once-per-run gate.
- Persist only `streakPaid`, not `cleanStreak` (partial streaks intentionally reset on resume; out of scope).
- Older saves lack the key: it must load as `false`, never reject on absence; the lives already paid ride along in the saved `lives`.
- No invariant, no HUD, no text; silence-with-sound-off comes from `tone()`'s existing muted check.
### Tests
- `tests/core/saveRun.test.ts`: the new round-trip/absence/case above (core save-format rule a later change could silently break). Sound method itself: none.
