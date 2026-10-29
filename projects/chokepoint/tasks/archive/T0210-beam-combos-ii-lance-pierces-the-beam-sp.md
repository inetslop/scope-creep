---
id: T0210
title: "Beam combos II: Lance pierces the beam, Splash scorches its target"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T13:49:24Z
claimed_at: 2026-10-29T20:58:32Z
finished_at: 2026-10-29T23:00:19Z
epic: E4
---

## Goal
The shape augments do nothing on a Beam-first tower today. Give Lance and Splash the beam version of their card lines, so each changes where the beam does its damage. (The middle slice of the beam trilogy: T0130 I — Bolt's rays, Rapid and Rally's feed; this II; T0132 III — the beam carries the support auras. The original T0131's third clause — a beam kill splitting into Spray needles — is filed separately after this lands.)

## Details
Applies to a tower whose **first** augment is Beam (the beam tower). Beam added to other towers is unchanged. Values per second scale with the beam's own rate (6/8/10 by the Beam's tier) and with any multipliers the tower has (T0130's rapid/rally feed, if landed).
- **Lance added ("+1 pierce"):** the beam does not stop at its target: it continues in a straight line to the tower's full range and damages the first N more enemies it passes through (N = the tower's pierce — Lance's own pierce count, 1/2/3 by Lance tier), each at the full beam rate. The line is drawn to the last enemy it touches (or to the range edge when N is not used up), with the hit tick on each enemy struck.
- **Splash added ("Hits burst over 1 cell, to 2 more enemies"):** the beam's hit end scorches: up to SPLASH_CAP − 1 (2) other enemies within the Splash radius (1 / 1.5 / 2 cells by the Splash's tier) of the beamed enemy take **half** the beam rate per second. Show it as a faint ring (the tower's color, 30% alpha) at the hit end while anything is scorched, not the shot burst ring every frame.
- **Scope against T0130:** the pierce and the scorch act on the beam's main line only. If T0130 has landed, its extra rays are plain full-rate beams (they do not pierce or scorch) and the main line sits in the held layout as today (held[0]); build against its `beamLines` signature. If T0130 has not landed, build against the beam as it is — T0130 composes on top (its rays ignore pierce and scorch).
- **Panel:** the tower's description gains one clause per augment that is present, e.g. "the beam pierces 1 more", "scorches 2 nearby at 3 per second".

## Acceptance criteria
- [ ] Beam first + Lance: with two enemies in a line within range, both take the full beam rate and the line is drawn through to the second; with a Lance Epic (pierce 3) and three enemies in a line, all three take the rate.
- [ ] Beam first + Splash: up to 2 enemies within 1 cell of the beamed enemy take half the beam rate; enemies further away take nothing; the faint ring shows while anything is scorched and is gone the moment no one is in the radius.
- [ ] Unit tests pin the pierce count (per Lance tier), the scorch rate and cap, and the radius per Splash tier.
- [ ] If T0130 has landed: a beam tower with extra rays still feeds every ray at the full rate, and the rays do not pierce or scorch; the main line's pierce and scorch compose with the rays' shared multiplier (the per-frame damage still equals the panel's damage-per-second line).
- [ ] The tower panel's description says each effect that is present.
- [ ] Byte-identical: a Beam tower with no Lance and no Splash behaves exactly as today (no ring, no pierce, the line ends at the target).

## Design (architect, inet-racing)

T0210 — Lance pierces the beam, Splash scorches its target. New pure rule file `core/beamShapes.ts`; `BeamSystem` deals and draws both on the main line only; `describeSpec` gains one clause per effect. Beam added to other towers, and beam towers without these augments, are byte-identical.

### Files
1. CREATE `src/core/beamShapes.ts` — pierce + scorch rules (pure, no Phaser).
2. CREATE `tests/core/beamShapes.test.ts` — unit tests (vitest, same fixture style as `tests/core/beam.test.ts`).
3. EDIT `src/systems/BeamSystem.ts` — one import line, one insertion in `update()`, one drawing replacement, two module functions below the class.
4. EDIT `src/core/augments.ts` — two lines in `describeSpec`'s beam branch (after line 252). No new imports.
Do NOT touch: `core/beam.ts`, `towerDps.ts` (T0130), `towerLook.ts` (T0133), `EnemySystem`, `GameScene`, `TowerPanel`, `runChecks.ts` (victims are transient — nothing to check).

### Interfaces (`src/core/beamShapes.ts`)
- `BEAM_PIERCE_HALF_WIDTH = 0.3 * CELL` (board units; just wider than the road's half-width 0.29*CELL).
- `beamPierceVictims(enemies: readonly TargetCandidate[], x: number, y: number, range: number, main: TargetCandidate, count: number): number[]` — indices, nearest-to-tower first.
- `beamScorch(spec: TowerSpec): { rate: number; cap: number; radius: number } | undefined` — undefined unless `kind === 'beam'` and `spec.splash > 0`; `rate = spec.beamDps / 2`, `cap = spec.splashCount * SPLASH_CAP - 1`, `radius = spec.splash * CELL`.

### Steps
**1. CREATE `src/core/beamShapes.ts`** (exactly):
```ts
import { CELL } from '../config';
import { splashHits, type TowerSpec } from './augments';
import { inBeamRange } from './beam';
import type { TargetCandidate } from './targeting';

/** The beam's pierce corridor in board units: a bit wider than half the road (0.29*CELL), so a beam along the road passes through everything on it. */
export const BEAM_PIERCE_HALF_WIDTH = 0.3 * CELL;

/** The beam's pierce (Lance in a beam-first tower): up to `count` more enemies past `main`, in the corridor of the straight line (x,y) through `main`, each within `range` of the tower; indices, nearest first. */
export function beamPierceVictims(enemies: readonly TargetCandidate[], x: number, y: number, range: number, main: TargetCandidate, count: number): number[] {
  if (count <= 0) return [];
  const dx = main.x - x;
  const dy = main.y - y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return [];
  const ux = dx / d;
  const uy = dy / d;
  const w2 = BEAM_PIERCE_HALF_WIDTH * BEAM_PIERCE_HALF_WIDTH;
  const out: { i: number; t: number }[] = [];
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e === main || !e.active || !inBeamRange(e, x, y, range)) continue;
    const ex = e.x - x;
    const ey = e.y - y;
    const t = ex * ux + ey * uy; // along the line from the tower
    if (t < d - 1) continue; // not past the main target
    const cross = ex * uy - ey * ux; // lateral offset from the line
    if (cross * cross > w2) continue;
    out.push({ i, t });
  }
  out.sort((a, b) => a.t - b.t);
  return out.slice(0, count).map((o) => o.i);
}

/** The beam's scorch (Splash in a beam-first tower): half the beam rate on the nearest `cap` other enemies within `radius` of the beamed enemy; undefined without one. The numbers mirror describeSpec in core/augments.ts — keep in sync. */
export function beamScorch(spec: TowerSpec): { rate: number; cap: number; radius: number } | undefined {
  if (spec.kind !== 'beam' || spec.splash <= 0) return undefined;
  return { rate: spec.beamDps / 2, cap: splashHits(spec.splashCount) - 1, radius: spec.splash * CELL };
}
```
(No import cycle: `augments.ts` never imports this file — its clause recomputes the same numbers inline.)

**2. EDIT `src/core/augments.ts`** — after line 252 (`else if (spec.beamExtras.length > 1) ...`), inside the `spec.kind === 'beam'` branch:
```ts
    if (spec.pierce > 0) line += `, the beam pierces ${spec.pierce} more`;
    if (spec.splash > 0) line += `, and scorches ${splashHits(spec.splashCount) - 1} nearby at ${spec.beamDps / 2} per second`;
```

**3. EDIT `src/systems/BeamSystem.ts`**
a) After line 5 add: `import { beamPierceVictims, beamScorch } from '../core/beamShapes';` and `import { pickNearest } from '../core/targeting';`
b) After the `if (main !== -1) { ... }` block (line 64), before the extras loop (line 65), insert:
```ts
      // Shape augments on a beam-first tower's main line: Lance pierces, Splash scorches.
      let pierced: number[] = [];
      let scorched: number[] = [];
      const scorch = beamScorch(t.spec);
      if (main !== -1 && this.enemies.all[main]!.active) { // the line and its shapes die with the target
        const m = this.enemies.all[main]!;
        if (t.spec.kind === 'beam' && t.spec.pierce > 0) {
          pierced = beamPierceVictims(this.enemies.all, t.x, t.y, range, m, t.spec.pierce);
          for (const i of pierced) this.enemies.beamTick(this.enemies.all[i]!, t.spec.beamDps * dt, t); // full rate
        }
        if (scorch) {
          scorched = pickNearest(m, scorch.radius, this.enemies.all, scorch.cap);
          for (const i of scorched) this.enemies.beamTick(this.enemies.all[i]!, scorch.rate * dt, t);
        }
      }
```
c) Replace the drawing loop (lines 84–96, `for (const e of now) { ... }`) with:
```ts
      const mainE = now[0];
      if (t.spec.kind === 'beam' && t.spec.pierce > 0 && mainE) {
        // The main line is straight: it runs through the pierced enemies to the last one struck,
        // or to the range edge along the aim when none is (the muzzle is on the same line).
        const end = pierceEnd(t.x, t.y, mainE, range, this.enemies.all, pierced);
        g.lineStyle(4, color, 1);
        g.lineBetween(m.x, m.y, end.x, end.y);
        hitTick(g, m, mainE);
        for (const i of pierced) {
          const e = this.enemies.all[i]!;
          if (e.active) hitTick(g, m, e);
        }
      } else if (mainE) {
        g.lineStyle(4, color, 1);
        g.lineBetween(m.x, m.y, mainE.x, mainE.y);
        hitTick(g, m, mainE);
      }
      for (let i = 1; i < now.length; i++) {
        const e = now[i];
        if (!e) continue;
        g.lineStyle(4, color, 1);
        g.lineBetween(m.x, m.y, e.x, e.y);
        hitTick(g, m, e);
      }
      if (scorch && mainE && scorched.length > 0) {
        g.lineStyle(2, color, 0.3); // the scorch ring: faint, only while someone is scorched
        g.strokeCircle(mainE.x, mainE.y, scorch.radius);
      }
```
d) Below the class, two module functions:
```ts
/** The small flat tick across the line at the hit end. */
function hitTick(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, e: { x: number; y: number }): void {
  const dx = e.x - from.x;
  const dy = e.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const px = -dy / d;
  const py = dx / d;
  g.lineBetween(e.x - px * 4, e.y - py * 4, e.x + px * 4, e.y + py * 4);
}

/** Where the pierced main line ends: the last enemy it still strikes, or the range edge along the aim. */
function pierceEnd(x: number, y: number, main: { x: number; y: number }, range: number, enemies: Enemy[], pierced: number[]): { x: number; y: number } {
  for (let i = pierced.length - 1; i >= 0; i--) {
    const e = enemies[pierced[i]!];
    if (e?.active) return { x: e.x, y: e.y };
  }
  const dx = main.x - x;
  const dy = main.y - y;
  const d = Math.hypot(dx, dy);
  return d < 1 ? { x: main.x, y: main.y } : { x: x + (dx / d) * range, y: y + (dy / d) * range };
}
```

