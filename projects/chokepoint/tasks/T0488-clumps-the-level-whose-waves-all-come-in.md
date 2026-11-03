---
id: T0488
title: "Clumps: the level whose waves all come in clumps"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T10:58:13Z
claimed_at: 2026-11-03T11:28:26Z
epic: E21
---

## Goal
The eighth level on the run-setup step: Clumps. A run that plays in one rhythm — every wave walks in clumps of 2 and 3, so a build that lives in the burst (splash, the beam, the feast chain across a clump) is the answer — and the ×1.40 coin multiplier pays for giving up the run's varied march.

## Details
- The pick (the level pattern, T0446/T0452): the level joins the run-setup step's level set — the name "Clumps", the dry one-liner "every wave comes in clumps", the set's current multiplier notch (bonus 0.40, ×1.40 — Plain's own), and the level chip (the level chips' own look, name only) under the stats card for the whole run. The levels reference (T0467) names it from the set, and the daily board pick's level order takes it in (T0452's insert).
- The rule (Clumps runs only): every non-quiet, non-boss wave walks in clumps of 2 and 3 with a 4 s simulation-time gap between clumps — the clumps tag's own values (T0448). The wave's number-based march tags do not fire in a Clumps run: no tight, rush, short cut, double, screen, scatter or halt wave — the march is the level's, one rhythm for the whole run.
- What keeps its own: a quiet wave (every 4th) stays a breather — its halving, its quiet tag and chip, its ×2 kill gold — and it does not clump; a boss wave keeps its own lane and pace.
- What is shown: nothing new. A Clumps wave wears no tag chip on the preview or the banner — the level chip says the march, nothing is shown twice. The word "clumps" is already readable in the waves reference (the pause's own line for the tag), so the one-liner at the pick teaches the whole rule.
- The tag's buzz and note (T0449, T0457) fire on a wave's own tag; a Clumps run's waves wear no march tag, so the run has no special-wave buzz or note — the rhythm is constant, taught once at the pick.
- The wave's own threat, hp scale, gate and spawn rules are untouched; only the march (the spacing into clumps) changes.
- A run without the level is byte-identical: same plans, same tags, same spawns, nothing new shown.

## Acceptance criteria
- [ ] The run-setup step offers "Clumps" with the one-liner "every wave comes in clumps" and the ×1.40 multiplier; picking it shows the "Clumps" chip under the stats card for the whole run, and the levels reference and the daily board pick's level order include it.
- [ ] In a Clumps run, a wave that would wear a march tag in normal play (tight, rush, short cut, double, screen, scatter or halt) walks in clumps of 2 and 3 with a 4 s simulation-time gap between clumps, and wears no tag chip on the preview or the banner — the level chip is the only march readout.
- [ ] In a Clumps run, no wave carries a number-based march tag; a quiet wave (every 4th) is halved, wears its quiet chip, pays ×2 kill gold and does not clump; a boss wave keeps its lane and pace.
- [ ] The wave's threat, hp scale and gate rules are unchanged: a Clumps wave has the same enemies and counts as the same wave in normal play, only spaced into clumps.
- [ ] The run has no special-wave buzz or note (the tag's own, T0449/T0457) while the level is on.
- [ ] A run without the level is byte-identical before and after: same plans, same tags, same spawns, same screens.
- [ ] Unit tests cover the Clumps run's plan (clumps spacing on a normal wave, no march tags, the quiet and boss exclusions, the ×1.40 multiplier) and the plain run's byte-identity.

## Design (architect, desktop)

### Files
- create `src/content/levels/clumps.ts` — the level's data (name, one-liner, ×1.40 notch), model on `plain.ts`
- edit `src/content/levels/index.ts` — import `clumps`; add it as the final (eighth) entry of `LEVEL_AUGMENTS`: `[tough, lean, shortFuse, swift, crowded, blind, plain, clumps]`
- edit `src/core/waves.ts` — `planWave` gains a 4th `clumpsRun` parameter (no march tag fires, no tight bunching); new `clumpsLevelPlan()` after `clumpsGap`
- edit `src/core/daily.ts` — `dailyOrder` inserts Clumps after Plain, Plain's T0452 pattern
- edit `src/systems/WaveSystem.ts` — plan with the flag; the level's march replaces the tags' march; suppress rush speed / double front / scatter / short-cut distances
- edit `src/debug/runChecks.ts` — new `level.clumps` invariant next to `level.speed`; make `level.speed` Clumps-aware
- create `tests/core/clumpsLevel.test.ts` — the level's rule and the plain run's byte-identity
- edit `tests/core/daily.test.ts` — the "six others keep today's order" test now accounts for Clumps

Everything else is automatic from the set: the pick step card (name + line + `levelMultiplierLabel`), the ×1.40 coin/hp multiplier (`RunState.levelHpMul`), the level chip under the stats card (`LevelChips` reads `getLevelAugment`), the levels reference (`LevelsScene` iterates the set), the wave-30 slot ladder (`LEVEL_AUGMENTS.length`). No new UI, buzz or note code: the preview chip and the banner read `plan.tags[0]`, the buzz and `Sfx.tagNote` fire off `plan.tags` — with no march tag on the plan, nothing shows and nothing sounds.

### Interfaces
```ts
// content/levels/clumps.ts
export const clumps: LevelAugmentDef = { id: 'clumps', name: 'Clumps', line: 'every wave comes in clumps', bonus: 0.4 };

// core/waves.ts — existing clumps-tag values are reused: CLUMPS_GAP_SEC (4), clumpBoundaries, clumpsGap
export function planWave(wave: number, rng: Rng, enemies: readonly EnemyDef[], clumpsRun = false): WavePlan;
/** The Clumps level's march: every non-quiet, non-boss wave walks in clumps of 2 and 3 with CLUMPS_GAP_SEC
 *  between them and wears no march tag. Quiet and boss waves come back the SAME plan object (byte-identical). */
export function clumpsLevelPlan(plan: WavePlan): WavePlan;
```
```ts
export function clumpsLevelPlan(plan: WavePlan): WavePlan {
  if (isQuietWave(plan.number) || isBossWave(plan.number)) return plan;
  return { ...plan, tags: [], spawns: clumpsGap(plan).spawns };
}
```

### Steps
1. Create `src/content/levels/clumps.ts` exactly as above (doc comment: the run plays in one rhythm; the wave's own march tags do not fire; the level chip says the march). Add the import (between `blind` and `crowded`) and the list entry in `content/levels/index.ts`.
2. In `src/core/waves.ts`:
   - `planWave`: add the 4th parameter. Line 352 becomes `if (!clumpsRun && isTightWave(wave)) finalSpawns = tightHalve(finalSpawns);` (adjust its comment: the Clumps level's run never bunches — the march is the level's). Hoist the tag chain out of the return at line 359 into `const tags = clumpsRun ? (isQuietWave(wave) ? ['quiet'] : []) : <the existing chain verbatim>;` and return `{ number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave), tags }`.
   - Add `clumpsLevelPlan` (code above) directly after `clumpsGap`.
3. In `src/core/daily.ts`, rewrite `dailyOrder` and its doc comment:
```ts
export function dailyOrder(seed: number): string[] {
  const six = new Rng(seed).shuffle(LEVEL_AUGMENTS.filter((a) => a.id !== 'plain' && a.id !== 'clumps').map((a) => a.id));
  const r = new Rng(seed);
  const atPlain = r.int(0, six.length);
  const seven = [...six.slice(0, atPlain), 'plain', ...six.slice(atPlain)];
  const atClumps = r.int(0, seven.length);
  return [...seven.slice(0, atClumps), 'clumps', ...seven.slice(atClumps)];
}
```
4. In `src/systems/WaveSystem.ts` (import `clumpsLevelPlan` on line 8):
   - `planNext()` and the `start()` fallback: pass `this.run.level.includes('clumps')` as `planWave`'s 4th argument.
   - `start()`: `const clumpsRun = this.run.level.includes('clumps');` then `this.plan = clumpsRun ? clumpsLevelPlan(plan0) : isDoubleWave(plan0.number) ? doubleLull(plan0) : isClumpsWave(plan0.number) ? clumpsGap(plan0) : isScreenWave(plan0.number) ? screenFront(plan0) : plan0;`
   - `update()`: `const clumpsRun = this.run.level.includes('clumps');` — `const waveMul = clumpsRun ? 1 : waveSpeedMul(plan.number);`, `const doubleAt = !clumpsRun && isDoubleWave(plan.number) ? doubleSplitAt(plan.spawns.length) : Infinity;` (the `secondFront()` note is gated on `this.next === doubleAt`, so it never plays), and `const dist = clumpsRun ? entrance : isScatterWave(plan.number) && !def.flies ? scatterSpawnDistance(plan.number, this.run.rng, line, entrance) : shortCutSpawnDistance(plan.number, line, entrance);`
5. In `src/debug/runChecks.ts`: add `isBossWave, isQuietWave` to the `core/waves` import. Line 222 `level.speed`: compute `const waveMul = g.run.level.includes('clumps') ? 1 : waveSpeedMul(g.run.wave);` and use it in `base`. Add after it:
```ts
['level.clumps', (g) => {
  if (!g.run.level.includes('clumps')) return null;
  const p = g.waves.currentPlan;
  if (!p || isQuietWave(p.number) || isBossWave(p.number)) return null; // the breather and the boss keep their own
  if (p.tags.length > 0) return `a Clumps run's wave ${p.number} wears a march tag ${p.tags.join(',')}`;
  return clumpBoundaries(p.spawns.length).every((i) => p.spawns[i]!.delaySec === CLUMPS_GAP_SEC) ? null : `the Clumps run's wave ${p.number} lost its ${CLUMPS_GAP_SEC}s gaps between its clumps`;
}],
```
6. Write `tests/core/clumpsLevel.test.ts` (see Tests) and update the fourth test in `tests/core/daily.test.ts` (below). Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Resumed runs**: `run.level` is still `[]` when `WaveSystem` is constructed (GameScene builds it at line 152; `RunSave.restore` sets the level later, line 176). Never capture `run.level` in a constructor field — read `this.run.level.includes('clumps')` at the point of use (`planNext`/`start`/`update`), which is final for every run kind.
- **The existing `level.speed` invariant false-positives** in a Clumps run on a rush wave (base would carry the 1.5 while enemies walk at 1) — that is why step 5 edits it; without it the smoke test fails.
- **Rng stream**: `scatterSpawnDistance` rolls on `run.rng` per walker; suppressing it in a Clumps run shifts that run's rng stream. Expected — only runs *without* the level are byte-identical, and the flag-off path consumes the rng exactly as before.
- **Preview stays plain**: apply `clumpsLevelPlan` only in `start()` (after `planWithLevel`'s extras), exactly like the double's lull, clumps gap and screen front today. The preview reads `planned`, which is untagged and unshaped in a Clumps run — that is the intended "no chip" readout.
- **Boss waves have 1–3 spawns**: `clumpsLevelPlan` must return the same object (the `isBossWave` guard), not merely skip the gap.
- **Daily order stability**: Plain's position must stay the *first* draw of a fresh `Rng(seed)` (today's `at`); Clumps takes the *second* draw of that same instance. Do not seed a second `Rng(seed)`.
- Do not touch `WAVE_TAG_ROWS`/`waveTags.ts` (the pause's waves reference keeps the clumps row — the task leans on it) and do not add UI: the level chip, the pick card and the multiplier all come from the data.
- All existing `planWave` callers pass 3 args — the defaulted 4th keeps them byte-identical; don't change any of them.

### Tests
`tests/core/clumpsLevel.test.ts` (import `getLevelAugment`, `levelMultiplier`, `levelMultiplierLabel`, `CLUMPS_GAP_SEC`, `clumpBoundaries`, `clumpsLevelPlan`, `isBossWave`, `isQuietWave`, `planWave`, `planWithLevel`, `waveHpMul`):
- Content: `getLevelAugment('clumps')` has name 'Clumps', line 'every wave comes in clumps'; `levelMultiplier(['clumps'])` is 1.4 and the label '×1.40'.
- Waves 1–100 with `planWave(w, new Rng(w), ENEMIES, true)`: tags are `['quiet']` exactly when `isQuietWave(w)`, else `[]` — no number-based march tag anywhere.
- Same loop, non-quiet non-boss, shaped = `clumpsLevelPlan(plan)`: tags `[]`; `spawns.map(s => s.enemy)` equals the plain run's same wave; `hpMul` equals `waveHpMul(w)`; every `clumpBoundaries` index has `delaySec === CLUMPS_GAP_SEC`.
- Tight waves 6/14/22 in the run: `tags []`, and each `delaySec` (i > 0) is exactly twice the normal tight plan's — the bunching never happened.
- Quiet 4/8 and boss 10/20/40 in the run: `clumpsLevelPlan` returns the same object (`toBe`); the quiet keeps `['quiet']`; the boss's spawns `toEqual` the plain plan's.
- Combined with Crowded: `clumpsLevelPlan(planWithLevel(planWave(7, new Rng(7), ENEMIES, true), 1.2))` keeps the 4 s gaps at its clump boundaries.
- Byte-identity: waves 1–100, `planWave(w, new Rng(w), ENEMIES, false)` `toEqual` `planWave(w, new Rng(w), ENEMIES)`.

`tests/core/daily.test.ts`: change `SIX` to filter out both `'plain'` and `'clumps'`; rewrite the fourth test: the order has `SIX.length + 2` entries, `plain` and `clumps` each appear exactly once, and `order.filter(id => id !== 'plain' && id !== 'clumps')` equals `new Rng(s).shuffle(SIX)` for both days' seeds (drop the "up to Plain's position" prefix loop — Clumps can land before Plain).
