---
id: T0073
title: "Beam: the line that never stops (the T0029 re-task)"
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T21:24:45Z
claimed_at: 2026-10-29T03:39:56Z
epic: E4
---

## Goal
The pool gains the beam — the first sustained attack: a continuous line of damage that never fires a shot, and a second line when added. This re-tasks the failed T0029: its complete work is saved in `tasks/salvage/T0029.diff`.

## Details
- **Card lines (both forms):** as a new tower's first augment — "A continuous beam on the enemy furthest along: 6/8/10 damage per second by tier, range 4.5." Added — "A second beam on the enemy nearest the main target at half the per-second rate." Closest existing augment is Reach (a long single-target attack); new is the sustained line that never fires, and the sustained second target on any first augment.
- **First form:** a continuous beam from the tower's barrel on the enemy furthest along in range (4.5 cells). No projectile: the line appears the instant a target is locked and is gone the instant there is no target. It deals 6/8/10 damage per second by tier (a sustained tick, not a shot). It retargets the instant its target dies or leaves range — the new target is the enemy furthest along in range. The beam's damage is the tower's damage: Mark's +25% applies to it, and a kill by the beam is that tower's kill for gold, the combo chain, Mint's +1 and the panel's kills line (the source-of-kill rule, exactly like Ember's ticks).
- **Added form (on any tower):** a second beam on the enemy nearest the main target, at half the per-second rate (3/4/5 per second by tier), only while another enemy is in range. It disappears when the main target does, and each line retargets independently the instant its own target is gone.
- **Look:** the beam is a flat thin line (about 4 px) in the tower's own color, from the barrel tip to the hit point, with one small flat tick (about 8 px, the tower's own color) at the hit end. The tower's barrel is a short, flat, wide head lying on the plinth (wider than it is tall) in Beam's own color; each added Beam adds one small flat tick beside the barrel. Beam's own color: the first of green, yellow or blue that no landed augment already uses — check the content folder (Lead's green was freed when Lead was removed).
- **Draft:** pool augment, all tiers, offered from the opening draft. The card, the hand, the tower panel and the slot pip show it in the shared tier look (T0002/T0008); the draft's no-repeat rule (T0052) and the owned dot (T0044) work for it as for any augment.
- **Re-apply, don't restart:** the failed T0029's complete design — the beam system, its attack kind, the tower look, the line drawing — is in `tasks/salvage/T0029.diff`. Re-base it onto the latest code as a **short branch**: T0029's branch lived too long under a landing pool of augments and died three times on merge conflicts. Where the salvage conflicts with what has landed since — Anchor is Epic-only, enemy hooks/effects/sounds live in their own files (the Hauler's pattern), the kill flow in the strike block (combo gold, the kill gold trail, burn on death, the quiet wave), the draft's no-repeat rule — **the landed code wins and the beam keeps its behavior and values as speced here**.
- **No sound in this task:** the beam hum is T0043, which waits on this task; the beam is silent until then.