**4.** Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Byte-identity: with no Lance, the `else if (mainE)` + `i = 1..` loop draws exactly what the old `for (const e of now)` loop drew (4px line + tick per held enemy); with no Splash the ring never draws. Keep the gating on `t.spec.kind === 'beam'`.
- All new damage goes through `beamTick(e, rate * dt, t)` — dt-scaled, kills attributed to the tower; no auras (T0132's territory), no marks, no new sound.
- `pierced`/`scorched` are NOT held (transient, recomputed per frame): `broken()`, the hum, and `held` are untouched.
- A scorch target may also be a pierce victim or an extra line's target: rates stack (full + half + extra). Intended — do not dedupe.
- One rate source: main, pierce and scorch all read `t.spec.beamDps`. If T0130 (beam feed) lands first and scales the main rate elsewhere in `update()`, apply the same factor to the pierce and scorch calls.
- If T0130 has already landed, `update()`/the drawing differ: keep the pierce/scorch block right after the main line's tick and the pierce drawing inside the main line's draw; the main line is still `held[0]` and `beamLines` still returns it.
- The ring is a thin 2px stroke at 0.3 alpha on the shared per-frame Graphics (cleared automatically) — not a thick ring, so no `fillRing`.
- `describeSpec` recomputes the scorch numbers inline because importing `beamShapes` there would create a cycle (augments → beamShapes → beam → augments).

### Tests (`tests/core/beamShapes.test.ts`; fixture `const e = (x, y, distance, active = true): TargetCandidate => ({ x, y, distance, active });`, tower at (0,0), range `4.5 * CELL`, main `e(200, 0, 10)`)
- `beamPierceVictims`: 1/2/3 collinear enemies at (300,0)/(400,0)/(500,0) return that many indices in line order; excludes an enemy ahead of the main (t < d), |lateral| > 0.3*64, out of range, inactive, and the main itself; `[]` when `count <= 0` or d < 1.
- `beamScorch`: undefined for a non-beam spec and for `splash <= 0`; rate 3/4/5 for beamDps 6/8/10; cap 2 (1 copy) / 5 (2); radius 64/96/128.
- Tier pins via `towerSpec` with `const copy = (id, tier) => ({ id, tier })`: `[beam T, lance T]` → `pierce` 1/2/3; `[beam, splash T]` → `splash` 1/1.5/2; `[beam T]` → `beamDps` 6/8/10.

## Result (attempt 1, inet-racing)

Beam towers now combine with their shapes: a Lance-added beam pierces straight through its target to full range, hitting up to 1/2/3 more enemies in a corridor a touch wider than the road at the full beam rate, and a Splash-added beam scorches the 2 (or 5 with a second Splash) nearest others around its target at half rate inside the tier's radius, shown as a faint ring. Both feed through the normal kill path and scale with Rapid and Rally exactly like the beam's own line, and the tower's panel line gains one clause per shape. Beam towers without either shape are byte-identical to before: no ring, no pierce, line ends at the target. All pinned by 13 new unit tests plus the existing T0130/T0132 coverage; check and smoke pass on desktop and mobile.

- Self-review: APPROVE
- Time: 121.8 min

```
projects/chokepoint/game/src/core/augments.ts      |   3 +
 projects/chokepoint/game/src/core/beamShapes.ts    |  46 +++++++++
 projects/chokepoint/game/src/core/tiers.ts         |   3 +-
 projects/chokepoint/game/src/systems/BeamSystem.ts | 105 ++++++++++++++++++---
 .../chokepoint/game/tests/core/beamShapes.test.ts  | 100 ++++++++++++++++++++
 5 files changed, 242 insertions(+), 15 deletions(-)
```
