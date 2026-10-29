---
id: T0103
title: "Rally reaches as far as its ring: Reach grows it"
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T07:01:07Z
---

## Goal
Bug: a Rally tower with Reach added shows a bigger range ring, but its speed-up still reaches only 2 cells. Rally's reach becomes the tower's own range, the ring it shows, so Reach makes a Rally tower speed up towers further away.

## Details
- Each Rally tower (Rally as its first augment) speeds up the towers whose centers are inside **its own range circle**: the tower's range with everything added (2 cells for a plain Rally; with one Common Reach added, 2.7 cells), instead of the fixed 2 cells every Rally tower uses today. Two Rally towers with different reach each use their own.
- Where it goes wrong today: `RALLY_RANGE` in `src/core/rally.ts` (the Rally augment's base range) is used for every Rally tower in `src/systems/RallySystem.ts`, both for which towers are sped up and for the teal ring it pulses; the tower's range ring shows its real range.
- The teal rally ring uses the same reach as the speed-up.
- The tower panel line says the tower's own reach, e.g. "Towers within 2.7 cells attack 10% faster" (one decimal when it isn't whole). The draft card's line stays "Towers within 2 cells".
- Rally added to another tower (it joins its own rally: only that tower is sped up) is unchanged.

## Acceptance criteria
- [ ] A Rally tower with one Common Reach added speeds up a tower 2.5 cells away (inside its 2.7-cell ring); one 3 cells away is not sped up.
- [ ] A plain Rally tower still reaches exactly 2 cells.
- [ ] The range ring, the teal rally ring and the towers that show the speed-up chevron all agree.
- [ ] Unit tests cover the reach with and without Reach.

## Design (architect, yoga)

### Files
- edit `src/core/rally.ts` — `rallyBuffed` takes one reach per tower instead of one shared range; keep `RALLY_RANGE`/`RALLY_PCT`/`inRallyReach` as they are
- edit `src/systems/RallySystem.ts` — the speed-up set, chevrons and the teal ring all use each Rally tower's own `spec.range` (the circle its ring shows)
- edit `src/core/augments.ts` — `describeSpec`'s `spec.kind === 'rally'` case (line 214-216) prints the tower's own reach
- edit `tests/core/rally.test.ts` — adapt to the new signature, add reach coverage

### Interfaces
```ts
// src/core/rally.ts — replace the existing signature; body's only change is line 27:
export function rallyBuffed(cells: readonly Cell[], rally: readonly boolean[], attacks: readonly boolean[], ranges: readonly number[]): boolean[]
```
No other signatures change. No new files, no new exports, no registry line.

### Steps
1. `src/core/rally.ts`: change `rallyBuffed`'s last parameter to `ranges: readonly number[]` and line 27 to `return cells.some((o, j) => j !== i && rally[j]! && inRallyReach(c, o, ranges[j]!));`. Extend its doc comment: `` `ranges[i]` is the reach of the tower on `cells[i]` (its own range, what its ring shows). `` Keep the `RALLY_RANGE` doc as "the base range of a plain Rally".
2. `src/systems/RallySystem.ts`:
   - import line becomes `import { RALLY_PCT, inRallyReach, rallyBuffed } from '../core/rally';` (drop `RALLY_RANGE`).
   - In `update()`, after the `attacks` line add `const ranges = list.map((t) => t.spec.range);` and change the buffed line to `const buffed = rallyBuffed(list.map((t) => t.cell), hasRally, attacks, ranges);`.
   - Pulse lines 61-62 become `const hasNeighbor = list.some((o, j) => j !== i && inRallyReach(t.cell, o.cell, t.spec.range));` and `if (hasNeighbor) this.fx.ring(t.x, t.y, t.spec.range * CELL, PALETTE.teal);`.
   - Class comment: "pulses out to the 2-cell range" → "pulses out to its range".
3. `src/core/augments.ts` `describeSpec`, replace lines 214-216 with:
```ts
  } else if (spec.kind === 'rally') {
    const r = getAugment('rally');
    const reach = spec.range % 1 === 0 ? spec.range : spec.range.toFixed(1);
    line = `Towers within ${reach} cells attack ${Math.round((r.added.rally?.pct ?? 0) * 100)}% faster`;
  }
```
4. `tests/core/rally.test.ts`: add at top `import type { AugmentCopy, Tier } from '../../src/content/types';` and extend the augments import to `import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';`; after the `cell` helper add `const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });` and `const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));`. Update the three existing `rallyBuffed` calls' last argument to `[RALLY_RANGE, RALLY_RANGE, RALLY_RANGE]` / `[RALLY_RANGE, RALLY_RANGE, RALLY_RANGE]` / `[RALLY_RANGE]`. Add:
```ts
  it('a rally with reach (2.7) buffs a tower 2.5 cells away, not 3', () => {
    const cells = [cell(0, 0), cell(2.5, 0), cell(3, 0)];
    expect(rallyBuffed(cells, [true, false, false], [false, true, true], [2.7, 0, 0])).toEqual([false, true, false]);
  });

  it('two rallies with different reaches each use their own', () => {
    const cells = [cell(0, 0), cell(2.5, 0), cell(5, 0)];
    expect(rallyBuffed(cells, [true, false, true], [false, true, false], [RALLY_RANGE, 0, 2.7])).toEqual([false, true, true]);
  });
```
and a new `describe('the tower panel line', ...)` with `expect(describeSpec(spec('rally'))).toBe('Towers within 2 cells attack 10% faster.');` and `expect(describeSpec(spec('rally', 'reach'))).toBe('Towers within 2.7 cells attack 10% faster.');`

### Pitfalls
- The reach check must use the *rally tower's* reach (`ranges[j]`), never the buffed tower's.
- Chevrons need no change: they are drawn from the same `buffed` array, so they stay in agreement automatically.
- Don't touch `src/content/augments/rally.ts` — the draft card line "Towers within 2 cells" comes from `asTower` and stays fixed; only `describeSpec` (panel) changes.
- Rally added to another tower stays unchanged: `spec.kind` is then not `'rally'`, so its line keeps its old form and only its range grows — no code path to touch.
- Dropping `RALLY_RANGE` from the import is required (unused import fails lint); the tests still import it from `core/rally`.

### Tests
The `tests/core/rally.test.ts` changes in step 4: plain Rally exactly 2 (existing), reach 2.7 buffs at 2.5 not 3, two rallies each use their own reach, and the panel line with/without Reach.
