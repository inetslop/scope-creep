---
id: T0003
title: "Lobber tree: a bubble that arcs in, a splash that marks the ground"
size: L
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T01:44:04Z
epic: E1
---

## Goal
A third playstyle: the Lobber tree grows a weapon that throws an arcing bubble which splashes where it lands. A player who holds a spot can clear a whole crowd with one splash — crowds become something to lure, not just outrun.

## Details
- New tree file `src/content/talents/lobber.ts`, listed in TREES (closest example: `src/content/talents/gunner.ts`). Name `Lobber`, description "Your bubble: it arcs in and splashes on the ground.", look: shape circle, color teal.
- The tree as the panel draws it:
  ```
  Quick (3)
    Lob (5, needs Quick 1)
      Wide (3, needs Lob 2)
      Fuse (1, needs Lob 4)
  ```
- Four new upgrades, new files in `src/content/upgrades/` (closest examples: `split.ts` for stats mods, `bolt.ts` for the weapon):
  1. `quick` — "Shots fly 15% faster, per rank." Stats: `projectileSpeed +0.15` per rank, `maxLevel: 3`. Works with every projectile weapon: Bolt bolts reach the enemy sooner; the Lob's bubble lands sooner (multiplicative per rank). A stat no existing upgrade raises.
  2. `lob` — the weapon. Text: "Every 1.1 s, throws a bubble at the nearest enemy. It splashes where it lands. Each rank: +2 splash damage." Cooldown 1.1 s; aims at the nearest enemy, monster or player, with no lead: the bubble lands where the enemy was when it left the hand. New projectile file `src/content/projectiles/bubble.ts` (closest example: `bolt.ts`): a soft ice bubble — a circle with an ink outline in cool ice, told apart at a glance from the spinning star. It rises in an arc and lands after 0.8 s (sooner with Quick), moving by a path computed from its launch (at most 1 per player alive, 4 with full Split). On landing it lays a splash: a field on the ground, radius 70, lasting 0.6 s, hitting everything inside every 0.15 s (4 hits), 10 damage per hit at rank 1, +2 per rank (18 at rank 5). The splash also hits players (half damage, as usual). Look: an ice ring pulses where it lands, and a faint ice circle stays on the ground for the field's 0.6 s.
  3. `wide` — "The splash is 20% bigger, per rank." Stats: `area +0.2` per rank, `maxLevel: 3`. Scales the radius of every area your weapons lay (Lob splash: 70 → 84 → 101 → 121 per rank). It needs Lob 2, so a point in Wide is never spent before the splash exists. A stat no existing upgrade raises.
  4. `fuse` — the capstone, `maxLevel: 1`. Text: "When your bubble kills something, it pops into a ring (radius 50) that deals 10 damage." On-kill: a kill by the splash deals 10 damage to everything in a radius-50 ring around the death spot (players half, as usual). Chains in a crowd: one splash pops, and the pop pops the neighbors. No existing upgrade has an on-kill effect.
- Every mod with the Lob: Haste (fires sooner), Might (+12% splash damage), Quick (lands sooner) and Wide (bigger splash) all apply. Split applies: each extra bubble lands 30 units to the side of the previous one, each with its own splash, 12% weaker per Split rank. The pierce stat does not apply: the bubble lands and splashes, it never flies through anything. Ricochet does not: the bubble never hits anything in flight, only its splash field does.
- What a Lobber player gets: an area playstyle — hold a gem pile or a choke and one splash clears a crowd, or lure monsters into a spot and drop a bubble on the pile. What it costs: a point in Quick before the first Lob (the Gunner's first point goes to Haste while the Bolt already fires); the splash is weak on a single target (10 per hit vs the Bolt's focus on one enemy); the bubble lands where the enemy was, so a kiting enemy walks out of it — a Lobber must stand still or hit crowds, and standing still in a monster crowd is a real risk.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gunner | a weapon that fires at the nearest enemy | The Gunner's bolt flies straight and stops at the first enemy it hits; the Lobber's bubble lands on the ground and splashes in a circle — it hits a group, and it lands where the enemy was, not where it is: a position game, not an aim game |
| Body | a tree of plain stats | Body has no weapon of its own and its stats help any weapon; the Lobber has its own weapon (Lob) and a shape built around it: Quick first, then the weapon, then a fork of Wide (bigger splashes) and the Fuse capstone (kills that pop) |

Per new upgrade:
- Quick — a new stats row (`projectileSpeed`, no existing upgrade raises it):
  | Existing | What it shares | What the new one does that it can't (not numbers) |
  | --- | --- | --- |
  | Haste | makes the weapon feel snappier | Haste fires sooner (how often you shoot); Quick makes each shot arrive sooner (how fast it flies) — a faster bubble can be dodged, a shorter cooldown can't be |
- Lob — a weapon, one row for the only existing weapon:
  | Existing | What it shares | What the new one does that it can't (not numbers) |
  | --- | --- | --- |
  | Bolt | a weapon that fires at the nearest enemy | A bolt flies straight, hits one enemy, and stops; a bubble lands on the ground and splashes in a circle — it hits a group, and it lands where the enemy was, not where it is |
