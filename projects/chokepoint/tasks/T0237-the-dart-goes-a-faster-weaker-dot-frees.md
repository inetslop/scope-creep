---
id: T0237
title: "The Dart goes: a faster, weaker Dot frees the enemy cap"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T23:34:09Z
claimed_at: 2026-10-30T10:26:24Z
finished_at: 2026-10-30T10:36:00Z
---

## Goal
Remove the Dart — the one regular enemy that is its behavior with other numbers — so the 10-enemy regular cap opens a slot and the Feeder (next in the enemy queue) can be tasked.

## Details
- The Dart is a `walk` enemy (hp 16, speed 2.8, gold 3, livesCost 1, threat 1, from wave 2, an orange triangle, size 0.21): a faster, weaker Dot. Nothing about how it moves, survives or interacts is new — the bar in modules/enemies.md says new numbers on an existing behavior are not a new enemy, and it is the one regular that fails it. The fast niche stays covered with a behavior each: the Sprinter (from wave 8, ramps when hit) and the Dasher (from wave 5, burst dash).
- Removal: the Dart's content file (`game/src/content/enemies/dart.ts`), its entry in the enemy pool list, its look/texture generation, and every reference — wave mix, tests, and any name-tag or demo data that names it.
- Wave mix (`game/src/core/waves.ts`): the Dart leaves the fill pool. Wave threat budgets stay exactly as today, and the reserved slots are untouched (the Splitter's one-per-seven from wave 9, the Hauler, the Mute from 11, the Bulwark from 12, the Ward from 15). Wave 1 is byte-identical (the Dart is from wave 2 and wave 1 was Dot-only). Waves 2-3 fill their budget with Dots; from wave 4 on the mix re-normalizes over the remaining pool (Dot, Block, Sprinter, Splitter, Hauler). Quiet (every 4th) and tight (every 8th) waves keep their halving and their re-add rules.
- The Sprinter's numbers were derived from the Dart's 2.8 (speed 2.52 = 90%, ramp +0.28 = 10% of it per hit, cap 5.32 = 190%): the stored numbers stay byte-identical — if the code, a test or a comment derives them from the Dart's data, inline the constants instead.
- Saved runs: a resume save and a ghost run keep their exact board and play as before; if a saved wave plan can still name a Dart, loading drops that entry (or regenerates the plan from its wave number) — never a crash or a missing-token.
- Everything else is data-driven and needs no change: the wave preview, the name tag, the menu demo, the codex (augments only). The count becomes 9 regular types plus the Splinter (spawnOnly).
- What this trades: the early waves (2-3) lose their speed spike — Dots instead, slower and a little deeper in total hp — and the first pressure change now lands with the Block at wave 4. If a later balance pass finds waves 2-3 too easy or too hard, that is a tuning task (a Dot number or the wave budget), not a re-add of the Dart.

## Compared with what exists
Why the Dart goes and no other walk enemy does (the full same-behavior set):

| Existing | What it shares | What it has that the Dart can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker — the Dart is a numbers-change of it | the baseline of wave 1 and the game's first word; one of the two must carry the niche and the Dot is the one |
| Block | `walk` | slow and heavy, costs two lives on a leak |
| Sprinter | `walk`, the fast niche | a speed ramp on every hit; also owns the Dart's 2.8-derived numbers, so the niche survives the removal |
| Dasher | the fast niche | a dash behavior — a way of moving no walker has |
| Splitter | `walk` | splits into two splinters on death |
| Hauler | `walk` | hauls a fortune: 10 gold, a leak costs a life plus 5 gold |
| Mute | `walk` | silences every tower within two cells while it lives |
| Bulwark | `walk` | a front plate that halves shots into its face |
| Ward | `walk` | ignores slow, root and push entirely |
| Splinter | `walk`, small and fast | a spawnOnly piece of a killed Splitter — never in a wave's mix, so it holds no cap slot |

## Acceptance criteria
- [ ] A fresh run never shows a Dart: waves 2 and 3 are Dots only (same threat budget as today), the wave preview never shows the orange triangle, and no name tag ever reads "Dart".
- [ ] Wave 1 is byte-identical to today (same plan, same spawn times); the reserved slots (Splitter per-seven from 9, Hauler, Mute from 11, Bulwark from 12, Ward from 15) are unchanged, and quiet/tight waves halve as before.
- [ ] The Sprinter plays byte-identically (2.52, +0.28 per hit, cap 5.32) with no reference to Dart data left in code, tests or comments.
- [ ] Content and wave-mix tests pass with 9 regular types; every test that named the Dart is updated or removed, and no test left does.
- [ ] A saved run made with the old content (a wave plan that names a Dart) loads without error and plays the wave with the remaining types; ghost and resume runs keep their exact board.
- [ ] Nothing new on screen at 412x915 and 1280x720 — a removal only.

## Design (architect, desktop)

### Files
- delete `src/content/enemies/dart.ts` — the Dart's content file
- edit `src/content/enemies/index.ts` — remove the import line `import { dart } from './dart';` (line 5) and the list entry `dart,` (line 17)
- edit `src/content/enemies/sprinter.ts` — rewrite the comment on line 15, inlining the constants (see Steps)
- edit `src/content/enemies/dasher.ts` — rewrite the comment on line 9, inlining the constant
- edit `tests/core/waves.test.ts` — in the `quietHalve` fixture (lines 147-159), replace the four `'dart'` strings with `'dasher'` and the comment "the dropped dart's 1" with "the dropped dasher's 1"; expected numbers stay exactly as they are
- edit `tests/core/tightWaves.test.ts` — in the `tightHalve` fixture (lines 10-20), replace the two `'dart'` strings with `'dasher'`; expected numbers stay exactly as they are

### Interfaces
None. This is a data removal: `ENEMIES` loses one entry, and everything downstream is data-driven.

- `src/core/waves.ts` needs **no edit**: `planWave()` filters the `ENEMIES` list it is passed, so the Dart leaves the fill pool automatically. Its reserved slots (rampers, dashers, splitter, hauler, mute, bulwark, ward) are hardcoded to other ids and are untouched. Do not change any line in this file.
- No save/load edit is needed: `SavedRun` (`src/core/saveRun.ts`) stores the wave **number**, never a wave plan. Resume (`RunSave.restore`) and ghost runs re-plan the wave from its number via `planWave(wave, rng, ENEMIES)`, which can only name enemies that exist, so no old save can reference the Dart. Do not touch `src/core/saveRun.ts` or `src/systems/RunSave.ts` (T0217 owns them).

### Steps
1. Delete `src/content/enemies/dart.ts`.
2. In `src/content/enemies/index.ts`, delete the two dart lines (import + list entry). Leave the remaining entries' order untouched.
3. In `src/content/enemies/sprinter.ts` line 15, replace the comment so no "Dart" name remains but the derivation is preserved with inlined constants:
   `speedRamp: { perHit: 0.28, max: 5.32 }, // base 2.52 is 90% of 2.8; +10% of 2.8 per hit; capped at 190% of it (10 hits)`
   The stored numbers `2.52`, `0.28`, `5.32` are already literals — do not change them.
4. In `src/content/enemies/dasher.ts` line 9, replace the comment:
   `speed: 1.4, // the crawl: half of 2.8; the surge lives in dashCycle`
5. In `tests/core/waves.test.ts`, do the four `'dart'` → `'dasher'` substitutions in the `quietHalve` fixture and its comment. Do not change any delay numbers or any other test.
6. In `tests/core/tightWaves.test.ts`, do the two `'dart'` → `'dasher'` substitutions in the `tightHalve` fixture. Do not change any delay numbers.
7. Run `npm run check` — typecheck, lint and all tests must pass. Verify with `grep -ri dart src tests` that nothing remains.

### Pitfalls
- A leftover `import { dart }` breaks the build; delete both dart lines in `index.ts`, not just one.
- Wave 1 must stay byte-identical: it is guaranteed only if you touch nothing in `waves.ts` and nothing else in `ENEMIES` (the Dart was `fromWave: 2`, so wave 1's pool was already Dot-only).
- Do not add a test pinning the enemy count (e.g. `ENEMIES.length === 10` or "waves 2-3 are Dot only"): the Feeder task will add the 10th type and would break it. The existing data-driven loops already cover the budget, reserved slots, quiet/tight rules with the new list.
- The test fixtures pass plain strings to `quietHalve`/`tightHalve`, which never look up `ENEMIES` — replacing the id is safe as long as the expected arrays and delay numbers are kept identical.
- No pooling, cleanup, layout or mobile changes: nothing new appears on screen; the preview, name tag, menu demo, codex and texture painters all derive from `ENEMIES`.

### Tests
None (the removal changes content data, not a `src/core` rule; the two fixture edits above are updates to existing tests, and no test may name the Dart afterwards).

## Result (attempt 1, cachyos-x8664)

Removed the Dart, the numbers-only walk enemy, opening the 10th regular slot for the Feeder: its content file is deleted (listed above for the runner) and its import + list entry are out of `src/content/enemies/index.ts`, so `planWave`'s fill pool drops it automatically with `waves.ts` untouched — wave 1 stays byte-identical (Dart was fromWave 2, pool was already Dot-only), waves 2–3 fill with Dots, and all reserved slots are unchanged. Sprinter plays byte-identically (`2.52` / `+0.28` / cap `5.32`): the 2.8-derived constants are now inlined in its comment, and Dasher's crawl comment likewise names no Dart. The only tests that named the Dart had their fixture ids swapped `'dart'` → `'dasher'` in `tests/core/waves.test.ts` (4 strings + the "dropped dasher's 1" comment) and `tests/core/tightWaves.test.ts` (2 strings), with every expected array and delay number kept exactly as they were. `npm run check` passes (typecheck + lint + 421 tests) and `npm run smoke` passes on desktop and mobile, so saves, previews, name tags and textures all re-derive cleanly from the 9-regular pool.

- Self-review: APPROVE
- Time: 9.6 min
- Deleted src/content/enemies/dart.ts, as the agent asked.

```
projects/chokepoint/game/src/content/enemies/dart.ts     | 15 ---------------
 projects/chokepoint/game/src/content/enemies/dasher.ts   |  2 +-
 projects/chokepoint/game/src/content/enemies/index.ts    |  2 --
 projects/chokepoint/game/src/content/enemies/sprinter.ts |  2 +-
 projects/chokepoint/game/tests/core/tightWaves.test.ts   |  4 ++--
 projects/chokepoint/game/tests/core/waves.test.ts        | 10 +++++-----
 6 files changed, 9 insertions(+), 26 deletions(-)
```
