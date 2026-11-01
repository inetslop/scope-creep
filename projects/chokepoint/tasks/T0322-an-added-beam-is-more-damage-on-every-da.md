---
id: T0322
title: An added Beam is more damage, on every damage tower
assignee: cachyos-x8664
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T01:07:29Z
---

## Goal
The owner's call: Beam's added form becomes a plain **damage boost** that works on every tower that deals damage, not only on a beam tower. Today (T0316) an added Beam adds a flat 5/7/9 per second to a beam tower's line and does nothing on any other tower.

## Details
- **The added form:** "+N% damage" per copy, tiered Common < Rare < Epic. The architect picks the three numbers (each tier line within the 56-char cap). Copies add up into one sum per tower (two Common copies: +2N%), then multiply the tower's damage once.
- **What it boosts, per attack kind:** every damage the tower deals: shot hits (and their pierce and burst hits), spray pellets, pulse hits and the bolts a pulse fires, the beam's ticks (main line and rays), and the burns the tower sets (their per-second rate).
- **mark, rally and the 0-damage supports** (Frost first, Haste, Mint, Toll): nothing, there is no damage to boost. Acceptable: the card line says it is damage.
- **Gone:** the flat per-second addition to a beam tower's line. A beam tower keeps its look of one width step thicker per added Beam (it is now the boost's read on a beam); any other damage tower shows its added Beams the way the other added augments show in `entities/towerLook.ts` (one tick per copy).
- **Card lines:** Beam's `description` and its `asAdded` per tier, e.g. "+N% damage." `asTower` is unchanged.
- **Shown:** the tower panel's line (`describeSpec`) shows the boosted numbers; the "≈ N/s" line (`core/towerDps.ts`), the codex and the what-if preview carry it from the def.

## Acceptance criteria
- [ ] Unit tests: a Bolt tower with one added Common Beam deals N% more per hit; two copies deal 2N% more; a Common Beam tower with one added Common Beam beams N% more per second; an Ember tower's burn rate grows by N%.
- [ ] A Mark, Rally or Frost-first tower with an added Beam behaves exactly as without it.
- [ ] No flat beam addition is left; the beam tower still thickens per added Beam.
- [ ] The tier lines fit the 56-char cap; the panel and "≈ N/s" show the boost.

## Design (architect, desktop)

### Files
- edit `src/content/types.ts` - `TierValues`: replace `addedBeamDps` with `addedDamagePct`; `AddedForm`: delete the `beam?: { dps: number }` field (and its comment), add `damagePct?: number` right after `damageMul`. Leave `FirstForm.beam` alone.
- edit `src/core/tiers.ts` - in `tierAdded()` only: delete the `beam: a.beam ? ... : undefined` line from BOTH branches (common branch line 63, tier branch line 77); in the tier branch add `damagePct: t.addedDamagePct ?? a.damagePct,` after the `push` line. Do NOT touch `tierFirst`.
- edit `src/content/augments/beam.ts` - new added form, tier values, card lines, header comment.
- edit `src/core/augments.ts` - the whole mechanic: import `beam`, new `beamCount` spec field, replace the beam block in `towerSpec()`, one-decimal cleaning in `describeSpec()`.
- edit `src/entities/towerLook.ts` - `beamTicks` helper + 3 `barrelLook` branches show one tick per added Beam on damage towers.
- edit `src/core/towerDps.ts` - one header-comment word: "already fatter by each Beam added" → "already boosted by each Beam added". No logic change (it reads the folded spec).
- edit `src/systems/BeamSystem.ts` - line 68 comment: `// no beam of its own, and added Beams only fatten one` → `// no line: only a beam-first tower beams`. No logic change.
- edit `tests/content.test.ts` - delete line 94 (`if (t.addedBeamDps !== undefined) ...`) - the type field is gone.
- edit `tests/core/augments.test.ts` - rewrite the beam `describe` block's changed tests (lines 223-248, 250-256).
- edit `tests/core/towerDps.test.ts` - replace the two added-Beam tests (lines 64-70).

