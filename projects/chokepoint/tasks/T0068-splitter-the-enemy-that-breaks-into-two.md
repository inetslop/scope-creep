---
id: T0068
title: "Splitter: the enemy that breaks into two"
size: M
priority: 3
status: design
depends_on: [T0057]
attempts: 0
created: 2026-10-28T13:54:28Z
---

## Goal
Killing is not always winning: the Splitter dies into two smaller, faster enemies — the first enemy that fights back against being killed.

## Details
- **Closest existing enemy:** Dot (a plain small walker). **New:** it splits on death — no current enemy splits, and it turns a kill into a spawn.
- **The Splitter:** a round token 1.2× Dot's size in Dot's own color, with one thin crack line across its face in the road's white (the tell). It walks at 75% of Dot's speed with 3× Dot's hp and pays 2× Dot's kill gold.
- **The split:** on death from any damage source (a shot, a Beam per-second tick, an Ember tick, a Trap spring — whatever lands the killing blow), two splinters spawn on the road at the Splitter's position, one 0.25 cells ahead of it and one 0.25 cells behind. Each splinter is a small round token 0.6× Dot's size (no crack), with 0.5× Dot's hp, 1.25× Dot's speed, no split of its own, and each pays Dot's kill gold.
- **The Splitter's death is a normal kill:** it pays its gold, it triggers a Mint (T0021) if in range, it counts for "stopped", and it starts or continues the combo chain (T0031) — splinter kills within 1.5 s of the Splitter's death continue the same chain.
- **Wave mix:** from wave 9, the mix rolls one Splitter per 7 enemies (floor of count ÷ 7; a wave with under 7 enemies sends none; waves 1–8 never do). Splinters are not in any mix — they exist only as splits. The wave preview (T0015) counts Splitters among the wave's shapes once it is in.
- **Art:** chunky round token with a darker side face and soft shadow like the others; the crack is one thin road-white line across the face; splinters are the same token scaled down with no crack. No new colors beyond Dot's.
- Chained behind T0057 (Hauler) on purpose: new enemies land one at a time so the enemy system, the wave mix and the art settle between additions.

## Acceptance criteria
- [ ] From wave 9 some waves include Splitters — round tokens 1.2× Dot's size, Dot's color, one thin white crack across the face; before wave 9, none.
- [ ] Killing a Splitter by any damage source spawns two splinters (0.6× Dot's size, no crack) 0.25 cells either side of the kill position along the road, continuing at 1.25× Dot's speed.
- [ ] The Splitter's death pays its kill gold, counts as a kill (combo, "stopped", Mint) and a splinter killed within 1.5 s continues the combo chain.
- [ ] Splinters never split, whatever kills them; they are the only splinters on the board.
- [ ] A first-time player reads the Splitter as a bigger, cracked Dot before being told; the wave preview (once in) counts Splitters in the next wave's shapes.
