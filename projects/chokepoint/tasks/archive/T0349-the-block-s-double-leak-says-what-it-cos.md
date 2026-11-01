---
id: T0349
title: "The Block's double leak says what it costs"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T09:12:53Z
claimed_at: 2026-11-01T09:56:27Z
finished_at: 2026-11-01T10:15:24Z
---

## Goal
A first-time player who loses two lives to a Block learns why at the moment it happens — the way the Hauler's extra gold is taught (T0307) — instead of only in the enemies reference.

## Details
- The Block is the only regular enemy whose leak costs 2 lives. The run's first leak pops "leaks cost a life" (T0107); a Block's leak then quietly contradicts what the run was just told.
- On the first Block leak of a run, one muted chip at the exit gate, in the first-leak chip's own look (T0107's chip: a small rounded card chip, bold 12 px muted ink), says "the Block takes 2 lives" and holds for ~1.5 s.
- Once per run, and never again after a resume (T0307's rule, mirrored exactly). If the Block is the run's very first leak, its chip starts 1.2 s after the first-leak chip's, at the same spot (T0307's ordering).
- No sound: the leak's own thud, jolt and echo are unchanged. A non-Block leak shows nothing new; the Hauler's teach chip (T0307) is untouched.
- A new enemy-hook file in the T0307 pattern (its hook is the closest example), registered in the enemy-hooks index; the chip rides the existing leak-chip painter. No HUD, no new readout — the lives number already shows the −2.
- The Block itself is unchanged (hp, speed, gold, its 2-life leak cost, its look): this task touches nothing on the enemy, only what the exit says once.

## Acceptance criteria
- [ ] In a fresh run, the first Block leak pops "the Block takes 2 lives" at the exit gate for ~1.5 s; a second Block leak the same run pops nothing.
- [ ] A resumed run never shows the chip, whether or not it saw it before closing.
- [ ] When the Block is the run's very first leak, its chip starts 1.2 s after "leaks cost a life"; otherwise it pops on its own at the leak.
- [ ] Non-Block leaks, the Hauler's teach chip and every sound behave exactly as before.

## Design (architect, yoga)

### Files
- create `src/systems/fx/blockTold.ts` — the chip painter: a verbatim copy of `src/systems/fx/haulerTold.ts` with the label changed to `'the Block takes 2 lives'` (same card look: 12 px bold muted ink on a white rounded chip, `if (fx.full) return;`, ~1.5 s life via `fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' })`)
- create `src/systems/enemyHooks/blockTeach.ts` — the teach hook: a verbatim copy of `src/systems/enemyHooks/haulerTeach.ts` with only these renames — export `haulerTeach`→`blockTeach`, id check `'hauler'`→`'block'`, flag `run.haulerTold`→`run.blockTold` (both the guard and the set), import + call `haulerTold`→`blockTold` from `'../fx/blockTold'`, doc comment. Keep `import { START } from '../../config'`, the two constants (`FIRST_LEAK_CHIP_MS = 1500`, `AFTER_FIRST_MS = 1200`) and the delay logic exactly as they are
- edit `src/systems/enemyHooks/index.ts` — add `import { blockTeach } from './blockTeach';` next to the `haulerTeach` import, and one line `blockTeach,` right after `haulerTeach,` in `ENEMY_HOOKS`
- edit `src/core/run.ts` — after `haulerTold = false;` (line 54): `blockTold = false; // the run's one Block teach showed (T0349): a Block that leaked has paid`
- edit `src/systems/RunSave.ts` — in `persist` after `haulerTold: run.haulerTold,` add `blockTold: run.blockTold,`; in `restore` after `run.haulerTold = saved.haulerTold;` add `run.blockTold = saved.blockTold;`
- edit `src/core/saveRun.ts` — in `SavedRun` after the `haulerTold` line: `blockTold: boolean; // the Block's double-leak teach was shown; older saves predate the field`; after the haulerTold check: `if (p.blockTold !== undefined && typeof p.blockTold !== 'boolean') return undefined;`; in the parse after `haulerTold: p.haulerTold === true,`: `blockTold: p.blockTold === true,`
- edit `tests/core/saveRun.test.ts` — in `sample()` after `haulerTold: false,` add `blockTold: false,`; add a test mirroring the hauler-told one (lines 197-206): round-trip `sample({ blockTold: true })`, a save without the key loads as untold, `broken({ blockTold: 'x' })`

