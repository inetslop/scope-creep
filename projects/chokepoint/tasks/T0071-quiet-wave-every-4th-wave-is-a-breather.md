---
id: T0071
title: "Quiet wave: every 4th wave is a breather"
size: M
priority: 2
status: todo
depends_on: [T0015, T0054]
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E1
---

## Goal
A run has pressure and relief: every 4th wave is a quiet breather — half the enemies, double the gold per kill — so the build phase before it is a chance to spend, not a trap.

## Details
- **The rule:** every 4th wave (4, 8, 12, …) is a quiet wave: half the wave's usual enemy count (rounded up, minimum 3), with the same mix rules for that wave number (the same enemy types and proportions, fewer of them). Every other wave is exactly as it is today.
- **Gold:** each kill on a quiet wave pays 2× the normal kill gold, and the gold pop at the kill spot shows the doubled number (the same doubled-pop language as last stand, T0054). The kill-gold multiplier is the **product** of the multipliers that are on — quiet (×2) × last stand (×2) = ×4 when both are on, so a quiet wave inside the last stand is the run's richest minute. Mint's +1 per copy pays on top and is never doubled (T0021's rule); combo gold (T0066, once in) pays on top as usual.
- **The preview:** the wave preview (T0015 — the small card above the build countdown) shows the quiet wave's halved shape counts and gains a small muted-blue "quiet" chip at the left edge of the same card. Muted chip style, blue because it is relief — red is the leak warning's color and is never used for a breather. Non-quiet waves show no chip.
- **A quiet wave can be held clean:** zero leaks pops the green "Clean" chip (T0005) and counts for the clean streak (T0045) and the Momentum bonus (T0064) like any clean wave — the smaller count is exactly what makes it the easy clean.
- Chained behind T0054 on purpose: both tasks change the kill-gold line, so the multipliers land one at a time.

## Acceptance criteria
- [ ] Waves 4, 8, 12, … send half the usual enemy count (rounded up, minimum 3) with that wave's usual mix; waves 1–3, 5–7, … are unchanged.
- [ ] A kill on wave 4 pays 2× the normal kill gold and the gold pop shows the doubled number; a kill on wave 3 or 5 pays normal.
- [ ] The build phase before wave 4 shows the halved shape counts plus a small muted-blue "quiet" chip in the wave preview; the build phase before wave 3 shows no chip; the chip fits the preview card at 412x915 and 1280x720 without crowding the shapes.
- [ ] With last stand on, a kill on a quiet wave pays 4× the normal kill gold and the pop shows it; Mint's +1 is not doubled and pays on top.
- [ ] A quiet wave held with zero leaks pops the green "Clean" chip and counts for the clean streak like any clean wave; lives, wave escalation and enemy types are otherwise unchanged.

## Design (architect, baby-mama)

### Files
- `src/core/waves.ts` — quiet-wave rules + halving. Add `isQuietWave`, `quietCount`, `quietGoldMul`, `quietHalve`; make `planWave` apply the halving at its single exit. (core, pure, no Phaser.)
- `src/systems/EnemySystem.ts` — one line in `strike()`: fold the quiet multiplier into the kill's base gold as a product with T0054's last-stand multiplier; the Mint bonus stays on top.
- T0015's wave-preview card (a file in `src/ui/hud/`, already registered in `HudScene.parts`) — it plans the upcoming wave, so the halved shape counts fall out for free; T0071 adds only a small muted-blue "quiet" chip at the card's left edge, on quiet waves only.
- `tests/core/waves.test.ts` — unit tests for the new core rules (extend the existing import line).

### Interfaces
```ts
// src/core/waves.ts  (all pure, deterministic — no rng)
/** Every 4th wave is a quiet breather wave (wave 0 is not). */
export function isQuietWave(wave: number): boolean;
/** A quiet wave's enemy count: half the usual, rounded up, minimum 3. */
export function quietCount(total: number): number;
/** The multiplier a kill's base gold takes on wave `wave` (quiet waves pay double). */
export function quietGoldMul(wave: number): number;
/** Halve a planned wave: keep every other spawn (same types/proportions, fewer). */
export function quietHalve(spawns: WaveSpawn[]): WaveSpawn[];
```
`planWave(wave, rng, enemies): WavePlan` keeps its signature; on a quiet wave it returns `quietHalve` of the usual plan. `EnemySystem.strike` gains an import of `quietGoldMul` from `../core/waves`.

### Steps
1. `src/core/waves.ts` — add the four quiet functions:
```ts
export function isQuietWave(wave: number): boolean {
  return wave > 0 && wave % 4 === 0;
}
export function quietCount(total: number): number {
  return Math.max(3, Math.ceil(total / 2));
}
export function quietGoldMul(wave: number): number {
  return isQuietWave(wave) ? 2 : 1;
}
/**
 * A quiet wave keeps every other enemy: same types and proportions, half the count.
 * A kept spawn takes on the gaps of the spawn(s) that left, so the kept enemies still
 * arrive on schedule; the first kept one stays at delay 0.
 */
export function quietHalve(spawns: WaveSpawn[]): WaveSpawn[] {
  const want = quietCount(spawns.length);
  if (Math.ceil(spawns.length / 2) < 3) return spawns.slice(0, want); // the min-3 floor wins
  const kept: WaveSpawn[] = [];
  for (let i = 0; i < spawns.length; i += 2)
    kept.push({ enemy: spawns[i]!.enemy, delaySec: i === 0 ? 0 : spawns[i]!.delaySec + spawns[i - 1]!.delaySec });
  return kept;
}
```
2. `src/core/waves.ts` — `planWave`: fold its two return paths into one, then halve. (Wave 4 has no ramer (wave 8+) or dasher (wave 5+), so `reserved.length === 0` and it takes the early return — the halving must sit after BOTH paths.)
```ts
  const reserved = [...rampSpawns, ...dashSpawns];
  let finalSpawns: WaveSpawn[];
  if (reserved.length === 0) {
    finalSpawns = spawns;
  } else {
    // Interleave the rampers and dashing ones evenly through the wave (no rng: seeded waves stay stable).
    let t = 0;
    const at: { enemy: string; t: number }[] = spawns.map((s) => {
      t += s.delaySec;
      return { enemy: s.enemy, t };
    });
    const span = t + waveSpacing(wave) * 1.5;
    reserved.forEach((enemy, i) => at.push({ enemy, t: ((i + 0.5) / reserved.length) * span }));
    at.sort((a, b) => a.t - b.t);
    finalSpawns = at.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.t - at[i - 1]!.t }));
  }
  if (isQuietWave(wave)) finalSpawns = quietHalve(finalSpawns);
  return { number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave) };
```
Non-quiet waves are byte-identical (the guard is false, `finalSpawns` is the usual list).
3. `src/systems/EnemySystem.ts` — in `strike()`, T0054 already multiplies the base gold by its last-stand multiplier. Fold the quiet multiplier into that SAME base gold as a product; the Mint bonus (and future combo) stay OUTSIDE it:
```ts
const paid = this.run.addKill(
  e.def.gold * lastStandMul(this.run.wave) * quietGoldMul(this.run.wave)
  + (cell ? mintGoldBonus(this.towers(), cell, payload.source) : 0),
);
```
(`lastStandMul` = whatever T0054 named it — T0054 lands first, chained on purpose.) The existing `popText(`+${paid}`)` then shows the doubled number with no FxSystem change.
4. T0015's wave-preview card — it plans the upcoming wave (`this.run.wave + 1`) through `planWave`, so on a quiet wave its shape counts are already halved. When building the card, if `isQuietWave(this.run.wave + 1)` draw a small muted-blue "quiet" chip at the card's left edge and inset the shape row to its right so nothing crowds (must still fit 412x915 and 1280x720); on a non-quiet wave draw no chip and lay shapes as today. Create the chip only on quiet waves (the card is rebuilt each wave, so there is no hide/show state to track). The hue is blue (relief), never the red leak-warning.
5. `tests/core/waves.test.ts` — add the tests below.

### Pitfalls
- **Wave 4 exits `planWave` early** (no ramer/dasher reserved), so a naive halving of only the final `at.map(...)` would leave it unhalved — hence the single-exit refactor.
- **Halve by stride, not truncation.** Every-other-spawn keeps the same types/proportions and gives exactly `ceil(n/2)`; first-N skews the mix (wave 4's walkers come in same-type groups).
- **No `rng` in the halving** — it is positional, so seeded waves stay stable and it must not consume `run.rng`.
- **Mint (and future combo) are on top, never doubled:** the multiplier hits `e.def.gold` only; the `mintGoldBonus(...)` term is added after the product.
- **The pop is free:** `paid` from `addKill` is the doubled base gold + Mint, and `popText` already prints `+${paid}`.
- **Min-3 floor:** a block-heavy seeded wave-4 plan can be short, so when `ceil(n/2) < 3` keep the first 3 (truncation is fine at that size).
- **Clean/streak/Momentum need no change:** `clearWave()` already bumps `cleanWaves` when `leaksThisWave === 0`, so a held-clean quiet wave pops the Clean chip and counts like any clean wave; lives/wave-escalation/enemy types are untouched.
- **Preview counts are automatic** (they come from `planWave`); the only card change is the chip. If T0015's card pre-computes counts another way, run that list through `quietHalve` instead.

### Tests
`tests/core/waves.test.ts` (adds unit tests because T0071 adds rules in `src/core`):
```ts
it('isQuietWave: every 4th wave, not wave 0', () => {
  expect([0,1,2,3,4,5,8,12].map(isQuietWave)).toEqual([false,false,false,false,true,false,true,true]);
});
it('quietGoldMul: double on quiet waves, 1 otherwise', () => {
  expect([1,3,4,5,8,12].map(quietGoldMul)).toEqual([1,1,2,1,2,2]);
});
it('quietCount: half rounded up, minimum 3', () => {
  expect([2,3,4,5,6,7,8,10].map(quietCount)).toEqual([3,3,3,3,3,4,4,5]);
});
it('quietHalve: keeps every other spawn, same types, delays take on the gaps', () => {
  const full = [
    { enemy: 'dot', delaySec: 0 }, { enemy: 'dart', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
    { enemy: 'dot', delaySec: 1 }, { enemy: 'dart', delaySec: 1 },
  ];
  expect(quietHalve(full)).toEqual([
    { enemy: 'dot', delaySec: 0 },
    { enemy: 'block', delaySec: 2 }, // own 1 + the dropped dart's 1
    { enemy: 'dart', delaySec: 2 },
  ]);
  expect(quietHalve(full.slice(0, 4))).toEqual([ // ceil(4/2)=2 < 3, the min-3 floor wins
    { enemy: 'dot', delaySec: 0 }, { enemy: 'dart', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
  ]);
});
it('a quiet wave sends between 3 and half the usual budget, deterministically', () => {
  for (const wave of [4, 8, 12, 16, 20, 24]) {
    const a = planWave(wave, new Rng(wave), ENEMIES);
    expect(a.spawns).toEqual(planWave(wave, new Rng(wave), ENEMIES).spawns); // no rng in the halving
    expect(a.spawns.length).toBeGreaterThanOrEqual(3);
    expect(a.spawns.length).toBeLessThanOrEqual(Math.ceil(waveBudget(wave) / 2)); // full plan ≤ budget, so quiet ≤ half
  }
});
it('non-quiet waves are not halved', () => {
  for (const wave of [1, 2, 3, 5, 6, 7, 9, 10, 11, 13]) {
    const plan = planWave(wave, new Rng(wave), ENEMIES);
    expect(plan.spawns.length).toBeGreaterThan(0);
    expect(plan.spawns.length).toBeLessThanOrEqual(waveBudget(wave)); // the whole budget is fair game
  }
});
```
