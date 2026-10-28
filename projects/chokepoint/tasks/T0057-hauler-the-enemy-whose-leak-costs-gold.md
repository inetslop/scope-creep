---
id: T0057
title: "Hauler: the enemy whose leak costs gold"
size: M
priority: 2
status: designing
depends_on: [T0046, T0053]
attempts: 0
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T15:35:48Z
design_attempts: 1
designer: cachyos-x8664
---

## Goal
A big slow walker with a small fortune inside: killing it pays a few slots' worth in one pop, and letting it through costs gold as well as a life — the first enemy worth more dead than alive, and the first whose leak costs gold.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **What is new:** the economy — no enemy today costs anything but a life when it leaks, and none pays more than a few gold when killed; the Hauler makes a wave's gold a two-way risk.
- **Look:** a fat round token — a round shape no current enemy has — about 1.3× Block's size (the Mute's size class, a different silhouette), with the usual darker side face and soft shadow. Color: deep purple (check the content folder; if purple is taken by a landed enemy — the Dasher, T0046 — take the next free warm color, preferring a darker shade of it so the Hauler reads as its own token next to the Sprinter's orange; the Hauler stays warm: red, orange or purple).
- **Stats:** Block's speed, 3× Block's hp. Kills pay 10 gold (a few slots' worth for one kill) in the normal gold pop. It takes everything that works today — shots, beams, roots, pushes, marks, burns — including Mark's bonus damage.
- **Leak:** a leaking Hauler costs 1 life and 5 gold (gold never goes below 0), and the cost is seen where it happens: a small red "−5" pops at the exit with the usual leak jolt, next to the life-loss feedback.
- **Waves:** the Hauler enters the mix from wave 9 — one Hauler on waves 9, 13, 17, 21, … (one every 4 waves), added to the wave's existing spawns and walking in with the wave's normal groups; no wave is made of only Haulers. When the wave preview (T0015) shows the next wave's enemies, the Hauler appears in it by shape and count, like any other enemy.
- Otherwise plain: it does not dash, split, heal, jam or speed up — it just walks, is tough, and is worth more dead than alive.

## Acceptance criteria
- [ ] A new "Hauler" enemy exists (a big round token, distinct from the other six enemy shapes) and walks the road at Block's speed.
- [ ] From wave 9, waves 9, 13, 17, … each include exactly one Hauler in addition to the wave's usual enemies.
- [ ] The Hauler has 3× Block's hp, and killing it pays 10 gold in the gold pop.
- [ ] A leaking Hauler costs 1 life and 5 gold (gold floors at 0), with a red "−5" pop at the exit alongside the usual leak feedback.
- [ ] The existing enemies, the wave preview's layout, sounds and the HUD are otherwise unchanged; works at 412x915 and 1280x720.
