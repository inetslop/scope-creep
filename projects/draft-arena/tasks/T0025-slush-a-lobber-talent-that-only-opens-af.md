---
id: T0025
title: "Slush: a Lobber talent that only opens after a prestige this life"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T05:24:06Z
epic: E7
---

## Goal
Prestiging is worth it within a life: after a player's first prestige this life, the Lobber tree opens a new talent, Slush — a zone weapon no first-life player can ever build, so a second life grows into a control playstyle the others never see.

## Details
- One new weapon upgrade **Slush** (its own file in src/content/upgrades/), one new ground area **the slush puddle** (its own file in src/content/areas/), one new status **slush** (slowed, its own file in src/content/statuses/), and one new talent line in the Lobber tree (src/content/talents/lobber.ts).
- Text on the talent row: "Every 1.6 s, if an enemy is within 240, throws a slush blob that lands and leaves a puddle (radius 40, 2.5 s). Anything in it is slowed 20% and struck for 4 damage every 0.5 s. Per rank: +2 strike damage, +0.5 s puddle life." maxLevel 3. Look: shape circle, color ice.
- Aims and moves like Lob: it throws at the nearest enemy within 240 world units (waits if there is none); the blob arcs like a bubble — a slightly flatter arc — and never hits in flight; where it lands it leaves the puddle. No burst splash damage: the throw's whole payload is the puddle.
- Ranks: rank 1 strikes for 4, the puddle lasts 2.5 s; rank 2 strikes for 6, 3.0 s; rank 3 strikes for 8, 3.5 s. The slow is 20% at every rank.
- The blob: a small flatter ice circle than the bubble, about 9 units wide, ink outline, a small white shine on top — a blob, not a bubble, tellable at a glance.
- The puddle: a pale ice patch on the ground, an ellipse about the puddle's radius across, a wavy ink edge and two small white shines; it fades in over 0.3 s and out over 0.3 s. It tells itself apart from a bubble's splash (a bright short field with a blooming ring — the puddle is paler, has no ring, and stays 2.5–4 s) and from a Snail's sticky patch (orange).
- The puddle acts every 0.5 s on everything standing in it, monsters and players alike: 4 damage per rank (strikes hit other players at half damage, like every other weapon hit) and the slush status — 20% slower, refreshed for 0.5 s while the critter stays in it, so the slow ends within 0.5 s of leaving, exactly like Mired.
- The talent line, in the Lobber tree file: id `slush`, upgrade slush, max 3, needs [["lob", 1]], points 2, prestige 1 — only a player with 1 or more prestiges this life can take it; a knockout resets prestiges this life, so the talent locks again after death.
- The tree as the panel will draw it:
  ```
  Quick (3)
    Lob (5, needs Quick 1)
      Wide (3, needs Lob 2)
      Fuse (1, needs Lob 4)
      Slush (3, needs Lob 1, 2 points in the tree, 1 prestige this life)
  ```
- What a Lobber player gets and what it costs: Slush 1 needs Lob 1 and 2 points already spent in the tree, so it lands around level 4 of a second life (the first point comes at level 2); ranks 2 and 3 cost 5 and 6 points in the tree, pulling points away from Wide (a bigger splash) and Fuse (the kill capstone) — a control build instead of a damage build. A first-life player never takes it: prestiging is what opens the third way to play Lobber.
- The prestige bar: right after the prestige the player is at level 1 with only the free Bolt — Slush is still locked behind Lob 1 and 2 points, so the reward opens a path the player must still earn point by point; it never hands back the power the reset took.
- Which mods apply to the Slush blob and puddle:
  - Haste: yes, it fires 8% sooner per rank, like every weapon.
  - Quick: yes, the blob flies 15% faster per rank and lands sooner.
  - Split: yes, one more blob fanned per rank, all strikes 12% weaker.
  - Might: yes, +12% to the puddle strike per rank.
  - Chill: yes, its on-hit runs on the puddle's strikes, so a chilled critter in the puddle carries the chill slow on top of the slush slow (slows multiply, like Mired and Chill already do).
  - Chomp: yes, as for every kill — a puddle strike that kills a monster heals 5 hp (25 on a player knockout).
  - Wide: no — it sizes the bubble's splash, not the puddle.
  - Lance: no — the blob never hits in flight, so pierce has nothing to pierce (as with the bubble).
  - Ricochet: no — it bounces Bolts only.
  - Fuse: no — it pops on a bubble's kills, not on the puddle's strikes.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires at the nearest enemy | leaves a zone on the ground that keeps striking and slowing anything that walks into it for seconds, with no line of sight; a bolt vanishes on hit |
| Maw | a weapon that acts on close enemies | reaches out to 240 and arcs over anything in between, and its effect persists after the throw; Maw is an instant bite in front |
| Lob | a Lobber throw that arcs to the ground | no burst splash: instead of one strike where it lands it leaves a lasting slow-and-damage puddle that punishes standing still and funnels players around it |
| Chill | a slow on a target | Chill is a ticking status on whatever got hit; the puddle is a place — any new target that stands in it is slowed for as long as it stays |
| Fuse | a second effect around a Lobber kill | Fuse is a one-shot ring on a bubble's kill; the puddle is the primary payload of its own throw and works whether or not it kills |
| Wide | sizes a Lobber ground effect | Wide sizes the bubble's splash; the puddle is its own area and Wide leaves it alone |

## Acceptance criteria
- [ ] A player with 1 prestige this life sees **Slush** in the Lobber tab of the talents panel: it shows "needs Lob 1" and "2 points in the tree" until met, and it can be taken; a player with 0 prestiges this life sees the prestige requirement on it and cannot take it, ever, in a first life.
- [ ] With Slush 1, the critter throws an ice blob at the nearest enemy within 240 every 1.6 s; where it lands, a pale puddle (radius 40, 2.5 s) slows whatever stands in it by 20% and strikes for 4 every 0.5 s; rank 3: strikes for 8, puddle 3.5 s.
- [ ] The puddle's strikes hit other players at half damage, and the slow applies to players too: a player standing in it moves at 80% speed.
- [ ] The blob and the puddle tell apart at a glance in a crowd: a flatter ice circle (not a bubble), a pale patch without a ring (not a splash), not orange (not a sticky patch).
- [ ] Haste, Quick, Split, Might, Chill and Chomp all work with Slush as listed; Wide, Lance, Ricochet and Fuse do not.
- [ ] Knock out a Slush player: in the new life the talent is locked on the prestige again.
- [ ] No new HUD element: Slush shows only in the existing talents panel.
