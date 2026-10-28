---
id: T0029
title: "Beam: the line that never stops"
assignee: asus
size: L
priority: 3
status: todo
depends_on: [T0004]
attempts: 2
created: 2026-10-28T06:24:55Z
claimed_at: 2026-10-28T12:21:52Z
finished_at: 2026-10-28T14:22:29Z
epic: E4
---

## Goal
The draft can roll a new augment, Beam — the first sustained attack: a continuous line that deals damage per second for as long as the enemy is in range. No shots, no cooldown: a Beam tower holds one enemy down and never lets go until it moves.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Reach (a long single-target attack on the enemy furthest along). **What is new:** no shots at all — a continuous beam that deals per-second damage and retargets the instant its target dies or leaves range — and an added form that is a sustained second target, which no added form does (extra shots, slow, mark, leap, pierce and push all end with the attack).
- **As a tower's first augment (its own attack):** a continuous beam on the enemy furthest along within range. Common: 6 damage per second. Rare: 8. Epic: 10. The beam works within the tower's normal range, so Reach's added +35% range lengthens it. The moment its target dies or leaves range the beam snaps to the next-furthest enemy in range (the same targeting rule as Bolt); with no enemy in range the rod idles.
- **When added to a tower:** a second beam locks on the enemy nearest the tower's main target (the first beam's target if the tower is Beam-first, otherwise the attack's target) and deals half the per-second rate: Common 3, Rare 4, Epic 5. The second beam idles while the main target is absent. The new way: any attack gains a sustained secondary — Bolt + Beam shoots the furthest while a line holds the nearest to it; Splash + Beam bursts the crowd while a line picks one off.
- **Card lines:** Common first: "A continuous beam on the furthest enemy: 6 per second." / added: "A second beam on the nearest enemy: 3 per second." Rare and Epic show 8/4 and 10/5 in the same lines.
- **Look on the tower:** Beam's color is teal — the line, the rod and the dashes are all teal (a body shape and bright color no other augment uses; check the content folder and take the next free pair if one is taken by an in-flight augment). Beam first: the barrel is a long, thin rod (a narrow rounded rectangle) instead of a short one; while beaming, a solid teal line (2 px) runs from the rod's tip to the target — full width on the main target, half width on the second. Every added Beam: one short teal dash on the barrel, the existing tick style. If T0010's tier pips have landed, they stay visible — the dashes never sit on top of the pips.
- **The mark on a beamed enemy:** a small teal flash (60 ms, soft) at the beam's impact point so the sustained damage reads without strobing.
- **The tower-panel line** (the same place Mark's mark line lives): "A continuous beam on the furthest enemy: 6 per second", and for a tower with Beam added, "...and a second beam on the nearest enemy".
- **Sound:** one new Sfx method, a soft lock-on tick, played only when a beam acquires a new target; no sound while beaming, no sound when the beam breaks.
- **Spec-test coverage** closest to the other new augments' tests: the beam's per-second damage per tier, retargeting when the target dies or leaves range, the second beam at half rate and its idle, Reach extending the beam's range, and the card lines per tier.
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Beam as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's per-second rate; the added line reads "A second beam on the nearest enemy: N per second."
- [ ] A lone Common Beam tower holds a solid teal line on the enemy furthest along within range and deals 6 damage per second; the instant that enemy dies or leaves range the line snaps to the next-furthest enemy in range.
- [ ] A Beam-first tower with a second Beam holds two lines: full width on the main target, half width on the enemy nearest to it, at 3/4/5 per second by tier; with no main target the second beam idles.
- [ ] A Reach tower with Beam added holds a beam that reaches Reach's extended range — visibly farther than a plain Beam's line.
- [ ] A Bolt tower with Beam added shoots exactly as before while a teal line holds the enemy nearest its target.
- [ ] The tower shows the long thin rod (Beam first) or one short teal dash per added Beam, visible at 1x zoom at 412x915 and 1280x720.
- [ ] A first-time player can read it from the board alone: the line connects the tower to whatever it is holding down.

## Design (architect, desktop)

### Files
- create `src/content/augments/beam.ts` — the Beam `AugmentDef` (a sustained attack).
- create `src/core/beam.ts` — pure, Phaser-free beam targeting: `beamTarget()` (hold/re-pick) and `secondBeamTarget()` (nearest-to-anchor / idle), unit-testable.
- create `src/systems/BeamSystem.ts` — per-frame board glue: teal lines, per-second damage, soft impact flash, one lock-on tick per target change.
- create `tests/core/beam.test.ts` — the beam's spec + targeting tests.
- edit `src/content/augments/index.ts` — import + one line adding `beam` right after `bolt`.
- edit `src/content/types.ts` — `'beam'` in `AttackKind`; `beam?` on `FirstForm` and `AddedForm`; `asTower?` and `beam?` on `TierValues`.
- edit `src/core/augments.ts` — 3 new `TowerSpec` fields (+`EMPTY`), set them in `towerSpec`, add the `describeSpec` beam branch.
- edit `src/core/tiers.ts` — scale `beam` in `tierFirst`, set `beam` in `tierAdded`, add `tierTowerLine()`.
- edit `src/entities/towerLook.ts` — `barrelCount` beam→1, `barrelLook` beam→long thin rod, one `DECORATIONS` entry (teal dash).
- edit `src/systems/TowerSystem.ts` — `update()` skips `kind === 'beam'` towers (they have no cooldown).
- edit `src/systems/RunFlow.ts` — `RunSystems.beams`, call `this.s.beams.update(dt)` after `towers.update(dt)` in the wave phase.
- edit `src/scenes/GameScene.ts` — field + `new BeamSystem(this, this.towers, this.enemies, this.fx, sfx)` + pass it in the `RunSystems` object.
- edit `src/systems/EnemySystem.ts` — `HitPayload.noFlash?`, pass it through `strike`→`hit`.
- edit `src/entities/Enemy.ts` — `hit(damage, noFlash = false)`: skip the white flash when `noFlash`.
- edit `src/systems/FxSystem.ts` — `beamImpact(x, y)` (soft teal 60 ms flash).
- edit `src/audio/Sfx.ts` — `lock()` (soft lock-on tick).
- edit `src/scenes/DraftScene.ts` — render `tierTowerLine(b, copy.tier)` for the tower line (so Rare/Epic show 8/10).
- edit `tests/content.test.ts` — line 39 becomes `a.first.damage > 0 || a.first.slow || a.first.mark || a.first.beam`.

### Interfaces
```ts
// content/types.ts
export type AttackKind = 'shot' | 'pulse' | 'mark' | 'beam';   // 'beam' = continuous line
FirstForm  { beam?: number }   // damage per second (kind 'beam'); `damage`=0, `rate`=1 (formality)
AddedForm  { beam?: number }   // per-second of the added second beam
TierValues { asTower?: string; beam?: number }                 // asTower: this tier's asTower line; beam: this copy's 2nd-beam rate
// core/augments.ts  TowerSpec:
TowerSpec { beamDps: number; addedBeamDps: number; addedBeamCount: number }
// core/beam.ts (pure)
export interface BeamCandidate { x:number; y:number; distance:number; active:boolean; serial:number } // Enemy satisfies this
export interface BeamHeld { index:number; serial:number }
export function beamTarget(x:number,y:number,range:number,held:BeamHeld|null,es:readonly BeamCandidate[]):number
export function secondBeamTarget(anchorIndex:number,x:number,y:number,range:number,es:readonly BeamCandidate[]):number
// tiers.ts
export function tierTowerLine(def:AugmentDef, tier:Tier):string   // common→def.asTower else tiers[tier].asTower ?? def.asTower
// FxSystem
beamImpact(x:number,y:number):void
// Sfx
lock():void
```

### Steps
1. **The dev must not make Beam openable.** It deals damage only as a sustained line (`first.damage = 0`, `first.beam = 6`), so `rollOffer`'s opening filter (`first.damage > 0 || opening`) already excludes it — matching Frost. A lone Common/Rare beam (6/8 s) cannot hold wave 1 (five 30 HP Dots), and the existing `augments.test.ts` "hold wave 1" test (min DPS > 12) forbids a 6–10 DPS opening pick. So Beam is a normal-pool augment (all tiers, appears from the first post-wave draft) but never the wave-0 pick. Do NOT set `opening` and do NOT change the opening filter or the DPS test.
2. `beam.ts` (def): `id:'beam'`, `name:'Beam'`, `look:{shape:'hexagon',color:'teal',size:0.22}` (teal is Bolt's color; use a non-circle shape — if `hexagon/teal` is taken by an in-flight augment, take the next free of `diamond, square, pentagon, triangle` + teal, never `circle/teal`). `first:{kind:'beam',damage:0,range:2.6,rate:1,beam:6}`. `added:{beam:3}`. `asTower:'A continuous beam on the furthest enemy: 6 per second.'` `asAdded:'A second beam on the nearest enemy: 3 per second.'` `tiers.rare:{damageMul:8/6,beam:4,asTower:'…8 per second.',asAdded:'…4 per second.'}` `tiers.epic:{damageMul:10/6,beam:5,asTower:'…10 per second.',asAdded:'…5 per second.'}`.
3. `core/beam.ts`: `beamTarget` returns `held.index` while `held` is alive (`serial` matches) and within range, else `pickTarget(...)`; `secondBeamTarget` returns the in-range enemy nearest `es[anchorIndex]`, skipping `anchorIndex`, or -1.
4. `BeamSystem.update(dt)`: `lines.clear()`; for each tower where `kind==='beam' || addedBeamDps>0` (range `spec.range*CELL`): main = `beamTarget(...)` (if `kind==='beam'`) → `aimAt` + `beam(t,e,spec.beamDps*dt,2)`; anchor = main (beam-first) else `pickTarget`; second = `secondBeamTarget(anchor,...)` → `beam(t,e,spec.addedBeamDps*dt,1)`; one `sfx?.lock()` when the primary (main, else second) index/serial changes. `beam()` = `lineStyle(width,PALETTE.teal,1).lineBetween(muzzle(0), e)` + `enemies.strike(e,{damage,color:PALETTE.teal,noFlash:true})` + `fx.beamImpact(e.x,e.y)`. Hold state in `Map<Tower,{main:BeamHeld|null,primaryIndex,primarySerial}>`.
5. Shared wiring exactly as in Files. `describeSpec` beam branch (before the `spec.damage<=0` fallthrough): `A continuous beam on the furthest enemy: ${Math.round(spec.beamDps)} per second` + (if `addedBeamDps>0`) `, and a second beam on the nearest enemy`. `barrelLook` beam → `{length:1.9,width:0.6,bulb:false,bands:0}`. `DECORATIONS` dash: `for i in addedBeamCount` a short `fillRing` teal arc across the **top** arc (angle 0 = up), clear of the pips at the bottom.

### Pitfalls
- **White flash**: the beam strikes every frame; without `noFlash` the beamed enemy is permanently tinted white. Thread `noFlash` through `strike`→`hit` (only caller of `Enemy.hit`).
- **Leftover lines**: `lines.clear()` at the top of `update`; the final wave frame has no targets, so nothing persists into build/draft. `lines` is a scene graphic (auto-destroyed on shutdown); the state `Map` is per-run.
- **Pooling/recycle**: hold identity by `serial` (not index) — a recycled slot is a new enemy, so the beam re-picks.
- **`Record<AttackKind,Attack>`**: adding `'beam'` forces an `ATTACKS.beam` entry — make it a documented `() => false` stub (TowerSystem skips beam towers, so it's never called). Do not switch `TowerSystem.attack` on beam.
- **Card fit**: the beam's lines are long (~56/49 chars); verify both wrap and fit the 220×206 card at 412×915 and 1280×720; if the added line clips, widen the card's wrap width, not the text.
- **Shared-file traffic**: `core/augments.ts` (`towerSpec`), `content/types.ts`, `core/tiers.ts` are hot — place each addition next to its related line (beam near `mark`/`splash`), never at the end. Beam + a slow augment won't apply the slow (sustained attack has no discrete hit) — out of scope, leave `describeSpec` as above.

### Tests
- `tests/core/beam.test.ts`: per-second per tier (`Math.round(tierFirst(beam,t).beam)` = 6/8/10); second-beam rate (`tierAdded(beam,t).beam` = 3/4/5); `towerSpec([beam])` → `{kind:'beam',damage:0,beamDps:6}`; `towerSpec([beam,reach]).range ≈ 2.6*1.35`; `towerSpec([bolt,beam])` → `{kind:'shot',addedBeamDps:3,addedBeamCount:1}`; `tierTowerLine`/`tierAddedLine` per tier; `describeSpec` names the beam and (with a 2nd beam) the second; retarget on death/leave/recycle + second-beam idle via `beamTarget`/`secondBeamTarget`; Beam is not the opening pick but rolls in the normal pool.
- Retargeting/idle live in `BeamSystem` (Phaser) — the pure decisions are covered above; the rendered line is exercised by `npm run smoke`.

## Attempt 1 failed (asus)

Could not merge into main (conflict). The work was saved to projects/chokepoint/tasks/salvage/T0029.diff; the next attempt re-applies it on the latest code.
- Conflicts in: projects/chokepoint/game/src/content/types.ts, projects/chokepoint/game/src/core/augments.ts, projects/chokepoint/game/src/core/tiers.ts, projects/chokepoint/game/src/debug/runChecks.ts, projects/chokepoint/game/src/scenes/GameScene.ts, projects/chokepoint/game/src/systems/EnemySystem.ts, projects/chokepoint/game/src/systems/TowerSystem.ts, projects/chokepoint/game/tests/content.test.ts
- Auto-resolved 8 spot(s) where both sides only added lines (clean: projects/chokepoint/game/src/content/types.ts, projects/chokepoint/game/src/core/augments.ts, projects/chokepoint/game/src/core/tiers.ts, projects/chokepoint/game/src/debug/runChecks.ts, projects/chokepoint/game/src/scenes/GameScene.ts).
- Could not resolve them: git could not continue the rebase after 3 rounds.

## Attempt 2 failed (asus)

Could not merge into main (conflict). The work was saved to projects/chokepoint/tasks/salvage/T0029.diff; the next attempt re-applies it on the latest code.
- Self-review made fixes (kept; checks pass).
- Conflicts in: projects/chokepoint/game/src/content/augments/index.ts, projects/chokepoint/game/src/content/types.ts, projects/chokepoint/game/src/core/augments.ts, projects/chokepoint/game/src/systems/FxSystem.ts, projects/chokepoint/game/src/systems/TowerSystem.ts, projects/chokepoint/game/tests/content.test.ts
- Auto-resolved 3 spot(s) where both sides only added lines (clean: projects/chokepoint/game/src/content/augments/index.ts, projects/chokepoint/game/src/core/augments.ts, projects/chokepoint/game/src/systems/FxSystem.ts).
- Could not resolve them: git could not continue the rebase after 3 rounds.
