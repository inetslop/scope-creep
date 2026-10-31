---
id: T0121
title: "Echo: a Lobber fork, the bubble splashes, comes back and splashes behind you"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: [T0118]
attempts: 1
created: 2026-10-31T20:09:56Z
claimed_at: 2026-10-31T22:24:04Z
epic: E27
---

## Goal
The bubble's third direction: after its splash, the bubble turns and flies back toward you, splashing again where it stops behind you — a committed Lobber kites through a trail of their own ice, and every chase gets a price at the chaser's feet.

## Details
- **Echo rewrites your bubble's flight**, built the way Drift and Swoop rebuilt the bolt and Bop rebuilt the bubble: Lob's fire gives the bubble Echo when you have it. A player without Echo is unchanged.
  - **The out leg is exactly Lob's bubble today** — same range, same aim, same arc, the same normal splash where it lands (Lob's +2 splash damage per rank, Wide's size, Fuse and Fizz all apply to that splash as usual).
  - **The return leg:** where the bubble's splash strikes, the bubble turns in place over 0.2 s, then flies back **toward you** (homing to your current position) at **100 u/s for 1.0 s**, and splashes again where it stops. You outrun it (100 u/s against your 180+ move speed), so it lands behind you: a trailing zone every 1.1 s (Lob's own cooldown — Echo adds no extra shot).
  - **The return splash:** the same splash as your normal bubble — the same damage (Lob's ranks, your damage stats, Wide's size) but a smaller radius: **50% of your splash's radius at rank 1, +25% per rank** (rank 2: 75%, rank 3: 100%).
  - If you are knocked out before the bubble returns, it pops in a small puff and does not splash.
  - **Both splashes' strikes are your hits** (Chill, Reap, Swarm, Snare and the rest apply), and a return splash's kill is your kill (Chomp, Nest, Sting, Scavenge, Adrenaline and Fang pay out on it). Fizz lingers both splashes — a fizz-puddle where the out splash landed and one where the return splash lands.
  - **With Bop (T0118):** a bubble that touches a critter pops on it as a Bop bubble and does not return; a bubble that touches nothing splashes where it lands and still comes back. A Bop+Echo miss leaves a trail.
  - **Split:** every fanned bubble gets the return leg — each one splashes, comes back and splashes behind you, all 12% weaker.
  - **Quick flies the bubble faster on both legs**; Haste fires Lob sooner, as today. Lance (pierce) does nothing (the bubble hits nothing in flight, as today). Slush is its own straight shot and is untouched.
