---
id: T0080
title: "Snare: a Goober talent, your Gush puddles sap whatever stands in them"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T13:48:21Z
epic: E17
---

## Goal
After a first prestige this life, the Goober tree opens a second fork under Gush: Snare turns the Goo's puddle from a slow into a mark — sapped critters take more damage from you, so a Goober life picks a direction, Chew (the zone fights alone) or Snare (the zone feeds every weapon you have).

## Details
- New on-hit upgrade "Snare" in src/content/upgrades/ (closest example: reap.ts — an on-hit that reads a state on the target).
- Panel text: "After 1 prestige this life. Whatever stands in your Gush puddle is sapped: it takes 15% more damage from you, per rank +10%."
- maxLevel 3: hits on a sapped critter deal +15% (rank 1), +25% (rank 2), +35% (rank 3).
- New status "Sapped": 1 s, refreshed while the critter stands in a Gush puddle (closest example: Slosh, refreshed in the plain puddle). Both puddle variants lay it — the plain Gush puddle and the Chew puddle — on monsters and players in it. One Sapped per critter: a second puddle refreshes it, never stacks it.
- Readable in a crowd: a sapped critter wears a small blue drop on its upper back (ink outline, Goo's color) — a new field area with no hitbox (closest example: the splat on a Cling mark). Blue is a player-weapon color, so a monster wearing it reads as marked by a player's zone, not as a new monster.
- Works with every weapon and area: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Horn's dart, Slush's blob and puddle, and your own Gush puddle tick all deal the bonus on a sapped critter. It works on players too: a sapped player takes the bonus from your hits, at the usual half damage.
- The Gush puddle's own numbers do not change: 40 units (+10 per Gush rank), 20% slow, 1.5 s; Chew's 6 damage per 0.5 s is untouched.
- Talent line: id snare, upgrade snare, max 3, needs [["gush", 1]], points 3, prestige 1 — in the Goober tree (closest example: slush's line in the Lobber tree).
- The tree as the panel will draw it:
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
        Snare (3, needs Gush 1, points 3, prestige 1)
        Chew (3, needs Gush 3)
      Cling (3, needs Goo 2)
      Scatter (1, needs Goo 3)
  ```
- What it costs: 3 points after Reap 1, Goo 1, Gush 1, plus a prestige this life; those 3 points could instead take Gush 2-3 (a wider puddle) or reach Chew.
- Why it passes the prestige bar: it opens only once your Gush puddle exists in a second life, and it only amplifies what the zone already does — a fresh level-1 player cannot reach it and it never hands back level-17 power.

## Acceptance criteria
- [ ] After 1 prestige this life the Goober tab shows Snare under Gush with its text; before a prestige it shows what it still needs.
- [ ] A monster standing in your Gush puddle shows the blue drop on its back; it fades about 1 s after it leaves, and standing back in refreshes it.
- [ ] Rank 1: a Goo that deals 18 hits the same sapped monster for 21 (15% more, within rounding); the same hit on an unsapped monster is still 18.
- [ ] The bonus works with more than one weapon in one life: e.g. your Bolt and your Gush puddle tick both land the bonus on a sapped critter.
- [ ] A sapped player takes the bonus from your hits and shows the drop too.
- [ ] Two overlapping Gush puddles do not stack the bonus.
- [ ] A Goober without Snare lays the same puddle with the same numbers — slow only, no drop.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit | Ricochet bounces a bolt on to another enemy; Snare makes your hits on a sapped critter deal more damage |
| Reckless | an on-hit that pays on a state | Reckless pays while you are hurt; Snare pays while the target stands in your puddle |
| Chill | an on-hit that marks the target | Chill slows whatever it hits (movement, any source); Sapped changes damage taken and only your puddle lays it |
| Reap | an on-hit that reads the target's state | Reap pays on any target already below half hp; Snare pays only on a target your own Gush puddle sapped |
| Swarm | an on-hit that scales with a count | Swarm adds flat damage per enemy around the target; Snare adds a percentage to one marked target, made by your zone |
| Mend | an on-hit that heals you | Mend heals you on a Nerve hit; Snare adds damage to your hits on a sapped critter, with any weapon |
| Cling | an on-hit, Goo only | Cling makes a Goo hit splat on its target and ride it; Snare makes a Goo kill's puddle mark what stands in it |
| Gush | the puddle it turns | Gush lays a slow puddle where a Goo kills; Snare turns that puddle into a damage mark |
| Chew | the same puddle | Chew makes the puddle deal its own damage every 0.5 s; Snare makes whatever the puddle saps take more damage from you |
