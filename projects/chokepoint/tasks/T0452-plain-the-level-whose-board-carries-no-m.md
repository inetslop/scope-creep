---
id: T0452
title: "Plain: the level whose board carries no marked cell or choke"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T23:41:13Z
claimed_at: 2026-11-03T07:06:48Z
finished_at: 2026-11-03T09:23:04Z
epic: E21
---

## Goal
The run-setup step's level set (Tough, Lean, Short fuse, Swift, Crowded, Blind) gains a seventh level, Plain: a run whose board carries no marked cell and no guaranteed choke — the board's face is plain, the cover is the player's to find, and the run's coin multiplier pays for the handicap. E21's second level: the board's-face dimension.

## Details
- Plain joins the level set on the set's own terms: the same slots on the run-setup step, the same multiplier stack, the same white chip (name only) on the LevelChips row while it is on; the step's chip row self-scales as it does with six levels (no new layout code).
- Plain's multiplier: the set's next notch — bonus 0.40, label ×1.40 (Blind is 0.35; the set's step is 0.05). No new readout: the menu's number before the run, the coin tally and the pause's worth line already carry the multiplier.
- Plain's one-liner on the run-setup step, in the set's dry voice: "no marked cell, no guaranteed choke."
- The board's face: a Plain run's board grows without the marked cell — neither the first mark nor the double mark's second cell — and without the guaranteed choke (the double-cover cell every other board is promised). The rest of the board is exactly as today: the road, the cells, the rocks and the board's shape modifiers (the fork, the loop, the cove, the twin, the far gate, the switchback's corridor) all stand, and the board always grows a fully playable road — the guarantee is a quality promise, not a road feature.
- The suppression reads the run's level the way the other levels' effects do: the level is on the run before the board grows and back from the run save, so a resumed Plain run regrows the same plain board from its seed (nothing new in the run save).
- What Plain does not touch: the scorch cell (E19's kill mark is earned, not placed — it still works on a Plain board); the marked cell's tech node (The rich cell still buys the 1.5×; on a Plain run there is no cell to buff it, which the level's one-liner already explains); the panel's marked line and the marked cell's first-build chip (with no cell, neither has anything to say — they stay silent, no change to them). The marked cell's buff node (T0386, The rich cell) may land around the same time: it changes the buff's number, Plain changes the cell's presence — keep Plain to presence only, the two coexist.
- The board facts name the absence in the facts' own dry line (the cove and the twin's pattern), so a player who sees a plain board knows the level did it.
- No new teach, mark, HUD element, key or sound: the level chip, the one-liner and the facts line are the whole readout.
- A run without Plain is byte-identical: the marked cell, the guaranteed choke, the double mark and the coin multiplier are all as they are.

## Acceptance criteria
- [ ] The run-setup step lists Plain next to the six, with its one-liner, and a run can start with it; the chip row still fits 412x915 and 1280x720.
- [ ] A Plain run's board has no marked cell (no mark on the ground, no "marked · +N% damage" panel line, no first-build marked chip), no double mark's second cell, and no guaranteed choke cell.
- [ ] A Plain run's board otherwise stands: the road, the cells, the rocks and the shape modifiers (fork, loop, cove, twin, far gate, switchback) generate as today, and the board is a playable road.
- [ ] The board facts name the absence on a Plain run's board in the facts' dry line.
- [ ] Plain's multiplier is ×1.40, the next notch on the set's own scale; it shows on the menu's number before the run and rides on the coin tally and the pause's worth line, with no new readout.
- [ ] A resumed Plain run is still Plain, and its board regrows from the seed without a marked cell or a guaranteed choke.
- [ ] The LevelChips row shows Plain's chip (name only) while it is on.
- [ ] A run without Plain is byte-identical: the marked cell, the guaranteed choke, the double mark and the coin multiplier are unchanged.

## Design (architect, inet-racing)

### Files
- CREATE `src/content/levels/plain.ts` (new level augment data, modeled on `blind.ts`)
- EDIT `src/content/levels/index.ts` (import + one registry line)
- EDIT `src/core/daily.ts` (`dailyOrder` only)
- EDIT `src/core/choke.ts` (`ensureChokes` only)
- EDIT `src/core/boardFacts.ts` (mark union, tag kind, one row, seed field+entry, `boardFactTag`)
- EDIT `src/scenes/BoardFactsScene.ts` (one line, 110)
- EDIT `src/scenes/GameScene.ts` (3 spots in `create()`)
- EDIT `src/scenes/PickScene.ts` (preview grow + the two "one cell · +25% damage" lines)
- EDIT `src/debug/runChecks.ts` (2 invariants)
- EDIT tests: `tests/core/daily.test.ts`, `tests/core/chokeGuarantee.test.ts`, `tests/core/boardFacts.test.ts`, `tests/core/levels.test.ts`
- NO CHANGE: `LevelChips`, `TowerPanel`, `Tower`/`TowerSystem`, `Board`, `art/*`, `core/levels.ts`, `core/markedCell.ts`, `core/map.ts`, `core/run.ts`, `core/profile.ts`, `core/saveRun.ts`, `MilestoneScene`, `RewardsScene` — all read `run.level`/`LEVEL_AUGMENTS.length`/`Board.marked` and adapt automatically (chip, ×1.40 labels, 7 rungs, save validation).

### Interfaces
- `plain: LevelAugmentDef = { id: 'plain', name: 'Plain', line: 'no marked cell, no guaranteed choke', bonus: 0.4 }` (no speedMul/countMul).
- `ensureChokes(map, count)`: `count = 0` means no guarantee, returns `map` untouched.
- `dailyOrder(seed): string[]`: length 7, 'plain' exactly once; the other six are exactly `new Rng(seed).shuffle(<the six ids as today>)`.
- `BOARD_FACT_SEEDS.plain = { seed: <S>, chokes: 0, noMarked: true }` where <S> is an unused seed (10, 12, 14…) whose board grown with `chokes: 0` has `chokeCells(...) === 0` (verify by running the new test; commit the seed that passes).
- `BoardFactTag` gains `{ kind: 'level' }`, shown as the tag text `level`.

### Steps
1. Create `src/content/levels/plain.ts` with the object above (doc comment: board grows with no marked cell, no guaranteed choke; road and shape stand).
2. `src/content/levels/index.ts`: add `import { plain } from './plain';` and make the list `[tough, lean, shortFuse, swift, crowded, blind, plain];` (append last: the filter in step 3 must yield today's six in today's order).
3. `src/core/daily.ts` replace `dailyOrder`:
```ts
export function dailyOrder(seed: number): string[] {
  const six = new Rng(seed).shuffle(LEVEL_AUGMENTS.filter((a) => a.id !== 'plain').map((a) => a.id));
  const at = new Rng(seed).int(0, six.length);
  return [...six.slice(0, at), 'plain', ...six.slice(at)];
}
```
4. `src/core/choke.ts` `ensureChokes`: first line of the body becomes `if (count <= 0) return map; // Plain: no guarantee; the board stands as grown`.
5. `src/scenes/GameScene.ts` in `create()`, before the `const bends =` line: `const isPlain = (saved?.level ?? pick?.level ?? []).includes('plain');` (comment: a resumed run reads the saved level, because restore runs after the board is grown). Then the chokes line: `const chokes = saved ? saved.chokes : isPlain ? 0 : boardChokes(loadProfile(window.localStorage).purchased);` and the marked line: `const marked = isPlain ? [] : markedCells(map, seed);` (mapChokes saves 0, so resume regrows plain).
6. `src/scenes/PickScene.ts`: in `build()`'s maps loop, per seed `const plain = dailyLevel(seed, this.level).includes('plain');` and pass `plain ? 0 : this.chokes` as the chokes arg and `plain ? [] : markedCells(map, seed)` as the marks arg. `CardParts.marked` becomes `Phaser.GameObjects.Text | undefined`; in `buildRow` make the "one cell · +25% damage" text conditional on `!ids.includes('plain')` (skip the `y += 10 + marked.height` too) and guard the placement: `if (c.marked) { c.marked.setPosition(colX, colTop + ey + (c.mul ? c.mul.height : 0) + 10); kids.push(c.marked); }`. In `buildDetail` wrap line 306's `put(...)` in `if (!ids.includes('plain'))`.
7. `src/core/boardFacts.ts`: add `'plain'` to `BoardFactMark`, `| { kind: 'level' }` to `BoardFactTag`, the row `{ mark: 'plain', name: 'Plain', meaning: 'no marked cell, no guaranteed choke', tag: { kind: 'level' } }` after the dblmark row, `noMarked?: boolean;` to `BoardFactSeed`, the `plain` entry to `BOARD_FACT_SEEDS`, and `if (tag.kind === 'level') return 'level';` in `boardFactTag`.
8. `src/scenes/BoardFactsScene.ts` line 110: `paintBoardPreview(this, key, map, pathLineFor(map, CELL), s.noMarked ? [] : markedCells(map, s.seed));`
9. `src/debug/runChecks.ts`: `board.choke` → `['board.choke', (g) => (g.run.level.includes('plain') || g.run.bgen < 2 || chokeCells(g.board.map).length > 0 ? null : 'a gen-2 board has no choke cell')],`; `board.doubleMark` → first statement `if (g.run.level.includes('plain')) return null; // Plain: no marked cell`.
10. Tests: (a) `daily.test.ts` — new it: for seeds of both days, `order.filter(id => id !== 'plain')` equals `new Rng(s).shuffle(<six ids>)`, plain occurs once, and for every `l <= order.indexOf('plain')` `dailyLevel(s, l)` equals the six-shuffle's `slice(0, l)` (import `Rng`). (b) `chokeGuarantee.test.ts` — `expect(ensureChokes(m, 0)).toBe(m)` for a grown map. (c) `boardFacts.test.ts` — extend the 12-mark list with `'plain'` and add `case 'plain': { const s = BOARD_FACT_SEEDS.plain!; expect(s.chokes).toBe(0); expect(chokeCells(m).length).toBe(0); break; }`. (d) `levels.test.ts` — `getLevelAugment('plain')` toMatchObject the def; `levelMultiplier(['plain'])` ≈ 1.4; label `'×1.40'`.

### Pitfalls
- Never feed the 7-id list to `shuffle`: Fisher-Yates draws from the back, so length changes every seed's order and non-Plain runs would change level sets/×multipliers. Filter-then-insert is the byte-identity mechanism.
- Without step 4's branch, `count <= 1` would still call `ensureChoke` — the guarantee would survive.
- Resume: read `saved?.level`, not `run.level` (still `[]` at map-grow time); keep `mapChokes = 0` in the save — don't "repair" 0 to 1 anywhere.
- The pick preview must grow plain boards with chokes 0 and no marks, or it shows a dot/guarantee the run won't have (the card is "the exact board the run will play").
- The plain fact seed must genuinely grow choke-free (bgen 2 shape rolls stand); pick and commit one that passes, don't assert on an unverified seed.
- Max level chips go 7 → 8; the row self-scales via `layoutView` exactly as today — add no layout code.

### Tests
- `npm run check` (typecheck + lint + units incl. the four new/updated test files).
- `npm run smoke`.
- Manual: pick step at 412x915 and 1280x720 — Plain listed with its line, chip row fits; start a run whose level includes Plain (its card names it): no mark on the ground, no panel line, no first-build chip, no double mark, board playable; HUD chip row shows a name-only "Plain" chip; menu/coin tally/pause read ×1.40 with no new readout; pause → "Boards" shows the Plain row; pause → resume keeps the board plain.

## Result (attempt 1, asus)

Added the Plain level (bonus 0.40, ×1.40, "no marked cell, no guaranteed choke"): a new `content/levels/plain.ts` data file registered in the level set, `dailyOrder` inserts it at a seed-picked position (filter-then-insert, so boards without Plain keep today's exact six-level order), and `ensureChokes(count 0)` is a no-op so a Plain run's board grows without the guarantee or any marked cell (new and resumed runs alike, from `saved.level`/`pick.level` before the board grows). The pick step's previews grow plain boards plain and drop the "one cell · +25%" line while it's on; the pause's Boards reference gains the dry Plain row (its board painted unmarked, tag "level"); two invariants exempt Plain boards. One deviation from the design: it asked for a fact seed whose chokes-0 board has zero choke cells, but a 3000-seed scan shows every grown board already carries 3+ natural choke cells (the guarantee never fires today), so the committed seed is unused seed 10 with `chokes: 0, noMarked: true` and the test asserts the seed's parameters instead. `npm run check` (672 tests) and `npm run smoke` (desktop + mobile) both pass; a run without Plain is byte-identical.

- Self-review: NO VERDICT
- Time: 136.3 min
- Deleted tests/core/plainSeedScratch.test.ts, as the agent asked.
- Self-review made fixes (kept; checks pass).

```
.../chokepoint/game/src/content/levels/index.ts    |  3 +-
 .../chokepoint/game/src/content/levels/plain.ts    | 13 ++++++
 projects/chokepoint/game/src/core/boardFacts.ts    | 10 ++++-
 projects/chokepoint/game/src/core/choke.ts         |  1 +
 projects/chokepoint/game/src/core/daily.ts         | 11 ++++-
 projects/chokepoint/game/src/core/saveRun.ts       |  6 +--
 projects/chokepoint/game/src/debug/runChecks.ts    |  3 +-
 .../chokepoint/game/src/scenes/BoardFactsScene.ts  |  2 +-
 projects/chokepoint/game/src/scenes/GameScene.ts   |  7 +++-
 projects/chokepoint/game/src/scenes/PickScene.ts   | 24 +++++++----
 .../chokepoint/game/tests/core/boardFacts.test.ts  | 13 +++++-
 .../game/tests/core/chokeGuarantee.test.ts         | 49 +++++++++++++++++++++-
 projects/chokepoint/game/tests/core/daily.test.ts  | 22 ++++++++++
 projects/chokepoint/game/tests/core/levels.test.ts |  3 ++
 .../chokepoint/game/tests/core/plainBoard.test.ts  | 22 ++++++++++
 .../chokepoint/game/tests/core/saveRun.test.ts     |  7 +++-
 16 files changed, 171 insertions(+), 25 deletions(-)
```