- Wide — a new stats row (`area`, no existing upgrade raises it):
  | Existing | What it shares | What the new one does that it can't (not numbers) |
  | --- | --- | --- |
  | (none) | — | No existing upgrade changes the size of an area; Wide opens the splash game by making every area your weapons lay bigger |
- Fuse — the first on-hit/on-kill effect besides the existing one:
  | Existing | What it shares | What the new one does that it can't (not numbers) |
  | --- | --- | --- |
  | Ricochet | an effect that runs on the player's weapon | Ricochet fires on a hit and bounces the bolt to one nearby enemy; Fuse fires on a kill and damages everything in a ring around the death spot — it chains a crowd into one kill |

## Acceptance criteria
- [ ] The talents panel (pulsing button / T key) has a third tab, "Lobber", circle icon in teal, with the description "Your bubble: it arcs in and splashes on the ground."
- [ ] A level 3 player (2 points) has Quick 1 and Lob 1 and fires a bubble at the nearest enemy (monster or player) every 1.1 s.
- [ ] The bubble arcs for 0.8 s and lands where the enemy was when it fired — a kiting enemy can walk out of it; each Quick rank lands it visibly sooner.
- [ ] On landing: an ice ring pulse and a faint ice circle on the ground for 0.6 s; a monster inside takes 10 damage every 0.15 s (4 hits), +2 per hit per Lob rank.
- [ ] The splash also hurts a player inside (half damage, as usual).
- [ ] With Wide, the splash circle is visibly bigger per rank (70 → 84 → 101 → 121).
- [ ] At Lob 4 plus a point in Fuse: when the splash kills a monster, a pop ring (50) deals 10 to everything inside, and a neighbor monster it hits can die in turn.
- [ ] Split from the Gunner tree applies to the Lob: each extra bubble lands 30 units to the side of the previous one, each with its own splash, 12% weaker per Split rank.
- [ ] The Gunner and Body trees are unchanged; the game starts and plays normally.

## Design (architect, desktop)

