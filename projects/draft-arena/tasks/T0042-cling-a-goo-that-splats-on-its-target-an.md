---
id: T0042
title: "Cling: a Goo that splats on its target and rides it"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T08:05:11Z
epic: E12
---

## Goal
The Goober tree gets its 5th talent: a Goo that hits doesn't just pop — it splats on its target and keeps biting while it rides it, so a Goober build marks one target and melts it while it runs. Under Goo the tree forks: sticky (Cling), zone (Gush) or scatter (the capstone).

## Details
- New upgrade `cling` in src/content/upgrades/cling.ts (an on-hit upgrade, like Reap's file), registered in the upgrades index with the other Goober upgrades.
- Text (shown on the talent): "When your Goo hits, it splats on its target and clings for 2 s, dealing 5 damage every 0.5 s. Per rank: +5 damage per tick."
- maxLevel 3. Tick damage per rank: 5, 10, 15 per 0.5 s; the cling lasts 2 s (4 ticks) at every rank.
- What it does with every weapon: with Bolt, Maw and Lob, nothing — only the Goo's drop splats (the tree's own weapon is the point, like Gush and Scatter only fire on a Goo kill). With the Goo: on hit, the drop splats.
- One splat per target; a new Goo hit on the same target refreshes the 2 s, it never stacks.
- The cling ticks are hits: Reap's bonus applies to them.
- Against a player the ticks deal half damage, like the player's other weapons.
- Look: a small blue drop with an ink rim that sits on the target's back and squishes once per tick; it rides a moving target all the way (a fleeing Flee takes the ticks while it runs). Cool blue, so it reads as a player's mark, and smaller than the Goo in flight so it is told apart at a glance from the shot and from a monster's orange glob.
- Alive at once: at most one splat per target, at most 3 per player (the Goo fires every 1.6 s and a splat lasts 2 s; Haste 3 allows the third). Each is a mark on the target, not a projectile.
- Talent line in src/content/talents/goober.ts: id `cling`, upgrade `cling`, max 3, needs [["goo", 2]], the new line after the `gush` line. The tree as the panel draws it:
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
      Cling (3, needs Goo 2)
      Scatter (1, needs Goo 3)
  ```
- What a Goober gets and what it costs: 6 points in the tree (Reap 1, Goo 2, Cling 3) — the same points could finish Gush 3 (slow puddles) or Scatter (the capstone). Cling is the single-target direction of the fork: one marked critter takes 20/40/60 extra damage per Goo hit while it lives.

## Acceptance criteria
- [ ] The Goober tab in the talents panel shows a new Cling row under Goo with the text above; before Goo is at rank 2 the row says what it still needs.
- [ ] Cling 3 costs 3 points and only unlocks at Goo 2; the panel draws it under Goo, next to Gush and Scatter.
- [ ] A Goo hit leaves a blue splat on the target that squishes once every 0.5 s and deals 5/10/15 damage per tick by rank, for 2 s; a new Goo hit on the same target refreshes it.
- [ ] The splat rides a moving target: a Flee that sprints away takes the ticks all the way; against a player the ticks deal half damage.
- [ ] A tick on a target below half hp gets Reap's bonus; Bolt, Maw and Lob hits leave no splat; Scatter's mini-Goo leave no splat.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect that reacts to a weapon's hit | sends the shot bouncing on to a second enemy once; Cling keeps hitting the same target for seconds while it rides it |
| Chill | an on-hit status that sits on the target | slows the target's movement for a few seconds; Cling deals damage on a timer and the splat rides the target, so it bites a fleeing Flee all the way |
| Reap | an on-hit damage bonus on the target | adds to each hit once; Cling creates new hits that keep coming while the target is alive |
| Chomp | an on-kill reaction | fires only on a kill; Cling fires on every Goo hit, kill or not |
| Fuse | an on-kill that pops the kill into something | needs a kill and makes one ring on the ground; Cling needs a hit and sticks to the target itself |
| Scatter | an on-kill on a Goo | needs a kill and spawns new shots at other enemies; Cling needs a hit and adds damage to the one it already caught |
| Gush | an on-kill on a Goo that marks the ground | leaves a puddle where the kill happened; Cling marks the target itself, wherever it runs |
