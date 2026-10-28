---
id: T0027
title: "Push: the augment that moves enemies back along the road"
assignee: desktop
size: L
priority: 3
status: done
depends_on: [T0020, T0023, T0024, T0026]
attempts: 1
created: 2026-10-28T05:51:38Z
claimed_at: 2026-10-28T15:41:46Z
finished_at: 2026-10-28T15:59:46Z
epic: E4
---

## Goal
The draft can roll a new augment, Push: a gust that shoves enemies back along the road — the first thing in the game that moves an enemy instead of only slowing or stopping it. It buys time, not damage, so a chokepoint can be held back, not just through.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft — a support role, like Frost and Mark). **Closest existing:** Frost (the only other support pulse: affects everything in a radius without dealing damage — Frost slows). **What is new:** no existing augment changes an enemy's **position along the road**. Frost and Anchor change how fast an enemy walks; Mark changes what its hits cost; Push moves it *back* — an enemy pushed back near the exit is bought real time, and the road behind it is struck again. As an added form, "hits push back" is the first added form that changes an enemy's position: it combines with every attack in the game in a way no other added form does (damage, slow, mark, leap, pierce, extra shots).
- **As a tower's first augment (support role, no damage):** a gust that pushes **everything** within 2.5 cells back along the road. Common: 0.8 cells back, every 2.4 s. Rare: 1.0 cells back, every 2.0 s. Epic: 1.2 cells back, every 1.8 s. The slide takes ~180 ms along the white road (never a teleport), and the gust plays a soft whoosh (one new Sfx method, quieter than the hit blip). A push deals no damage: an enemy's health, slow and mark are exactly unchanged by it.
- **When added to a tower:** every enemy this tower hits is also pushed back 0.4 cells; +0.4 cells per extra Push in the tower (two Pushes: 0.8 per hit). The same numbers at every tier. Per-hit pushes are silent (a Rapid host would spam the sound); only the support gust plays the whoosh.
- **The push is a position change, not a speed change:** the enemy's remaining road distance shrinks. A slowed enemy pushed back is still slowed when it walks on. An enemy at the road's start never slides before it (the push clamps at the start). Sprinter (T0006) speeds an enemy up when it is hit — the two coexist: a hit may speed an enemy up *and* push it back, and the push never touches speed.
- **Card lines:** Common first: "Pushes everything back 0.8 cells, every 2.4 s." / added: "Hits push back 0.4 cells, +0.4 per Push." The Rare and Epic cards show their own distance and cadence in the same first line (1.0 cells / 2.0 s; 1.2 cells / 1.8 s); the added line is the same at every tier.
- **Look on the tower:** a body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). A short, wide, flat barrel (the gust comes out of it; it throws nothing), and one small outward-pointing tick on the base ring per Push in the tower (a small arrowhead pointing away from the base, in the existing tick style). If T0010's tier pips have landed, they stay visible — the ticks sit around/below the pips, never on top of them.
- **The tower-panel line** (the tower's described spec, the same place Mark's mark line lives) reads the push numbers: e.g. "Pushes everything back 0.8 cells", and for a tower with a Push added to another first augment, "...and its hits push back 0.4 cells".
- The gust values (distance, cadence, per-hit push) get spec-test coverage closest to Frost's slow values in the augment tests, and the push clamp (no enemy ever before the road's start) is one invariant line in the debug run checks next to the existing enemy invariants.
- No new input, no new HUD element; the pause screen is unchanged. The only new sound is the gust whoosh.

## Acceptance criteria
- [ ] The draft can roll Push as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's distance and cadence; the added line reads "Hits push back 0.4 cells, +0.4 per Push." at every tier.
- [ ] A lone Common Push tower pushes every enemy within 2.5 cells back 0.8 cells every 2.4 s: enemies visibly slide back along the road over ~180 ms and a soft whoosh plays; an enemy's health after the gust is exactly what it was before.
- [ ] An enemy at the road's start does not slide before it; a slowed enemy pushed back is still slowed when it walks on.
- [ ] A Bolt tower with Push in a later slot pushes each hit enemy back 0.4 cells on every shot; with two Pushes it pushes back 0.8 per shot.
- [ ] A Rare Push tower pushes 1.0 cells every 2.0 s and an Epic pushes 1.2 cells every 1.8 s — visibly stronger and faster than the Common one.
- [ ] The tower shows the free shape/color body, the short flat barrel and one outward tick per Push copy, visible at 1x zoom at 412x915 and 1280x720.
- [ ] A first-time player can read what a Push tower does from the board alone: enemies slide back when it fires.