### Interfaces
```ts
// content/types.ts
export interface TierValues { /* ... */ addedDamagePct?: number; /* replaces this copy's added damage boost, as a fraction (Beam) - where addedBeamDps was */ /* ... */ }
export interface AddedForm { /* ... */ damageMul?: number; damagePct?: number; /* this fraction of the tower's damage, per copy, on every damage it deals; the copies add up (Beam) */ /* ... */ }
// core/augments.ts - new TowerSpec field, next to beamAdds:
beamCount: number; // Beams in the tower: one tick per copy (on a beam tower the first is its own line)
```
Numbers (the three tiers): Common `0.1`, Rare `0.15`, Epic `0.2`. Card lines: `asAdded: '+10% damage.'`, rare `'+15% damage.'`, epic `'+20% damage.'` (all well under the 56-char cap). `asTower` lines unchanged. `description: 'A continuous beam on the furthest enemy. Added: +10% damage.'`

### Steps
1. **types.ts**: make the three `AddedForm`/`TierValues` edits above.
2. **tiers.ts**: make the `tierAdded` edits.
3. **beam.ts**: `added: { damagePct: 0.1 }`; tiers `rare: { beamDps: 20, addedDamagePct: 0.15, asTower: 'Beams the furthest enemy: 20 per second, range 3.5.', asAdded: '+15% damage.' }`, `epic: { beamDps: 28, addedDamagePct: 0.2, asTower: 'Beams the furthest enemy: 28 per second, range 3.5.', asAdded: '+20% damage.' }`; new `asAdded`/`description`; header comment now says: added anywhere it is a plain damage boost, +N% per copy, copies add up; on a beam tower the line reads it as one width step per copy.
4. **core/augments.ts**: add `import { beam } from '../content/augments/beam';` (after the `anchor` import). Add `beamCount: number` to the `TowerSpec` interface (doc above), `beamCount: 0` to `EMPTY` and to the spec object in `towerSpec()`; fix the `beamDps`/`beamAdds`/`damageMul` doc comments (rate is its own tier rate boosted by added Beams; width step per copy; multiplier includes the added Beams' boost). Replace the beam block (lines 219-228) with:
```ts
  // Beams in any slot: the first is the tower's own line; each added one boosts the tower's damage —
  // +N% per copy, the copies adding up into one sum multiplied once (a beam tower's line is its
  // damage; on other kinds their hits, bolts and burns) — and on a beam tower one width step.
  let boostPct = 0;
  for (let i = 0; i < augments.length; i++) {
    const c = augments[i]!;
    if (getAugment(c.id).id !== beam.id) continue;
    spec.beamCount += 1;
    if (i === 0) spec.beamDps = f.beam?.dps ?? 0;
    else {
      boostPct += tierAdded(getAugment(c.id), c.tier).damagePct ?? 0;
      if (spec.kind === 'beam') spec.beamAdds += 1;
    }
  }
  if (boostPct > 0) {
    const boost = 1 + boostPct;
    spec.damage *= boost;
    spec.boltDamage *= boost;
    spec.damageMul *= boost; // the burn it sets burns at burn.dps × damageMul
    if (spec.kind === 'beam') spec.beamDps *= boost;
  }
```
Add a module function near `splashHits`: `/** The cleanest form of a number for a line: 15.400000000000002 reads 15.4. */ function cleanNum(n: number): number { return Math.round(n * 1e10) / 1e10; }` and in `describeSpec()` use it in the burn line (`${cleanNum(spec.burn.dps * spec.damageMul)} per second`) and the beam line (add `const rate = cleanNum(spec.beamDps);`, use `rate` in both beam texts and `cleanNum(spec.beamDps / 2)` in the scorch text).
5. **towerLook.ts**: add `/** One barrel tick per Beam added — only where the boost lands, on a tower that deals damage. */ function beamTicks(spec: TowerSpec): number { if (spec.damage <= 0 && spec.bolts <= 0 && spec.beamDps <= 0 && spec.burn === undefined) return 0; return spec.beamCount; }`; in `barrelLook`: gust branch `beamTicks: beamTicks(spec)`; spray branch add `beamTicks: beamTicks(spec)`; beam branch keeps `beamTicks: spec.beamAdds`; generic branch `beamTicks: beamTicks(spec), // one tick per Beam added, when the tower deals damage (its boost reads)`. The barrel painter already draws these ticks - no art change.
6. **towerDps.ts / BeamSystem.ts**: the two one-line comment fixes.
7. **tests/content.test.ts**: delete the `addedBeamDps` line.
8. **tests/core/augments.test.ts**, beam block: replace 'a Beam added to a beam tower fattens...' with: `expect(spec('beam','beam')).toMatchObject({ kind:'beam', beamAdds:1, beamCount:2 }); expect(spec('beam','beam').beamDps).toBeCloseTo(15.4); expect(spec('beam','beam','beam')).toMatchObject({ beamAdds:2, beamCount:3 }); expect(spec('beam','beam','beam').beamDps).toBeCloseTo(16.8);`. Replace 'a tiered added Beam fattens...' with: `towerSpec([copy('beam'), copy('beam','rare')]).beamDps` toBeCloseTo 16.1; epic → 16.8; `towerSpec([copy('beam','rare'), copy('beam','epic')]).beamDps` toBeCloseTo 24. Replace 'a Beam added to a non-beam tower does nothing' with: `spec('bolt','beam').damage` ≈ 13.2; `spec('bolt','beam','beam').damage` ≈ 14.4 (two copies: 2N%, one sum); `spec('spray','beam').damage` ≈ 4.4; `spec('frost','bolt','beam').boltDamage` ≈ 13.2; `spec('ember','beam').damageMul` ≈ 1.1; and for `['mark','rally','frost','mint','toll','haste','anchor','push']` both `towerDps(spec(first,'beam')) === towerDps(spec(first))` and `describeSpec(spec(first,'beam')) === describeSpec(spec(first))`; plus `describeSpec(spec('ember','beam'))` toBe `'Sets ablaze the furthest enemy: 3.3 per second for 3 s.'`. Card-lines test: `tierAddedLine(beam, t)` toBe `'+10% damage.'` / `'+15% damage.'` / `'+20% damage.'`. Tower-line test: `describeSpec(spec('beam','beam'))` toBe `'Beams the furthest enemy: 15.4 per second.'`; `describeSpec(towerSpec([copy('beam','rare'), copy('beam','epic')]))` toBe `'Beams the furthest enemy: 24 per second.'`; keep the `describeSpec(spec('bolt','beam')) === describeSpec(spec('bolt'))` line.
9. **tests/core/towerDps.test.ts**: replace the two added-Beam tests with: `towerDps(spec('beam','beam'))` ≈ 15.4; `towerDps(spec('beam','beam','rapid'))` ≈ 15.4 × 1.125; `towerDps(spec('bolt','beam'))` ≈ 19.2 × 1.1; `towerDps(spec('ember','beam'))` ≈ 3.3; and `towerDps` of `spec('mark','beam')` / `spec('rally','beam')` / `spec('frost','beam')` each 0.
10. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Delete `beam` from `AddedForm` only - `FirstForm.beam` (the first form) stays; `tierFirst` stays untouched.
- Do NOT round displays with `toFixed(1)`: `tests/core/ember.test.ts:76` asserts `'2.25 per second'` (Ember+Rapid). `cleanNum` (1e10) strips float noise but keeps 2.25.
- Fold the boost once in `towerSpec()`; do not touch the attack files, EnemySystem, TowerSystem or the burn/beam consumers - they all read `spec.damage` / `spec.boltDamage` / `spec.beamDps` / `spec.damageMul`.
- `beamAdds` (width step) counts only on beam towers; `beamCount` counts every copy. Supports (mark, rally, frost, push, anchor, mint, toll, haste) get no tick - the `beamTicks()` helper returns 0 when nothing deals damage.
- The boost multiplies the composed damage (after Rapids/tier), so `12 × 1.3 × 1.1` - tests must use `toBeCloseTo`.
- No new files, no art, no HUD, no audio; `content/augments/index.ts`, `TowerPanel`, codex and draft preview all carry the new lines from the def automatically.

### Tests
- Rewritten/added unit tests as listed in Steps 8-9 (tests/core/augments.test.ts, tests/core/towerDps.test.ts): per-hit boost N%/2N% on a Bolt tower, per-second boost on a Beam tower, burn rate +N% on Ember, zero effect on mark/rally/frost-first, no flat addition left (beamDps ≈ 15.4, not 19) with beamAdds still 1/2, and the tier card lines.