## Acceptance criteria
- [ ] A tower with Beam as its first augment holds a continuous line in its own color on the enemy furthest along within 4.5 cells: no projectile, 6/8/10 damage per second by tier; the line vanishes the instant its target dies or leaves range and locks the new furthest enemy immediately.
- [ ] A tower with Beam added holds a second line on the enemy nearest the main target at half the per-second rate, only while another enemy is in range; it drops with the main target, and each line retargets independently.
- [ ] A beam kill pays through the normal kill path — gold, the combo chain, Mint's +1, the panel's kills line — attributed to the beam's tower; a marked beam target takes Mark's +25%.
- [ ] The draft offers Beam from the opening draft at all tiers; card, hand, tower panel and slot pip show it in the shared tier look; the tower shows the flat wide barrel plus one tick per added Beam, and no line is drawn while the tower has no target.
- [ ] The draft never offers two Beams in one offer (T0052), and the owned dot (T0044) marks an offered Beam the run already has.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/content/augments/beam.ts` - the Beam augment def (both forms, tiers, `opening: true`)
- create `src/core/beam.ts` - pure per-frame line-resolution rules (`beamLines`, `inBeamRange`)
- create `src/systems/BeamSystem.ts` - the per-frame system: targets, damage, line drawing (T0043 will add the hum here)
- create `src/systems/attacks/beam.ts` - no-op `Attack` entry so `ATTACKS` stays total
- create `tests/core/beam.test.ts` - unit tests for the line rules
- edit `src/content/types.ts` - `AttackKind | 'beam'`; `FirstForm.beam?: { dps: number }` (after `burn`); `AddedForm.beam?: { dps: number }` (after `burn`); `TierValues.beamDps?: number` (after `burnDps`)
- edit `src/content/augments/index.ts` - import + `beam,` in `AUGMENTS` next to `ember,`
- edit `src/core/tiers.ts` - in `tierFirst` and `tierAdded`: copy `beam` in the Common branch, and `beam: x.beam ? { ...x.beam, dps: t.beamDps ?? x.beam.dps } : undefined` in the tiered branch (4 lines, next to `burn`)
- edit `src/core/augments.ts` - `TowerSpec` + `EMPTY` + spec literal: `beamDps: 0, beamExtras: number[] = []` (next to `burnCount`); beam loop after the Ember loop; `describeSpec` beam branch + guard the "its hits set ablaze"/"its hits push back" trailers with `spec.kind !== 'beam'` + one extras trailer line
- edit `src/systems/attacks/index.ts` - import + `beam,` in `ATTACKS`
- edit `src/systems/TowerSystem.ts` - first line of the `update()` tower loop: `if (t.spec.kind === 'beam') continue;` (its lines are held by BeamSystem, not on a cooldown)
- edit `src/systems/EnemySystem.ts` - public `beamTick()` right after `tickBurn`
- edit `src/entities/towerLook.ts` - `barrelCount`: `if (spec.kind === 'beam') return 1;` (next to the burn line); `barrelLook`: beam branch returning the wide head + `beamTicks` in the generic return
- edit `src/art/barrels.ts` - `BarrelLook.beamHead?/beamTicks?`, the head's paint + texture key
- edit `src/scenes/GameScene.ts` - import, `beams!: BeamSystem`, `new BeamSystem(this, this.towers, this.enemies)` after the rally line, `this.beams.update(simDt)` after `this.rally.update(simDt)`
- edit `src/ui/hud/TowerPanel.ts` - `statsLine`: beam branch (no damage, no rate/s)
- edit `src/debug/runChecks.ts` - `['beams.valid', (g) => g.beams.broken()]` next to `rally.valid`
- edit `tests/content.test.ts` - add `|| a.first.beam` to the "does something" line; `beamDps > 0` tier check next to `burnDps`
- edit `tests/core/augments.test.ts` - `describe('beam (Beam)')` block

### Interfaces
```ts
// content/augments/beam.ts (exact def):
id 'beam', name 'Beam', look { shape: 'chevron', color: 'green', size: 0.22 }, opening: true,
description: 'A continuous beam on the furthest enemy. Added: a second beam on the nearest.',
asTower: 'Beams the furthest enemy: 6 per second, range 4.5.',
asAdded: 'A second beam on the nearest enemy: 3 per second.',
first: { kind: 'beam', damage: 0, range: 4.5, rate: 1, beam: { dps: 6 } },
added: { beam: { dps: 3 } },
tiers: { rare: { beamDps: 8, asTower: '…8 per second…', asAdded: '…4 per second.' },
         epic: { beamDps: 10, asTower: '…10 per second…', asAdded: '…5 per second.' } }; // same shapes, swap the number

// core/beam.ts (pure; imports pickTarget from ./targeting):
export function inBeamRange(e: TargetCandidate, x: number, y: number, range: number): boolean
export function beamLines(
  held: readonly (TargetCandidate | undefined)[],  // held[0] = last frame's main target, rest = extra lines
  enemies: readonly TargetCandidate[], x: number, y: number, range: number,
  mainTower: boolean,                               // true: a Beam-first tower (its main line is sticky)
): { main: number; lines: (TargetCandidate | undefined)[] }

// systems/EnemySystem.ts:
beamTick(target: Enemy, damage: number, source: Tower): void
// { if (damage <= 0 || !target.active) return; if (target.hit(damage, false)) this.kill(target, source); }

