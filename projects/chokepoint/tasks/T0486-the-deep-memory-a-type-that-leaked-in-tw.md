---
id: T0486
title: "The deep memory: a type that leaked in two waves in a row comes back doubled"
size: M
priority: 2
status: todo
depends_on: [T0473]
attempts: 0
created: 2026-11-03T10:07:19Z
epic: E27
---

## Goal
E27's memory makes a leak cost the next wave; this makes a repeated leak cost more — a type that got through in each of the last two waves comes back doubled, so holding the road against one stubborn type starts to matter.

## Details
- The rule (extends T0473's memory, which stays as the base): when the next wave is planned, each regular type that leaked in the wave that just ended still comes back, +1 as today — but if it also leaked in the wave before that, it comes back ×2 instead of ×1 (two of its kind, both taking the next wave's own hp scale, both leaking as normal).
- Only the last wave's leakers ever come back: a type that leaked two waves ago but not in the last wave comes back ×0, today and after this.
- The cap is unchanged: at most 3 walkers come back in total. When the weighted total exceeds 3, the doubled types come first, then by most leaked in the last wave, then the higher threat, then first-leak order — T0473's tie-breaks, with the depth ahead of the count.
- What never comes back is unchanged: the boss, the split pieces (Shard, Splinter). A quiet or boss wave never takes additions: the drop is all-or-nothing, as today.
- Where it is seen: nowhere new. The next-wave preview already shows the plan's tokens and counts, so a doubled type simply shows a higher count in its own row — no chip, line, mark or sound (the one-time teach is T0487, and it reads whatever count the plan carries).
- A run in which no type leaked in two consecutive waves is byte-identical to the memory rule as it stands: same plans, same references where today's rule returns the plan untouched, same preview.
- The run save needs no new field: the per-type leak record T0473 keeps is per wave for the whole run, so the two waves the rule looks at are already there.

## Acceptance criteria
- [ ] After waves N−1 and N both leak a Hauler (and N also leaks a Dot), wave N+1's plan carries two extra Haulers and one extra Dot on top of the planned wave, and the preview's Hauler count is up by 2 over the plain plan.
- [ ] A type that leaked two waves ago but not in the last wave comes back ×0; a type that leaked only in the last wave comes back ×1, as today.
- [ ] The weighted cap: a wave whose leakers weigh 2 + 1 + 1 (one doubled type and two single types) sends back only 3 walkers — the doubled type's two plus the most-leaked single type.
- [ ] A quiet or boss wave never wears additions, as today; the boss, Shard and Splinter never come back.
- [ ] A run with no type in two consecutive waves is byte-identical to the memory rule as it stands (same plans, same preview, nothing new shown).
- [ ] Unit tests cover: ×2 for a type in both waves, ×1 for the last wave only, ×0 for the earlier wave only, the weighted cap of 3 and its depth-first order, the unchanged quiet/boss drops and spawnOnly exclusion.

## Design (architect, desktop)

### Files
- edit `src/core/remember.ts` - T0473's memory rule: a type that also leaked in the wave before the last comes back with 2 copies instead of 1; the cap counts it as 2 of its 3 walker slots; the sort gains a depth term ahead of the count term
- edit `tests/core/remember.test.ts` - unit tests for the doubled rule, next to T0473's

No other files. The save field is T0473's per-type per-wave leak record, which already keeps wave N−1 — do not touch `src/core/saveRun.ts`, `src/systems/RunSave.ts` or `src/core/run.ts`. No UI: the next-wave preview already renders `waveCounts(plan)` of the planned wave, so the doubled count appears in the type's own row. No sound, no chip, no mark (that is T0487). No invariant change: T0473's "at most 3 returners" check keeps holding.

### Interfaces
No new exports or signatures. T0473's memory function in `src/core/remember.ts` (called from `WaveSystem.planNext()` after `planWithLevel(planWave(...))`) keeps its signature and its early returns; only the per-type selection inside changes:

