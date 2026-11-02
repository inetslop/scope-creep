---
id: T0435
title: "The Fracture: the wave-100 boss that splits when it dies"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T17:22:19Z
---

## Goal
The next boss in the lane, wave 100: a big shape that walks the road and, the moment it dies, bursts into three fast Shards at the death spot — the wave's last word is where the player chose to kill it.

## Details
- The wave-100 plan sends exactly one Fracture, nothing else (the Colossus's whole-wave rule); the boss lane carries it through the bossId and the boss tag: the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, the escape horn.
- The split: the moment the Fracture dies it flashes white for ~0.3 s (the Orb's break flash), then 3 Shards walk out of the death spot — the Orb's own children, the wave's own scaling, walking the road from that spot. The shards are ordinary enemies from then on: their own gold, ordinary hits, the near miss, the wave's count — the wave ends when they are done.
- A leaked Fracture never splits: it costs 1 life (with the escape horn) and the wave ends with it.
- The death spot is the player's decision: killed in the entrance third, the 3 Shards have the whole road ahead of them; killed at the exit, they barely walk. The wave's pressure is the kill's location.
- The first split teaches once: a small white "it splits when it dies" chip at the death spot (the leechTell's pattern, once per run).
- Look: a new silhouette — a purple trefoil (three joined lobes; no enemy is a trefoil — the purple shapes in use are square, hexagon, pentagon, ring, chevron, wings), size 0.5 (the boss norm), with two thin cracks between the lobes that deepen as it takes damage (the orbSplit live-crack pattern, one per crack line).
- Exact numbers: hp 720 (the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 100, spawnOnly, threat = the wave-100 budget (the whole wave in one shape, the Colossus's rule).
- What counters it: the early road — the choke, the marked cells and the scorch cells are where the hundred should die; a burst build that kills it late hands three Shards to the last stretch.
- What it punishes: the "the wave is over when the boss dies" habit, and killing the boss where it is convenient instead of where it is safe.

## Compared with what exists

| Existing | What it shares | What the Fracture does that it can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker | its death is an ordinary death; the Fracture's death is the wave's last word, not its last enemy |
| Block | `walk`, slow and tough | leaking it costs 2 lives and ends it; the Fracture ends with three Shards on the road, not with its leak |
| Colossus | `walk`, the whole wave in one shape | it survives by going out of reach on a clock; the Fracture gets its second life only when it is already dead |
| Guard | `walk`, a spawnOnly escort | carries the Titan's shield; the Fracture is the whole wave, and its death is what makes the Shards |
| Titan | `walk`, a boss that halves damage | it lives while its Guard lives; the Fracture lives on after its own death |
| Orb | `walk`, splits at half hp | it splits while alive, on a clock, into two; the Fracture splits only when it dies, and the death spot is where the player chose |
| Hive | `walk`, pops a Dot every 6 s | grows the group while it lives; the Fracture grows the group only at its death |
| Shard | `walk`, a fast split piece | is a fragment of a killed enemy; the Fracture's death makes three of them at the spot the player chose |
| Sprinter | `walk`, ramps faster when hit | survives by outrunning the damage it takes; the Fracture survives by splitting into pieces that outrun the road |
| Splitter | `walk`, splits into two Splinters | is a regular enemy making two small pieces; the Fracture is the wave's boss and its three Shards carry the wave's full hp scaling |
| Hauler | `walk`, a leak costs gold | its death pays 10 gold and nothing more; the Fracture's death costs the road three Shards |
| Mute | `walk`, holds the towers within 2 cells still | interacts with the towers while it lives; the Fracture interacts with the road after it dies |
| Flyer | `fly`, crosses the board in a straight line | avoids the road entirely; the Fracture walks the road and leaves three Shards on it |
| Ward | `walk`, ignores control | survives by being untouched by slow, root and gust; the Fracture takes every hit and still gets out |
| Leech | `walk`, a boss that drinks its escorts | survives by drinking while it lives; the Fracture survives by splitting after it dies |
| Mender | `walk`, a boss that restores hp | mends itself while it lives, four times; the Fracture "mends" once, at its death, into three pieces |
| Bulwark | `walk`, a plate across its front | survives by facing the wrong way; the Fracture survives by being killed in the wrong place |
| Splinter | `walk`, fast and small | is a piece of a killed Splitter; the Fracture's death makes three Shards, not two Splinters |

## Acceptance criteria
- [ ] Wave 100 sends exactly one Fracture, nothing else; the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, and the escape horn all wear it through the boss lane.
- [ ] The Fracture's death: the boss's own burst, horn and name card, then the ~0.3 s white flash and 3 Shards walking out of the death spot with the wave's scaling; the shards pay their own gold, take ordinary hits, and the wave ends when they are done; a leaked Fracture never splits.
- [ ] The first split shows "it splits when it dies" once at the death spot; the trefoil token is a new shape in purple at size 0.5 with two live cracks that deepen with damage; no other token, sound or HUD element changes.
- [ ] Unit tests for the wave-100 plan and the split rule (shard count, wave scaling, no split on a leak); content validation for the new fields; the runChecks invariants (the Fracture's spawnOnly slot, the boss plan's wave-100 case); `npm run check` and the desktop + mobile smoke pass.

## Design (architect, desktop)

### Files
- create `src/content/enemies/fracture.ts` - the Fracture def (see Interfaces)
- create `src/core/deathSplit.ts` - pure split rule: flash constant, children (kill-only), spawn distances, child muls
- create `src/systems/enemyHooks/deathSplit.ts` - the split: white flash, pending shards, `run.pendingSplits`, first-split teach
- create `src/systems/enemyHooks/deathCracks.ts` - two live cracks, model on `crackDeep.ts` (one Graphics per crack, alpha `0.25 + 0.75 * (1 - hp/maxHp)`, face-center offset `- Math.max(2, r * 0.18) / 2`, color `deepOf('purple')`, width `Math.max(1, r * 0.08)`, drop in `onKill`/`onLeak`); cracks are two segments from the face center out `0.5r` toward angles `-Math.PI / 6` and `Math.PI + Math.PI / 6` (the two gaps by the top lobe)
- create `src/systems/fx/deathSplitTell.ts` - copy of `leechTell.ts` verbatim, only the label text changed to `it splits when it dies`
- create `tests/core/deathSplit.test.ts` - split-rule tests
- edit `src/content/types.ts` - `Shape` union gains `| 'trefoil'` (line 4); `EnemyDef` gains, right after `splitsAt` (line 39): `deathSplit?: { into: string; count: number };` with a doc comment: the moment it dies — never while alive, never on a leak — it flashes white for a beat (the hook's constant) and leaves `count` of `into` at the death spot (core/deathSplit.ts), each carrying the wave's scaling the parent wore
- edit `src/content/enemies/index.ts` - import + `fracture,` in `ENEMIES` right after `shard,`
- edit `src/core/waves.ts` - `bossId`: prefix the chain with `wave === 100 ? 'fracture' : ` (line 121); append ", the Fracture on wave 100" to the boss lists in the doc comments (lines 113 and 127). `planWave` needs no change: its generic boss return (line 145) already sends `[{ enemy: bossId(wave)!, delaySec: 0 }]`
- edit `src/art/shapes.ts` - `sides` record (line 15) gains `trefoil: 0`
- edit `src/art/paint.ts` - `shapePath` gains, before the polygon fallback (line 95): `if (shape === 'trefoil') { ctx.beginPath(); for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6]) ctx.arc(x + Math.cos(a) * radius * 0.45, y + Math.sin(a) * radius * 0.45, radius * 0.62, 0, Math.PI * 2); return; }` — three joined lobes (one up, two down) in one path; the token is painted by the existing `paintToken` default branch, no change in `art/entities.ts`
- edit `src/core/run.ts` - after `pendingPops = 0;` (line 61): `pendingSplits = 0;` with comment "The shards a dead Fracture will still split this wave (the deathSplit hook rewrites it every wave frame): the enemies-left count keeps them in."; in `clearWave` after the `pendingPops = 0` line (174): `this.pendingSplits = 0;`
- edit `src/systems/RunFlow.ts` - `enemiesLeft` (line 72) appends `+ this.run.pendingSplits` (and its doc comment); line 99 becomes `if (this.s.waves.spawningDone && this.s.enemies.aliveCount === 0 && this.run.pendingSplits === 0) this.clearWave();`
- edit `src/systems/enemyHooks/index.ts` - imports + `deathSplit,` and `deathCracks,` in `ENEMY_HOOKS` right after `midSplit,`
- edit `src/debug/runChecks.ts` - after `enemies.menderSlot` (112): `['enemies.fractureSlot', (g) => (g.run.wave === 100 || !g.enemies.all.some((e) => e.active && e.def.id === 'fracture') ? null : 'a Fracture alive off its wave 100')],`; after `hive.pending` (121): `['deathSplit.pending', (g) => (Number.isInteger(g.run.pendingSplits) && g.run.pendingSplits >= 0 && g.run.pendingSplits <= 3 ? null : `pending splits ${g.run.pendingSplits}`)],`; after `level.bossPlan` (195): `['waves.fracturePlan', (g) => (g.run.wave !== 100 || (g.waves.currentPlan?.spawns.length === 1 && g.waves.currentPlan.spawns[0]!.enemy === 'fracture') ? null : 'wave 100 does not send the Fracture alone')],`
- edit `tests/content.test.ts` - line 27 size-0.5 allowlist gains `|| e.id === 'fracture'`; after the `splitsAt` block (line 66) a `deathSplit` block: `count` 1..5 and `ENEMIES.some((d) => d.id === deathSplit.into)`
- edit `tests/core/waves.test.ts` - in the boss describe, add wave-100 plan tests (see Tests)

### Interfaces
```ts
// content/enemies/fracture.ts
export const fracture: EnemyDef = {
  id: 'fracture', name: 'Fracture',
  description: 'The whole wave in one trefoil: the moment it dies it breaks into three Shards that walk on from where it fell.',
  behavior: 'walk',
  hp: 720, // the boss norm, like the Colossus and the Orb; wave-scaled like everything else
  speed: 0.9, // Block's
  gold: 20, // the boss bounty, like the Colossus
  livesCost: 1,
  threat: 500, // a wave-100 budget's worth: it is the wave
  fromWave: 100,
  spawnOnly: true, // never in a normal mix; only the wave-100 boss
  deathSplit: { into: 'shard', count: 3 },
  look: { shape: 'trefoil', color: 'purple', size: 0.5 }, // a big trefoil, its two cracks painted live
};
// core/deathSplit.ts
export const DEATH_SPLIT_FLASH_SEC: number; // 0.3
export function deathSplitChildren(def: EnemyDef, killed: boolean): { into: string; count: number } | undefined; // undefined unless killed && def.deathSplit
export function deathSplitDistances(distance: number, pathLength: number, count: number): number[]; // (i - (count-1)/2) * CELL * 0.25 off the death spot, clamped to [0, pathLength - 1]
export function deathSplitChildMuls(parent: { hpMul: number; speedMul: number; waveSpeedMul: number; walkMul: number }): { hpMul: number; speedMul: number; waveSpeedMul: number; walkMul: number }; // identity: the wave's scaling walks on
```
`deathSplit` hook (`MakeEnemyHook`, uses `{ board, enemies, fx, run }`): `onKill` — `if (deathSplitChildren(enemy.def, true) === undefined) return;` then capture `x, y, d = enemy.distance, lane` and `deathSplitChildMuls(enemy)` BEFORE anything else (a spawn may recycle the slot), set a closure `let told` flag for this kill, push `{ left: DEATH_SPLIT_FLASH_SEC, x, y, into, count, distances: deathSplitDistances(d, board.path.length, count), hpMul, speedMul, waveSpeedMul, walkMul, lane, tell }`, and (guarded by `fx.full`) add `artScale(fx.scene.add.image(x, y, enemyTexture(enemy.def.id)), 1).setTintFill(0xffffff).setDepth(DEPTH.enemies)` tracked `DEATH_SPLIT_FLASH_SEC * 1000` ms to `{ alpha: 0, ease: 'Quad.easeIn' }`. `update(dt)` — count each pending down by `dt`; at ≤ 0 splice it, call `deathSplitTell(fx, p.x, p.y)` when `p.tell`, then `const child = getEnemy(p.into); for (const dd of p.distances) enemies.spawn(child, p.hpMul, p.speedMul, p.waveSpeedMul, p.walkMul, dd, p.lane);`; then `run.pendingSplits = pending.reduce((n, p) => n + p.count, 0);`. No `onLeak` (a leaked Fracture never splits).

### Steps
1. `content/types.ts` (union + field) → 2. `fracture.ts` + `index.ts` → 3. `core/deathSplit.ts` → 4. `art/shapes.ts` + `art/paint.ts` → 5. `systems/fx/deathSplitTell.ts` → 6. the two hooks + `enemyHooks/index.ts` → 7. `core/run.ts` → 8. `systems/RunFlow.ts` → 9. `core/waves.ts` → 10. `debug/runChecks.ts` → 11. the three test files → 12. `npm run check`, then `npm run smoke`.

### Pitfalls
- The wave must not end in the flash window: `RunFlow` line 99 checks `aliveCount === 0` directly (not `enemiesLeft`), so `pendingSplits` must be added to BOTH the `enemiesLeft` getter and the clearWave condition; the hook rewrites `run.pendingSplits` every wave frame (it runs before that check) and `run.clearWave()` resets it — same discipline as `pendingPops` (never saved).
- Capture the death spot and all multipliers in `onKill` before any spawn; the pool recycles the Fracture's slot.
- `bossId` chain: prepend `wave === 100` only; every other wave's boss must stay byte-identical (seeded plans depend on it).
- The `sides` record in `art/shapes.ts` is an exhaustive `Record<Shape, number>` — typecheck fails until `trefoil: 0` is added.
- `content.test.ts` line 27 caps size at 0.45 except the allowlisted bosses — add `fracture` or the check fails.
- `fx.full` guards the flash image and the tell only; the shard spawns never skip.
- No new `Enemy` field, no new `Sfx` method, no HUD edits: the preview chip, BossCard, arrival horn/ring, death burst/name card and escape horn all key off `bossId(run.wave)` and the plan's `boss` tag, so they wear it automatically.
- Countdowns use `dt`; crack `Graphics` are destroyed on kill/leak, one per crack line, moved with `setPosition`.

### Tests
- `tests/core/deathSplit.test.ts`: `fracture.deathSplit` equals `{ into: 'shard', count: 3 }` with `fromWave 100` and `spawnOnly`; `deathSplitChildren(fracture, true)` is the rule and `deathSplitChildren(fracture, false)` (the leak) is `undefined`, as is any `deathSplitChildren(dot, true)`; `deathSplitDistances(400, 800, 3)` is `[384, 400, 416]`, `(0, 800, 3)` is `[0, 0, 16]`, `(800, 800, 3)` is `[784, 799, 799]`, `(400, 800, 1)` is `[400]`; `deathSplitChildMuls` passes all four multipliers through unchanged.
- `tests/core/waves.test.ts`: `bossId(100)` is `'fracture'`; `planWave(100, new Rng(100), ENEMIES)` is `spawns [{ enemy: 'fracture', delaySec: 0 }]`, `tags ['boss']`, `hpMul waveHpMul(100)`; no non-boss wave 1..100 sends a `fracture`; `ENEMIES.find((e) => e.id === 'fracture')!.threat` equals `waveBudget(100)`.
- `tests/content.test.ts`: the `deathSplit` validation block and the size allowlist (acceptance: content validation).
