---
id: T0006
title: "Sprinter: the enemy that gets faster when hit"
assignee: inet-racing
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
---

## Goal
A new enemy with a behavior no other has: it gets faster every time it is hit, so focusing it is a race — melt it before it takes off.

## Details
- Closest existing: Dart (a fast walker at constant speed). What is new: a speed ramp — every hit makes it permanently faster.
- Shape and size: a small orange chevron (arrow) pointing along the path, the same size as Dart. Distinguishable from Dart at a glance (Dart is its current shape; the Sprinter is the arrow).
- hp: the same as Dot's hp. Kill gold: the same as Dart's. A leak costs 1 life, like all enemies.
- Speed: starts at 90% of Dart's speed. Each hit it takes adds 10% of Dart's speed (of the base, not compounding). Cap: 190% of Dart's speed, reached after 10 hits.
- Feedback: the normal white hit flash, plus two short speed ticks trailing behind it; the ticks grow a little with every speed step, and once the cap is reached they pulse every 0.5s.
- Waves: waves 1-7 unchanged. From wave 8: 2 Sprinters mixed into the wave; +1 at wave 12, +1 at wave 16, +1 at wave 20; capped at 6 per wave.

## Acceptance criteria
- [ ] A Sprinter that has been hit is visibly faster than an unhit Dart (it covers the same road segment in less time).
- [ ] After 10 hits it stops getting faster: its speed no longer changes when hit.
- [ ] Sprinters first appear in wave 8; waves 1-7 contain none.
- [ ] The orange chevron reads as a new enemy (shape differs from Dart and Dot) at 412x915 and 1280x720.
- [ ] Killing one pays Dart's gold and counts as a stop like any enemy.

## Design (architect, desktop)

- `Enemy` is a pooled `Image` that stores `speed` in board units/s; `strike()` only calls `e.hit(damage)` when `damage > 0`, so "a hit" = a damaging hit (same event as the white flash).
- Enemies never rotate ("shading is painted in"); Dart's triangle is a fixed up-pointing glyph. So the chevron is a fixed glyph too — "pointing along the path" is carried by the trailing speed lines, which do follow the path direction (a new `dirX/dirY` unit vector on `Enemy`).
- `enemyMarks.ts` has a `MARKS` registry `(g, e) => void` redrawn every frame — the right home for the persistent speed lines (no pooling, no cleanup, can't outlive the enemy).
- `planWave` is budget/weight driven; "exactly 2 Sprinters from wave 8" needs an explicit reservation + interleave, and the rng call order for waves 1–7 must stay identical.
- `Phaser 3.90` Graphics has `save()/translate()/rotate()/restore()`; thick strokes are banned by the art rules, so ticks are filled rounded rects.
- `Rng.weighted` on an empty list returns `undefined` without consuming the seed — the walk loop is safe as-is.

DESIGN:
### Files
- create `src/content/enemies/sprinter.ts` — the enemy data
- edit `src/content/enemies/index.ts` — import + one entry in `ENEMIES` (after `block`)
- edit `src/content/types.ts` — `'chevron'` in `Shape`; `speedRamp` field in `EnemyDef` (two one-line hunks, near `speed`)
- edit `src/art/shapes.ts` — chevron points in `shapePoints`
- edit `src/core/waves.ts` — `rampCount()`; reserve + interleave ramping enemies in `planWave`
- edit `src/entities/Enemy.ts` — `dirX/dirY`; ramp in `hit()`
- edit `src/systems/enemyMarks.ts` — one `MARKS` entry (speed lines)
- edit `src/debug/runChecks.ts` — one invariant line
- edit `tests/core/waves.test.ts`, `tests/content.test.ts` — rule tests

### Interfaces
```ts
// content/types.ts — Shape gains 'chevron'; EnemyDef gains, right after `speed`:
/** Gets faster when hit: `perHit` cells/s added per hit taken, never past `max`. */
speedRamp?: { perHit: number; max: number };
// core/waves.ts:
export function rampCount(wave: number): number; // 0 before wave 8; else min(6, 2 + floor((wave-8)/4))
// entities/Enemy.ts gains fields (no signature changes):
dirX = 0; dirY = -1; // unit vector along the path where it walks
```

### Steps
1. `src/content/enemies/sprinter.ts` (model on `dart.ts`): `id 'sprinter'`, `name 'Sprinter'`, `description 'Gets faster every time it is hit: melt it before it takes off.'`, `behavior 'walk'`, `hp: 30` (Dot's), `speed: 2.52`, `gold: 3` (Dart's), `livesCost: 1`, `threat: 3`, `fromWave: 8`, `look: { shape: 'chevron', color: 'orange', size: 0.21 }` (Dart's size), `speedRamp: { perHit: 0.28, max: 5.32 } // 90% of Dart's 2.8; +10% of it per hit; capped at 190% (10 hits)`. Add to `ENEMIES`.
2. `content/types.ts`: append `| 'chevron'` to the `Shape` line; add the `speedRamp` field. Nothing else in this file.
3. `art/shapes.ts` in `shapePoints`, first statement: `if (shape === 'chevron')` return (pointing up, a triangle with a notch cut up out of its base, all y `+ radius*0.1`): `{x:0,y:-radius}`, `{x:radius*0.85,y:radius*0.7}`, `{x:radius*0.45,y:radius*0.7}`, `{x:0,y:radius*0.05}`, `{x:-radius*0.45,y:radius*0.7}`, `{x:-radius*0.85,y:radius*0.7}`. Also add `chevron: 6` to the `sides` record or the typecheck fails. No other art changes: `entities.ts` paints it automatically via `paintToken`.
4. `core/waves.ts`: add `rampCount` (above). In `planWave`: split `unlocked` into `rampers` (`e.speedRamp`) and `walkers`; before the pick loop, for each ramper take `n = Math.min(rampCount(wave), Math.floor(budget / e.threat))` ids into `rampSpawns` and `budget -= n * e.threat`; the existing while-loop is unchanged except `unlocked` → `walkers` (keep the "faster enemies come closer together" comment); if `rampSpawns.length === 0` return the plan exactly as today. Otherwise: convert `spawns` to absolute times `at: {enemy, t}[]` (cumulative `delaySec`), let `end` = total, `span = end + waveSpacing(wave) * 1.5`; push each ramper id at `t = ((i + 0.5) / rampSpawns.length) * span`; `at.sort((a, b) => a.t - b.t)`; return `spawns: at.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.t - at[i - 1]!.t }))`. No `rng` calls in the mix step.
5. `entities/Enemy.ts`: add the two fields (doc: "The way it is walking (unit vector along the path); speed lines trail behind it."); in `spawn()` reset both (`dirX = 0; dirY = -1;`); in `advance()` after `const p = path.pointAt(this.distance);` add: `const a = path.pointAt(this.distance + 4); const dl = Math.hypot(a.x - p.x, a.y - p.y); if (dl > 0) { this.dirX = (a.x - p.x) / dl; this.dirY = (a.y - p.y) / dl; }`; in `hit()` after `this.setTintFill(0xffffff);` add: `const ramp = this.def.speedRamp; if (ramp && this.speed < ramp.max * CELL) this.speed = Math.min(this.speed + ramp.perHit * CELL, ramp.max * CELL);` (`CELL` already imported).
6. `systems/enemyMarks.ts`: import `CELL` (`../config`) and `deepOf` (alongside `PALETTE`); add one `MARKS` entry after the health-bar mark:
```ts
  (g, e) => {
    const ramp = e.def.speedRamp;
    if (!ramp) return;
    const step = Math.max(0, Math.min(10, (e.speed / CELL - e.def.speed) / ramp.perHit));
    const len = 5 + step * 1.1;
    const alpha = e.speed >= ramp.max * CELL - 0.01 ? 0.65 + 0.25 * Math.sin(e.age * Math.PI * 4) : 0.9;
    const r = e.def.look.size * CELL;
    const angle = Math.atan2(-e.dirY, -e.dirX);
    for (const s of [-1, 1]) {
      g.save();
      g.translate(e.x - e.dirX * (r + 4) - e.dirY * s * 3.5, e.y - e.dirY * (r + 4) + e.dirX * s * 3.5);
      g.rotate(angle);
      g.fillStyle(deepOf(e.def.look.color), alpha);
      g.fillRoundedRect(-len, -1.5, len, 3, 1.5);
      g.restore();
    }
  },