## Design (architect, desktop)

### Files
- create `src/content/augments/push.ts` — the Push `AugmentDef` (support pulse, no damage).
- edit `src/content/augments/index.ts` — import `push`, add it to `AUGMENTS` next to `frost` (both support pulses).
- edit `src/content/types.ts` — add `push?: number` to `FirstForm` and `AddedForm`; add `push?: number` and `asTower?: string` to `TierValues`.
- edit `src/core/tiers.ts` — `tierFirst` returns `push: t.push ?? f.push`; add `tierFirstLine()`.
- edit `src/core/augments.ts` — `TowerSpec` gains `gust`/`pushPerHit`/`pushCount` (set in `EMPTY` and `towerSpec`); `describeSpec` gains a gust branch + per-hit clause.
- edit `src/entities/Enemy.ts` — `pushLeft` field, `pushBack()`, the slide in `advance()`, reset in `spawn()`.
- edit `src/systems/EnemySystem.ts` — `HitPayload.push`; `strike()` applies it; `brokenPush()` invariant helper.
- edit `src/systems/TowerSystem.ts` — build `payload.push`.
- edit `src/systems/attacks/pulse.ts` — play the gust whoosh when `spec.gust > 0`.
- edit `src/entities/towerLook.ts` — `barrelCount`/`barrelLook` for the flat mouth; a `DECORATIONS` entry for the outward ticks + a `drawArrowhead` helper.
- edit `src/audio/Sfx.ts` — `gust()` method.
- edit `src/scenes/DraftScene.ts` — show `tierFirstLine(b, copy.tier)` on the first card line (one line + import).
- edit `src/debug/runChecks.ts` — `enemies.push` invariant line.
- edit `tests/content.test.ts`, `tests/core/augments.test.ts` — spec/card coverage.

### Interfaces
```ts
// content/types.ts
interface FirstForm  { /* ... */ push?: number }   // cells the attack pushes everything in range back (Push)
interface AddedForm  { /* ... */ push?: number }   // cells each hit pushes back (0.4 per Push)
interface TierValues { /* ... */ push?: number; asTower?: string } // tier's gust distance; tier's first card line

// core/augments.ts
interface TowerSpec  { /* ... */ gust: number; pushPerHit: number; pushCount: number }
// core/tiers.ts
function tierFirstLine(def: AugmentDef, tier: Tier): string

// systems/EnemySystem.ts
interface HitPayload { /* ... */ push: number }    // board units the hit pushes back (0: none)
class EnemySystem    { brokenPush(): string | undefined }

// entities/Enemy.ts
class Enemy { pushLeft: number; pushBack(units: number): void }
// audio/Sfx.ts
class Sfx { gust(): void }
```

