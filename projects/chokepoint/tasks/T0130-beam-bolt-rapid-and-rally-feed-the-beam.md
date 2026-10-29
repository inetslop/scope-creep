---
id: T0130
title: "Beam combos I: Bolt adds a ray, Rapid and Rally feed the beam"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
epic: E4
design_attempts: 1
---

## Goal
A tower with Beam as its first augment ignores almost every augment added to it today: Bolt, Rapid and Rally do nothing, so building onto a Beam tower is a wasted slot. Make the attack-strength augments change the beam the way a player expects from their card lines, starting with the most obvious one: Bolt gives the beam another ray.

## Details
Applies to a tower whose **first** augment is Beam (the beam tower). Beam added to other towers is unchanged.
- **Bolt added ("One more shot each attack"):** +1 ray per Bolt. Each extra ray is a full beam at the tower's beam rate (6/8/10 per second by the Beam's tier), locked on the next enemy furthest along in range that no other ray of this tower holds (ray 1 the furthest, ray 2 the second furthest, ...). With fewer enemies than rays, the spare rays are off. Each ray retargets on its own the instant its target dies or leaves range. Bolt's own tier does not change the ray's rate.
- **Rapid added ("Attacks 50% faster, hits 25% lighter"):** multiplies the beam's per-second damage by the same net factor it gives a shot tower: 1.5 x 0.75 = x1.125 (Rare 1.65 x 0.75, Epic 1.85 x 0.75), on every ray and every Beam-added line of this tower. Stacks multiplicatively like it does on shots.
- **Rally:** a beam tower inside a Rally ring, or with Rally added, gets its per-second damage x1.10 per rally (the rally's "attacks 10% faster"), on every ray and line.
- **Look:** each extra ray is drawn exactly like the main beam (same color, same width, same tick at the hit end), each from the barrel.
- **Panel:** the tower panel's description says it, e.g. "Beams the 2 furthest enemies: 9 per second each". The panel's damage-per-second line (T0084) counts every ray and the multipliers.

## Acceptance criteria
- [ ] Beam first + 1 Bolt with 2+ enemies in range: two full-rate beams on the two enemies furthest along; with 1 enemy, one beam.
- [ ] Beam first + 2 Bolts: three rays on three different enemies.
- [ ] Beam first + Rapid (Common): every ray deals 1.125x the beam's per-second damage; a unit test pins the value.
- [ ] A beam tower in a Rally ring deals 1.10x per second; a unit test pins it.
- [ ] Kills by any ray pay through the normal kill path (gold, combo, Mint, the kills line), attributed to the tower.
- [ ] The tower panel's text and its damage-per-second line reflect the rays and multipliers.

## Design (architect, baby-mama)

Beam gains two addable upgrades — Bolt adds a beam ray, Rapid speeds the beam — carried by two new spec fields (`beamRays`, `beamRapidMul`), a stateless ray picker in `core/beam.ts`, a beam branch in `towerDps`, per-frame ray/extra ticks in `BeamSystem`, and a `describeSpec` line.

### Files
1. `src/core/augments.ts` — `TowerSpec` + `EMPTY` + `towerSpec` init: two new fields. Added loop: extend the shot/pulse chain (kind is fixed by the first augment before the loop, so gating on `spec.kind === 'beam'` is safe). `describeSpec` beam case: one-line change.
2. `src/core/beam.ts` — new export `rayTargets` (pure, farthest-first, reuses `pickTargets` from `core/targeting.ts` — **no change to targeting.ts**). Refactor `beamLines` to take main and extras separately (behavior preserved).
3. `src/core/towerDps.ts` — new optional param, new beam branch.
4. `src/systems/BeamSystem.ts` — held layout, per-frame ray mirror, resize fix, ticks scaled by `m`.
5. `src/ui/hud/TowerPanel.ts` — one line in `build()`.
6. `tests/core/augments.test.ts` — new spec pins + one new `describeSpec` string.
7. `tests/core/beam.test.ts` — adapt call shapes to the new `beamLines` signature (assertions unchanged); new `rayTargets` tests.
8. `tests/core/towerDps.test.ts` — beam DPS cases.

### Interfaces
- `TowerSpec` (core/augments.ts): `beamRays: number` (0) and `beamRapidMul: number` (1), next to `beamDps`/`beamExtras`. Both only grow on beam towers: `×1.125` per common Rapid = `rateMul * damageMul` (1.5 × 0.75).
- `rayTargets(enemies, x, y, range, main, count)` (core/beam.ts; same `enemies`/`C` types as `pickTargets`/`beamLines`): dense list, ≤ `count`, of in-range active enemies, farthest along first, **excluding `main`**. Stateless — no memory, no RNG.
- `beamLines(heldMain: C | undefined, heldExtras: readonly (C | undefined)[], enemies, x, y, range, mainTower): { main: number; lines: (C | undefined)[] }` (core/beam.ts) — same sticky-main and drop/retake rules as today; only the caller's held array is split because rays now sit between main and extras.
- `towerDps(spec: TowerSpec, rallyRateMul = 1): number` — new beam branch, `m = spec.beamRapidMul * rallyRateMul`:
  `dps += (1 + spec.beamRays) * spec.beamDps * m + spec.beamExtras.reduce((a, b) => a + b, 0) * m`.
  Shot/pulse/spray and burn terms unchanged (existing tests stay green).
- BeamSystem held: `size = 1 + spec.beamRays + spec.beamExtras.length`, layout `[main, ...rays, ...extras]`. Ray slots are re-mirrored statelessly each frame from `rayTargets` (they are NOT sticky). Ticks: main and each ray at `spec.beamDps * m * dt`, extra `i` at `spec.beamExtras[i] * m * dt`, `m = spec.beamRapidMul * t.rallyRateMul`. Draw loop already iterates the held array (rays come along for free); `aimAt` stays on main only. `broken()` unchanged — every held target is in range, rays by construction.
- `describeSpec` beam line: lone beam (`beamRays === 0`) stays **byte-identical** (test-pinned); new wording only when `beamRays > 0`: `` `Beams ${beams} enemies: ${spec.beamDps} per second each` `` — base rate, no rapid/rally scaling (the panel's `≈ N/s` line carries the scaled number, matching existing style). Extras lines unchanged.

### Steps
1. core/augments.ts — add `beamRays: 0, beamRapidMul: 1` to `TowerSpec`, `EMPTY`, and the `towerSpec` init (next to the `beamDps`/`beamExtras` pair). In the added loop, replace the shot/pulse chain with exactly:
   ```ts
   if (spec.kind === 'shot') spec.shots += e.extraShots ?? 0;
   else if (spec.kind === 'pulse') spec.bolts += e.extraShots ?? 0;
   else if (spec.kind === 'beam') spec.beamRays += e.extraShots ?? 0;
   if (spec.kind === 'beam' && e.rateMul) spec.beamRapidMul *= e.rateMul * (e.damageMul ?? 1);
   ```
   and the describeSpec beam case to:
   ```ts
   } else if (spec.kind === 'beam') {
     const beams = spec.beamRays + 1;
     line = beams === 1
       ? `Beams the furthest enemy: ${spec.beamDps} per second`
       : `Beams ${beams} enemies: ${spec.beamDps} per second each`;
     // existing beamExtras if/else-if lines unchanged
   ```
2. core/beam.ts — split `beamLines`' first arg into `heldMain` + `heldExtras` (same sticky-main and drop/retake rules, return shape unchanged). Add `rayTargets`: `pickTargets(...)` in range farthest-first, drop `main`, take up to `count`.
3. core/towerDps.ts — `towerDps(spec, rallyRateMul = 1)` with the beam branch from Interfaces; leave the other terms byte-for-byte.
4. systems/BeamSystem.ts — `size = 1 + t.spec.beamRays + t.spec.beamExtras.length`. Build `next`: `next[0]` = old main; old extras copied to the **new end** positions; ray slots start undefined. Resolve main via `beamLines`; then `rays = rayTargets(enemies, t.x, t.y, range, main, t.spec.beamRays)`; fill `next[1..1+beamRays-1]` from `rays`. Tick main and each ray at `spec.beamDps * m * dt`, extras at `beamExtras[i] * m * dt`. `held.set(t, next)`; draw/`aimAt` untouched.
5. ui/hud/TowerPanel.ts — `build()`: `towerDps(tower.spec, tower.rallyRateMul)`.
6. Tests as in Files 6–8 (pinned numbers in ## Tests).
7. `npm run check`, then `npm run smoke`.

### Pitfalls
- **`beamRapidMul` must be its own accumulator**: on a beam tower `spec.damage` is 0 so `damageMul` cannot flow through it, and `spec.rate` would carry only 1.5 — the pinned values need 1.125 (`rateMul * damageMul`).
- **Resize path**: the old index-based `Array.from({ length: size }, (_, i) => held?.[i])` breaks once rays sit between main and extras — copy `held[0]` to slot 0 and the old extras to the *new end* positions (ray slots start undefined).
- **One `m` everywhere**: `spec.beamRapidMul * t.rallyRateMul` must scale main, every ray, and every extra in BeamSystem, and the identical `m` must appear in `towerDps` — per-frame damage has to equal the DPS formula.
- **Chain discipline**: `beamRays +=` goes *inside* the kind if/else chain (a Bolt on a shot tower must not touch `beamRays`); `beamRapidMul *=` is a separate `if (spec.kind === 'beam' && e.rateMul)` statement.
- The lone-beam `describeSpec` string is test-pinned — keep it byte-identical; gate the new wording on `beamRays > 0` and use the base `spec.beamDps` (no rapid/rally scaling).
- `rayTargets` lives in `core/` (Phaser-free, lint-enforced) and must stay pure: reuse `pickTargets`, do not touch `pickTarget`'s inline farthest-along ordering or `core/targeting.ts` at all.
- Rays are re-mirrored statelessly each frame against the freshly resolved main — no per-tower memory, no RNG; do NOT special-case rays in the draw loop (it iterates the held array) and keep `aimAt` on main only.

### Tests
- `tests/core/towerDps.test.ts` — beam cases: lone Beam **6** (was 0 — this is the display fix); +Bolt **12**; rare lone **8**; rare+Bolt **16**; rare+Bolt+Rapid **18**; with `rallyRateMul` 1.1 → **19.8**; Beam+Beam **9**; +Rapid **10.125**. (Rare via a direct `towerSpec([copy('beam', 'rare'), ...])` call.)
- `tests/core/augments.test.ts` — `beamRays` 0/1, `beamRapidMul` 1 and 1.125 (`toBeCloseTo`); Bolt on a non-beam tower → `beamRays` 0; one new `+Bolt` `describeSpec` string; all lone-beam string pins stay green.
- `tests/core/beam.test.ts` — existing `beamLines`/`inBeamRange` assertions unchanged, only call shapes adapted to `(heldMain, heldExtras, ...)`; new `rayTargets` tests: farthest-first order, excludes main, stateless (no memory between calls), skips inactive enemies, short list when fewer are in range.
- `npm run check` (typecheck + lint + unit) and `npm run smoke` (desktop + phone browser) must pass; `tests/content.test.ts` validates content automatically (no content change).
