---
id: T0068
title: "Splitter: the enemy that breaks into two"
size: M
priority: 3
status: todo
depends_on: [T0057]
attempts: 0
created: 2026-10-28T13:54:28Z
---

## Goal
Killing is not always winning: the Splitter dies into two smaller, faster enemies — the first enemy that fights back against being killed.

## Details
- **Closest existing enemy:** Dot (a plain small walker). **New:** it splits on death — no current enemy splits, and it turns a kill into a spawn.
- **The Splitter:** a round token 1.2× Dot's size in Dot's own color, with one thin crack line across its face in the road's white (the tell). It walks at 75% of Dot's speed with 3× Dot's hp and pays 2× Dot's kill gold.
- **The split:** on death from any damage source (a shot, a Beam per-second tick, an Ember tick, a Trap spring — whatever lands the killing blow), two splinters spawn on the road at the Splitter's position, one 0.25 cells ahead of it and one 0.25 cells behind. Each splinter is a small round token 0.6× Dot's size (no crack), with 0.5× Dot's hp, 1.25× Dot's speed, no split of its own, and each pays Dot's kill gold.
- **The Splitter's death is a normal kill:** it pays its gold, it triggers a Mint (T0021) if in range, it counts for "stopped", and it starts or continues the combo chain (T0031) — splinter kills within 1.5 s of the Splitter's death continue the same chain.
- **Wave mix:** from wave 9, the mix rolls one Splitter per 7 enemies (floor of count ÷ 7; a wave with under 7 enemies sends none; waves 1–8 never do). Splinters are not in any mix — they exist only as splits. The wave preview (T0015) counts Splitters among the wave's shapes once it is in.
- **Art:** chunky round token with a darker side face and soft shadow like the others; the crack is one thin road-white line across the face; splinters are the same token scaled down with no crack. No new colors beyond Dot's.
- Chained behind T0057 (Hauler) on purpose: new enemies land one at a time so the enemy system, the wave mix and the art settle between additions.

