---
id: T0136
title: "Shrapnel: a Miner fork under Mine 2, a detonation flings ice shards at the crowd around it"
size: M
priority: 2
status: todo
depends_on: [T0135]
attempts: 0
created: 2026-10-31T23:01:32Z
epic: E31
---

## Goal
The Mine's first fork: a detonation is no longer only a circle at the feet. It flings shards at the crowd that gathers around the blast, so a mine you laid 8 s ago still pokes the enemies its circle missed — the trap's reach grows beyond its radius.

## Details
- Talent (in the Miner tree's file, after the mine line): id shrapnel, upgrade shrapnel, max 2, needs [["mine",2]].
- The panel draws it under Mine:
  ```
  Mine (5, needs Last 1)
    Shrapnel (2, needs Mine 2)
  ```
- Upgrade (new file, src/content/upgrades/shrapnel.ts): name "Shrapnel", maxLevel 2, look: shape star, color #3bc9db.
- Text: "When one of your mines detonates, it flings ice shards: 3 at the 3 nearest enemies within 120, 6 damage each. Per rank: +1 shard, +30 range."
- Behavior: when one of your mines detonates — once per mine, not per critter the blast strikes — shards fly from the mine's spot at the 3 nearest enemies within 120 of it (rank 2: 4 within 150), nearest first. The owner is never a target. A detonation with no enemy in range flings nothing.
- The shards (new projectile, src/content/projectiles/shard.ts): small ice shards with an ink outline (the jab's shape, ice with a teal tinge), straight, 220 u/s, 0.4 s, gone on hit or when their time runs out. They move by a simple path computed on launch (like the jab); at most 4 per detonation, and at most 6 of your mines can be alive at once, so at most 24 shards per player at a moment — all path-based, no per-tick steering.
- A shard's hit is a normal hit: every non-weapon-conditional on-hit upgrade runs on it (Chill, Reap, Swarm, Reckless, Snare, Leech, Glide), and a kill by a shard is a normal kill (the gem, the kill coin, a level-4+ corpse gem, the non-weapon-conditional on-kills). Shards never split, bounce or chain.
- Which mods apply: the player's damage stat scales the shards' 6 damage (a hit); Haste does not affect the shards (they fire on a detonation, not on a cooldown); Split, Lance, Wide and Quick do nothing to them.
- What the player sees: a fan of small ice shards bursting out of the mine's pop at the critters around it — readable as the mine's own signature, since the shards are ice like the mine's ring and fly from the blast, not from a body.

## Compared with what exists

Shrapnel triggers on an area's strike, the way Fizz triggers on a splash landing. One row per on-hit upgrade, plus the upgrades it is close to:

| Existing | What it shares | What Shrapnel does that it can't |
| --- | --- | --- |
| Ricochet | a hit spawns a new bolt near the hit | Ricochet re-fires the bolt itself, one bounce, along the bolt's line; Shrapnel's shards are new shots from a mine on the ground, at up to 4 neighbors around the blast, from a spot you left up to 8 s ago |
| Reckless | an on-hit that changes the hit | Reckless doubles the hit's own damage below half hp; Shrapnel adds shots where the hit was — the blast's damage is unchanged |
| Chill | an on-hit that applies a status | Chill slows the critter the hit touched; Shrapnel extends the hit's reach with shots at the crowd around it |
| Reap | an on-hit bonus on a half-dead target | Reap sharpens the hit on a wounded target; Shrapnel pokes the whole crowd around the blast, wounded or not |
| Swarm | an on-hit that scales with the crowd | Swarm sharpens each hit the more enemies are around its target; Shrapnel adds shots at the crowd — at rank 2 it hits 4 of them instead of sharpening them |
| Leech | an on-hit that pays the player back | Leech heals you while your hits land in a crowd; Shrapnel turns the hit's moment into a fan of shards at the crowd around the blast |
| Mend | an on-hit on one weapon (Nerve) | Mend heals you on your own Nerve hits; Shrapnel is a weapon-conditional on-hit like Mend, but it triggers on your mine's blasts and adds reach instead of sustain |
| Lash | a hit spawns small darts at the neighbors | Lash's darts fly from the target your dart hit, splitting the dart's own line; Shrapnel's shards fly from the mine's spot at the 3-4 nearest enemies around the blast — a trap laid earlier pokes the crowd that gathers on it, not the critter you hit |
| Gore | an on-hit on one weapon (Nerve), while hurt | Gore makes the Nerve jab go through more enemies below half hp; Shrapnel's shards are new shots at the blast's neighbors, and they fire whether you are hurt or not |
| Glide | an on-hit that moves the player | Glide speeds you up while your hits land in a crowd; Shrapnel sends the hit's energy outward as shards at the crowd around the blast |
| Cling | a hit splats on the target | Cling sticks a damage tick to the one critter the Goo touched; Shrapnel radiates from the mine's spot at the several critters around it |
| Snare | a hit applies a sap mark | Snare marks whatever your Gush puddle saps so it takes more damage; Shrapnel's shards deal their own 6 damage to whatever is near the blast |
| Fizz | an on-hit on one weapon (Lob) that lingers the zone | Fizz makes the splash you threw keep ticking; Shrapnel makes the mine you laid pop outward with shards at the neighbors — a one-time burst of reach, not a longer zone |
| Horn | darts at the nearest on a timer | Horn fires its own darts at up to 4 of the nearest enemies every 0.8 s while you stand where the crowd is; Shrapnel's shards come from a detonation on the ground, at whatever is near that spot, on no timer of your own |

## Acceptance criteria
- [ ] With Mine 2 and Shrapnel, a mine's pop flings 3 ice shards from the mine's spot at the 3 nearest enemies within 120 (rank 2: 4 within 150), 6 damage each; the shards fly straight, die on hit or after 0.4 s, and never target the owner.
- [ ] The shards' hits and kills behave as normal hits: on-hit upgrades run on them and a shard kill pays the gem, the coin and the on-kill upgrades.
- [ ] A detonation with no enemy in range flings nothing; two mines that pop at the same spot each get their own fan.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/content/projectiles/shard.ts` - the shard projectile (id `shard`): straight ice shard, gone on hit or after 0.4 s
- create `src/content/upgrades/shrapnel.ts` - the Shrapnel upgrade (id `shrapnel`): on-hit hook that fires the fan when a mine's blast strikes
- edit `src/content/palette.ts` - add the shard's color `#3bc9db` (see step 1)
- edit `src/content/projectiles/index.ts` - import `{ shard }` after the `jab` import; add `shard,` after `lashDart,` in `PROJECTILES`
- edit `src/content/upgrades/index.ts` - import `{ shrapnel }` after the `scavenge` import; add `shrapnel,` after `lash,` in `UPGRADES`
- edit `src/content/talents/miner.ts` - one talent line after the `mine` line (created by T0135)

### Interfaces
No new types. Everything uses existing `UpgradeDef.onHit(ctx, me, level, hit)`, `ProjectileDef.path(s, t, owner)`, `Hit.area`, `Ctx.enemiesNear`, `Ctx.fire`, `v.angleTo` (all in `engine/api.ts`).

Exact content of `src/content/projectiles/shard.ts` (mirror of `jab.ts` plus the straight path from `glob.ts`):
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Shrapnel's shard: a small ice shard that flies straight from the mine's spot, gone on hit or after 0.4 s. */
export const shard: ProjectileDef = {
  id: 'shard',
  radius: 5,
  life: 0.4,
  look: { shape: 'diamond', color: PALETTE.frost, scale: 1.2 },
  path(s, t) {
    return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
  },
};
```
(`PALETTE.frost` — see step 1 for the name.)

Exact content of `src/content/upgrades/shrapnel.ts`:
```ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Miner's fork under Mine: a detonation flings ice shards at the crowd gathering around the blast. */
export const shrapnel: UpgradeDef = {
  id: 'shrapnel',
  name: 'Shrapnel',
  description:
    'When one of your mines detonates, it flings ice shards: 3 at the 3 nearest enemies within 120, 6 damage each. Per rank: +1 shard, +30 range.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.frost },
  onHit(ctx, me, level, hit) {
    const a = hit.area;
    if (!a || a.def.id !== 'mine') return; // only your mine's blast
    if (a.mem.shrapnel) return; // one fan per mine, not one per critter the blast strikes
    a.mem.shrapnel = 1;
    const crowd = ctx.enemiesNear(me, a.x, a.y, 120 + 30 * level); // rank 1: 3 within 120, rank 2: 4 within 150
    if (crowd.length === 0) return; // a detonation with no enemy in range flings nothing
    crowd.sort((u, w) => (u.x - a.x) ** 2 + (u.y - a.y) ** 2 - ((w.x - a.x) ** 2 + (w.y - a.y) ** 2));
    for (let i = 0; i < Math.min(2 + level, crowd.length); i++) {
      const t = crowd[i]!;
      ctx.fire(me, 'shard', { x: a.x, y: a.y, angle: v.angleTo({ x: a.x, y: a.y }, t), speed: 220, damage: 6 });
    }
  },
};
```
Talent line in `src/content/talents/miner.ts`, placed directly after the `mine` talent line:
```ts
    { id: 'shrapnel', upgrade: 'shrapnel', max: 2, needs: [['mine', 2]] },
```

### Steps
1. In `src/content/palette.ts`: if an entry with value `#3bc9db` already exists (T0135 may have added a mine color), use its name everywhere below instead. Otherwise add `frost: '#3bc9db',` right after the `ice: '#99e9f2',` line, and use `PALETTE.frost`.
2. Create `src/content/projectiles/shard.ts` exactly as above.
3. Create `src/content/upgrades/shrapnel.ts` exactly as above.
4. Add the two registry lines to `src/content/projectiles/index.ts` (import after the `jab` line; list entry after `lashDart,`).
5. Add the two registry lines to `src/content/upgrades/index.ts` (import after the `scavenge` line; list entry after `lash,` — the closest cousin).
6. Add the talent line in `src/content/talents/miner.ts` after the `mine` line.
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- One fan per mine: the mine's pulse strikes every critter inside, and `onHit` runs per struck critter — the `a.mem.shrapnel` mark is what makes it once per mine (two different mines at the same spot are different area instances, so each fans). Do NOT use `a.slots[0]` (T0135 likely uses the mine's slots for its armed state) and do NOT dedupe with `me.mem` + `a.id` (entity ids wrap after 65535 and can be re-hand-out).
- The task's "Split, Lance, Wide and Quick do nothing to them" is not enforceable: the frozen engine adds the player's `shots`/`pierce`/`projectileSpeed` stats to every projectile a player fires (`engine/sim/match.ts` `fire`/`fireOne`). Shards therefore fan with Split, pierce with Lance and fly faster with Quick — exactly like Lash's darts and Ricochet bolts. Wide (an `area` stat) truly does nothing. Do not try to special-case the shard def; the acceptance criteria don't test these stats. Haste (cooldown stat) really does nothing, and the damage stat really scales the 6 — both automatic.
- `path()` must stay pure: only `s` and `t`; no `ctx`, no `Math.random`, no state. `s.speed` already includes the owner's projectileSpeed stat.
- Do not exclude `hit.target` from the crowd: the spec targets the 3 (4) nearest enemies of the blast, and a critter the circle hit can also be sharded. The owner is excluded for free — `enemiesNear` filters by team (it also returns enemy players, which is correct).
- Do not pass `pierce` or `life` in the fire opts: the def defaults (1 hit, 0.4 s) are the spec.
- `damage: 6` is pre-stat; `ctx.fire` multiplies by the damage stat — never pre-multiply.
- No new effect, audio, HUD or panel: the engine draws the shard and the talent panel shows the description (same length class as Lash's). T0137 owns the mine's sounds.

### Tests
none (no pure helpers; engine/tests/ exercises the upgrade and projectile in a real match automatically).
