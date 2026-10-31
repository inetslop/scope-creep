---
id: T0135
title: "The Miner tree: a mine drops where you stand, and whatever steps on it pops"
size: M
priority: 1
status: todo
depends_on: [T0134]
attempts: 0
created: 2026-10-31T23:01:32Z
epic: E31
---

## Goal
A seventh playstyle for the talents panel, filling the slot the Body tree vacates: the Miner. Its weapon is the path itself — every 2.5 s a candy mine drops where you stand, and whatever walks into your trail pops. Cheap zone-time mods first, the Mine deeper, so kiting, camping and running all end in a trail of traps.

## Details

Tree (a new file in src/content/talents/, one line in TREES):
- name Miner, description "Your Mine: it drops where you stand, and whatever steps on it pops.", look: shape pentagon, color teal #3bc9db.
- Talents, in file order:
  - id last, upgrade last, max 3
  - id mine, upgrade mine, max 5, needs [["last",1]]
- The panel draws:
  ```
  Last (3)
    Mine (5, needs Last 1)
  ```
- What a Miner player gets and what it costs: 1 point buys a zone-time mod that works with every tree's zones; 4 points buy Mine 3 (the weapon's first real power) — the same 4 points a Gunner would spend on Bolt ranks and Split.

Last (new upgrade, src/content/upgrades/last.ts):
- Name "Last", maxLevel 3, look: shape diamond, color #3bc9db.
- Text: "Your lingering zones and marks last 25% longer, per rank."
- It extends the lifetime of every lingering zone and mark your own weapons and talents lay or refresh, by 25% per rank: Slush's puddle (2.5 s), Gush's puddle (1.5 s), Fizz's splash (2.5 s), Cling's splat (2 s), Chill's slow (1 s), Sapped's mark, and your own mine's 8 s life. Single-strike fields (Lob's splash, Maw's bite, Bellow's ring, a mine's blast) are not extended, a monster's own puddle is never extended, and the mine's 0.5 s arming is never extended — only the life after it.
- What it does with every weapon: Bolt, Cover, Nerve, Horn, Maw, Bellow and Reach — nothing of theirs lingers, no effect; Lob — the splash is a single strike, no effect, but a Fizz splash lingers longer; Goo — the Gush puddle, Chew's ticks and Cling's splat last longer; Slush — the puddle lasts longer; Mine — the 8 s life becomes 10 / 12.5 / 15 s at ranks 1-3.

