---
id: T0112
title: "Swoop: a Gunner fork, your bolts re-aim once at 200 units and fly a second leg"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: [T0111]
attempts: 2
created: 2026-10-31T18:10:25Z
claimed_at: 2026-10-31T21:06:38Z
epic: E24
---

## Goal
A Gunner's miss still finds its target: with the fork, a bolt that has flown 200 units re-aims once at the enemy it was fired at and flies a straight second leg — the target that moved during the first leg is still caught, and the kite's hard cut is the dodge. Second slice of the Gunner's growth (E24), the other fork under Bolt 2.

## Details
- A new weapon-behavior mod `swoop` in the Gunner tree, a fork under Bolt 2, alongside Split and Drift.
- Text (shown on the talent's row): "At 200 units, your bolt re-aims at the enemy it was fired at and flies a straight second leg of 160 units. Rank 2: 240 units."
- Talent line: id swoop, upgrade swoop, max 2, needs `[["bolt", 2]]`. No points commitment, no prestige gate.
- How a swooping bolt flies and looks: straight at full speed for 200 units; if its target is still alive, the star stops spinning for 0.15 s and points nose-down (the telegraph — a player sees the bolt about to turn), then it flies a straight second leg of 160 units (rank 2: 240) at full speed toward where the target is at the moment of the turn. It never turns again: the dodge is a sharp cut right as the bolt nose-dips. A bolt that hits, dies, or whose target is already dead before 200 units never swoops.
- Many bolts are alive at once: at most ~12 per player (Bolt 6 with Split 2 at Haste 3); the re-aim happens once per bolt, so it stays cheap.
- With every weapon that fires bolts: Bolt (every bolt of its volleys swoops at its own target), Split (the fanned bolts each swoop at the enemy they were aimed at), Lance (a swooping bolt still goes through on its legs), Ricochet (a bolt that bounces flies its full 200 units before it swoops, on its new line), Cover (the back fan swoops at whatever chases — the rear line finds the kiter that cut).
- Not bolts, no effect: the Goo, the bubble, the Nerve's jabs, the Horn's darts, the Maw's bite and the Bellow's ring are unchanged — their motion is their own.
- With Drift (a life can buy both): a bolt flies fast for 120 units, drifts to 200, then swoops at full speed for its second leg — the committed line: slow, then fast, on target.
- Players: a swooping bolt hits a player at half damage like every other bolt (the pvp damageMul) — it finds players that cut back across the line too.
- look: shape diamond, color #ffd43b.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Goo | a shot that turns toward its target in flight | The Goo is its own weapon: a big slow drop that keeps turning to the nearest enemy until it dies; Swoop is your Bolt: a fast star that turns once, at 200 units, at the enemy it was fired at, and keeps straight after |
| Drift (T0111, this epic) | a Gunner bolt mod that changes the flight | Drift slows the bolt on its line; Swoop turns it toward a target that moved — and the two stack into a drift-then-swoop bolt |
| Quick | changes how bolts fly | Quick makes every shot faster, all the time, with every weapon; Swoop adds a turn to the Bolt's flight, at one point of it, and only for bolts |
| Lance | a mod for bolts | Lance adds a pierce to the bolt; Swoop adds a turn to the flight — a bolt can go through and swoop at once |
| Split | a mod for bolts (and every weapon) | Split adds shots; Swoop changes how each shot flies — a fanned swoop is a fan that still finds its targets |
| Ricochet | a Bolt capstone about its flight | Ricochet reacts to a hit (a bounce on to another enemy); Swoop changes the flight with no hit at all |

The tree as the panel will draw it (Gunner after this task):
```
Haste (3)
  Bolt (5, start 1, needs Haste 1)
    Split (2, needs Bolt 2)
    Drift (2, needs Bolt 2)
    Swoop (2, needs Bolt 2)
    Ricochet (1, needs Bolt 4)
    Cover (3, needs Bolt 2, points 3, prestige 1)
Lance (2)
```
What a Gunner gets, and what it costs: a point at Bolt 2, where it could buy Split (one more bolt) or Drift (the lingering line). Swoop instead makes the aimed shot find a moving target — the kite's hard cut is the only dodge, and a player who sees the nose-dip turns with it, so a Gunner's volleys stop being free to sidestep.

## Acceptance criteria
- [ ] The Talents panel's Gunner tab shows Swoop under Bolt, beside Split and Drift, with its text and 2 ranks; it takes a point once Bolt 2 is bought.
- [ ] A rank-1 Gunner's bolt flies straight for 200 units, its star stops spinning and points nose-down for 0.15 s, then flies a straight second leg of 160 units toward where the target was at the turn (rank 2: 240); it never turns again, and a bolt with no live target at 200 units never swoops.
- [ ] Every bolt source swoops the same way (volleys, the Split fan, after a Ricochet bounce, the Cover back fan), the Goo, the bubble, the jabs, the darts, the bite and the ring are unchanged, and a life with both forks fires a bolt that drifts to 200 and then swoops.
- [ ] A swooping bolt hits players at half damage like a normal bolt, and the game is working and playable otherwise.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/swoop.ts` - the `swoop` UpgradeDef plus the pure helpers `SWOOP_LEG2`, `DRIFT_MUL`, `swoopLevel`, `targetP2`, `swoopTime`
- create `src/content/projectiles/swoop-bolt.ts` - ProjectileDef `id: 'swoop-bolt'` (radius 6, life 4, `step`, diamond look) plus pure `swoopDip`
- create `tests/swoop.test.ts` - vitest for `targetP2`, `swoopTime`, `swoopDip`
- edit `src/content/upgrades/bolt.ts` - `fire`: swoop branch (below), keeping T0111's drift branch as the else fallback
- edit `src/content/upgrades/cover.ts` - `fire`: swoop branch (below); add `Unit` to the type import
- edit `src/content/upgrades/ricochet.ts` - `onHit`: a `swoop-bolt` bounce branch before the existing `bolt` branch
- edit `src/content/talents/gunner.ts` - one line after the `split` line
- edit `src/content/upgrades/index.ts` - `import { swoop } from './swoop.ts';` after the swift import; one line `swoop,` after `quick,` in UPGRADES
- edit `src/content/projectiles/index.ts` - `import { swoopBolt } from './swoop-bolt.ts';` after the slushBlob import; one line `swoopBolt,` after `bolt,` in PROJECTILES
- edit `src/content/upgrades/drift.ts` - ONLY if T0111 left no exported `driftLevel(me)`: add it, a 2-line mirror of `swoopLevel`

### Interfaces
```ts
// swoop.ts
export const SWOOP_LEG2: readonly number[];        // [0, 160, 240] by rank
export const DRIFT_MUL: readonly number[];         // [1, 0.4, <rank-2 number copied from drift-bolt.ts>]
export function swoopLevel(me: Player): number;    // me.mem.swoop, only when me.mem.swoopLife === me.prestige (a stamp from this life)
export function targetP2(id: number): number;      // ids are 1..65535, p2 is an i16: id > 32767 ? id - 65536 : id
export function swoopTime(speed: number, leg2: number, drift: number): number;
// = drift <= 0 ? 200/speed + 0.15 + leg2/speed : 120/speed + 80/(speed*DRIFT_MUL[drift]) + 0.15 + leg2/speed
export const swoop: UpgradeDef; // name 'Swoop', look { shape: 'diamond', color: PALETTE.yellow }, cooldown: 0.25,
// fire(ctx, me, level) { me.mem.swoop = level; me.mem.swoopLife = me.prestige; }  (a hook can't ask the engine for levels: the upgrade stamps its own)
// description EXACTLY: 'At 200 units, your bolt re-aims at the enemy it was fired at and flies a straight second leg of 160 units. Rank 2: 240 units.'

// swoop-bolt.ts
export const swoopBolt: ProjectileDef;  // radius 6, life 4 (ceiling; fire sites pass a shorter life; leg two ends the bolt itself)
export function swoopDip(k: number): number; // k 0..1: 1 -> 0.85 -> 1, quadratic ease (eased over the 0.15 s, never one frame)
```
`swoopBolt.look`: `{ shape: 'diamond', color: PALETTE.yellow }` with `draw(g, e)`: when `e.slots[0] === 1`, `g.save(); g.scale(1, swoopDip((e.slots[1] ?? 0) / 100));` then `drawCritter(g, look, e, { ink: PALETTE.ink, glint: true })`, then `g.restore()` — the nose dips while in place.
`step(ctx, p, dt)` state in `p.mem` (`ph` 0 leg one / 1 dip / 2 leg two / 3 done, `dist`, `dist2`, `tm`, `turn` = angle*100); `p.slots[0]` = ph (0/1/2), `p.slots[1]` = dip progress 0..100. Launch data: `p1` = leg2 (+1000 when ricochet already bounced it), `p2` = `targetP2(target.id)`. Body:
- ph 0: `p.speed = driftOf(p.owner) > 0 && dist >= 120 ? p.launch.speed * DRIFT_MUL[drift] : p.launch.speed` (T0111's drift section); `dist += p.speed * dt`; `moveForward(p, dt)`; at `dist >= 200` find the target (id from `p2`: `q > 0 ? q : q < 0 ? q + 65536 : 0`; first `ctx.unitsNear(p.launch.x, p.launch.y, 900)` with `u.id === id && u.alive`); found: `ph = 1, tm = 0.15, turn = round(atan2(t.y - p.y, t.x - p.x) * 100), p.angle = Math.PI / 2, slots[0] = 1, slots[1] = 0`; not found: keep flying straight (it never swoops) and die at its life.
- ph 1: `p.speed = 0` (in place: stops, nose down); `tm -= dt`; `slots[1] = clamp(round((1 - tm / 0.15) * 100), 0, 100)`; at `tm <= 0`: `ph = 2, dist2 = 0, p.angle = turn / 100, p.speed = p.launch.speed, slots[0] = 2`.
- ph 2: `dist2 += p.speed * dt`; `moveForward(p, dt)`; at `dist2 >= p.launch.p1 % 1000`: `ph = 3; p.life = p.age` (the bolt is done).
`driftOf(u)`: `u.type === 'player'` and T0111's drift mem stamp is current this life, else 0 (copy the exact key/stamp test from drift.ts).

### Steps
1. Read T0111's `drift.ts` and `drift-bolt.ts` (it is built before this task): note the drift mem keys, its level helper (add `driftLevel` if missing), and the rank-2 speed for `DRIFT_MUL[2]`.
2. Write `swoop.ts` (exact description above), then `swoop-bolt.ts` (step and look exactly as above), then both registry lines and the tree line `{ id: 'swoop', upgrade: 'swoop', max: 2, needs: [['bolt', 2]] }` after the split line.
3. bolt.ts fire: `const swoop = swoopLevel(me);` then per bolt: if `swoop > 0` fire `'swoop-bolt'` with `{ angle, speed: 560, damage: 8 + 4 * (level - 1), p1: SWOOP_LEG2[swoop], p2: targetP2(target.id), life: Math.max(1.1, swoopTime(560 * me.stats.projectileSpeed, SWOOP_LEG2[swoop], driftLevel(me)) + 0.5) }`, else the existing line (T0111's drift branch if present).
4. cover.ts fire: when `swoop > 0`, pick the chaser: nearest `ctx.enemiesNear(me, me.x, me.y, 520)` with `(t.x - me.x) * cos(back) + (t.y - me.y) * sin(back) > 0`; with one, fire the 3-bolt back fan as `'swoop-bolt'` (same p1/p2, `speed: 160`, `life: Math.max(0.6, swoopTime(160 * me.stats.projectileSpeed, leg2, driftLevel(me)) + 0.5)`); without one, plain bolts `life: 0.6` as today.
5. ricochet.ts onHit: new first branch — if `shot.def.id === 'swoop-bolt'` and `shot.launch.p1 < 1000` and `(shot.slots[0] ?? 0) === 0` (leg one only: it never turns twice), find `next` exactly like the bolt branch, then fire `'swoop-bolt'` with `{ x: hit.x, y: hit.y, angle: atan2 to next, speed: 620, damage: 9, p1: leg2 + 1000, p2: targetP2(next.id), life: Math.max(1.1, swoopTime(620 * me.stats.projectileSpeed, leg2, driftLevel(me)) + 0.5) }` where `leg2 = shot.launch.p1 % 1000`; `return`. Leave the `bolt` branch untouched.
6. `tests/swoop.test.ts`, then `npm run check` and `npm run smoke`.

### Pitfalls
- p2 overflow: unit ids reach 65535 but p2 is i16 — always encode with `targetP2`, decode `q > 0 ? q : q < 0 ? q + 65536 : 0`.
- Stale mem after a prestige (prestige does NOT clear mem): the `swoopLife`/`driftLife` life-stamp check, or a prestiged player swoops forever.
- Life too short kills a bolt mid second leg: fire sites always pass the explicit `swoopTime + 0.5` life; the def's 4 s is only a ceiling; the step ends the bolt at leg two's end.
- The step may not throw (a throw disables the def for the match): no NaN — `turn` is set before ph 2; `DRIFT_MUL` has 3 entries.
- Don't re-fan for Split: the engine's `shots` stat copies the launch (same p1/p2), so the whole fan swoops at the same enemy for free; same for Lance (pierce at creation) and pvp half damage (engine strike).
- Swoop wins over Drift in the fire sites: a Drift+Swoop life gets `swoop-bolt`, whose step does the drift section itself — don't fire `drift-bolt` when swoop is held.
- Scripted projectiles cost a position per tick (like the Goo); the numbers stay as specified; if the load test names `swoop-bolt`, report it — don't silently change ranges.
- No HUD/panel layout work: the talents panel is engine-drawn from the tree data; the Swoop row (name 5 letters, 110-char description, 2 ranks) wraps in the existing row style at 412x915 and 1280x720.

### Tests
- `tests/swoop.test.ts`: `targetP2` round-trips every id 1..65535 into i16 (0 stays "none"); `swoopTime` equals 200/s+0.15+leg2/s without drift and 120/s+80/(s*DRIFT_MUL[r])+0.15+leg2/s with it; `swoopDip(0)=1`, `swoopDip(0.5)=0.85`, `swoopDip(1)=1`, in [0.85, 1]. Everything else is covered by engine/tests (the upgrade in a real match, the talent reachable, registries, the 60-player budget) and the smoke test.

## Attempt 1 failed (cachyos-x8664)

The agent made no changes to the game (timeout).
