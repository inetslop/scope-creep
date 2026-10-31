---
id: T0003
title: "Lobber tree: a bubble that arcs in, a splash that marks the ground"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T01:44:04Z
claimed_at: 2026-10-31T01:44:08Z
epic: E1
designer: desktop
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
