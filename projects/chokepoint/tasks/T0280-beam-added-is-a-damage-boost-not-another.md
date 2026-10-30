---
id: T0280
title: Beam added is a damage boost, not another beam
assignee: cachyos-x8664
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T10:37:56Z
claimed_at: 2026-10-30T20:30:05Z
epic: E4
---

## Goal
Adding more targets is Bolt's job: on a Beam tower each Bolt already adds a ray (T0130). Today an added Beam also adds a second line on the nearest enemy, which blurs the two roles. Make an added Beam a plain damage boost instead, so Bolt means more beams and Beam means stronger beams, on any tower.

## Details
- **New added form:** +25% / +35% / +50% damage at Common / Rare / Epic, multiplicative per copy like the other multipliers (two Common Beams added give ×1.5625).
- **What it multiplies:** the tower's own damage on every attack kind:
  - shot damage on Bolt, Lance, Rapid and Reach towers;
  - pellet damage on Spray;
  - pulse damage on Splash;
  - Bolt-added bolts on pulse towers (`boltDamage`);
  - the beam's per-second rate on a Beam tower, on every ray (Bolt rays included).

  It also boosts burn: once the inbox task "Beam and burn deal damage in ticks" lands, burn ticks scale with the tower's damage multipliers, and this boost is one of them. On towers whose only effect is a non-damage one (Frost, Anchor, Push, Mint, Rally, Mark, Toll) it does nothing, the same honesty rule as before.
- **Remove the second line completely:** `added.beam`, `addedBeamDps`, `spec.beamExtras`, the nearest-enemy extra line in `BeamSystem`/`core/beam.ts`, its drawing and sound, and its term in `core/towerDps.ts`. Rays from Bolt are unaffected.
- **Card lines:**
  - `asAdded`: "+25% damage." at Common, "+35% damage." at Rare, "+50% damage." at Epic.
  - `description`: "A continuous beam on the furthest enemy. Added: +25% damage."
  - `asTower` is unchanged.
- **Look:** keep T0133's one tick per added Beam around the orb, and the existing tick on other towers' barrels. They now mean "boosted" instead of "extra line".
- **Panel:** the tower panel's description and its damage-per-second line (T0084) include the boost. For example, a Common Beam with a Common Beam added reads 6 × 1.25 = 7.5 per second, or 17.5 if the balance task has landed first.
- **Order with the balance task:** the inbox task "Balance: Beam hits too softly" also edits `beam.ts`. Whichever lands second rebases onto the other. This task changes only `added` and the tiers' added fields.
- **Tests:** replace the extra-line tests in `tests/core/beam*.test.ts` and `towerDps.test.ts` with boost tests. `tierStrength`'s "a different added form at each rarity" still holds (25/35/50).

## Acceptance criteria
- [ ] Adding a Beam to any tower never draws a second beam line. A Beam tower with Beams added still has exactly one line, plus one per Bolt.
- [ ] An added Beam multiplies the tower's damage by 1.25 / 1.35 / 1.5 by tier, on shots, pellets, pulses and beam rays, and stacks multiplicatively. It changes nothing on a no-damage tower, and boosts burn ticks through the tick task's damage scaling.
- [ ] Draft cards read "+25% damage." / "+35% damage." / "+50% damage." by tier, inside the 56-character tier cap.
- [ ] The panel's damage-per-second figure includes the boost. No `beamExtras` or extra-line code remains.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- edit `src/content/types.ts` - `AddedForm`: delete the `beam?: { dps: number }` field (line 184-185). `TierValues`: replace `addedBeamDps?: number` (line 85-86) with `addedDamageMul?: number` commented `/** Replaces this copy's added damage multiplier (Beam). */`; in the `TierValues` doc comment add `addedDamageMul` to the "replace the ADDED form's" list.
- edit `src/core/tiers.ts` - `tierAdded()`: drop `beam: ...` from the common-branch object (line 63) and from the non-common return (line 77); add `damageMul: t.addedDamageMul ?? a.damageMul,` as the first line of that non-common object (before `rateMul`).
- edit `src/content/augments/beam.ts` - the whole new file, see Steps.
- edit `src/core/beam.ts` - delete the extra-line logic; `beamLines` becomes `beamMain` (whole new function in Steps).
- edit `src/core/augments.ts` - `TowerSpec`: replace `beamExtras: number[]` with `beamBoosts: number` (comment: `/** Beams added after the first: each one boosts the tower's damage and shows one tick. */`); in `EMPTY` and the `towerSpec` init object replace `beamExtras: []` with `beamBoosts: 0`; import `beam` from `'../content/augments/beam'` (next to the `bolt` import); in the added-form loop add the beam-rate boost accumulator; rewrite the beam second-pass loop and the `describeSpec` beam lines (Steps).
- edit `src/core/towerDps.ts` - beam term becomes `dps += (1 + spec.beamRays) * spec.beamDps * m;`; update the header comment (drop "and a line per Beam added").
- edit `src/systems/BeamSystem.ts` - remove all extra-line code (held/holds resize, beamLines call, extras ticks, comments).
- edit `src/entities/towerLook.ts` - 3× `spec.beamExtras.length` → `spec.beamBoosts` (lines 44, 48, 61); line 61 comment: `// a Beam added to any tower boosts it: one tick each`.
- edit `src/entities/Tower.ts` - line 152 `orbTexture(this.scene, color, spec.beamBoosts)`.
- edit `tests/content.test.ts` - line 94 → `if (t.addedDamageMul !== undefined) expect(t.addedDamageMul).toBeGreaterThan(1);`
- edit `tests/core/beam.test.ts`, `tests/core/augments.test.ts`, `tests/core/towerDps.test.ts` - replace extra-line tests with boost tests (Steps).