### Steps
1. **`push.ts`** (full file):
```ts
export const push: AugmentDef = {
  id: 'push', name: 'Push',
  description: 'Pushes everything back along the road. Added: hits push back 0.4 cells.',
  asTower: 'Pushes everything back 0.8 cells, every 2.4 s.',
  asAdded: 'Hits push back 0.4 cells, +0.4 per Push.',
  look: { shape: 'triangle', color: 'purple', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 2.4, push: 0.8 },
  added: { push: 0.4 },
  opening: true,
  tiers: {
    rare: { cooldownMul: 5 / 6, push: 1.0, asTower: 'Pushes everything back 1.0 cells, every 2.0 s.', asAdded: 'Hits push back 0.4 cells, +0.4 per Push.' },
    epic: { cooldownMul: 3 / 4, push: 1.2, asTower: 'Pushes everything back 1.2 cells, every 1.8 s.', asAdded: 'Hits push back 0.4 cells, +0.4 per Push.' },
  },
};
```
First check `content/augments/` for any in-flight augment already using `triangle`+`purple`; if taken, take the next free (shape, color) pair. Register it in `index.ts`.
2. **`types.ts`**: add the three fields (comments above). **`tiers.ts`**: in the non-common `tierFirst` return add `push: t.push ?? f.push,`; after `tierAddedLine` add `tierFirstLine(def, tier)` = `tier === 'common' ? def.asTower : def.tiers[tier].asTower ?? def.asTower`.
3. **`core/augments.ts`**: in the `spec` literal add `gust: f.push ?? 0, pushPerHit: 0, pushCount: 0,` (and the three to `EMPTY`). After the marks loop add:
```ts
  for (let i = 0; i < augments.length; i++) {
    const a = getAugment(augments[i]!.id);
    if (a.id !== 'push') continue;
    spec.pushCount += 1;
    if (i > 0) spec.pushPerHit += a.added.push ?? 0;
  }
```
In `describeSpec`, make the first branch `if (spec.gust > 0) { line = \`Pushes everything back ${spec.gust.toFixed(1)} cells\`; /* +slow/+bolts/+mark as the other branches */ }`, and just before `return \`${line}.\`` add `if (spec.pushPerHit > 0) line += \`, and its hits push back ${spec.pushPerHit.toFixed(1)} cells\`;`.
4. **`Enemy.ts`**: module `const PUSH_RATE = 4.5;` (cells/s, 0.8 cells ≈ 180 ms). Field `pushLeft = 0`; reset it in `spawn()`. `pushBack(units)` = `if (!this.active || units <= 0) return; this.pushLeft += units;`. In `advance()`, after the slow block and before the walk:
```ts
    if (this.pushLeft > 0) {
      const pushed = Math.min(this.pushLeft, PUSH_RATE * CELL * dt);
      this.distance = Math.max(0, this.distance - pushed);
      this.pushLeft -= pushed;
    }
```
5. **`EnemySystem.ts`**: add `push: number` to `HitPayload`; in `strike()` after the slow line add `if (payload.push > 0) e.pushBack(payload.push);`; add `brokenPush()` (an active enemy with `distance < 0`). **`TowerSystem.ts`**: in the payload add `push: (spec.gust + spec.pushPerHit) * CELL,`. **`pulse.ts`**: replace `sfx?.pulse();` with `if (spec.gust > 0) sfx?.gust(); else sfx?.pulse();`.
6. **`towerLook.ts`**: `barrelCount` → `if (spec.gust > 0) return 1;` after the `attacks` guard. `barrelLook` → first line `if (spec.gust > 0) return { length: 1.2, width: 2.2, bulb: false, bands: 0 };` (the short wide mouth; tune so it clears the body at 1x on a phone). New `DECORATIONS` entry (after the Mark entry): for `i < spec.pushCount`, `drawArrowhead(g, BODY * 2.4, Math.PI / 2 + (i / spec.pushCount) * Math.PI * 2, PALETTE.ink)`. Add the `drawArrowhead(g, R, a, color)` helper: a small ink `fillTriangle` with its tip at radius `R + 5` along `a` and its base at `R - 3` spanning `a ± 0.34`.
7. **`Sfx.ts`**: `gust(): void { this.tone(300, 0.18, 'sine', 0.15, 160); }` (soft downward slide, quieter than `pulse`).
8. **`DraftScene.ts`**: import `tierFirstLine`; line 74 `b.asTower` → `tierFirstLine(b, copy.tier)`.
9. **`runChecks.ts`**: add `['enemies.push', (g) => g.enemies.brokenPush()],` after `enemies.mark`.
10. **Tests**: `content.test.ts` line 39 → `... || a.first.push);`, and in the tier loop validate `t.asTower` length/label when present. `augments.test.ts`: import `tierFirstLine`; assert `towerSpec([copy('push')]).gust === 0.8`, `.range === 2.5`, `.rate ≈ 1/2.4`, rare `.gust === 1.0`/`.rate ≈ 1/2.0`, epic `.gust === 1.2`/`.rate ≈ 1/1.8`, `.damage === 0`; `pushPerHit` 0.4 / 0.8 for one/two added Pushes, `gust === 0` on `bolt+push`, `pushCount` 1 and 2; `describeSpec` matches `/Pushes everything back 0\.8 cells/` and `/hits push back 0\.4 cells/`; `tierFirstLine(push, 'rare')`/`'epic'` equal the card lines.

