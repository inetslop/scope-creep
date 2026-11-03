---
id: T0473
title: "The road remembers: the leakers come back in the next wave"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T05:01:11Z
epic: E27
---

## Goal
A leak costs a life and nothing else: the waves are fully decided by the seed and the wave number, so a run's worst moments pass without a trace. Now the run's play shapes the run's next wave — every regular walker that got through comes back in the next wave, one per different type — so holding the road is worth more than a life.

## Details
- The rule: when a wave ends, every regular enemy type that leaked during that wave adds one of itself to the next wave's plan — one per different type, on top of the planned wave (the planned wave keeps its full threat; the additions are extra, not a swap of planned enemies). The remembered walkers take the next wave's own hp scale and join the plan's own gate and interval rules, like any other enemy in it, and leak as normal (a life each, the wave card's "held" chip, the leak warning — the existing rules).
- The cap: when more than 3 different regular types leaked, only 3 walkers come back — the types that leaked most, ties to the higher threat, then the type that leaked first.
- What never comes back: the boss (its lane is its own), and the split pieces (Shard, Splinter — spawnOnly, only from a split). A wave whose only leakers were the boss, a Shard or a Splinter leaves the next plan unchanged.
- What never remembers: a quiet wave and a boss wave never take additions. If the wave after a leaky one is quiet (every 4th) or a boss wave, the leakers are dropped, not queued — the breather stays a breather, the boss wave stays the whole wave in one shape.
- Where it is seen: nowhere new. The next-wave preview already shows the plan's tokens and counts, so the added walkers appear in its token row with no change to the preview, the banner or the wave card. No new chip, line or mark anywhere on screen (the one-time teach is its own later task).
- The run's leak record: the run already knows what each wave leaked (the wave card's "held · N" chip and the Gorge's feed on the Splinters' leaks both read the run's leaks); if that record is only a count, extend it to per type with the smallest change the run's state allows.
- A run with no leaks is byte-identical to before: same plans, same preview, nothing new shown.

## Acceptance criteria
- [ ] After a wave in which, say, two Dots and one Ward got through, the next wave's plan carries one extra Dot and one extra Ward on top of the planned wave, and the next-wave preview shows both tokens during the build phase with no new line or chip.
- [ ] Four or more different regular types leaking caps the addition at 3 walkers: the three most-leaked types come back (ties to the higher threat, then the type that leaked first).
- [ ] A quiet wave or a boss wave never wears additions: if the wave after a leaky one is the 4th (quiet) or a boss wave, its plan is the plain planned wave and the leakers are dropped, not queued.
- [ ] A wave whose only leakers were the boss, a Shard or a Splinter leaves the next plan unchanged.
- [ ] The remembered walkers take the next wave's own hp scale and leak as normal.
- [ ] A run with no leak is byte-identical to before the change: same plans, same preview, nothing new on screen.
- [ ] Unit tests cover the per-type leak ledger, the +1 per different type with the cap and its tie-breaks, the quiet and boss drops, and the spawnOnly exclusion.

## Design (architect, desktop)

### Files
- create `src/core/remember.ts` - the rule: which leaker types come back, and how they are appended to the next plan
- create `tests/core/remember.test.ts` - unit tests for the ledger, cap, tie-breaks, drops, spawnOnly exclusion
- edit `src/core/run.ts` - `WaveRecord` gains `leakBy`; `RunState` keeps a per-type leak count; `leak()` takes the leaker's id
- edit `src/core/saveRun.ts` - validate and default `leakBy` on saved story records
- edit `src/systems/WaveSystem.ts` - plan every wave through `planWithRemembered` (fresh plan and resumed replan)
- edit `src/systems/EnemySystem.ts` - one line: pass the leaker's id to `run.leak`
- edit `src/systems/RunSave.ts` - carry `leakBy` in persist (line 52) and restore (line 83)
- edit `src/debug/runChecks.ts` - one invariant line after `run.story` (line 34)
- edit `tests/core/run.test.ts`, `tests/core/saveRun.test.ts`, `tests/core/waveStory.test.ts`, `tests/systems/runFlow.test.ts` - update `leak()` call sites and story literals for the new field

