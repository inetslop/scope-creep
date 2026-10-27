---
id: T0114
title: "Warm Start — finish an 8:00+ run and the next run begins with one pick"
assignee: desktop-4070
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T13:48:11Z
---

## Goal
The first concrete step of the studio meta-progression: after any run of 8:00+, the next run starts with one random upgrade level already applied — a returning player walks in with an edge, and a first-time player can read the loop on the menu.

## Details
- Earning it: the moment the game-over card lands, if the run's clock reached 8:00 (480 s — exactly 480.0 arms it), a "warm start" flag is set and persisted between sessions, exactly like the saved best score (same persistence idiom as `src/core/bestScore.ts`). A run under 8:00 neither arms nor consumes anything.
- Spending it: the player's next run start consumes the flag and applies exactly one level of one upgrade at run start: a uniformly random id from the same 16-card `UPGRADES` pool the level-up roll uses, at level 1, applied through the same path as a normal pick — so it counts toward the card's max level, composes with later picks of the same card, and may be a weapon card (starting a run with Line, Orbit, Arc or Counterpoint is legal and fun). The pick is drawn with the run's seeded RNG, so a fixed seed reproduces the whole run, warm start included.
- The menu teaches it: one small ink line under the start button in the Menu scene (`src/scenes/Menu.ts`), Bauhaus small caps in the menu's existing style — while the flag is armed, "WARM START READY — NEXT RUN BEGINS WITH ONE PICK"; while unarmed, "FINISH AN 8:00+ RUN TO EARN A WARM START".
- The run announces it: the moment the run starts, a "WARM START — <UPGRADE NAME>" note prints in small caps in the HUD using the boss-nameplate idiom (T0064), fading over 2 s, so the player sees exactly what they got.
- The pick is a normal pick: it appears in The Index (T0104) on the pause screen, and later picks of the same card level it as usual (the existing roll rule that never offers a maxed card keeps it within the card's maxLevel).
- No new input, no new scene, no new content file, no new sound; the run timer, the score and the game-over card are unchanged.

## Acceptance criteria
- [ ] A run of 480 s or more arms the flag the moment the game-over card lands, and the menu line under the start button reads "WARM START READY — NEXT RUN BEGINS WITH ONE PICK" — and still does after a page reload.
- [ ] The next run starts with exactly one level of one random upgrade already applied: the "WARM START — <NAME>" note prints in the HUD for 2 s at run start, and the pick appears in The Index on the pause screen.
- [ ] Picking the same card later in the run levels it normally, never above its maxLevel; the warm-start pick may be any of the 16 cards, including weapon cards.
- [ ] A run under 480 s does not arm the flag; an armed flag is consumed by the next run whatever that run's outcome; after spending it the menu line reverts to "FINISH AN 8:00+ RUN TO EARN A WARM START".
- [ ] The same seed reproduces the same warm-start pick, and the existing upgrade-roll, spawn and boss tests stay green.
- [ ] `npm run check` and `npm run smoke` pass.