```
7. `debug/runChecks.ts`: import `CELL`; after the `enemies.count` line add: `['enemies.speedCap', (g) => (g.enemies.all.some((e) => e.active && e.def.speedRamp && e.speed > e.def.speedRamp.max * CELL + 0.01) ? 'a ramping enemy is over its speed cap' : null)],`
8. Run `npm run check`.

### Pitfalls
- **Do not rotate the chevron sprite.** Enemy textures have their side face and shadow painted in ("never rotate an image that has it"); the chevron is a fixed up-pointing glyph like Dart's triangle. The path-following feel comes from the trailing lines using `e.dirX/dirY`.
- **Waves 1–7 must stay bit-identical**: same `rng` call sequence — the ramper reservation must not call `rng`, and the mix step must not either. The early return keeps the old path byte-for-byte.
- **Floats**: `2.52*64 + 10*0.28*64` lands within 1e-13 of the cap; every cap comparison uses an epsilon (the `0.01` above).
- **Pooling**: `dirX/dirY` are reset in `spawn()`; the speed lives in `this.speed` which `spawn()` already resets from `def`.
- **Graphics**: `save()`/`restore()` must always pair (the bars `Graphics` is cleared each frame, so an unbalanced save corrupts the next frame's bars); ticks are filled rounded rects, never thick `lineBetween` strokes (notched/shimmer).
- **Merge surface**: T0002/T0004 also edit `content/types.ts` (in `AugmentDef`/`AddedForm`) and T0002 likely `tests/content.test.ts` (augments block). Keep your hunks to the `Shape` line, the `EnemyDef` field, and the enemies loop — one line each, nothing else.
- The menu demo picks a random `ENEMIES` entry, so Sprinters will appear in it automatically — nothing to do.

### Tests
- `tests/core/waves.test.ts`: `rampCount` equals `[0,2,3,4,5,6,6]` for waves `[7,8,12,16,20,24,40]`; and for waves `[[1,0],[7,0],[8,2],[12,3],[16,4],[20,5],[24,6],[30,6]]`, `planWave(wave, new Rng(wave), ENEMIES).spawns.filter(s => s.enemy === 'sprinter').length` equals the expected count.
- `tests/content.test.ts` (enemies loop): `if (e.speedRamp) { expect(e.speedRamp.perHit).toBeGreaterThan(0); expect(e.speedRamp.max).toBeGreaterThan(e.speed); }`