- **Look:** an Echo bubble wears a **thin teal band** around it in flight (the Lobber's color), as Bop's white band marks the bubbles that pop — a player sees at a glance which bubbles come back; on the return leg the band pulses. Where the bubble turns, a small white tick (a 4-unit pop, the fizz-tick style, no glow).
- **Talent line (Lobber tree, planning/modules/talents.md):** id `echo`, upgrade `echo`, max 3, needs `[["lob", 3]]` — the fork under Lob beside Wide and Bop: Wide grows the splash, Bop aims the bubble at the critter, Echo brings it back.
- **Text:** "Your bubble splashes, then turns and flies back to you, splashing again where it lands behind you. Per rank: the return splash is 25% bigger (50% to 75% to 100% of your splash)."
- **What it costs:** 3 points in a tree that has already spent Quick 1 and Lob 3 — a committed Lobber. Those 3 points could buy Wide (a bigger splash) or Bop (a bubble that snipes a critter); Echo is the choice to make the ground behind you as deadly as the ground ahead.

## Compared with what exists
Echo rewrites how the tree's shot flies, so one row for that kind (Drift, Swoop, Bop) and every similar upgrade named above:

| Existing | What it shares | What Echo does that it can't (not numbers) |
| --- | --- | --- |
| Drift | rewrites how the tree's shot flies | slows the bolt along its line and lets it linger; Echo's bubble flies out as normal and adds a second leg back to the thrower |
| Swoop | rewrites how the tree's shot flies | re-aims a bolt once at its target and flies a second leg at the enemy; Echo's second leg flies back to the thrower, away from the enemy |
| Bop | rewrites how the bubble flies | the bubble dies on the first critter it touches; Echo's bubble splashes on the ground and comes back, and with Bop a bubble that misses still returns |
| Wide | sizes your splash | makes the splash where the bubble lands bigger; Echo adds a second, smaller splash behind the thrower that Wide sizes too |
| Fizz | makes the Lobber's ground last | lingers the splash where it lands; Echo's splashes linger where they land, out and back (a fizz-puddle per splash) |
| Fuse | a reaction to your bubble's kills | pops a ring where a bubble killed; the return splash's kills fire Fuse, like the out splash's |
| Split | more, weaker shots for every weapon | fans out extra bubbles — with Echo, each of them splashes, comes back and splashes behind you |
| Slush | a Lobber shot that leaves a zone | a separate straight shot that leaves a slow puddle; Echo's zone is the bubble's own splash, behind the thrower, and it slows nothing |
| Goo | a shot that homes to an enemy | the drop turns and catches the nearest enemy, one way; Echo's bubble homes back to the thrower after it splashes |
| Cling | a shot that sticks to the target | the Goo rides the critter it hit; Echo's bubble rides the thrower, not the enemy |
| Scatter | a kill that spawns seekers | 4 mini-Goo from a Goo kill; Echo adds a leg to every bubble, on no kill |

## Acceptance criteria
- [ ] A player with Echo (Lob 3 or better): after a bubble's splash strikes, the bubble turns in place over 0.2 s and flies back toward the player at 100 u/s for 1.0 s, then splashes again where it stops — behind a running player.
- [ ] The return splash deals the normal splash damage at 50% of the splash's radius at rank 1, 75% at rank 2 and 100% at rank 3; a rank-3 Wide return splash is visibly bigger than one without Wide.
- [ ] A return splash's strike gets your on-hit upgrades (a critter standing in it is slowed by Chill), and a return splash's kill pays Chomp/Nest/Sting/Scavenge as your kill.
- [ ] A player with Fizz: both the out splash and the return splash leave a fizz-puddle where they land.
- [ ] With Bop: a bubble that touches a critter pops on it (the Bop burst) and does not return; a bubble that touches nothing splashes, comes back and splashes behind the player.
- [ ] With Split, every fanned bubble gets the return leg, all 12% weaker.
- [ ] A knocked-out player's returning bubble pops in a small puff and does not splash.
- [ ] An Echo bubble wears a thin teal band in flight (pulsing on the return leg); a normal bubble is unchanged. A small white tick where the bubble turns.
- [ ] Echo is in the Lobber tab as a 3-rank fork under Lob (needs Lob 3), beside Wide and Bop, with the text above.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/echo.ts` — Echo upgrade (marker: `stats: {}`, the flight lives in echo-bubble) + defensive `echoRank(me)` reader (copy the `drift.ts` pattern)
- create `src/content/projectiles/echo-bubble.ts` — the Echo bubble: a `step()` projectile (out leg = Lob's exact arc, normal out splash, 0.2 s in-place turn, homing return leg), teal band look pulsing on the return leg, Bop's pop on contact, return splash in `onEnd`
- create `src/content/effects/echo-tick.ts` — small white 4-unit pop where the bubble turns (fizz-tick style, no glow)
- create `tests/echo.test.ts` — unit tests (see Tests)
- edit `src/content/upgrades/lob.ts` — `fire()`: new echo branch that takes priority; the existing bubble/bop fall-through stays byte-for-byte unchanged
- edit `src/content/upgrades/index.ts` — `import { echo } from './echo.ts';` (after the drift import) + `echo,` after `drift,` in the list
- edit `src/content/projectiles/index.ts` — `import { echoBubble } from './echo-bubble.ts';` (after the bubble import) + `echoBubble,` after `bubble,`
- edit `src/content/effects/index.ts` — `import { echoTick } from './echo-tick.ts';` (after the splashRing import) + `echoTick,` after `splashRing,`
- edit `src/content/talents/lobber.ts` — one line after the `wide` line: `{ id: 'echo', upgrade: 'echo', max: 3, needs: [['lob', 3]] },`

### Interfaces
```ts
// upgrades/echo.ts
export const echo: UpgradeDef; // id 'echo', name 'Echo', maxLevel 3, stats: {}, look { shape: 'circle', color: PALETTE.teal }
export function echoRank(me: Player): number; // 0 when not held, never throws (drift.ts pattern)
// projectiles/echo-bubble.ts
export const ECHO_TURN = 0.2;         // seconds the bubble spins in place (not Quick-scaled)
export const ECHO_RETURN = 1.0;       // seconds of the return leg
export const ECHO_RETURN_SPEED = 100; // u/s at Quick 0
export function echoOutLeg(s: Launch, t: number): Point; // identical to bubble.path(s, t, owner)
export function echoReturnRadius(rank: number): number;  // rank 1: 0.5, 2: 0.75, 3: 1.0
export const echoBubble: ProjectileDef; // id 'echo-bubble', radius 8, life 2 (fire overrides), pierce 99 (Bop fires with 1), step + look + onHit + onEnd
```
`echo` description, verbatim: `Your bubble splashes, then turns and flies back to you, splashing again where it lands behind you. Per rank: the return splash is 25% bigger (50% to 75% to 100% of your splash).`

### Steps
1. `echo-tick.ts`: `EffectDef { id: 'echo-tick', duration: 0.15, draw(g, fx) { const r = 4 * fx.t; if (r <= 0) return; g.globalAlpha = 1 - fx.t; // ink ring lineWidth 2 at r, then white ring lineWidth 1 at r - 1, both g.arc(fx.ax, fx.ay, ...) } }` — colors `PALETTE.ink`, `PALETTE.white`.
2. `echo.ts`: the def + `echoRank` exactly as `drift.ts` (copy its reader, keyed on `echo`).
3. Read T0118's output first (it lands before this task): in `src/content/upgrades/bop.ts` / `src/content/projectiles/bop-bubble.ts` find (a) the damage Bop's bubble is fired with and (b) the effect/area call Bop's bubble makes when it pops on a critter.
4. `echo-bubble.ts`:
   - `echoOutLeg(s, t)`: copy `bubble.ts`'s arc exactly (`aim` from `p1`/`floor(p2/8)`, `f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT))`, rise `80 * Math.sin(Math.PI * f)`).
   - `echoReturnRadius(rank)`: `0.5 + 0.25 * (rank - 1)`.
   - `look`: `{ shape: 'circle', color: PALETTE.ice, draw(g, e) { drawCritter(g, this, e, { ink: PALETTE.ink }); // thin teal band; pulses on the return leg (slot 0 = 2): const r = e.radius + 2.5 + (e.slots[0] === 2 ? 1 + Math.sin(e.time * 12) : 0); g.strokeStyle = PALETTE.teal; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); } }`
   - `step(ctx, p, dt)`: `const me = p.owner; if (me.type !== 'player' || !me.alive) { if (!p.mem.popped) { p.mem.popped = 1; ctx.effect('slow-pop', { x: p.x, y: p.y }); } p.life = p.age; return; }` then `const mul = p.launch.speed / BUBBLE_SPEED; const outTime = BUBBLE_FLIGHT / mul;` — if `p.age < outTime`: set `p.x/p.y = echoOutLeg(p.launch, p.age)`, `p.slots[0] = 0`, return. If `!p.mem.splashed`: `p.mem.splashed = 1; const level = (p.launch.p2 % 8) + 1; ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) }); ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area)); ctx.effect('echo-tick', { x: p.x, y: p.y });` If `p.age < outTime + ECHO_TURN`: `p.slots[0] = 1; turnToward(p, { x: me.x, y: me.y }, 20 * dt); return;` Else: `p.slots[0] = 2; p.speed = ECHO_RETURN_SPEED * mul; turnToward(p, { x: me.x, y: me.y }, 10 * dt); moveForward(p, dt);`
   - `onHit(ctx, p, target)`: `if (p.damage <= 0) return;` then play Bop's pop (b), exactly as bop-bubble does, at the critter (`target.x/y`).
   - `onEnd(ctx, p)`: `const me = p.owner; if (me.type !== 'player' || !me.alive) return; const level = (p.launch.p2 % 8) + 1; const frac = echoReturnRadius(echoRank(me)); ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1), radius: 70 * frac }); ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * frac * me.stats.area));`
5. `lob.ts` `fire()`: keep the `nearestEnemy` guard, then before the existing fire call add: `if (echoRank(me) > 0) { const bop = /* defensive rank read of bop, drift.ts pattern, importing { bop } from './bop.ts' */; ctx.fire(me, 'echo-bubble', { angle: v.angleTo(me, target), speed: BUBBLE_SPEED, damage: bop ? <(a) Bop's contact damage, as a const in lob.ts, kept in sync with bop-bubble> : 0, pierce: bop ? 1 : 99, life: BUBBLE_FLIGHT / me.stats.projectileSpeed + ECHO_TURN + ECHO_RETURN / me.stats.projectileSpeed, p1: Math.round(target.x), p2: Math.round(target.y) * 8 + (level - 1) }); return; }` — import `ECHO_TURN, ECHO_RETURN` from `./echo-bubble.ts` and `echoRank` from `./echo.ts`.
6. Talent line in `lobber.ts` (exact line above, after `wide`).
7. `tests/echo.test.ts` (copy `tests/drift.test.ts` shape): (1) for 3 launch constants (vary x/y, angle, speed 400/500/725, valid packed `p1`/`p2`) and `t` from 0 to 0.8 step 0.01: `expect(echoOutLeg(s, t)).toEqual(bubble.path!(s, t, { x: 0, y: 0 }))` — pins "the out leg is exactly today's Lob bubble"; (2) `echoReturnRadius(1/2/3)` → `0.5 / 0.75 / 1`; (3) `echoRank` held → 2, `{}` → 0.
8. `npm run check`, then dev-play as a human: buy Quick 1, Lob 3, Echo 1..3; verify out leg, the tick + turn, the return splash landing behind a running player, the band pulse, and the KO puff (die mid-flight).

### Pitfalls
- Homing to a moving owner has no closed form: this MUST be `step()`, never `path()`. Bandwidth is fine (one bubble per 1.1 s, same class as Goo); do not add any other step projectile.
- Never edit `bubble.ts` (Bop/Fizz touch the Lobber's files): the arc is duplicated, and tests/echo.test.ts pins it to `bubble.path`.
- Don't invent new `p1`/`p2` packing — aim + level stay exactly as today; read echo rank off the owner at splash time, Bop rank at fire time.
- The engine fires `onEnd` only on life expiry, never when pierce runs out — that is why a Bop pop (pierce 1, killed on contact) never returns. Do not move the return splash into `onHit`.
- A plain echo bubble takes 0-damage "strikes" passing through critters (today's bubble does too): the `p.damage <= 0` guard in `onHit` is mandatory or every monster touched would play Bop's pop.
- Both splashes must be real `ctx.area(me, 'splash', ...)` strikes — Fizz (T0116), Fuse, Chill and kill credit all key off the splash area's strikes; a hand-rolled pulse silently breaks the return leg.
- Quick scales both legs via `launch.speed` (`mul`), never via `me.stats` inside `step` (stats can change mid-flight; the launch is fixed). The 0.2 s turn is not scaled.
- The dead-owner check runs every tick on all three legs: one `slow-pop` (guard with `p.mem.popped`), then `p.life = p.age`; `onEnd` must no-op when the owner is dead.
- No `Math.random`/`Date`/`performance` in `src/content/`; colors only from `PALETTE`; look reads only `e.slots`/`e.time`.
- Talents panel fullest state (Lobber tab, incl. open Fizz/Bop): 8 rows; the Echo row is the longest text — "Echo" + 3 pips + the 2-sentence description (wraps ~3 lines at 412x915) + "Needs Lob 3" while locked; the panel (`src/hud/talentTree.ts`) already wraps rows, no layout change.

### Tests
- `tests/echo.test.ts` as in step 7 (out-leg parity with `bubble.path`, return-splash fraction 0.5/0.75/1.0, `echoRank` defensive read). The engine tests cover registration, looks, talent reachability and the 60-player budget; note the per-upgrade match test grants Echo alone (no Lob), so the unit tests are the only CI coverage of the flight.