### Interfaces
```ts
// content/types.ts
interface TierValues { /* addedBeamDps removed */ addedDamageMul?: number; /* … */ }
interface AddedForm { /* beam?: { dps: number } deleted; damageMul stays */ }
// core/augments.ts
interface TowerSpec { /* beamExtras deleted */ beamBoosts: number; /* … */ }
// core/beam.ts (replaces beamLines; rayTargets and inBeamRange unchanged)
export function beamMain<C extends TargetCandidate>(
  heldMain: C | undefined,
  enemies: readonly C[],
  x: number,
  y: number,
  range: number,
  mainTower: boolean,
): number {
  return mainTower && heldMain && inBeamRange(heldMain, x, y, range)
    ? enemies.indexOf(heldMain)
    : pickTarget(x, y, range, enemies);
}
```
Doc comment for `beamMain`: the main line's target this frame (index, -1 when nothing in range); a Beam-first tower is sticky, a non-beam-first tower always follows the furthest along.

### Steps
1. `beam.ts` becomes exactly: header comment rewritten to "added to any tower it boosts that tower's damage (its own rate on a beam tower)"; `description: 'A continuous beam on the furthest enemy. Added: +25% damage.'`; `asAdded: '+25% damage.'`; `added: { damageMul: 1.25 }`; tiers: `rare: { beamDps: 8, addedDamageMul: 1.35, asTower: 'Beams the furthest enemy: 8 per second, range 4.5.', asAdded: '+35% damage.' }`, `epic: { beamDps: 10, addedDamageMul: 1.5, asTower: 'Beams the furthest enemy: 10 per second, range 4.5.', asAdded: '+50% damage.' }`. `asTower` common and `first` unchanged.
2. `core/augments.ts` `towerSpec`: add `let beamDamageMul = 1;` next to `let rootSec = 0;`. In the `augments.slice(1)` loop, right after the `beamRapidMul` line, add: `if (spec.kind === 'beam' && e.damageMul && !e.rateMul) beamDamageMul *= e.damageMul;` with comment: `// A Beam added to a beam tower boosts the beam's own rate (the Rapid keeps its net rate×damage in beamRapidMul, so a copy with a rateMul is counted there, not here).` Replace the beam second-pass loop (lines 212-220) with:
```ts
  // Beams in any slot: the first is the tower's own line, boosted by every Beam added to this
  // tower (one look tick each). The rate is its own stat (like the burn's rate): never scaled
  // by the damage and rate multipliers of the other augments.
  for (let i = 0; i < augments.length; i++) {
    const c = augments[i]!;
    if (getAugment(c.id).id !== beam.id) continue;
    if (i === 0) spec.beamDps = (f.beam?.dps ?? 0) * beamDamageMul;
    else spec.beamBoosts += 1;
  }
```
   (Baking the boost into `spec.beamDps` makes the rays, the scorch in `core/beamShapes.ts`, `towerDps` and the panel pick it up with no further changes.)