Mine (new weapon upgrade, src/content/upgrades/mine.ts):
- Name "Mine", maxLevel 5, look: shape circle, color #3bc9db, cooldown 2.5 s.
- Text: "Every 2.5 s, drops a candy mine where you stand. 0.5 s after it lands it arms, and whatever steps on it pops: a 60-radius blast, 14 damage, monsters and players alike, never you. An untouched mine pops empty after 8 s. Per rank: +5 damage, +10 blast radius."
- Fire: unconditional, at the player's own position. It lays a new area (src/content/areas/mine.ts):
  - The mine is a small candy ball (radius 12) that sits still. For its first 0.5 s it is disarmed (dull teal, a gray star at the fuse tip) and strikes nothing.
  - Armed, the ball brightens to vivid teal and a small pink star at the fuse tip pulses on a 0.4 s beat (the star's size grows and shrinks; no glow).
  - The first critter that touches an armed mine — a monster or another player — detonates it: one strike for the blast radius (60, +10 per rank), 14 damage (+5 per rank), monsters and players alike (a player takes the normal half), never the owner. The mine is gone after the strike.
  - An untouched mine pops empty after 8 s (extended by Last): a small puff of pale confetti, no ring, no damage.
  - A mine takes no damage and cannot be destroyed any other way; only contact or expiry ends it.
- Which mods apply: Haste (the drop is 8% sooner per rank), Split (one more mine per drop, the extras landing 40 units out fanned ±30° around your facing; each mine's blast 12% weaker per Split rank), Wide (the blast radius +20% per rank), the player's damage stat (the blast is a hit, as with Slush's puddle and Bop's burst). Quick and Lance do nothing (a mine does not fly).
- The blast's strike is a normal area hit: every non-weapon-conditional on-hit upgrade runs on it (Chill slows the survivors of a pop, Reap pops a half-dead critter harder, Swarm pops harder in a crowd, Snare's sapped critter takes more, Reckless doubles it below half hp, Leech and Glide pay if their own conditions are on you). The weapon-conditional ones do not (Ricochet on Bolt, Mend and Gore on Nerve, Lash on Horn, Fizz and Bop on the bubble).
- A kill by the blast is a normal kill: the gem drops, the kill coin pays, a level-4+ player's corpse gem drops, and every non-weapon-conditional on-kill runs (Chomp, Adrenaline, Fang, Snap, Nest, Sting, Scavenge). The weapon-conditional ones do not (Fuse on a bubble kill, Gush, Chew and Scatter on a Goo kill).
- What the player sees: a small still teal ball with a pulsing pink star — nothing else on the field sits still and sparks (a Goo is a big blue drop that flies, a puddle is a flat rimmed field, a gem is a yellow-green star that rises). On detonation it pops like a bubble's splash: an ice ring with an ink rim blooms out to the blast radius, with a burst of teal and pink confetti.
- In a crowd of monsters: a line of mines thins the chasers (Dots, a Zippy's dash, a Flee's retreat) before they reach you, and a Brood's newborn Dots spawn straight into the trail. Against other players: a mine on the road to the geyser or the jackpot is a toll, and a kiting loop lays a ring of mines you run through and your pursuer does not. With 6 players the trail mostly fights monsters and bots; with 60 it becomes the field's most visible hazard, and the geyser toll is contested.

## Compared with what exists

The tree, one row per existing tree (after T0134 retires the Body tree):

| Existing | What it shares | What the Miner gives that it can't |
| --- | --- | --- |
| Gunner | a mods-first tree around one weapon (Haste, Lance) | the bolt is aimed at the enemy and flies at it; the mine is laid where you stand and waits — the weapon is your path, not your aim, and it hurts whoever walks in, even the crowd behind you |
| Lobber | a zone weapon with zone mods (Quick, Wide) | a Lobber's zone lands where a thrown bubble lands, and strikes on landing or ticks; the mine is laid where you walk, waits up to 8 s, and detonates on first touch — the zone follows your movement, not a projectile |
| Goober | zones that cling to enemies (Gush, Cling, Snare) | Goober's zones come from a hit you land; the mine needs no hit — a trap laid ahead works on whatever wanders in, including a Flee you never touch |
| Frenzy | a tree around one weapon (Nerve), hurt-scaled | Nerve bursts around you every 0.6 s while an enemy is close; the mine is patient — it pops once, at the feet, on contact, and a whole trail of them is the attack |
| Hive | crowd-scaling damage (Swarm, Scavenge) | the Hive is stronger the more enemies are around you now; the Miner is stronger the more enemies walk where you have been — the crowd is your ammo, not your buff |

The Mine, one row per weapon and per upgrade it is close to:

| Existing | What it shares | What the Mine does that it can't |
| --- | --- | --- |
| Bolt | a weapon on a cooldown that aims at the nearest | the bolt flies now, at the nearest enemy; the mine waits where you stand for up to 8 s and pops on touch — it can hit an enemy that is not the nearest, and one you have already passed |
| Cover | a weapon on a cooldown, behind you | Cover shoots at whatever chases you, right now; the mine is laid where you were and pops later, on the thing that walks in |
| Maw | a short-range strike around you | Maw bites in front of you every 0.9 s while an enemy is close; the mine is behind you on your path, one pop, on contact |
| Bellow | a timer-spawned ring around you | Bellow's ring is cast around you, strikes once and is gone; the mine is cast where you stand, lives up to 8 s, and detonates wherever a critter touches it — a trail, not a pulse |
| Lob | lays an ice field on the ground | Lob's splash lands where a thrown bubble lands and strikes on landing; the mine is placed by your movement, not a throw, waits for a touch, and can pop long after you have left |
| Goo | a cool drop weapon | the Goo flies and turns after the enemy; the mine never moves — it is a still trap the enemy comes to |
| Reach | a thin needle at the farthest | Reach fires at the farthest enemy every 4 s; the mine is close-range and patient, trading range for an ambush |
| Nerve | a burst around you | Nerve is a ring of needles around your body every 0.6 s; the mine is a single pop at a point on the ground, triggered by contact, not by proximity to you |
| Horn | darts at the nearest | Horn's darts fly at up to 4 of the nearest enemies now; the mine pops at its own spot later, on the one that touches it |
| Slush | lays a lingering zone | Slush's puddle is thrown at an enemy and ticks a slow where the blob lands; the mine is laid by your walk and does not tick — it detonates once on first touch, and can sit 8 s |
| Bop | a pop-on-touch burst | Bop's bubble flies at the critter and pops where it touches it; the mine sits where you stood and pops on the critter that comes to it — the aim is your feet, not a target |
| Fizz | a lingering zone from your weapon | Fizz's zone is the splash of a bubble you threw, ticking every 0.5 s; the mine is a trap placed by movement, one pop on contact, and its 8 s life is what Last extends |

Last, one row per upgrade that lengthens a zone or mark:

| Existing | What it shares | What Last does that it can't |
| --- | --- | --- |
| Slush | its ranks lengthen a zone | Slush's rank lengthens only its own puddle (+0.5 s per rank); Last lengthens every lingering zone and mark a player lays, whichever tree it came from |
| Chill | its ranks lengthen a mark | Chill's rank lengthens only its own slow (+0.5 s per rank); Last adds 25% per rank to whatever of a player's weapons lingers |
| Fizz | a fixed 2.5 s lingering zone | Fizz's splash stays 2.5 s no matter what; Last's 25% per rank reaches it (3.1, 3.9, 4.9 s) and every other lingering zone and mark a player makes |

## Acceptance criteria
- [ ] The talents panel has a seventh tab, the Miner (pentagon, teal), with Last and Mine drawn as above; spending 1 point on Last and 4 on Mine 3 works end to end.
- [ ] A Miner drops a candy mine where they stand every 2.5 s; it sits dull for 0.5 s, then a pink star pulses on its fuse; a monster or another player that touches it pops it (14 damage, radius 60, half to players, never the owner), and an untouched one pops empty after 8 s.
- [ ] Last's ranks visibly extend the mine's life and other trees' lingering zones and marks; Split fans the drop, Wide grows the blast, Haste speeds the drop, and the blast's kills pay the normal gem, coin and on-kill upgrades.
- [ ] The mine reads in a crowd: a small still teal ball with a pulsing star, an ink-rimmed ice ring and confetti on the pop; no glow anywhere.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/last.ts` — Last upgrade def + `lastRank`/`lastMul` helpers
- create `src/content/upgrades/mine.ts` — Mine weapon def + `mineRank`/`mineFan` helpers
- create `src/content/areas/mine.ts` — the mine area: fuse, contact pop, empty pop, look
- create `src/content/effects/mine-pop.ts` — ink-rimmed ice ring blooming to the blast radius + teal/pink confetti
- create `src/content/effects/mine-puff.ts` — small pale confetti puff, no ring
- create `src/content/talents/miner.ts` — the Miner tree
- edit `src/content/palette.ts` — one line: add `cyan: '#3bc9db',` after `teal` (the task's teal is not in PALETTE; `teal` is already `#38d9a9`)
- edit `src/content/upgrades/index.ts` — register `last`, `mine`
- edit `src/content/areas/index.ts` — register `mine`
- edit `src/content/effects/index.ts` — register `minePop`, `minePuff`
- edit `src/content/talents/index.ts` — register `miner`
- edit `src/content/projectiles/slush-blob.ts` — Slush puddle life × Last
- edit `src/content/upgrades/gush.ts` — Gush puddle life × Last
- edit `src/content/upgrades/chew.ts` — Chew puddle life × Last
- edit `src/content/upgrades/fizz.ts` — Fizz puddle life × Last
- edit `src/content/upgrades/chill.ts` — Chill slow duration × Last
- edit `src/content/upgrades/cling.ts` — Cling mark deadline × Last
- edit `src/content/areas/puddle.ts` — Sapped mark duration × Last
- edit `src/content/areas/chew-puddle.ts` — puddle refresh window + Sapped mark × Last

### Interfaces
```ts
// palette.ts:  cyan: '#3bc9db',
// upgrades/last.ts (stats: {} like bop.ts — the content test wants stats|fire|onHit|onKill)
export const last: UpgradeDef;                // id 'last', name 'Last', maxLevel 3, look { shape: 'diamond', color: PALETTE.cyan }
export function lastRank(me: Player): number; // the bopRank pattern (bop.ts:16): read the engine-held rank, 0 if not held, never throws
export function lastMul(me: Player): number;  // Math.pow(1.25, lastRank(me))
// upgrades/mine.ts
export const mine: UpgradeDef;                // id 'mine', name 'Mine', maxLevel 5, cooldown 2.5, look { shape: 'circle', color: PALETTE.cyan }
export function mineRank(me: Player): number; // bopRank pattern, for the mine def
export function mineFan(split: number): readonly number[]; // offsets around the facing of Split's extra mines: 0→[], 1→[0], 2→[-π/6, +π/6]
// areas/mine.ts
export const mine: AreaDef;                   // id 'mine', radius 12, life 8 (fire sets the real life), interval 0.1, look with draw
// effects/mine-pop.ts: export const minePop: EffectDef;   // id 'mine-pop', duration 0.5
// effects/mine-puff.ts: export const minePuff: EffectDef; // id 'mine-puff', duration 0.4
// talents/miner.ts
export const miner: TalentTreeDef;            // id 'miner', name 'Miner', look { shape: 'pentagon', color: PALETTE.cyan }
```

### Steps
1. `palette.ts`: add `cyan: '#3bc9db',` after the `teal` line. Do this first; every look below references `PALETTE.cyan`.
2. `upgrades/last.ts`: def with `description: 'Your lingering zones and marks last 25% longer, per rank.'`, `stats: {}` (copy bop.ts's comment about why), and:
```ts
export function lastRank(me: Player): number {
  const held = (me as Player & { upgrades?: ReadonlyMap<UpgradeDef, { level: number }> }).upgrades?.get(last);
  return held ? held.level : 0;
}
export function lastMul(me: Player): number { return Math.pow(1.25, lastRank(me)); }
```
3. `upgrades/mine.ts`: def with `cooldown: 2.5`, `description: 'Every 2.5 s, drops a candy mine where you stand. 0.5 s after it lands it arms, and whatever steps on it pops: a 60-radius blast, 14 damage, monsters and players alike, never you. An untouched mine pops empty after 8 s. Per rank: +5 damage, +10 blast radius.'`, `mineRank` (bopRank pattern), and:
```ts
export function mineFan(split: number): readonly number[] {
  if (split <= 1) return split === 1 ? [0] : [];
  const out: number[] = [];
  for (let i = 0; i < split; i++) out.push(-Math.PI / 6 + (Math.PI / 3) * (i / (split - 1)));
  return out;
}
fire(ctx, me, level) {
  const drop = (x: number, y: number) =>
    ctx.area(me, 'mine', { x, y, radius: 12 / me.stats.area, damage: 14 + 5 * (level - 1), life: 8 * lastMul(me) });
  drop(me.x, me.y);
  for (const offset of mineFan(me.stats.shots)) // Split ranks: one more mine per rank, 40 units out
    drop(me.x + Math.cos(me.angle + offset) * 40, me.y + Math.sin(me.angle + offset) * 40);
},
```
4. `areas/mine.ts` (import `{ traceShape, noise, shade, type AreaDef }` from api, PALETTE, `{ mineRank }` from `../upgrades/mine.ts`):
```ts
const ARM = 0.5, TOUCH = 12;
export const mine: AreaDef = {
  id: 'mine', radius: 12, life: 8, interval: 0.1,
  look: {
    shape: 'circle', color: PALETTE.cyan,
    draw(g, e) {
      const armed = e.slots[0] > 0;
      g.save();
      g.beginPath(); g.arc(0, 0, TOUCH, 0, Math.PI * 2);
      g.fillStyle = armed ? PALETTE.cyan : shade(PALETTE.cyan, -0.2);
      g.fill(); g.lineWidth = 2.5; g.strokeStyle = PALETTE.ink; g.stroke();
      g.beginPath(); g.arc(-4, -4.5, 3, 0, Math.PI * 2); g.fillStyle = PALETTE.white; g.fill(); // shine
      g.beginPath(); g.moveTo(8.5, -8.5); g.lineTo(13, -13); g.lineWidth = 2; g.lineCap = 'round'; g.stroke(); // fuse, from the ball's edge
      const beat = ((e.time + 0.4 * noise(e.seed, 0)) % 0.4) / 0.4;
      const sr = armed ? 3 + 2 * (0.5 + 0.5 * Math.sin(beat * Math.PI * 2)) : 3.5; // 0.4 s beat
      g.translate(13, -13);
      g.beginPath(); traceShape(g, 'star', sr, 0);
      g.fillStyle = armed ? PALETTE.pink : PALETTE.muted;
      g.fill(); g.lineWidth = 1.5; g.lineJoin = 'round'; g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    if (a.age >= ARM) a.slots[0] = 1; // the fuse has burned: tell every client
    if (a.age < ARM) return;          // disarmed: it strikes nothing
    const o = a.owner;
    if (o.type !== 'player') return;
    const rank = Math.min(5, Math.max(1, mineRank(o)));
    const blast = (60 + 10 * (rank - 1)) * o.stats.area; // Wide grows the blast
    if (ctx.enemiesNear(o, a.x, a.y, TOUCH).length > 0) {
      for (const u of ctx.enemiesNear(o, a.x, a.y, blast)) ctx.strike(a, u); // never the owner; players half
      ctx.effect('mine-pop', { x: a.x, y: a.y }, undefined, Math.round(blast));
      a.life = a.age; // the mine is gone after the strike
    } else if (a.life <= 0.15) {
      ctx.effect('mine-puff', { x: a.x, y: a.y }); // pops empty as it wears off
      a.life = a.age;
    }
  },
};
```
5. `effects/mine-pop.ts` (import `{ noise, type EffectDef }`): `duration: 0.5`; draw = the ring from `splash-ring.ts` (ink 3px stroke at `fx.value * fx.t`, ice 2px at `r - 2` when `r > 4`, `globalAlpha = 1 - fx.t`) plus the confetti loop from `bop-confetti.ts` (10 dots, `COLORS = [PALETTE.cyan, PALETTE.pink, PALETTE.ice]`, spread `fx.value * (0.15 + 0.55 * fx.t)`). No glow, strokes and flat fills only.
6. `effects/mine-puff.ts`: `duration: 0.4`; 6 small dots like bop-confetti but radius `3 * (1 - fx.t) + 1`, spread `18 * (0.2 + 0.6 * fx.t)`, `COLORS = [PALETTE.white, PALETTE.ice, PALETTE.cyan]`, no ring, no ink stroke on the dots.
7. `talents/miner.ts`:
```ts
export const miner: TalentTreeDef = {
  id: 'miner',
  name: 'Miner',
  description: 'Your Mine: it drops where you stand, and whatever steps on it pops.',
  look: { shape: 'pentagon', color: PALETTE.cyan },
  talents: [
    { id: 'last', upgrade: 'last', max: 3 },
    { id: 'mine', upgrade: 'mine', max: 5, needs: [['last', 1]] },
  ],
};
```
8. Registries, one line each, next to related entries: `upgrades/index.ts` — imports `last` between `lance`/`leech`, `mine` between `mend`/`might`; in UPGRADES add `mine,` after `horn,` (weapon block) and `last,` after `haste,` (mod block). `areas/index.ts` — import after `fizzPuddle`; add `mine,` after `fizzPuddle,`. `effects/index.ts` — imports after `splashRing`; add `minePop,` and `minePuff,` after `bopConfetti,`. `talents/index.ts` — import after `lobber`; add `miner,` after `gunner,` in TREES (second tab, the slot Body vacates).
9. Last's multiplier at every listed zone/mark site — add `import { lastMul } from './last.ts';` (or `'../upgrades/last.ts'`) and change exactly these lines:
   - `slush-blob.ts:27`: `life: 2.5 + 0.5 * rank,` → `life: (2.5 + 0.5 * rank) * lastMul(p.owner),`
   - `gush.ts:14`: add `life: 3 * lastMul(me)` to the `ctx.area(me, 'puddle', …)` options
   - `chew.ts:13`: add `life: 3 * lastMul(me)` to the `ctx.area(me, 'chew-puddle', …)` options
   - `fizz.ts:21`: add `life: 2.5 * lastMul(me)` to the `ctx.area(me, 'fizz-puddle', …)` options
   - `chill.ts:11`: `onHit(ctx, _me, level, hit)` → `onHit(ctx, me, level, hit)`; line 14: `0.5 + level * 0.5` → `(0.5 + level * 0.5) * lastMul(me)`
   - `cling.ts:17`: `2` → `2 * lastMul(me)`; line 18: `+ 200` → `+ Math.round(200 * lastMul(me))`
   - `puddle.ts:34`: `ctx.addStatus(u, 'sapped', 1)` → `ctx.addStatus(u, 'sapped', lastMul(o))` (`saps` already implies `o` is a player)
   - `chew-puddle.ts:56`: `a.life = a.age + 3` → `a.life = a.age + 3 * (a.owner.type === 'player' ? lastMul(a.owner) : 1)`; line 65: same sapped change as puddle.ts

### Pitfalls
- `a.life` is REMAINING seconds (countdown), not the total: the empty-pop check is `a.life <= 0.15`, never `a.age >= a.life`. `a.life = a.age` is the codebase way to end an area early (splat.ts:45) — the engine has no removeArea.
- `Area.damage` and `Area.radius` are multiplied by the owner's damage/area stats AT CREATION (engine/sim/match.ts:1106-1105). So pass `14 + 5*(level-1)` as base (Split's −12%/rank and Might come free via the damage stat — do NOT multiply by 0.12 in code) and pass `12 / me.stats.area` so the touch radius stays exactly 12 while the blast uses `o.stats.area` at pop time (fizz.ts:21 precedent).
- Read `mineRank` at pop time, clamped 1..5 (bop.ts/bop-bubble.ts precedent): a player who prestiges loses the upgrade, and an unclamped rank 0 would give a 50-radius blast.
- The arming state MUST go in `a.slots[0]`: the client's `DrawView` has no area age, so the client cannot derive the 0.5 s fuse from its own clock.
- No `Math.random`/`Date`/`performance` anywhere in `src/content/`; variation in draws from `noise(e.seed, i)` only. No glow/gradient/blur in the two effects. The mine is candy, not a critter: its draw does not start with `drawCritter()`.
- Do NOT extend single-strike fields (`splash`, `bite`, `bellow-ring`) or monster-owned zones — only the eight edit sites in step 9. Haste (cooldown stat), Split (shots stat) and Wide (area stat) are automatic engine behavior; the mine's code only reads `me.stats.shots` for the fan.
- If the 60-player load test (engine/tests/load.test.ts) fails on bytes/tick time because of the mines, raise the area's `interval` from 0.1 to 0.2 (coarser contact check, still fine).
- Talents panel (`src/hud/talentTree.ts`) is fully data-driven: the 7th tab chip wraps by existing CSS, and the Mine description (the longest in the panel) flows in the existing `.hud-talent-desc` — do not touch the panel or its CSS.

### Tests
- `tests/miner.test.ts` for the new pure helper `mineFan`: `mineFan(0)` → `[]`; `mineFan(1)` → `[0]`; `mineFan(2)` → `[-Math.PI/6, Math.PI/6]` (toBeCloseTo). Everything else (one-file-per-id, registry, data, each upgrade in a real match — the mine's fire/area/strike path, talent reachability, the 60-player budget) is covered by `engine/tests/`.
