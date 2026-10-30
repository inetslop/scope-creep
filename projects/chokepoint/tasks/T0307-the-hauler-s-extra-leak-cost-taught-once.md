---
id: T0307
title: "The Hauler's extra leak cost, taught once"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T21:22:19Z
---

## Goal
A Hauler that gets through costs 5 gold on top of its life, but the player learns that only from the enemies reference — teach it at the exit, once, at the moment the cost is paid.

## Details
- Once per run, on the first Hauler leak, a small muted chip pops at the exit gate in the first-leak chip's look (T0107, `fx/leakCost.ts`): "the Hauler also takes 5 gold", ~1.5 s, then fades. A white chip, muted ink — the name-tag chip's language (T0085).
- It is a leak hook: a new file beside the other leak hooks in `src/systems/enemyHooks/` (`tollLeak.ts` from T0255, `leakEcho.ts` from T0250) and its entry in `enemyHooks/index.ts`. It changes nothing about the leak itself: same life cost, same 5 gold, same thud, jolt and gold pop.
- If the Hauler's leak is also the run's first leak, the "leaks cost a life" chip (T0107) fires on the same leak: the Hauler chip then starts 1.2 s after that chip, so the two lines read one after the other instead of on top of each other.
- Once per run, and never again after a resume: the Hauler that leaked has already paid. Later Hauler leaks in the same run show nothing.
- No sound, no new HUD element: the chip is a one-time teach and is gone after 1.5 s.

## Acceptance criteria
- [ ] In a fresh run, the first Hauler to reach the exit shows "the Hauler also takes 5 gold" at the exit gate for ~1.5 s; a second Hauler leak in the same run shows no chip.
- [ ] When the Hauler's leak is also the run's first leak, the chip appears ~1.2 s after the "leaks cost a life" chip and the two chips never overlap.
- [ ] Closing and resuming a run in which a Hauler already leaked does not show the chip again.
- [ ] A run that holds every Hauler (or dies before wave 9) never shows the chip; the leak's life cost, gold, sound and jolt are unchanged.

## Design (architect, yoga)

### Files
- create `src/systems/fx/haulerTold.ts` - the teach chip: a copy of `src/systems/fx/leakCost.ts` with the function renamed and the text changed
- create `src/systems/enemyHooks/haulerTeach.ts` - the leak hook: once per run, first Hauler leak pops the chip at the exit gate
- edit `src/systems/enemyHooks/index.ts` - one import line after the `haulerLeak` import; one `haulerTeach,` array line right after `haulerLeak,`
- edit `src/core/run.ts` - one new field after `streakPaid`
- edit `src/core/saveRun.ts` - the field in `SavedRun`, its load check and return line, each right after the `streakPaid` line
- edit `src/systems/RunSave.ts` - `haulerTold: run.haulerTold,` after `streakPaid: run.streakPaid,`; `run.haulerTold = saved.haulerTold;` after `run.streakPaid = ...`
- edit `tests/core/saveRun.test.ts` - one round-trip test after the streak-paid test

### Interfaces
```ts
// core/run.ts, after `streakPaid = false;`
haulerTold = false; // the run's one Hauler teach showed (T0307): a Hauler that leaked has paid
// core/saveRun.ts SavedRun, after `streakPaid: boolean;`
haulerTold: boolean; // the Hauler's extra-cost teach was shown; older saves predate the field
// loadSavedRun: `if (p.haulerTold !== undefined && typeof p.haulerTold !== 'boolean') return undefined;` and `haulerTold: p.haulerTold === true,`
// fx/haulerTold.ts: `export function haulerTold(fx: FxSystem, x: number, y: number): void`
// enemyHooks/haulerTeach.ts: `export const haulerTeach: MakeEnemyHook`
```

### Steps
1. Copy `src/systems/fx/leakCost.ts` to `src/systems/fx/haulerTold.ts`; rename the function `leakCost` → `haulerTold`; text becomes `'the Hauler also takes 5 gold'`; header comment: the Hauler's extra cost, taught once, same look and life as the first-leak chip. Everything else (12px bold muted, cardDeep/card chip, 200 ms pop, `fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' })`) stays byte-identical.
2. Add the field to `RunState` (above). Add the three `saveRun.ts` lines and the two `RunSave.ts` lines (above).
3. Write the hook exactly:
```ts
import { START } from '../../config';
import { haulerTold } from '../../fx/haulerTold';
import type { MakeEnemyHook } from './hook';

/** The first-leak chip's life (fx/leakCost.ts): 200 ms in, 1 s hold, 300 ms out. */
const FIRST_LEAK_CHIP_MS = 1500;
/** The teach waits this long after that chip is gone, so the lines read one after the other. */
const AFTER_FIRST_MS = 1200;

export const haulerTeach: MakeEnemyHook = ({ run, fx, board }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler' || run.haulerTold) return;
    run.haulerTold = true; // set before any chip: the leak paid, a resumed run never re-teaches
    const pts = board.path.points; // same exit anchor as LeakCost and ExitWarning
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    // onLeak runs before run.leak(): at or above the start, no leak has happened yet, so the
    // first-leak chip (systems/LeakCost) fires on this same leak. `>=`: a clean streak pays +1.
    const delay = run.lives >= START.lives ? FIRST_LEAK_CHIP_MS + AFTER_FIRST_MS : 0;
    if (delay > 0) fx.scene.time.delayedCall(delay, () => haulerTold(fx, x, y));
    else haulerTold(fx, x, y);
  },
});
```
4. Register it in `index.ts` (both lines after `haulerLeak`'s lines).
5. Add to `tests/core/saveRun.test.ts` after the streak-paid test:
```ts
it('round-trips a hauler-told save, and a save written without the key loads as untold', () => {
  const store = memory();
  saveRun(store, sample({ haulerTold: true }));
  expect(loadSavedRun(store)).toEqual(sample({ haulerTold: true }));
  const without = { ...sample() } as Record<string, unknown>;
  delete without.haulerTold; // older saves predate the field
  store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
  expect(loadSavedRun(store)).toEqual(sample());
  broken({ haulerTold: 'x' });
});
```

### Pitfalls
- Read the exit anchor inside `onLeak`, never in the factory: the fake context in `tests/systems/enemyHooks.test.ts` has no `points` on the path, and the "every hook builds from a context" test would throw.
- Set `run.haulerTold = true` before the chip attempt (and even when `fx.full` skips the chip) — the teach is paid at the leak; a second Hauler leak and every resumed run show nothing.
- The delay condition must be `>=` (the streak can lawfully pay +1, lives 21) and reads pre-leak lives; in Iron runs (1 life) it is false, matching that the first-leak chip never fires there.
- The 1500 ms constant tracks `fx/leakCost.ts`'s timings — if those are retuned, the 1.2 s gap and no-overlap guarantee move with it; keep the comment.
- No leak itself changes: the life cost, the 5-gold debit, `'-5'` pop, thud, jolt stay in `EnemySystem.leak` and `haulerLeak.ts`; the `delayedCall` lives on `fx.scene.time` and is cleared with the scene.

### Tests
- The `saveRun.test.ts` round-trip above (older saves load as untold). No other unit tests: the chip is juice, and the auto "every hook builds" test covers the new hook.
