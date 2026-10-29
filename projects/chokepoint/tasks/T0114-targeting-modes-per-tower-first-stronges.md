---
id: T0114
title: "Targeting modes per tower: first, strongest, closest"
size: L
priority: 2
status: todo
depends_on: [T0025]
attempts: 0
created: 2026-10-29T09:55:07Z
---

## Goal
Every tower aims at the enemy furthest along by default; a small chip in the tower panel lets a player point a tower at the strongest (most hp) or the closest enemy instead — focus-fire the Hauler or clear the head of a pack, per tower, decided where the tower is managed.

## Details
- Three modes, one per tower:
  - **First** (the default) — exactly today's targeting: the enemy furthest along in range. Every fresh tower is First, and a resumed run keeps First unless it was changed, so existing play is byte-identical.
  - **Strongest** — the enemy in range with the most current hp; a tie goes to the furthest of those.
  - **Closest** — the enemy nearest the tower; a tie goes to the furthest of those.
- The mode applies to the tower's main target choice for every targeting augment: Bolt, Rapid, Reach, Lance, Splash (the blast center), Chain (the first strike), Beam (the main line), Spray (the first shot), Mark (the marked enemy) and Ember (the ignited enemy). It never applies to position-based auras (Frost's ring, Push's gust, Anchor's root, Pulse's ring, Rally, Mint) or to nearest-pick added forms (the Beam's second beam, Spray's needles, the Chain's leaps).
- Target selection is centralized where it lives today (the targeting core, `core/targeting.ts`, is the home): add the mode there so every attack's main choice goes through the one place that knows it; where an attack hard-codes "furthest" today, route it through the same helper.
- UI — the tower panel (T0008): one small chip on the panel's stats line reading "First" / "Strongest" / "Closest" in muted ink, tappable to cycle First → Strongest → Closest → First, with the existing soft button blip (no new sound). The chip shows on every tower, always — the mode is not an augment: no barrel, ring or tick on the tower (the small board-side marker is parked in IDEAS as a follow-up while the tower-look file is busy).
- Listed on the pause screen: "Targeting — tap the mode chip in the tower panel: First / Strongest / Closest."
- Persistence: the mode is part of the tower's resume save (the T0042 pattern) — absent means First, so a save written before this task loads as First. New runs: every tower First.
- It matters in play now: the Hauler (3× Block's hp, 10 gold) is worth focusing with Strongest; a Dart or Sprinter pack is worth clearing with Closest; First stays the default the waves are tuned around.

## Acceptance criteria
- [ ] A fresh tower is First and targets the enemy furthest along in range — byte-identical to today's targeting for every augment.
- [ ] Tapping the mode chip in the tower panel cycles First → Strongest → Closest → First with the soft blip; the chip's word updates in place.
- [ ] A Strongest-mode tower aims at the enemy in range with the most current hp (the Hauler over Darts and Dots); when it dies or leaves range, the next strongest; ties go to the furthest.
- [ ] A Closest-mode tower aims at the nearest enemy in range; ties go to the furthest.
- [ ] The mode applies to the main attack of Bolt, Rapid, Reach, Lance, Splash, Chain, Beam, Spray, Mark and Ember; position-based auras and nearest-pick added forms (the Beam's second beam, Spray's needles, the Chain's leaps) are unaffected.
- [ ] The mode survives a resume (the save carries it; a save without it loads as First).
- [ ] The pause screen lists the mode chip; no new key, no new sound.

## Design (architect, desktop)

### Files
- edit `src/core/targeting.ts` - add `TargetMode` type, `hp` to `TargetCandidate`, exported `prefers()` helper; add a defaulted `mode` parameter to `pickTarget()` and `pickTargets()`
- edit `src/core/beam.ts` - `beamLines()` gains a defaulted `mode` parameter; the main-line re-take passes it to `pickTarget()`
- edit `src/entities/Tower.ts` - add `targetMode` field
- edit `src/systems/attacks/shot.ts` - pass `tower.targetMode` to `pickTargets()` (Bolt/Rapid/Reach/Lance/Splash; Splash's blast center is the hit enemy, so it follows)
- edit `src/systems/attacks/spray.ts` - pass `tower.targetMode` to `pickTarget()`
- edit `src/systems/attacks/burn.ts` - pass `tower.targetMode` to `pickTarget()` (Ember)
- edit `src/systems/attacks/mark.ts` - its local `furthestUnmarked()` becomes mode-aware via `prefers()`
- edit `src/systems/attacks/chain.ts` - the first strike's `pickTarget()` call passes `tower.targetMode` (file exists only after T0025)
- edit `src/systems/BeamSystem.ts` - pass `t.targetMode` to `beamLines()`
- edit `src/core/saveRun.ts` - `SavedTower` gains optional `targetMode`; load validation rejects unknown values
- edit `src/systems/RunSave.ts` - persist `targetMode` in `persist()`; restore it in `restore()` (`?? 'first'`)
- edit `src/ui/hud/TowerPanel.ts` - the mode chip on the stats line
- edit `src/scenes/PauseScene.ts` - one more line in the Controls text
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/core/targeting.test.ts` - `hp` on every literal + mode tests
- edit `tests/core/beam.test.ts` - `hp` on the factory + one strongest-mode test
- edit `tests/core/saveRun.test.ts` - mode round-trip and rejection tests

### Interfaces
```ts
// core/targeting.ts
export type TargetMode = 'first' | 'strongest' | 'closest';
export interface TargetCandidate { x: number; y: number; distance: number; hp: number; active: boolean; }
/** Both in range: should the tower prefer a over b? Ties always go to the furthest along. */
export function prefers(a: TargetCandidate, b: TargetCandidate, mode: TargetMode, x: number, y: number): boolean;
export function pickTarget(x: number, y: number, range: number, enemies: readonly TargetCandidate[], mode?: TargetMode): number;
export function pickTargets(x: number, y: number, range: number, enemies: readonly TargetCandidate[], count: number, mode?: TargetMode): number[];
// core/beam.ts
export function beamLines<C extends TargetCandidate>(held: readonly (C | undefined)[], enemies: readonly C[], x: number, y: number, range: number, mainTower: boolean, mode?: TargetMode): { main: number; lines: (C | undefined)[] };
// entities/Tower.ts
targetMode: TargetMode = 'first';
// core/saveRun.ts
export interface SavedTower { col: number; row: number; slots: number; augments: AugmentCopy[]; targetMode?: TargetMode; }
```
`prefers`: first → `a.distance > b.distance`; strongest → `a.hp > b.hp || (a.hp === b.hp && a.distance > b.distance)`; closest → squared distance to (x, y), `da < db || (da === db && a.distance > b.distance)`.

### Steps
1. `core/targeting.ts`: add the type and `prefers()` above `pickTarget`. Rewrite `pickTarget` as a loop with `if (best === -1 || prefers(e, enemies[best]!, mode, x, y)) best = i;` (identical result to today's `e.distance > bestDistance` for 'first'). In `pickTargets`, keep the existing comparator verbatim for 'first'; strongest sorts by `enemies[b]!.hp - enemies[a]!.hp || enemies[b]!.distance - enemies[a]!.distance`; closest by squared-distance ascending with the same `|| distance` tiebreak.
2. `core/beam.ts`: add `mode?: TargetMode` after `mainTower`; line 40 becomes `pickTarget(x, y, range, enemies, mode)`; note in the doc comment that the re-take follows the tower's mode (stickiness itself is unchanged).
3. `entities/Tower.ts`: import `type { TargetMode } from '../core/targeting'`; add the field next to `aim`.
4. Attacks: in `shot.ts`/`spray.ts`/`burn.ts` pass `tower.targetMode` as the new last argument. In `mark.ts` rename `furthestUnmarked` to `preferredUnmarked(x, y, range, enemies, mode)`, same loop but `best === -1 || prefers(...)` (keep the `e.markPct > 0` skip), call with `tower.targetMode`. Do NOT touch `pulse.ts`, `rally.ts`, `EnemySystem`'s splash, or `ProjectileSystem` (`pickNearest` needles, `pickPierceTarget`) — those are position-based.
5. `BeamSystem.ts` line 48: `beamLines(held, this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam', t.targetMode)`.
6. `saveRun.ts`: import the type; add the optional field to `SavedTower`; in the towers loop after the augments check: `if (tower.targetMode !== undefined && tower.targetMode !== 'first' && tower.targetMode !== 'strongest' && tower.targetMode !== 'closest') return undefined;`. `RunSave.ts`: add `targetMode: t.targetMode,` after the `augments:` line in `persist()`; in `restore()` after `tower.slots = t.slots;` add `tower.targetMode = t.targetMode ?? 'first';`.
7. `TowerPanel.ts`: import `getSfx` from `../../scenes/keys` and `type TargetMode` from `../../core/targeting`. In `build()`, change the stats text (line 77) `wordWrap` width to `w - 36 - 100` (reserve the chip's column). After the `items` declaration add: a `modeWord: Record<TargetMode, string> = { first: 'First', strongest: 'Strongest', closest: 'Closest' }`; `chipW = 88`; `chipLabel = scene.add.text(0, 0, modeWord[tower.targetMode], textStyle(11, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5)`; `chip = scene.add.container(w / 2 - 18 - chipW / 2, top + 60, [makeCard(scene, 0, 0, chipW, 26, 13), chipLabel])`; `chip.setSize(chipW, 44); chip.setInteractive({ useHandCursor: true });` (44 px hit area around the 26 px chip, like `makeButton`); `chip.on('pointerup', (_p, _x, _y, event) => { event.stopPropagation(); const order: TargetMode[] = ['first', 'strongest', 'closest']; tower.targetMode = order[(order.indexOf(tower.targetMode) + 1) % order.length]!; chipLabel.setText(modeWord[tower.targetMode]); getSfx(scene)?.blip(); })`; `items.push(chip)`. The chip is created for every tower (including the `n === 0` branch) and rebuilds with the panel.
8. `PauseScene.ts` line 62 only: append `\nTargeting — tap the mode chip in the tower panel: First / Strongest / Closest.` to the Controls string and add `wordWrap: { width: panelW - 48 }` to its style. It wraps to two lines and fits between the block (ends ≈ y -14) and the Resume button (top y 10); no other element moves.
9. `runChecks.ts`: next to `'towers.gold'` add `['towers.targetMode', (g) => { for (const t of g.towers.towers) if (t.targetMode !== 'first' && t.targetMode !== 'strongest' && t.targetMode !== 'closest') return \`target mode ${t.targetMode} at (${t.cell.col}, ${t.cell.row})\`; return null; }]`.
10. `systems/attacks/chain.ts` (after T0025 lands): find the first strike's `pickTarget(...)` and pass `tower.targetMode` as the last argument; leave the leaps alone.
11. Tests: add `hp: 1` to every `TargetCandidate` literal in `targeting.test.ts` (enemies list, pickNearest and pickPierceTarget fixtures); add a `describe('targeting modes')` covering: strongest picks most current hp over furthest, hp tie → furthest, no-mode call still furthest; closest picks nearest, distance tie → furthest; `pickTargets` orderings per mode and unchanged default. `beam.test.ts`: factory becomes `const e = (x: number, y: number, distance: number, active = true, hp = 1): TargetCandidate => ({ x, y, distance, active, hp });` plus one test that `beamLines([], [a, b], 0, 0, R, true, 'strongest')` re-takes the most-hp enemy. `saveRun.test.ts`: a tower with `targetMode: 'strongest'` round-trips; a save written without it loads `targetMode` undefined; `broken({ towers: [{ col: 2, row: 1, slots: 1, augments: [{ id: 'bolt', tier: 'common' }], targetMode: 'nearest' }] })`.
12. `npm run check`.

### Pitfalls
- `hp` is required on `TargetCandidate`: `Enemy` already has it; only the two test files have literal objects — the typecheck catches any missed one.
- Byte-identity: 'first' must keep today's exact comparator and stable-sort order; the new parameters are defaulted, so untouched call sites (none, except tests) behave identically.
- Beam stickiness: only the re-take uses the mode; held-target logic and `BeamSystem.broken()` are untouched.
- Chip closure captures the selected `tower`; the chip is destroyed with the panel `box` on rebuild — no scene listeners to remove. Don't skip the stats `wordWrap` reduction, or long stats text collides with the chip; the chip's 44 px hit area slightly overlaps the close button's bottom-left corner (chip is on top) — accepted, don't "fix" by moving the close button.
- Old saves load as First via `?? 'first'`; a new run never sets it (field default).
- `PauseScene.ts` is also edited by T0102 and `TowerPanel.ts` by T0110 — keep your edits to the single lines above; the runner serializes same-file tasks.

### Tests
- `tests/core/targeting.test.ts`: strongest (hp over distance, tie → furthest), closest (nearest, tie → furthest), multi-shot ordering per mode, default unchanged.
- `tests/core/beam.test.ts`: strongest-mode re-take.
- `tests/core/saveRun.test.ts`: mode round-trip, absent → undefined, invalid value rejects the save.
