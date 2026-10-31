---
id: T0316
title: Beam added is a damage boost (the T0280 re-file)
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T00:35:25Z
claimed_at: 2026-10-31T00:59:13Z
epic: E4
---

## Goal
The beam stops splitting its attention: an added Beam no longer grows a second, quiet beam — it fattens the beam that is already firing, so every beam interaction (the burn it carries, its marks, its kill needles) rides on one fatter line. (T0280's re-file: the earlier file failed three times on a weak machine, so this spec is deliberately narrow — one form change and its fallout.)

## Details
- **The added form, per tier:** a flat per-second addition to the main beam's own rate — Common +5/s, Rare +7/s, Epic +9/s — additive per copy, no cap. The main beam's rate is unchanged: 14 / 20 / 28 per second (Common / Rare / Epic).
- **The second beam is gone:** no second line on the nearest enemy, no second beam damage, no second hum — removed from everywhere it appears.
- **Card lines (exact):**
  - description: "A continuous beam on the furthest enemy. Added: the beam deals 5 more per second."
  - asAdded — Common: "The beam deals 5 more per second." · Rare: "The beam deals 7 more per second." · Epic: "The beam deals 9 more per second."
  - asTower is unchanged, per tier.
- **On every attack kind:** beam — the flat addition above, per copy. shot, spray, pulse, burn, mark, rally — a Beam added to any of them does nothing: a tower without a beam has nothing to fatten. Acceptable: the card's line says exactly where it works, in the draft, the hand and the panel, so the pick is never a surprise, and the offer's other cards always carry the play.
- **The beam's interactions ride on the main beam only, unchanged in form:** the carried Ember burn, Anchor root, Push shove and Mark (T0132), the Lance pierce along the main line (T0210), the beam kill's one needle per added Spray (T0242), the Bolt ray and the Rapid/Rally feed (T0130) — all keep their existing behavior; only the beam's own rate grows. The beam hum (T0112) is one voice, on the main beam.
- **On the tower:** the beam line grows one visible step in width per added Beam — thicker with each copy, the beam's own read; no new ring, pip or mark.
- **Nothing new on screen:** the panel's added line, the "≈ N/s" line (T0084), the codex card (T0221) and the what-if preview (T0096) all carry the change from the def in their existing language.
- **Worked examples (pin these):** a Common Beam tower with one Common added Beam ticks 19/s, with two 24/s; a Rare Beam with one Epic added Beam ticks 29/s; a Bolt tower with any added Beam deals the same damage at the same rate as the same Bolt tower without it.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Beam | the beam's own rate (its first form) and the removed second beam | the added form is now a flat per-second addition to the main beam per copy; the second beam — its own target, its own hum — stops existing |
| Rapid | an added form that changes damage | Rapid re-times every attack it joins, faster and lighter; this adds only to the beam's own tick rate and touches no other attack kind |
| Mark | an added form that raises damage taken | Mark marks one enemy and multiplies every tower's damage to it; this fattens only this tower's beam, on whatever enemy it holds |
| Ember | an added form that adds ticking damage | Ember's burn ticks off the beam for 3 s on a struck target; this raises the beam's own tick rate — the burn the beam carries is unchanged |

## Acceptance criteria
- [ ] A beam tower's rate is its own tier's rate plus the flat addition of every added Beam in it (14+5, 14+5+5, 20+9, 28+9…); unit tests pin the worked examples.
- [ ] No second beam exists anywhere: no second line renders, no second beam deals damage, and no system (carried effects, the Lance pierce, the Spray needles, the hum) reads a second beam; a multi-Beam beam tower is one line, one visible step thicker per added copy.
- [ ] A Beam added to a non-beam tower (shot, spray, pulse, burn, mark or rally host) deals no damage and has no effect — the tower is byte-identical to the same tower without it.
- [ ] The card lines read exactly as above, per tier, on the draft, the hand, the tower panel and the codex (each tier line within the 56-char cap).
- [ ] The "≈ N/s" line and the codex show the boosted rate from the def; the beam hum stays one voice.
- [ ] npm run check passes and the desktop 1280×720 / mobile 412×915 smoke passes.

## Design (architect, desktop)

### Files
- edit `src/content/augments/beam.ts` - new card lines, `added.beam.dps: 5`, tier `addedBeamDps: 7` (rare) / `9` (epic), doc comment
- edit `src/core/augments.ts` - `TowerSpec`: replace `beamExtras: number[]` with `beamAdds: number`; fold added beams into `beamDps`; drop the "second beam" lines in `describeSpec`
- edit `src/core/beam.ts` - `beamLines` main-line only (drops `heldExtras`/`lines`)
- edit `src/core/towerDps.ts` - beam term without the extras sum
- edit `src/systems/BeamSystem.ts` - no extra lines; main line one width step thicker per added Beam
- edit `src/entities/towerLook.ts` - `beamTicks` reads `spec.beamAdds` (3 places)
- edit `src/entities/Tower.ts` - orb ticks read `spec.beamAdds`
- edit `tests/core/augments.test.ts` - beam block: fattening, worked examples, non-beam host is no-op, new card lines
- edit `tests/core/beam.test.ts` - `beamLines` new signature; delete the extra-line tests
- edit `tests/core/towerDps.test.ts` - added Beam fattens; non-beam host unchanged

### Interfaces
```ts
// core/augments.ts TowerSpec — replaces `beamExtras: number[]`:
beamDps: number;  // main-line rate: own tier rate + each added Beam's flat addition (0: no beam)
beamAdds: number; // Beams added to a beam tower (rate already in beamDps; line width step per copy)

// core/beam.ts — replaces the old (heldMain, heldExtras, enemies, x, y, range, mainTower) -> { main, lines }:
export function beamLines<C extends TargetCandidate>(
  heldMain: C | undefined, enemies: readonly C[], x: number, y: number, range: number, mainTower: boolean,
): number; // index into enemies, -1 when nothing is in range
```

### Steps
1. `src/content/augments/beam.ts`: set `description: 'A continuous beam on the furthest enemy. Added: the beam deals 5 more per second.'`, `asAdded: 'The beam deals 5 more per second.'`, `added: { beam: { dps: 5 } }`, rare `addedBeamDps: 7` + `asAdded: 'The beam deals 7 more per second.'`, epic `addedBeamDps: 9` + `asAdded: 'The beam deals 9 more per second.'`. `asTower` per tier unchanged. Update the file doc comment ("added to a beam tower it fattens that line… no second line").
2. `src/core/augments.ts`: in `TowerSpec`, `EMPTY` and the `towerSpec` spec literal, replace `beamExtras: []` with `beamAdds: 0` (update the two doc comments). In the beams loop (~line 219): `if (i === 0) spec.beamDps = dps; else if (spec.kind === 'beam') { spec.beamDps += dps; spec.beamAdds += 1; }` (comment: added to any other kind it does nothing — no beam to fatten). In `describeSpec` delete the two `spec.beamExtras` lines (the `Beams the furthest enemy: ${spec.beamDps} per second` line now shows the boosted rate by itself).
3. `src/core/beam.ts`: rewrite `beamLines` as `return mainTower && heldMain && inBeamRange(heldMain, x, y, range) ? enemies.indexOf(heldMain) : pickTarget(x, y, range, enemies);` — keep `inBeamRange` and `rayTargets` untouched; fix the file/function doc.
4. `src/core/towerDps.ts`: beam term becomes `dps += (1 + spec.beamRays) * spec.beamDps * m;`; fix the header doc (main line already includes the additions).
5. `src/systems/BeamSystem.ts`: skip check `if (t.spec.beamDps <= 0) continue;`; `const size = 1 + t.spec.beamRays;`; `stateFor` keeps only slot 0 on resize (drop the extras carry loop); call `const main = beamLines(st.lines[0]!.enemy as Enemy | undefined, this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');`; build `targets` as `[mainTarget, ...rays]` only; delete the extras damage loop (`for (let i = 0; i < lines.length; i++) …beamExtras[i]…`); in BOTH main-line draw branches (`pierceEnd` branch and the plain `mainE` branch) change `g.lineStyle(4, color, 1)` to `g.lineStyle(4 + 2 * t.spec.beamAdds, color, 1)` — the rays loop keeps width 4. Do NOT touch the rays loop, the fx loop, the shapes, the hum, or `broken()`. Update the class doc comment.
6. `src/entities/towerLook.ts` lines 44/48/61 and `src/entities/Tower.ts` line 152: `spec.beamExtras.length` → `spec.beamAdds` (fix the line-61 comment: a Beam only fattens a beam tower).
7. Update the three test files (below), then run `npm run check` and `npm run smoke`.

### Pitfalls
- Non-beam hosts must be byte-identical: that holds only because `beamAdds` grows solely when `spec.kind === 'beam'` AND `beamDps` stays 0 there (BeamSystem skips them entirely — the old 0-damage main line and its `beamHolding` side effect vanish).
- `beamLines` has exactly one caller (`BeamSystem.update`) plus tests; grep `beamLines(` to be sure before changing the signature.
- The Lance pierce and Splash scorch feed off `spec.beamDps` — they grow with the fatter beam on purpose ("the same feed"); don't change `core/beamShapes.ts`.
- `stateFor` must never index past the old array when resizing (rays reset, main keeps its clock).
- Card lines only get shorter than before; draft/hand/panel/codex all word-wrap from their lines, so no layout work — the tier lines are 33 chars (cap 56).
- Keep the one voice: the hum follows `now[0]` only; no Sfx change.

### Tests
- `tests/core/augments.test.ts` beam block: `spec('beam','beam')` → `{ beamDps: 19, beamAdds: 1 }`; `spec('beam','beam','beam')` → `24/2`; `towerSpec([copy('beam','rare'), copy('beam','epic')])` → `beamDps 29`; tiered added: rare → 21, epic → 23; for firsts `bolt, spray, splash, ember, mark, rally`: added Beam gives `beamDps 0, beamAdds 0` and `towerDps` equal to the same tower without it; `tierAddedLine` pins the three new lines; `describeSpec` pins `Beams the furthest enemy: 19 per second.` / `… 29 per second.` and `describeSpec(spec('bolt','beam')) === describeSpec(spec('bolt'))`.
- `tests/core/beam.test.ts`: call `beamLines(held, enemies, x, y, R, sticky)` (no `[]`), expect the returned index; keep the sticky/re-take/nothing-in-range tests; delete the seven extra-line tests; rename the non-sticky test to "a non-sticky main line always follows the furthest enemy".
- `tests/core/towerDps.test.ts`: `towerDps(spec('beam','beam'))` = 19; `spec('beam','beam','rapid')` ≈ 21.375; `towerDps(spec('bolt','beam'))` = `towerDps(spec('bolt'))`.