### Interfaces
```ts
// src/core/run.ts — extended record, new private ledger, changed signature
export interface WaveRecord { wave: number; leaks: number; /** Per enemy type, in first-leak order ({} for a clean wave). */ leakBy: Record<string, number>; }
// RunState: private leakByThisWave: Record<string, number> = {};  // reset in startWave() and clearWave()
leak(id: string, livesCost: number): boolean; // was leak(livesCost: number); increments leakByThisWave[id] beside leaksThisWave

// src/core/remember.ts — new module
import type { EnemyDef } from '../content/types';
import type { WaveRecord } from './run';
import { isBossWave, isQuietWave, waveSpacing, type WavePlan, type WaveSpawn } from './waves';
export const REMEMBERED_MAX = 3;
export function rememberedIds(record: WaveRecord | undefined, enemies: readonly EnemyDef[]): string[];
export function planWithRemembered(plan: WavePlan, record: WaveRecord | undefined, enemies: readonly EnemyDef[]): WavePlan;

// implementation (whole file body)
export function rememberedIds(record: WaveRecord | undefined, enemies: readonly EnemyDef[]): string[] {
  if (!record) return [];
  const byId = new Map(enemies.map((e) => [e.id, e] as const));
  const rows: { id: string; count: number; threat: number }[] = [];
  for (const [id, count] of Object.entries(record.leakBy)) {
    const def = byId.get(id);
    if (!def || def.spawnOnly || count < 1) continue; // spawnOnly never comes back: the bosses, the Shard, the Splinter (and the wave-20 Guard)
    rows.push({ id, count, threat: def.threat });
  }
  rows.sort((a, b) => b.count - a.count || b.threat - a.threat); // stable: a full tie keeps the record's first-leak order
  return rows.slice(0, REMEMBERED_MAX).map((r) => r.id);
}
export function planWithRemembered(plan: WavePlan, record: WaveRecord | undefined, enemies: readonly EnemyDef[]): WavePlan {
  if (isQuietWave(plan.number) || isBossWave(plan.number)) return plan; // the leakers are dropped, not queued
  const ids = rememberedIds(record, enemies);
  if (ids.length === 0) return plan; // same reference: a leak-free run is byte-identical
  const gap = waveSpacing(plan.number);
  const adds: WaveSpawn[] = ids.map((id) => ({ enemy: id, delaySec: gap }));
  return { ...plan, spawns: [...plan.spawns, ...adds] }; // plain spawns: the wave's own hpMul, far gate (index % 3) and fork rules apply to them in WaveSystem.update
}

// src/systems/WaveSystem.ts — one private pipeline, used by both plan sites
private plan(wave: number): WavePlan {
  const base = planWithLevel(planWave(wave, this.run.rng, ENEMIES), levelCountMul(this.run.level));
  return planWithRemembered(base, this.run.story[this.run.story.length - 1], ENEMIES); // the story's last record is the wave that just ended
}
planNext(): void { this.planned = this.plan(this.run.wave + 1); }
// in start(): const plan0 = this.planned ?? this.plan(this.run.wave); // was the inline planWithLevel(planWave(...)) replan (a resumed wave replans with its leakers)
```