```ts
/** 2 when the type leaked in the wave just ended AND the wave before; 1 when only in the last. */
const depth = (id: string): number => (countIn(id, lastWave) > 0 && countIn(id, lastWave - 1) > 0 ? 2 : 1);
```

The candidate sort comparator becomes, in this order (only the first term is new):
```ts
(depth(b) - depth(a)) ||          // NEW: doubled types come first
(countLast(b) - countLast(a)) ||  // T0473: most leaked in the last wave
(threat(b) - threat(a)) ||        // T0473: the higher threat
firstLeakOrder(a, b)              // T0473: its existing final tiebreak, unchanged
```
The cap loop becomes a weighted fill of at most 3 walkers:
```ts
let budget = 3;
for (const t of sorted) if (depth(t) <= budget) { add depth(t) returner spawns of t; budget -= depth(t); }
```
A type that does not fit is skipped and the next one tried — with all weights 1 this is exactly T0473's take-the-top-3.

### Steps
1. Read `src/core/remember.ts` and `tests/core/remember.test.ts` (both from T0473) first. Identify: where candidates are collected (last wave's leakers, `spawnOnly` excluded), T0473's sort, T0473's cap, how a returner's spawn is placed into the plan, and the leak record's shape. Verify the record keeps wave N−1's per-type counts (the task guarantees it is per-wave for the whole run; if it does not, stop and surface it — do not add a save field).
2. In the candidate pass, compute `depth` per type from the two wave counts above; a missing wave (e.g. wave 0 at run start) reads as 0.
3. Insert the depth term at the head of T0473's comparator; leave its other three terms and their order untouched.
4. Replace T0473's "at most 3 types" cap with the weighted fill; a doubled type takes 2 of the 3 walker slots.
5. Keep T0473's early returns exactly as written, returning the plan object (same reference) before any depth work: no leakers in the last wave; the next wave is quiet (`isQuietWave`) or boss (`isBossWave`) — the drop is all-or-nothing; the boss and all `spawnOnly` types (Shard, Splinter, ...) are never candidates.
6. Place each taken copy exactly where T0473 places a returner spawn — run its existing placement `depth(t)` times instead of once. Both copies ride the plan's own `hpMul` and leak normally; nothing else in the plan changes.
7. Add the tests below using T0473's fixtures and helper style.

### Pitfalls
- Byte-identical requirement: with no depth-2 type the new comparator term is 0 for every pair and the weighted fill degenerates to T0473's take-the-top-3. The diff must be the depth term plus the weight only — no reordering, renaming or reformatting of T0473's code, or single-leak seeded plans shift.
- Same-reference returns: never return a copied plan from the no-leaker / quiet / boss paths; return the incoming plan object.
- Cap is a total of walkers, not of types: 2 + 1 + 1 candidates send 2 + 1 = 3, not all four; 2 + 2 + 1 sends the first doubled type's two plus the single.
- No `Math.random()`, no `dt`, no pooling, no Phaser — the whole change is pure plan math in `core/`; `npm run check` and `npm run smoke` must pass.

### Tests
In `tests/core/remember.test.ts` (extend T0473's file):
- ×2: a type (e.g. Hauler) leaked in wave N−1 and in N → wave N+1's plan carries two extra Hauler spawns over the plain plan (`waveCounts` hauler count +2); a type leaked only in N carries exactly one extra (×1).
- ×0: a type leaked only in N−1, not in N, carries no extra spawn.
- Weighted cap: leakers weighing 2 + 1 + 1 → exactly 3 returner spawns: the doubled type's two plus the most-leaked single; 2 + 2 + 1 → the first doubled type's two plus the single (the second doubled is skipped, the cap still fills to 3).
- Depth-first order: when two doubled types cannot both fit, the one with more leaks in the last wave, then the higher threat, takes the slots.
- Unchanged drops: a quiet next wave and a boss next wave return the plan untouched (same reference); leaked boss / Shard / Splinter never produce returners.
- Byte-identical: a record with no type in two consecutive waves yields the exact same plan (full spawn list, `hpMul`, tags) as T0473's rule; a no-leaker record returns the same reference.