// systems/BeamSystem.ts:
export class BeamSystem { constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem); update(dt: number): void; broken(): string | undefined }
```

### Steps
1. `content/types.ts`, `core/tiers.ts`, `content/augments/beam.ts`, `content/augments/index.ts` (content first; `rate: 1` is nominal — the beam never fires on a cooldown, and the content test requires `first.rate > 0`).
2. `core/augments.ts`: `beamDps` (main line: first Beam's tier rate when it is the first) and `beamExtras: number[]` (one half-rate entry per Beam after the first, at its own tier). Loop after the Ember loop: `dps = i === 0 ? f.beam?.dps ?? 0 : tierAdded(getAugment(c.id), c.tier).beam?.dps ?? 0`; `i === 0 ? spec.beamDps = dps : spec.beamExtras.push(dps)`. Beam DPS is its own stat (like `burnDps`): never scaled by `damageMul`/`rateMul`; the tower's `range` (Reach's `rangeMul`) still applies.
3. `core/beam.ts` `beamLines`: main = `mainTower` ? (held[0] if `active && inBeamRange`, else `pickTarget`) : `pickTarget`. `lines` has `held.length - 1` entries. When the main target is a different enemy than `held[0]` (died, left range, or a new furthest), every extra line drops and retakes; otherwise an extra line keeps its target while `active && inBeamRange && !== main`. Empty lines fill in order, each taking the nearest free in-range enemy to the main target (spatial distance; the main target and already-taken lines are excluded). `main === -1` → all lines undefined.
4. `systems/BeamSystem.ts`: one `Graphics` at `DEPTH.bars`, cleared/redrawn per frame (RallySystem chevrons pattern). Per tower with `beamDps > 0` or `beamExtras.length > 0`: `held = map.get(t)` resized to `1 + beamExtras.length`; call `beamLines`; store `[mainTarget, ...lines]`; `enemies.beamTick(main, spec.beamDps * dt, t)`; per extra `enemies.beamTick(lines[i], spec.beamExtras[i] * dt, t)`; a Beam-first tower calls `t.aimAt(main.x, main.y)` every frame (the head tracks; no `kick()`). Draw from `t.muzzle(0)` to the target: `lineStyle(4, color, 1)` line + an 8-unit tick across the line at the hit end, `color = towerColor(t.augments)` → `PALETTE[color]`. `broken()`: no held target inactive or out of its tower's range.
5. `systems/attacks/beam.ts` (`export const beam: Attack = () => false;` with a doc comment), `attacks/index.ts`, `TowerSystem.ts` skip line, `EnemySystem.beamTick` (no white flash: `hit(damage, false)`, exactly like the burn tick — Mark's +25%, gold, combo, Mint and `source.kills` all come free from `hit()`/`kill()`).
6. Look: `towerLook.ts` — `barrelCount` returns 1 for `kind === 'beam'`; `barrelLook` beam branch `{ length: 0.55, width: 2.4, bulb: false, bands: 0, beamHead: true, beamTicks: spec.beamExtras.length }`, and `beamTicks: spec.beamExtras.length` in the generic return (a Beam added to any tower ticks its barrels). `barrels.ts`: when `beamHead`, paint a flat wide pill (wider than tall, `deepOf(color)`) keyed `barrel:beam:${color}:${beamTicks}`, plus one 8×4 rounded tick beside the head per extra (stacked, 10 apart); texture sized `(w + 30) * 2`.
7. Wiring: `GameScene` (import/field/construct/update as in Files), `runChecks.ts` invariant, `TowerPanel.statsLine` beam branch `` `Range ${s.range.toFixed(1)} · ${s.beamDps.toFixed(0)}/s` ``, `describeSpec` beam branch `` `Beams the furthest enemy: ${spec.beamDps} per second` `` plus extras trailer (one: `` `, and a second beam at ${spec.beamExtras[0]} per second on the nearest enemy` ``; more: `` `, and N beams at … per second on the nearest enemies` ``).
8. Draft, hand, panel rows, owned dot, no-repeat and tier look are all automatic from the def — verify, don't build. Then the tests.

### Pitfalls
- `tasks/salvage/T0029.diff` is missing from the repo; build entirely from this design — do not wait for the file.
- Beam damage must go through `Enemy.hit()` (so Mark applies) and `kill(e, source)` (so gold/combo/Mint/`kills` pay) — never set `hp` directly. No per-tick white flash (`flash: false`).
- The main line is STICKY: it holds its target even when another enemy overtakes it; it re-takes only when the target is inactive or out of range. Extra lines drop whenever the main target changes enemy, then retake around the new one.
- Pooled enemies: a held reference can be recycled; validity is `active` + in range, checked every frame — never cache "dead".
- `speedUps()` divides by the first rate; the beam branch in `barrelLook` must return before it, and beam towers must not reach `ATTACKS` (TowerSystem skip). `MAX_SLOTS` = 4 → at most 3 beam ticks; clamp them.
- Card line lengths are tested (common ≤70, tier ≤56); use the exact strings in Interfaces.
- `simDt` (WaveSpeed) drives the beam: damage scales with game speed automatically; never use `Math.random()` or real time.
- No sound here — T0043 lands on `BeamSystem`/`Sfx` after this; keep `BeamSystem.update` a single clean per-frame method for it to extend.

### Tests
- `tests/core/beam.test.ts`: main locks the furthest; holds through an overtake; re-takes on death and on leaving range; second line takes the nearest-to-main; two lines take the two nearest in order; lines drop on main change (even with their own target alive) and retake around the new main; independent per-line retarget; a line never takes the main or a mate's target; nothing in range → `main -1`, no lines.
- `tests/core/augments.test.ts`: `spec('beam')` is `{ kind: 'beam', range: 4.5, beamDps: 6, damage: 0 }`; rare/epic `beamDps` 8/10; `spec('bolt','beam').beamExtras` `[3]`, two stack `[3,3]`; `spec('beam','beam')` → `beamDps 6, beamExtras [3]`; tiered added Beam → `[4]`/`[5]`; `describeSpec` mentions the rate and "a second beam at 3 per second".
- `tests/content.test.ts` and `tests/core/augments.test.ts` edits as listed; `npm run check` + `npm run smoke` (desktop 1280x720 and phone 412x915) must pass — the beam draws no HUD, so no layout work.