### Steps
1. `core/run.ts`: add `leakBy` to `WaveRecord` (line 19); add `private leakByThisWave: Record<string, number> = {};` after `leaksThisWave` (line 62); in `leak()` (line 136) take `id: string` first, add `this.leakByThisWave[id] = (this.leakByThisWave[id] ?? 0) + 1;` after the `leaksThisWave` bump, and push `{ wave: this.wave, leaks: this.leaksThisWave, leakBy: { ...this.leakByThisWave } }` in the death branch; reset `leakByThisWave = {}` in `startWave()` (line 156) and `clearWave()` (beside line 173), and include `leakBy: { ...this.leakByThisWave }` in the `clearWave` push (line 172).
2. Create `core/remember.ts` exactly as above.
3. `systems/EnemySystem.ts:303`: `this.run.leak(cost)` → `this.run.leak(e.def.id, cost)`.
4. `systems/WaveSystem.ts`: add the `planWithRemembered` import (between the `levels` and `run` imports, alphabetical), add `private plan(wave)` above `planNext()`, and change `planNext()` (line 53) and the fallback in `start()` (line 61) to use it.
5. `core/saveRun.ts`: add helper `function isLeakBy(v: unknown): v is Record<string, number>` (plain object, ≤24 entries, every value `inInt(n, 0, 1e6)`); in the story validation (line 127) add `&& ((r as { leakBy?: unknown }).leakBy === undefined || isLeakBy((r as { leakBy?: unknown }).leakBy))` to the per-record check; in the default (line 161) map records to `{ wave: r.wave, leaks: r.leaks, leakBy: r.leakBy ?? {} }`.
6. `systems/RunSave.ts`: line 52 persist and line 83 restore both become `...story.map((r) => ({ wave: r.wave, leaks: r.leaks, leakBy: { ...r.leakBy } }))`.
7. `debug/runChecks.ts`: after line 34 add `['run.leakBy', (g) => (g.run.story.every((r) => Object.values(r.leakBy).reduce((a, b) => a + b, 0) === r.leaks) ? null : 'a story record\'s types don\'t sum to its leaks')],`.
8. Update the existing tests: every `run.leak(n)` becomes `run.leak('dot', n)` (run.test.ts lines 51, 52, 80, 132, 183, 194, 208, 210, 212, 220, 225, 226, 242; runFlow.test.ts line 103); the story expectations in run.test.ts lines 199, 211, 213 gain the matching `leakBy` (e.g. `{ wave: 1, leaks: 1, leakBy: { dot: 1 } }`, clean waves `{ leakBy: {} }`); saveRun.test.ts line 27's sample records gain `leakBy: {}`/`{ dot: 1 }`; every literal in waveStory.test.ts (lines 6–16) gains `leakBy: {}`.
9. Create `tests/core/remember.test.ts`: (a) ledger — `startWave`, `leak('dot',1)`, `leak('ward',1)`, `leak('dot',1)`, `clearWave` → `story[0]` equals `{ wave: 1, leaks: 3, leakBy: { dot: 2, ward: 1 } }`; a death wave records its `leakBy` too (use `run.leak('dot', run.lives)` for the fatal leak); (b) `rememberedIds({wave, leaks, leakBy: { dot: 3, ward: 1 }}, ENEMIES)` is `['dot','ward']` — one per type, not per leak; (c) cap: `leakBy: { dot: 3, block: 2, ward: 1, mute: 1, dasher: 1 }` → `['dot','block','dasher']` (block's threat 4 beats ward/mute's 1; dasher's 2 beats the 1s); (d) full tie: `{ ward: 2, mute: 2 }` → `['ward','mute']` and the reversed record → `['mute','ward']` (both threat 1; first-leak order); (e) spawnOnly: `{ leech: 1, hauler: 2 }` → `['hauler']`, `{ mender: 1, ward: 2 }` → `['ward']`, `{ gorge: 1, splinter: 2 }` → `[]`; (f) `planWithRemembered(planWave(5, new Rng(5), ENEMIES), {wave: 4, leaks: 3, leakBy: { dot: 2, ward: 1 }}, ENEMIES)` appends `{enemy:'dot', delaySec: waveSpacing(5)}` then `{enemy:'ward', delaySec: waveSpacing(5)}`, keeps `number`, `hpMul`, `tags` and leaves the input `spawns` untouched; (g) quiet and boss drops: `planWithRemembered` returns the same reference for a wave-8 and a wave-10 plan with a leaky record; (h) byte-identical: record `{ leakBy: {} }` and `undefined` both return the same plan reference.
10. `npm run check` (typecheck catches any missed `leak()` call site), then `npm run smoke`.

### Pitfalls
- Never apply `planWithRemembered` twice: `start()` must use `this.planned` when set (already remembered) and only replan through `plan()` when it is not. A "uniform" fix that always re-applies it doubles the walkers on every normal wave.
- The quiet/boss guard uses `plan.number` (the wave receiving the additions), never the record's wave — "the wave after a leaky one is the 4th" is about the next wave.
- Tie-break depends on `Object.entries` insertion order of `leakBy` (first-leak order) and stable `Array.sort`; build `leakBy` only by first-touch insertion in `leak()`, never re-sort or rebuild it.
- No rng draws in the remember path — seeded plans of leak-free runs must stay byte-identical (same reference out of `planWithRemembered`).
- `leak()` is called once per leak event regardless of `livesCost` (a Block costs 2 lives but is 1 leak); keep the per-type bump next to `leaksThisWave += 1` so the new invariant (sum of `leakBy` === `leaks`) holds.
- Resumed old saves carry no `leakBy`; the `?? {}` default (saveRun load + RunSave restore) makes them resume with no additions instead of crashing `rememberedIds`.
- No HUD/preview/banner changes: the additions ride `nextPlan`, which `NextWavePreview` already renders (tokens + counts, fit-scaled); don't touch it.

### Tests
- `tests/core/remember.test.ts` (new, as listed in step 9); updated call sites/literals in `tests/core/run.test.ts`, `tests/core/saveRun.test.ts` (plus one load case: an old record without `leakBy` loads with `leakBy: {}`, and a record with a non-integer `leakBy` value is rejected), `tests/core/waveStory.test.ts`, `tests/systems/runFlow.test.ts`.