### Interfaces
- `src/systems/fx/blockTold.ts`: `export function blockTold(fx: FxSystem, x: number, y: number): void`
- `src/systems/enemyHooks/blockTeach.ts`: `export const blockTeach: MakeEnemyHook` with only `onLeak(enemy: Enemy)`; body: guard `enemy.def.id !== 'block' || run.blockTold` → return; set `run.blockTold = true` first; exit anchor `x/y` = mean of the last two `board.path.points` (verbatim from haulerTeach); `const delay = run.lives >= START.lives ? FIRST_LEAK_CHIP_MS + AFTER_FIRST_MS : 0;` then `delay > 0 ? fx.scene.time.delayedCall(delay, () => blockTold(fx, x, y)) : blockTold(fx, x, y)`
- `RunState.blockTold: boolean`, persisted through `SavedRun`

### Steps
1. Copy `src/systems/fx/haulerTold.ts` → `src/systems/fx/blockTold.ts`; rename function `haulerTold`→`blockTold`, label → `'the Block takes 2 lives'`, fix the one-line doc comment. Nothing else moves.
2. Copy `src/systems/enemyHooks/haulerTeach.ts` → `src/systems/enemyHooks/blockTeach.ts`; apply only the renames listed in Files. The delay, the constants and the `// onLeak runs before run.leak()` comment stay verbatim.
3. Add the `blockTold` field to `core/run.ts` (so the compiler keeps `RunSave` and `saveRun.ts` in sync), then the two `RunSave.ts` lines, then the three `saveRun.ts` lines.
4. Register `blockTeach` in `ENEMY_HOOKS` after `haulerTeach`.
5. Test fixture line + the mirrored round-trip test; run `npm run check`.

### Pitfalls
- Set `run.blockTold = true` synchronously in `onLeak`, BEFORE the `delayedCall` — a close mid-2.7-s wait must not re-teach after resume; the flag, not the chip, is the "seen" record (T0307's rule).
- The delay test reads `run.lives` before `run.leak()` deducts it: never compare against `lives - 2`, and in Iron mode (one life, already below `START.lives` at first leak) delay must be 0 — the first-leak chip never fires there, so waiting would hang the chip.
- `saveRun.test.ts` uses strict `toEqual`: `sample()` MUST gain `blockTold: false` or every round-trip test fails.
- The chip rides the same exit-gate anchor as the first-leak chip (`leakCost`/`ExitWarning`): when the Block is the run's very first leak its 2700 ms start lands 1.2 s after that chip's end; a later Block leak pops on its own. Both chips size from `label.width`, no layout change at 412x915 or 1280x720.
- Do not touch `haulerTeach.ts`, `haulerTold.ts`, `fx/leakCost.ts`, `leakEcho.ts`, `tollLeak.ts` or `content/enemies/block.ts` — second Block leak returns on the flag; non-Block leaks return on the id; the thud/jolt/echo are unchanged.

### Tests
- `tests/core/saveRun.test.ts`: the `blockTold` round-trip mirroring the hauler-told test (persisted, older-save-without-key loads as untold, wrong type rejected). `tests/systems/enomalyHooks.test.ts`… `tests/systems/enemyHooks.test.ts` already builds every registered hook, no edit needed.

## Result (attempt 1, yoga)

A first-time player who loses two lives to a Block now learns why at the moment it happens: on the run's first Block leak, a muted chip in the first-leak chip's own look pops "the Block takes 2 lives" at the exit gate for ~1.5 s (new `systems/fx/blockTold.ts` painter, verbatim from the Hauler's teach chip), driven by a new enemy hook `systems/enemyHooks/blockTeach.ts` registered in `ENEMY_HOOKS` after `haulerTeach` — once per run, flag-set before the chip and persisted as `blockTold` through `RunState`/`RunSave`/`SavedRun` so a resumed run never shows it, and when the Block is the run's very first leak its chip starts 1.2 s after "leaks cost a life" at the same spot, exactly mirroring the Hauler's teach (T0307). The Block itself, non-Block leaks, the Hauler's chip and all leak sounds are unchanged; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 19.0 min

```
projects/chokepoint/game/src/core/run.ts           |  1 +
 projects/chokepoint/game/src/core/saveRun.ts       |  3 +++
 projects/chokepoint/game/src/systems/RunSave.ts    |  2 ++
 .../game/src/systems/enemyHooks/blockTeach.ts      | 23 +++++++++++++++++++
 .../game/src/systems/enemyHooks/index.ts           |  2 ++
 .../chokepoint/game/src/systems/fx/blockTold.ts    | 26 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/saveRun.test.ts     | 12 ++++++++++
 7 files changed, 69 insertions(+)
```