3. `describeSpec`: delete the two `beamExtras` lines (302-303); in the beam branch format rates noise-free with a new module-level helper `function rateText(v: number): string { return String(Math.round(v * 100) / 100); }` — the beam lines read `... ${rateText(spec.beamDps)} per second` and the scorch `at ${rateText(spec.beamDps / 2)} per second`. (Needed: 6 × 1.35 = 8.100000000000001 in JS.)
4. `BeamSystem.ts`: import `beamMain` instead of `beamLines`; header comment: a Beam added boosts the rate (no line of its own). `if (t.spec.beamDps <= 0) continue;` (line 72). `size = 1 + t.spec.beamRays` (line 84) and both resize blocks simplify to `next[0] = old[0]` / `next[0] = held?.[0]` with the rest empty (rays sit after the main; ray slots start free). `const main = beamMain(held[0], this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');`; delete the `lines` variable, the `for (let i = 0; i < lines.length; i++) targets.push(lines[i]);` loop, and the extras tick loop (lines 134-137). Main tick, pierce, scorch, rays, holds, drawing loop (`i = 1..now.length` now covers rays only), hum and `broken()` stay as they are.
5. Tests. `beam.test.ts`: delete the seven extra-line `it`s (lines 60-143); the `beamLines` describe becomes `beamMain` — main locks the furthest (`beamMain(undefined, [a, b, c], 0, 0, R, true)` → 1), sticky (hold 0 after `b.distance = 40`), re-take on death and on leaving range, a non-beam-first tower re-takes the new furthest (`mainTower` false), nothing in range → -1. `inBeamRange`/`rayTargets` describes unchanged. `augments.test.ts` beam describe: `spec('beam')` matches `{ damage: 0, beamDps: 6, beamBoosts: 0 }`; `spec('bolt', 'beam').damage` ≈ 12 × 1.25 and `beamBoosts` 1; two added commons → 12 × 1.25 × 1.25; `spec('beam', 'beam').beamDps` ≈ 7.5 and `spec('beam', 'bolt', 'beam')` has `beamRays` 1 and the same boosted `beamDps`; tiered: `towerSpec([copy('bolt'), copy('beam', 'rare')]).damage` ≈ 12 × 1.35, epic ≈ 12 × 1.5, `towerSpec([copy('beam'), copy('beam', 'epic')]).beamDps` ≈ 9; no-damage towers: `spec('frost', 'beam').damage` = 0; card lines `'+25% damage.'` / `'+35% damage.'` / `'+50% damage.'`; `describeSpec(spec('beam', 'beam'))` = `'Beams the furthest enemy: 7.5 per second.'`; keep the Bolt-ray and Rapid tests unchanged, and keep `'Beams 2 enemies: 6 per second each.'`. `towerDps.test.ts`: replace the last `it` with `towerDps(spec('beam', 'beam'))` ≈ 6 × 1.25, `spec('beam', 'beam', 'beam')` ≈ 6 × 1.25², `spec('beam', 'bolt', 'beam')` ≈ 15, `spec('beam', 'beam', 'rapid')` ≈ 6 × 1.25 × 1.125, plus `towerDps(spec('bolt', 'beam'))` ≈ 19.2 × 1.25 and `towerDps(spec('frost', 'beam'))` = 0.

### Pitfalls
- **Rapid double-count on a beam tower**: Rapid's added `damageMul` (0.75) already rides in `beamRapidMul` as net rate×damage. The new accumulator must skip any copy with a `rateMul`, or `[beam, rapid, beam]` would count 0.75 twice.
- **Float noise in the panel line**: 6 × 1.35 = 8.100000000000001 — only via `rateText`; never round `spec.beamDps` itself (damage math stays exact).
- **Don't touch the first form**: `FirstForm.beam`, `TierValues.beamDps`, `tierFirst`, the `TowerSystem.ts:184` `f.beam` check, `beamDiscTexture` — all stay; only the added form disappears.
- **`towerDps` shot/pulse/spray/bolt paths already multiply** `e.damageMul` into `spec.damage`/`spec.boltDamage` — do not add a second application; only the beam tower needs the new accumulator.
- **Panel layout**: every changed line gets shorter (the card line drops from 48 to 13 chars), so no `TowerPanel`/card change is needed; `statsLine`'s `beamDps.toFixed(0)` keeps rounding 7.5 → 8, consistent with its other rounded stats.
- **Burn**: this task adds nothing to `core/burn.ts` — the tick task T0281 scales burns through the tower's damage multipliers and `e.damageMul` is already what it will read.
- **Rebase with T0279** (also edits `beam.ts` + these tests): our edit there is limited to `description`, `asAdded`, `added` and the tiers' added fields/lines.

### Tests
- Rewritten: `tests/core/beam.test.ts` (main-line rule only), `tests/core/augments.test.ts` (boost stacking, tiers, no-damage no-op, card lines, describeSpec), `tests/core/towerDps.test.ts` (boost on beams and shots, multiplicative stacking, Rapid interplay). Updated: `tests/content.test.ts` line 94 (`addedDamageMul > 1`). `tests/core/tierStrength.test.ts` passes untouched: 1.25 / 1.35 / 1.5 differ per tier. Then `npm run check` and `npm run smoke`.