## Acceptance criteria
- [ ] From wave 9 some waves include Splitters — round tokens 1.2× Dot's size, Dot's color, one thin white crack across the face; before wave 9, none.
- [ ] Killing a Splitter by any damage source spawns two splinters (0.6× Dot's size, no crack) 0.25 cells either side of the kill position along the road, continuing at 1.25× Dot's speed.
- [ ] The Splitter's death pays its kill gold, counts as a kill (combo, "stopped", Mint) and a splinter killed within 1.5 s continues the combo chain.
- [ ] Splinters never split, whatever kills them; they are the only splinters on the board.
- [ ] A first-time player reads the Splitter as a bigger, cracked Dot before being told; the wave preview (once in) counts Splitters in the next wave's shapes.

## Design (architect, desktop)

### Files
- create `src/content/enemies/splitter.ts` — `export const splitter: EnemyDef`: `id 'splitter'`, name 'Splitter', `behavior 'walk'`, `hp 90` (3× Dot), `speed 1.2` (75% of Dot's 1.6), `gold 8`, `livesCost 1`, `threat 1`, `fromWave 9`, `splitsInto: 'splinter'`, `look { shape: 'circle', color: 'red', size: 0.264 }` (1.2× Dot's 0.22), description e.g. 'A bigger Dot with a crack: killing it splits it into two splinters.'
- create `src/content/enemies/splinter.ts` — `export const splinter: EnemyDef`: `id 'splinter'`, `behavior 'walk'`, `hp 15`, `speed 2`, `gold 4`, `livesCost 1`, `threat 1`, `fromWave 9`, `spawnOnly: true`, `look { shape: 'circle', color: 'red', size: 0.132 }`, no `splitsInto`. (threat/fromWave values are never used by the mix — `spawnOnly` does that — but `tests/content.test.ts` requires threat > 0 and fromWave >= 1.)
- create `src/core/split.ts` — pure helper, exact:
```ts
import { CELL } from '../config';
/** Where an enemy's split children spawn, as distances along the road: one 0.25 cells ahead of the kill, one 0.25 behind, clamped to the road's ends. */
export function splitDistances(distance: number, pathLength: number): [number, number] {
  return [Math.min(distance + CELL * 0.25, pathLength - 1), Math.max(0, distance - CELL * 0.25)];
}
```
- edit `src/content/types.ts` — two optional fields on `EnemyDef`: after the `dashCycle` field add `/** When it dies, it splits into two of this enemy: one 0.25 cells ahead of the kill, one behind (core/split.ts). */ splitsInto?: string;`; after the `fromWave` field add `/** Never in a wave's mix: it exists only as a split of another enemy (core/waves.ts skips it). */ spawnOnly?: boolean;`
- edit `src/content/enemies/index.ts` — import lines `import { splitter } from './splitter';` `import { splinter } from './splinter';` (kebab-sorted, after `sprinter`), and `splitter,` `splinter,` as the last two lines of `ENEMIES` (list is fromWave-ordered; both are wave 9).
- edit `src/core/waves.ts` — the wave mix (see Steps 4).
- edit `src/entities/Enemy.ts` — new field + `spawn()` distance parameter (Steps 5).
- edit `src/systems/EnemySystem.ts` — `spawn()` distance parameter + the split on death in `strike()` (Steps 6).
- edit `src/art/entities.ts` — the white crack on any enemy with `splitsInto` (Steps 7).
- edit `src/scenes/menu/MenuDemo.ts` — demo never walks lone splinters (Steps 8).
- edit `src/debug/runChecks.ts` — one invariant (Steps 9).
- edit `tests/core/waves.test.ts`, create `tests/core/split.test.ts` (Steps 10).
No GameScene/HudScene changes: the split is kill handling (EnemySystem), the mix is `planWave`, the preview (`NextWavePreview`) reads `waveCounts(plan)` + `enemyTexture(id)` and counts Splitters automatically; the combo chain is FxSystem's 1.5 s time window, which splinter kills enter automatically via the normal `strike()` path. No new Sfx (Sfx.ts is hot: T0035/T0043/T0063).

### Interfaces
New types and changed signatures, exact:
```ts
// content/types.ts, on EnemyDef:
splitsInto?: string;
spawnOnly?: boolean;
// core/split.ts:
export function splitDistances(distance: number, pathLength: number): [number, number];
// entities/Enemy.ts:
hpMul = 1; // new field, after maxHp — the wave's hp multiplier it took; its split children take the same
spawn(def: EnemyDef, hpMul: number, path: PathLine, distance = 0): void; // was (def, hpMul, path)
// systems/EnemySystem.ts:
spawn(def: EnemyDef, hpMul: number, distance = 0): Enemy; // was (def, hpMul)
// core/waves.ts:
export function splitterCount(total: number): number; // = Math.floor(total / 7)
```

### Steps
1. `content/types.ts`: the two fields.
2. Create the two content files (exact values above), then register them in `content/enemies/index.ts`.
3. Create `core/split.ts`.
4. `core/waves.ts`, four small changes, in `planWave`: (a) `const unlocked = enemies.filter((e) => !e.spawnOnly && e.fromWave <= wave && e.threat > 0);` (b) `const walkers = unlocked.filter((e) => e.speedRamp === undefined && e.dashCycle === undefined && e.splitsInto === undefined);` (c) after `const reserved = [...rampSpawns, ...dashSpawns];` add exactly:
```ts
  // Splitters: one per 7 of the wave's enemies, once its fromWave (9) has been reached (no rng: seeded waves stay stable).
  const splitter = unlocked.find((e) => e.splitsInto !== undefined);
  if (splitter) for (let i = 0; i < splitterCount(spawns.length + reserved.length); i++) reserved.push(splitter.id);
```
(d) add `splitterCount` next to `rampCount`/`dashCount`. Splitters are free (not subtracted from the budget, like rampers are reserved but the count is fixed) — they join `reserved` and are interleaved evenly.
5. `entities/Enemy.ts`: add `hpMul = 1;` after `maxHp`; `spawn(def: EnemyDef, hpMul: number, path: PathLine, distance = 0)` — set `this.hpMul = hpMul;` and change `this.distance = 0;` to `this.distance = distance;` (position already comes from `path.pointAt(this.distance)`).
6. `systems/EnemySystem.ts`: `spawn(def, hpMul, distance = 0)` passes `distance` as the 4th arg of `enemy.spawn`; import `splitDistances`; in `strike()`, between `hook.stats.enemiesKilled += 1;` and `e.despawn();` insert:
```ts
    // A splitter dies into two splinters, 0.25 cells either side of the kill (core/split.ts).
    if (e.def.splitsInto) {
      const child = getEnemy(e.def.splitsInto);
      for (const d of splitDistances(e.distance, this.board.path.length)) this.spawn(child, e.hpMul, d);
    }
```
This runs after gold/Mint/combo for the Splitter's own kill, so its death is a normal kill and splinter kills within 1.5 s continue the chain automatically.
7. `art/entities.ts`: in the `for (const e of ENEMIES)` loop, wrap the existing `paintToken(...)` in a block body and, after it, for `e.splitsInto !== undefined` draw the crack (imports `rgba`, `PALETTE` already present):
```ts
    if (e.splitsInto !== undefined) {
      const cx = size / 2, cy = size / 2 - depth / 2;
      ctx.strokeStyle = rgba(PALETTE.road, 1);
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy - r * 0.1);
      ctx.lineTo(cx + r * 0.05, cy + r * 0.12);
      ctx.lineTo(cx + r * 0.55, cy - r * 0.02);
      ctx.stroke();
    }
```
One slightly-bent thin line = the crack; splinter has no `splitsInto` so no crack. No new painter, no new registry line: both textures are painted by the existing loop.
8. `scenes/menu/MenuDemo.ts` `spawn()`: `const mix = ENEMIES.filter((e) => !e.spawnOnly);` then `const def = mix[Math.floor(Math.random() * mix.length)]!;`
9. `debug/runChecks.ts`: after the `['enemies.mark', ...]` line add `['enemies.onRoad', (g) => (g.enemies.all.some((e) => e.active && (e.distance < 0 || e.distance > g.board.path.length + 1)) ? 'an enemy is off its road' : null)],`
10. Tests: in `tests/core/waves.test.ts` change the budget test's `spent += def.threat;` to `if (s.enemy !== 'splitter') spent += def.threat; // splitters are mixed in on top of the budget`, and add a test: waves 1 and 8 plan zero `splitter` spawns; for waves 9, 12, 15, 20 the `splitter` count equals `Math.floor(others / 7)` (others = non-splitter spawns) and is > 0. Create `tests/core/split.test.ts`: `splitDistances(400, 800)` is `[416, 384]`; `splitDistances(0, 800)` is `[16, 0]`; `splitDistances(10, 800)` is `[26, 0]`; `splitDistances(800, 800)` is `[799, 784]` (CELL = 64).
11. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Pool growth while iterating: `strike()` may be called mid-loop in `pulse.ts`/`ProjectileSystem.ts`; the victim/target index lists are computed before striking and `spawn()` only appends to the pool, so indices stay valid. Do not "defensively" copy the pool or re-filter victims.
- Splinter hp must scale with the wave: use `e.hpMul` stored on the enemy at spawn; do not read it from `run` (there is no such field).
- The crack is painted inside the existing `enemy:splitter` texture, after `paintToken` (which restores the shadow state) — never a separate rotated image; the token's side face and shadow must stay at the bottom.
- Keep the splinter out of every mix: the `!e.spawnOnly` filter in `planWave` and the MenuDemo filter. A later wave change (T0049, T0071 also touch `core/waves.ts`) must preserve it; keep this task's edit to the four listed lines and no reordering — if a merge conflict appears there, keep the splitter block directly after `const reserved = ...`.
- `fromWave 9` is what gates "waves 1–8 never do" (via `unlocked`); don't also hardcode a wave check in `splitterCount`.
- Do not touch Sfx, RunFlow, TowerSystem, targeting, or the combo code — kills already flow through `EnemySystem.strike()`, which is the single killing-blown choke point (future Beam/Ember/Trap must use it too).

### Tests
- `tests/core/split.test.ts` (new): quarter-cell offsets and end clamping of `splitDistances`.
- `tests/core/waves.test.ts`: budget test skips splitters; new mix test pins "one splitter per 7 enemies, none before wave 9".
