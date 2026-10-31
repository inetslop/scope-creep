---
id: T0043
title: "Chew: your Gush puddle deals damage to whatever stands in it"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T08:05:11Z
claimed_at: 2026-10-31T08:54:27Z
epic: E12
designer: desktop
---

## Goal
The Goober tree gets its 6th talent, under Gush: a Goo kill lays a puddle that bites, so killing a monster on top of someone is a fight move. The tree's deepest branch becomes zone denial.

## Details
- New upgrade `chew` in src/content/upgrades/chew.ts (an on-kill upgrade, like Gush's file), registered in the upgrades index with the other Goober upgrades.
- Text (shown on the talent): "Whatever stands in your Gush puddle takes 6 damage every 0.5 s. Per rank: +6 damage."
- maxLevel 3. Damage per tick by rank: 6, 12, 18 per 0.5 s.
- Every Gush puddle (the one a Goo kill lays) deals that damage on top of its slow, to whatever stands in it: monsters at full, players at half, like the player's other weapons.
- The puddle is refreshed while something stands in it, so it keeps biting for as long as they stay; walking out of it stops the ticks.
- What it does with every weapon: with Bolt, Maw and Lob, nothing — no Goo kill, no Gush puddle, nothing to bite (like Gush itself). With the Goo: its kills lay the biting puddle.
- Look: a Chew puddle is the same blue puddle as a plain Gush puddle, with little ink bubbles squishing once per tick. A squishing puddle is a puddle that hurts; a still one only slows.
- Talent line in src/content/talents/goober.ts: id `chew`, upgrade `chew`, max 3, needs [["gush", 3]], the new line after the `gush` line. The tree as the panel draws it (Cling, if already built, stays where it is):
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
        Chew (3, needs Gush 3)
      Scatter (1, needs Goo 3)
  ```
- What a Goober gets and what it costs: 8 points to the first rank (Reap 1, Goo 1, Gush 3, Chew 1) — the deepest commitment in the tree; Chew 3 is an 11-point zone-denial life. It matters in play now: in a crowd, killing a monster on top of a player lays a biting puddle under their feet, and holding a gem geyser spot with Goo kills keeps the spot hostile.

## Acceptance criteria
- [ ] The Goober tab in the talents panel shows a new Chew row under Gush with the text above; before Gush is at rank 3 the row says what it still needs.
- [ ] Chew 3 costs 3 points and only unlocks at Gush 3; the panel draws it under Gush.
- [ ] With Chew, a Goo kill lays a Gush puddle whose bubbles squish once every 0.5 s and deal 6/12/18 damage per tick by rank to whatever stands in it; without Chew the puddle only slows, exactly as before.
- [ ] A monster standing in the puddle takes the full ticks and keeps the puddle alive while it stays; a player standing in it takes half.
- [ ] Bolt, Maw and Lob kills lay no biting puddle: no Goo kill, no puddle at all.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect | acts on a hit; Chew acts on the ground a Goo kill left behind |
| Chill | makes a target slower | slows one target for a few seconds; Chew slows and damages everything that stands in a puddle for as long as it stays |
| Reap | an on-hit damage bonus | adds to a hit; Chew is a damage tick on a zone, not on a hit |
| Chomp | an on-kill reaction | heals the killer on a kill; Chew marks the kill spot so the ground keeps biting |
| Fuse | an on-kill that pops the kill into something | pops the kill into one ring that strikes once; Chew's puddle keeps striking everything that stands in it, refreshed while occupied |
| Scatter | an on-kill on a Goo | spawns shots at other enemies; Chew leaves the ground behind the kill hostile |
| Gush | a Goo kill lays a slow puddle | the puddle only slows; Chew makes that same puddle deal damage on a timer |
