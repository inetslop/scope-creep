---
title: "Players grow with their level: twice as big by level 18"
size: M
priority: 1
---

## Goal
A strong player looks strong: the critter grows as it levels up, so everyone can read who is ahead at a glance, and the leader is a bigger target.

## Details
- A director (src/content/directors/growth.ts) sets every living player's radius each tick from their level: `rules.player.radius * (1 + (level - 1) / 17)`. Level 1 stays as today (18), level 10 is about 27.5, level 17 about 34.9, and level 18 would be 36; a prestige (level 18 sends a player back to level 1) and a knockout make them small again.
- Smooth: the radius moves toward that size over about 0.5 s (a level-up never pops it in one frame), and a prestige shrinks it the same way.
- The engine follows a player's radius everywhere (hits, contact with monsters, pickups, the walls, the name and the hp bar), so nothing else needs changing. Check the content for anything that assumes `rules.player.radius` as the size of a player (an area or effect sized to a player) and use the player's own radius there.
- Hats and other accessories already scale with the radius.

## Acceptance criteria
- [ ] A level 1 player is the size it is today; a level 17 player is almost twice as wide.
- [ ] Growing and shrinking (after a prestige or a knockout) are smooth, never a jump.
- [ ] Monsters, shots and pickups touch a grown player at its new edge.
