---
id: T0369
title: "The thin road: the wave branch's second node, every enemy 10% slower"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T17:47:11Z
claimed_at: 2026-11-02T01:38:25Z
epic: E14
---

## Goal
The tech tree's "The wave" branch (T0358) gets its second node — The thin road: 85 coins, every enemy walks 10% slower, in every wave, for every run after the purchase. The branch's pace node, alongside The door's gate node and The breather's payout node (T0370).

## Details
- **The tech card:** "The thin road", depth-2 node of the wave branch — 85 coins by the depth rule (the branch's base 30, The door at depth 1 per T0358), shown derived like every other node's price. No buy-gate inside the branch: each node buys independently at its depth price (the depth price alone orders the branch). Locked and owned looks as on the branch's other node, bought through the wave branch's existing buy dispatch. Card line: "Every enemy walks 10% slower, for every run after."
- **The effect:** one 0.9 walk-speed factor on the run, read from the owned tech at run start (the The-door pattern, T0358) and applied at the run's spawn-speed-factor site (where the Swift level augment's 15% factor applies, T0294), so every enemy inherits it wherever its speed is read: a Dot walks 1.44 cells/s (not 1.6), a Block 0.81 (not 0.9), the Sprinter's ramped speed carries the factor, split children (Splinter, Shard) spawn with it, and the far gate's share (T0338) is no exception. A Dasher's crawl is 10% slower and its dash takes 10% longer for the same 3 cells. The run's boss is no exception (a Colossus walks 0.81; the Hive's pops inherit). E10's flyer, once it is on the board (T0353), crosses 10% slower through the same factor.
- **What does not change:** hp, threat, spawn timing, wave budget, the Dasher's dash distance, wave structure: the wave takes ~10% longer, and that is the whole node.
- **No HUD, no key, no sound, no new readout:** the tech screen shows the node owned and the road reads slower where the player looks — the effect is visible in the enemies' own pace, nothing shown twice, nothing painted on the board.

## Acceptance criteria
- [ ] The tech screen's "The wave" branch shows The thin road as its second node: 85 coins by the depth rule, bought with the existing dispatch, shown owned; every other branch untouched.
- [ ] With the node owned, every enemy in every wave walks at 0.9× its normal speed — a Dot 1.44 cells/s, a Block 0.81, a Dasher's crawl slower with a longer dash, split children and the far gate's share included, bosses included — with hp, threat, spawn timing and wave budget unchanged.
- [ ] A run started without the node is byte-identical to before this task (no factor applied anywhere); a resumed run keeps the factor it started with.
- [ ] The game is playable menu to game over with the node owned and unbought, on desktop and mobile.

## Design (architect, desktop)

### Files
- edit `src/content/tech/wave.ts` — `walkMul?: number` on `WaveNode`; the thin-road node row right after `door`
- edit `src/core/tech.ts` — `waveWalkFactor(owned)`, placed directly after `boardFarGate`
- edit `src/systems/WaveSystem.ts` — read the factor once, fold it into the spawn `speedMul`, pass it to `spawn`
- edit `src/entities/Enemy.ts` — `walkMul` field + `spawn()` param; the Dasher's dash leg carries it
- edit `src/systems/EnemySystem.ts` — forward the new `spawn()` param
- edit `src/systems/enemyHooks/split.ts`, `src/systems/enemyHooks/midSplit.ts`, `src/systems/enemyHooks/hivePops.ts` — pass the parent's `walkMul` through
- edit `src/debug/runChecks.ts` — update `level.speed` invariant, add `walk.mul` invariant, one import
- edit `tests/core/tech.test.ts` — wave-row content test, `nodeCost`, `waveWalkFactor`, depth-price buy test

### Interfaces
```ts
// content/tech/wave.ts — add to WaveNode after `farGate`:
/** the run's walk-speed factor on every enemy of every new run (The thin road: 0.9); absent when the node doesn't touch speed */
walkMul?: number;
// new row, immediately after the 'door' row:
{ id: 'thin-road', name: 'The thin road', line: 'every enemy walks 10% slower, for every run after', price: 30, farGate: false, walkMul: 0.9 },

// core/tech.ts (mirrors boardFarGate; WAVE_NODES is already imported):
export function waveWalkFactor(owned: readonly string[]): number; // 0.9 with 'thin-road' owned, 1 otherwise

// entities/Enemy.ts:
walkMul = 1; // field, directly after `waveSpeedMul = 1;`
spawn(def: EnemyDef, hpMul: number, path: PathLine, speedMul = 1, waveSpeedMul = 1, walkMul = 1, distance = 0, lane: 0 | 1 = 0): void;
// systems/EnemySystem.ts: same insertion in its spawn()
spawn(def: EnemyDef, hpMul: number, speedMul = 1, waveSpeedMul = 1, walkMul = 1, distance = 0, lane: 0 | 1 = 0): Enemy;
```

### Steps
1. `wave.ts`: add the field and the row above. Keep `price: 30` (the branch base; the screen derives 85 = depth-2 via `nodeCost`, never hardcode 85).
2. `core/tech.ts`, after `boardFarGate`:
```ts
/** The walk-speed factor of a new run's enemies for the owned wave nodes: the product of the owned nodes' factors, 1 when none has one; each node counts once, unknown ids count for nothing. */
export function waveWalkFactor(owned: readonly string[]): number {
  let mul = 1;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = WAVE_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.walkMul !== undefined) mul *= node.walkMul;
  }
  return mul;
}
```
3. `WaveSystem.ts`: import `waveWalkFactor` from `'../core/tech'` (after the `core/run` import); field `private readonly walkMul: number;` after `hasFork`; in the constructor `this.walkMul = waveWalkFactor(run.techOwned);`; line 79 becomes `const speedMul = levelSpeedMul(this.run.level) * this.walkMul * waveMul;`; in the spawn call pass `this.walkMul,` after `waveMul,`.
4. `Enemy.ts`: add the `walkMul = 1;` field with the doc `/** The run's walk factor it took (the wave branch's The thin road: 0.9); its split children take the same. */`; extend `spawn()` per the interface and set `this.walkMul = walkMul;` after `this.waveSpeedMul = waveSpeedMul;`. In `advance()`'s dash leg only: where the pause ends (`this.dashLeft = c.dashSec;`) write `this.dashLeft = c.dashSec / this.walkMul;`, and the surge line becomes `this.distance += (c.dashCells / c.dashSec) * CELL * this.walkMul * (1 + this.hastePct) * (1 + this.packPct) * dt;`. Leave the crawl, the pause (`c.pauseSec / this.waveSpeedMul`) and `this.speed` untouched.
5. `EnemySystem.ts`: extend `spawn()` per the interface; forward: `enemy.spawn(def, hpMul, this.routes[lane]!, speedMul, waveSpeedMul, walkMul, distance, lane);`
6. Hooks: `split.ts` line 10 → `enemies.spawn(child, enemy.hpMul, enemy.speedMul, enemy.waveSpeedMul, enemy.walkMul, d, enemy.lane);`; `midSplit.ts` add `wk = e.walkMul` to the capture line and `enemies.spawn(child, half / child.hp, sm, wm, wk, dd, lane);`; `hivePops.ts` → `enemies.spawn(into, waveHpMul(run.wave) * run.levelHpMul, e.speedMul, e.waveSpeedMul, e.walkMul, d);`
7. `runChecks.ts`: import `waveWalkFactor` from `'../core/tech'`; rewrite `level.speed` to `e.speedMul === levelSpeedMul(g.run.level) * waveWalkFactor(g.run.techOwned) * waveSpeedMul(g.run.wave)` (message: 'an enemy walks at the wrong level, walk or wave speed factor'); add right after it: `['walk.mul', (g) => (g.enemies.all.every((e) => !e.active || e.walkMul === waveWalkFactor(g.run.techOwned)) ? null : 'an enemy carries the wrong run walk factor')],`
8. Tests (in `tech.test.ts`): add `waveWalkFactor` to the `core/tech` import; replace the wave-row test with `expect(WAVE_NODES.map((n) => [n.id, n.name, n.line, n.price, n.farGate, n.walkMul])).toEqual([ ['door', 'The door', 'the far gate on every board', 30, true, undefined], ['thin-road', 'The thin road', 'every enemy walks 10% slower, for every run after', 30, false, 0.9], ]);` (keep any row another task already added, in array order, thin-road at index 1); add `expect(nodeCost(WAVE_NODES, 'thin-road')).toBe(85);` next to the `door` line; add a `waveWalkFactor` test (1 with none/other ids, 0.9 with 'thin-road', duplicate/unknown ids ignored); add a buy test: `buyWaveNode(withCoins(84), 'thin-road')` false, then `withCoins(85)` true leaving 0 coins.

### Pitfalls
- **Position is the price**: the node must sit at index 1 in `WAVE_NODES` (depth 2 → 85). Insert after `door`; if T0370's `breather` is already in the array, insert between `door` and it — never append.
- **Dash math**: the two changes cancel exactly — rate ×0.9 and duration ÷0.9 keep the surge at exactly 3 cells; with `walkMul = 1`, `x * 1 === x` and `x / 1 === x` in float, so unowned runs are byte-identical. Don't touch the pause leg or the dash distance.
- **Pooling**: `walkMul` must be set in `Enemy.spawn()` next to `speedMul`, or a recycled Dasher keeps a stale factor.
- **The `level.speed` invariant fires every frame** unless updated (step 7) — update it, don't delete it.
- **Resume**: read the factor from `run.techOwned` (profile at (re)start), exactly like The door's far gate at `GameScene.ts:126`. Do NOT add it to `SavedRun`/`saveRun.ts`.
- **Don't touch spawn timing or hp**: `core/waves.ts` gaps read `def.speed` (base) — leave it; only the speed factor changes.
- **Flyer (T0353, in progress elsewhere)**: don't touch its files; it inherits the factor through the same `speedMul` path when it lands.

### Tests
- `tests/core/tech.test.ts` updates above (the only rule that could silently break: the node's content, its derived 85 price, and `waveWalkFactor`). None elsewhere — the fold lives in Phaser-layer code, covered by the `level.speed`/`walk.mul` invariants in the smoke.
