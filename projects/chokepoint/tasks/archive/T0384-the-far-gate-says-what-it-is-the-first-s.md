---
id: T0384
title: "The far gate says what it is: the first send's one-time chip"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T22:18:47Z
claimed_at: 2026-11-01T22:52:30Z
finished_at: 2026-11-01T23:10:41Z
epic: E14
---

## Goal
A player who gets a board with the far gate learns what it is where it is: the run's first far-gate send wears a one-time chip at the gate, so a second entrance is never mistaken for decoration or an exit.

## Details
- **When:** the moment the far gate's send ring (T0360) fires for the first time in the run — the run's first wave that sends walkers through it (the ring's own rule: non-boss waves only).
- **What:** one small chip in the game's own chip look (the first-leak chip's look: muted ink on a small white rounded chip) that pops just above the far gate, reading "walkers come in here too", and fades after ~1.5 s (the first-leak chip's own timing). The ring still blooms at the gate as today; the chip rides above it and never covers the gate or the ring.
- **Once per run:** the run remembers the moment it has shown; a later wave never shows it again, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes). A board without the far gate never shows it.
- **Nothing else:** no sound, no button, no new line on any card, no permanent mark on the board; the wave preview keeps showing what the wave sends (not where it comes from) and the pause's boards reference is unchanged.

## Acceptance criteria
- [ ] On a board with the far gate, the first time the send ring fires, a small white chip pops just above the gate reading "walkers come in here too" and fades after ~1.5 s; the ring itself is unchanged.
- [ ] The chip shows exactly once per run: no later wave shows it, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] On a board without the far gate the chip never shows; on a boss wave it never shows (the ring's own rule).
- [ ] No new sound, button, card line or permanent board mark; the wave preview card and the boards reference are byte-identical.

## Design (architect, yoga)

### Files
- create `src/systems/fx/farGateTell.ts` — the one-time chip: a copy of `fx/leakCost.ts` (the first-leak chip) with 4 changes: import line `import { CELL, DEPTH } from '../../config';`, text `'walkers come in here too'`, container y `y - CELL - 26` (just above the ring's top), doc comment `(T0384)`. Everything else byte-identical (same label style, same chip graphics, same pop + hold 1 s + out 300 ms).
- edit `src/core/run.ts` — one field, after the `milestone30Asked` field: `farGateTold = false; // the run's one far-gate first-send chip showed (T0384)`
- edit `src/core/saveRun.ts` — 3 lines, each right after its `milestone30Asked`/`haulerTold` twin: `SavedRun` interface gets `farGateTold: boolean; // the far gate's first-send chip showed; older saves predate the field`; `loadSavedRun` gets `if (p.farGateTold !== undefined && typeof p.farGateTold !== 'boolean') return undefined;` and, in the returned object, `farGateTold: p.farGateTold === true,`
- edit `src/systems/RunSave.ts` — 2 lines, after the `milestone30Asked` lines: in `persist` `farGateTold: run.farGateTold,`; in `restore` `run.farGateTold = saved.farGateTold;`
- edit `src/systems/RunFlow.ts` — import `import { farGateTell } from './fx/farGateTell';` after the `farGateSend` import; in `farGatePulse()`, right after `farGateSend(this.s.fx, c.x, c.y);`, add:
  ```ts
  if (!this.run.farGateTold) {
    this.run.farGateTold = true;
    farGateTell(this.s.fx, c.x, c.y);
  }
  ```
- edit `tests/core/saveRun.test.ts` — `farGateTold: false,` in `sample()` after `milestone30Asked: false,`; one new `it` after the block-told test, exactly modeled on the hauler-told test (round-trip `sample({ farGateTold: true })`, deleted key loads as false, `broken({ farGateTold: 'x' })`).

### Interfaces
```ts
// RunState (core/run.ts) and SavedRun (core/saveRun.ts): farGateTold: boolean
// systems/fx/farGateTell.ts:
export function farGateTell(fx: FxSystem, x: number, y: number): void; // x, y = the far gate's cell center, board units
```
No other signatures change; `farGateSend` and the ring are untouched.

### Steps
1. Copy `fx/leakCost.ts` to `fx/farGateTell.ts` and apply the 4 changes above.
2–4. Add the `farGateTold` field to `run.ts`, the 3 lines to `saveRun.ts`, the 2 lines to `RunSave.ts` — each immediately after the named `milestone30Asked`/`haulerTold` line, in that file's list order (interface → validate → return object; persist → restore).
5. Edit `RunFlow.farGatePulse` (import + 3-line flag block).
6. Update the test file; run `npm run check`.

### Pitfalls
- Chip never covers gate or ring: ring blooms to radius CELL (64) at the gate center; chip centered at `y - CELL - 26`, its lowest drawn edge is +12 relative, so ~12.5 units clear of the ring's top and far above the gate token (±19.2). Do not change the offset.
- Set `run.farGateTold = true` BEFORE calling the fx: a save made while the chip is up must not replay it on resume; if `fx` is full the chip silently no-ops and the flag stays — same as `LeakCost`.
- Copy leakCost's label style verbatim, including `resolution: 1 / fx.scene.scale.zoom` — board-space text; do NOT use `textStyle` (it bakes `display.ratio`).
- One `fx.track` per chip (the alpha tween owns the destroy); the pop tween is added separately, as in leakCost.
- A save written before this field loads as `false` (like `haulerTold`): a resumed run can re-tell at most once — intended, matches the other `*Told` fields.
- `farGatePulse` is the only ring fire site; both wave starts (countdown, `startWaveNow`) pass it, so the flag covers both. The guard order (gate/plan/boss/split) runs first, so the fake in `runFlow.test.ts` (`farGate: undefined`) still early-outs.

### Tests
- `tests/core/saveRun.test.ts`: the `sample()` field plus the round-trip/missing-key/broken `it` (the save-run field is a core rule later refactors could break).

## Result (attempt 1, yoga)

On a board with the far gate, the first time its send ring fires (the run's first non-boss wave that sends walkers through it), a small white chip reading "walkers come in here too" now pops just above the gate and fades after ~1.5 s, in the same muted-ink chip look as the first-leak chip. It shows exactly once per run: the flag is set before the effect and is saved/resumed through the run save like the other *Told fields, so a resumed run past the moment never replays it. The ring itself is untouched, and there is no new sound, button, card line or permanent board mark; the wave preview card and boards reference are unchanged.

- Self-review: APPROVE
- Time: 18.2 min

```
projects/chokepoint/game/src/core/run.ts           |  1 +
 projects/chokepoint/game/src/core/saveRun.ts       |  3 +++
 projects/chokepoint/game/src/systems/RunFlow.ts    |  5 +++++
 projects/chokepoint/game/src/systems/RunSave.ts    |  2 ++
 .../chokepoint/game/src/systems/fx/farGateTell.ts  | 26 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/saveRun.test.ts     | 12 ++++++++++
 6 files changed, 49 insertions(+)
```
