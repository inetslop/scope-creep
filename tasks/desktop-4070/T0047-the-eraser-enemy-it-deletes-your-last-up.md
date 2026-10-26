---
id: T0047
title: The Eraser enemy — it deletes your last upgrade
assignee: desktop-4070
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T23:43:51Z
---

## Goal
A late-run paper-white rectangle that punishes greed: on contact it erases the upgrade level you picked most recently, with an "ERASED" flash. The page itself becomes hostile to your build.

## Details
- New enemy content file `src/content/enemies/eraser.ts` (copy the structure of `src/content/enemies/slab.ts`) and register it in `src/content/enemies/index.ts` in unlock order (after `pinwheel`, at 180 s) with the import in alphabetical order.
- Look: a small paper-white (paperLight) rectangle with a thick ink outline, radius 13, slow wobble rotation (0.5 rad/s). It is a rectangle wider than it is tall (about 2:1) — add a new shape if the shape system has no rectangle. It reads as a clean white block on the warm paper: the only enemy that is not a primary color.
- Stats: hp 40, speed 55, xp 6, threat 3, spawnWeight 2, unlockAtSec 180, knockbackResist 0.4, behavior `chase`.
- Contact behavior (new, not damage): when it touches the player and the player has at least one upgrade level, the most recent single upgrade level is removed — e.g. Rhythm level 3 becomes Rhythm level 2; if the last pick was a granted weapon (Line, Orbit or Arc), that weapon is removed instead. The starting Point weapon is never erased. Removed effects stop applying immediately. A small all-caps "ERASED" flash appears in the HUD (reuse the RHYTHM streak-flash pattern), a soft paper-tear SFX plays, and the Eraser crumples into paper fragments and dies (dropping its 6 XP).
- The erase respects the player's normal post-hit invulnerability window — one erase per contact window, never two from the same touch.
- If the player has no upgrade levels at all, contact deals 8 damage instead (so it is never free) and the Eraser survives.
- RunState (or wherever the upgrade stack lives) must remember the order upgrades were applied this run and support removing the most recent one, recomputing derived stats. The level-up UI and any other display of owned upgrades must reflect the removal, and a removed upgrade becomes offerable again at the next level-up.
- Marginalia note for the first encounter: "TAKES YOUR LAST UPGRADE".

## Acceptance criteria
- [ ] The Eraser never spawns before 180 s and appears in the spawn pool after (covered by the existing spawn unlock test).
- [ ] On first encounter, the marginalia note "TAKES YOUR LAST UPGRADE" fades in beside it.
- [ ] When it touches a player who has upgrades, the last-picked upgrade level is removed, its effects stop applying immediately, "ERASED" flashes in the HUD, and the Eraser crumples and dies.
- [ ] When it touches a player with no upgrades, the player takes 8 damage and the Eraser survives.
- [ ] The Eraser can be shot down at 40 hp and drops 6 XP.
- [ ] After an erase, the removed upgrade is offerable again at the next level-up.