### Pitfalls
- The slide must be frame-rate independent: consume `pushLeft` at `PUSH_RATE * CELL * dt` (never assume 60 fps) and clamp `distance` at 0 so no enemy slides before the road's start; the slow is untouched (`slowPct`/`slowLeft`), so a slowed enemy stays slowed.
- The flat mouth sits behind the body (the body draws over the gun); if it is hidden at 412x915, raise `barrelLook` `length`/`width` until a wide cap is visible at 1x. The outward ticks are at radius `BODY * 2.4`, below the tier pips (deco-local y≈26) — keep them clear.
- `pushLeft` must be reset in `spawn()` (pooled enemies) or a recycled enemy keeps sliding. Per-hit pushes are silent; only `spec.gust > 0` plays the whoosh (a Rapid host must not spam it).
- T0006 (Sprinter) also edits `Enemy` movement; the push is a position change and never touches `speed`, so they compose — keep the push on `distance`/`pushLeft` and do not read or write `speed`.
- Do not reorder the `AUGMENTS`/`DECORATIONS`/`INVARIANTS` lines; insert next to the related entry.

### Tests
- `tests/core/augments.test.ts`: gust distance/cadence per tier, per-hit push (1 and 2 Pushes), `gust === 0` for `bolt+push`, `pushCount`, the `describeSpec` push lines, and `tierFirstLine` card lines (mirrors the Frost slow-value tests).
- `tests/content.test.ts`: accept `a.first.push` as a valid support first form; validate `t.asTower` when present.

## Result (attempt 1, desktop)

Added the Push augment (src/content/augments/push.ts, triangle/purple, opening, per-tier gust 0.8/1.0/1.2 cells at 2.4/2.0/1.8 s) plus the first position-changing mechanic: gusts and per-hit pushes queue `pushLeft` on enemies, slid back at 4.5 cells/s (≈180 ms) and clamped at the road's start in `Enemy.advance()`, applied via a new `HitPayload.push` in `EnemySystem.strike()` (so every attack kind carries it). `TowerSpec` gained `gust`/`pushPerHit`/`pushCount` with the tower-panel lines in `describeSpec`, the tower shows a short flat gust mouth and one outward arrowhead tick per Push, and a soft `sfx.gust()` whoosh plays only for support gusts; new spec/card tests mirror Frost's and an `enemies.push` invariant guards the clamp. Two small deviations: the design's `tierFirstLine()` already exists as `tierTowerLine()` (DraftScene untouched), and the pure-support skip in `TowerSystem.update()` now also allows `gust > 0` so a Push tower can actually fire. `npm run check` and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 18.0 min

```
projects/chokepoint/game/src/audio/Sfx.ts          |  5 +++
 .../chokepoint/game/src/content/augments/index.ts  |  2 ++
 .../chokepoint/game/src/content/augments/push.ts   | 17 ++++++++++
 projects/chokepoint/game/src/content/types.ts      |  6 ++++
 projects/chokepoint/game/src/core/augments.ts      | 28 +++++++++++++++-
 projects/chokepoint/game/src/core/tiers.ts         |  1 +
 projects/chokepoint/game/src/debug/runChecks.ts    |  1 +
 projects/chokepoint/game/src/entities/Enemy.ts     | 19 +++++++++++
 projects/chokepoint/game/src/entities/towerLook.ts | 19 +++++++++++
 .../chokepoint/game/src/systems/EnemySystem.ts     |  9 +++++
 .../chokepoint/game/src/systems/TowerSystem.ts     |  5 +--
 .../chokepoint/game/src/systems/attacks/pulse.ts   |  3 +-
 projects/chokepoint/game/tests/content.test.ts     |  2 +-
 .../chokepoint/game/tests/core/augments.test.ts    | 39 +++++++++++++++++++++-
 14 files changed, 150 insertions(+), 6 deletions(-)
```