### Files
- create `src/content/projectiles/bubble.ts` — the Lob's bubble: a `ProjectileDef` (pure arcing `path`, `onEnd` lays the splash); also exports `BUBBLE_SPEED = 500`, `BUBBLE_FLIGHT = 0.8` (used by lob.ts).
- create `src/content/areas/splash.ts` — the splash `AreaDef`: radius 70, life 0.6, interval 0.15, look `{ shape: 'circle', color: PALETTE.ice }` (the engine's default area draw is the "faint ice circle"; no custom draw), `pulse` strikes and marks.
- create `src/content/effects/splash-ring.ts` — `EffectDef` `splash-ring` (duration 0.45): an ice ring with ink rim blooming to `fx.value`; used for both the landing pulse and the Fuse pop.
- create `src/content/upgrades/quick.ts` — stats `{ projectileSpeed: 0.15 }`, maxLevel 3, look diamond/blue.
- create `src/content/upgrades/lob.ts` — weapon: `cooldown: 1.1`, look circle/teal, description exactly "Every 1.1 s, throws a bubble at the nearest enemy. It splashes where it lands. Each rank: +2 splash damage.".
- create `src/content/upgrades/wide.ts` — stats `{ area: 0.2 }`, maxLevel 3, look hexagon/teal, description "The splash is 20% bigger, per rank.".
- create `src/content/upgrades/fuse.ts` — capstone maxLevel 1, look star/ice, description "When your bubble kills something, it pops into a ring (radius 50) that deals 10 damage.", `onKill` hook.
- create `src/content/talents/lobber.ts` — `TalentTreeDef` Lobber: description "Your bubble: it arcs in and splashes on the ground.", look circle/teal, talents: `quick` max 3; `lob` max 5 needs `[['quick',1]]`; `wide` max 3 needs `[['lob',2]]`; `fuse` max 1 needs `[['lob',4]]` (each line after its parent).
- edit `src/content/projectiles/index.ts` — import `bubble`; add `bubble,` after `bolt,` in PROJECTILES.
- edit `src/content/areas/index.ts` — import `splash`; AREAS becomes `[splash]` (first area in the game).
- edit `src/content/effects/index.ts` — import `splashRing`; add `splashRing,` between `ring,` and `burst,`.
- edit `src/content/upgrades/index.ts` — add the four imports in alphabetical position; in UPGRADES add `lob,` after `bolt,` (weapons), `fuse,` after `ricochet,` (capstones), `quick,` and `wide,` in the stats group after `swift,`.
- edit `src/content/talents/index.ts` — import `lobber`; add `lobber,` after `body,` (tab order = TREES order, so Lobber is the third tab).

### Interfaces
No existing type changes; everything uses existing `engine/api.ts` types. The decision-heavy hooks:

```ts
// bubble.ts
path(s: Launch, t: number) { // pure: only s and t (SPEED/FLIGHT/ARC are module consts)
  const ty = Math.floor(s.p2 / 8);                 // p2 = targetY*8 + (lobLevel-1), see Steps
  const d = Math.hypot(s.p1 - s.x, ty - s.y);      // throw distance = distance to target
  const f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT)); // s.speed already has the projectileSpeed stat: Quick lands sooner
  return { x: s.x + Math.cos(s.angle) * d * f, y: s.y + Math.sin(s.angle) * d * f - ARC * Math.sin(Math.PI * f) }; // ARC = 80: rises, and sin(PI*f)=0 so it lands exactly on aim
}
onEnd(ctx: Ctx, p: Projectile) { // runs when life runs out = the landing
  const me = p.owner;
  if (me.type !== 'player') return;
  const level = (p.launch.p2 % 8) + 1;
  ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) }); // engine multiplies damage by the owner's damage stat once: Might and Split's -12% land here
  ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area));
}

// lob.ts fire
fire(ctx: Ctx, me: Player, level: number) {
  const target = ctx.nearestEnemy(me, 420); // monster or player
  if (!target) return;
  ctx.fire(me, 'bubble', { angle: v.angleTo(me, target), speed: BUBBLE_SPEED, damage: 0, life: BUBBLE_FLIGHT / me.stats.projectileSpeed, p1: Math.round(target.x), p2: Math.round(target.y) * 8 + (level - 1) });
}

// splash.ts pulse
pulse(ctx: Ctx, a: Area) {
  for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) { u.mem.splashAt = ctx.time; ctx.strike(a, u); } // strike: full damage to monsters, half to players (pvp.damageMul), credits kills to the owner
}

// fuse.ts onKill
onKill(ctx: Ctx, me: Player, _level: number, victim: Unit) {
  if (ctx.time - (victim.mem.splashAt ?? -99) > 0.4) return; // only kills by the splash pop; the window is one splash tick + margin
  for (const u of ctx.enemiesNear(me, victim.x, victim.y, 50)) ctx.damage(u, 10, me); // plain damage: no stat, no re-mark -> chain is bounded by the splash's 0.6 s
  ctx.effect('splash-ring', { x: victim.x, y: victim.y }, undefined, 50);
}
```

### Steps
1. `bubble.ts`: consts + `ProjectileDef` exactly as Interfaces. `pierce: 99` on the def. The engine collides every projectile with units in flight; `damage: 0` makes those contacts do nothing (engine `damage()` no-ops on 0) and pierce 99 means the first contact can't kill the bubble, so the splash always lands.
2. `splash.ts` and `splash-ring.ts` as above. Effect draw must not throw for `value: 12, t: 0` (engine test) — `if (r <= 0) return;` before drawing; no glow/gradients, ink rim + `PALETTE.ice` only.
3. The four upgrades, then `lobber.ts`, copying the shapes of `haste.ts` (stats), `bolt.ts` (weapon), `ricochet.ts` (on-kill capstone), `gunner.ts` (tree).
4. The five registry edits, exactly the lines listed.
5. `npm run check`, then `npm run smoke`.

### Pitfalls
- The Split offset: flight direction must come from `s.angle` and distance from p1/p2 — if the path flies toward p1/p2 instead, all fanned Split copies converge on one point. The engine fans copies 0.16 rad apart (frozen), so landings sit ≈0.16×distance apart (≈30 at 190, up to ≈67 at the 420 aim); full Split (shots 2) makes 3 copies, engine-decided.
- `life: BUBBLE_FLIGHT / me.stats.projectileSpeed` in fire() is what makes Quick land the splash sooner; a fixed 0.8 s life breaks that acceptance criterion.
- Never pass `p.damage` to `ctx.area` (the bubble's is 0); the base damage comes from the p2 pack: `p2 = targetY*8 + (level-1)` fits because 4000*8+4 = 32004 < 32768; decode `Math.floor(s.p2 / 8)`.
- Don't double-apply the damage stat (engine multiplies area damage by `stats.damage` once — that is where Might/Split must land).
- Without the `mem.splashAt` gate, Fuse pops on every credited kill (bolt kills in hybrid builds); without the 0.4 s window and plain `ctx.damage`, the pop chain can run away.
- Wide radii are 70/84/98/112 (the engine stat is additive, 1 + 0.2·rank); the task's 101/121 are compounded numbers the frozen stat model can't produce — "visibly bigger per rank" holds.
- No HUD, menu, `rules.ts` or `palette.ts` changes: the talents panel (src/hud/talentTree.ts) renders every tree generically — third tab, teal circle icon, and all text appear automatically. Fullest panel state: 3 tab chips ("Gunner", "Body", "Lobber" + icon + spent, max "12"), title "Lobber · 12 points", the 46-char description, 4 rows with up to 5 pips, the 104-char Lob description (wraps to ~3 lines at 412x915, 1–2 at 1280x720), one "Needs Lob 4" line, "17 to spend" in the header; existing CSS already wraps and flows — never edit base.css or another part's CSS.
- No `Math.random`/`Date`/`performance` in src/content (lint); `Math.sin/hypot` in path are fine. File name must equal item id (test-enforced).

### Tests
- none — engine/tests/ auto-covers every new item (data checks, path purity and finiteness, effect draw at t 0/0.5/1, each upgrade at max level in a 20 s match, tree reachability, 60-player budget).
