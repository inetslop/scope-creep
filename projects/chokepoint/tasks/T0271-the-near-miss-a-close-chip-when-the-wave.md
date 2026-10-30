---
id: T0271
title: "The near miss: a 'close' chip when the wave's last kill stops an enemy at the exit"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T09:22:16Z
---

## Goal
A wave won by a hair is felt as a hair: when the last enemy of a wave is killed a short distance from the exit, the board says "close," so the player feels how much that wave just cost — the leak warning (T0014) teaches the danger before, the chip names it after.

## Details
- When a wave ends because its final enemy is killed (its death is what ends the wave — no further enemy alive or still to come) and that enemy's death spot was within 1.5 cells of the exit, one small "close" chip pops above the kill spot and holds for ~1 s, then fades. The chip is the new-enemy name tag's chip look (T0085) with the word "close" in muted ink.
- The distance is the remaining road distance the killed enemy still had to walk to the exit gate — the same quantity the leak warning (T0014) turns into its 3 s estimate. Within 1.5 cells is a near miss; farther is not.
- The chip is the only addition. The wave's existing last-kill ring (T0229) plays exactly as it does today, and the exit's clean/leak treatment is unchanged. No sound, no input, no new card.
- A wave that ends on a leak (its final enemy gets through) shows no chip.
- The chip is transient (clears on its own). If two waves in a row end in near misses, each shows its own chip at its own kill spot.
- It is a board chip, so it shows identically on desktop and mobile and is not a HUD element.

## Acceptance criteria
- [ ] A wave whose final enemy is killed within 1.5 road-cells of the exit shows one small "close" chip above the kill spot for ~1 s; the last-kill ring (T0229) is unchanged.
- [ ] A wave whose final enemy is killed farther than 1.5 cells from the exit shows no chip.
- [ ] A wave that ends on a leak shows no chip.
- [ ] No sound, no input, no new HUD card or line; the board is otherwise unchanged.
