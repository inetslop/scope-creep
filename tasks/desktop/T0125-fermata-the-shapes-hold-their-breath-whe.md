---
id: T0125
title: Fermata — the shapes hold their breath when you pick
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T15:42:50Z
claimed_at: 2026-10-27T16:06:54Z
designer: desktop-4070
---

## Goal
The level-up is the one moment a run stops to ask you a question — it should feel like a held breath: when the game resumes after you pick a card, every shape on the page holds still for 0.6 s while you can already move and fire.

## Details
- The trigger: the moment a level-up card is confirmed — the same moment the level-up pulse fires (T0102) and The Index updates (T0104).
- The hold: from the moment the game resumes after the pick, for exactly 0.6 s: every enemy (normal, elite and boss minion), every enemy bullet, and the boss and its parts stop where they are. Boss attack timers pause too — The Grid's arms freeze mid-sweep, The Frame halts mid-charge, The Press's wall and stamp telegraph stop, The Palette's swatches stop falling — and every pattern resumes exactly where it left off when the hold ends (no repeated telegraphs, no skipped strikes, no boss state desync).
- The page keeps breathing: the player moves and fires normally during the hold; player bullets fly and can kill frozen enemies; shards, the Gutter's sweep (T0099), the Crop's shrink (T0045), the run clock, the music and the Inkwell all advance normally. No new enemies or bosses spawn during the hold — the spawner holds with the shapes.
- Two quick picks in a row (a shard burst) give one fresh 0.6 s from the later pick — the hold never stacks or extends.
- No extra art, sound, HUD, key or scene for the hold itself: you move and everything else is still, and that is the legibility. The hold timing (start, retrigger, expiry) is a small pure state with a unit test.

## Acceptance criteria
- [ ] Picking any level-up card: from the moment the game resumes, all enemies, enemy bullets, and the boss and its parts are motionless for exactly 0.6 s, after which everything resumes.
- [ ] During the hold the player moves and fires; a fired projectile flies and can kill a frozen enemy; shards and active hazards (the Gutter) keep moving; the run timer and music keep running.
- [ ] A boss mid-pattern holds: The Grid's arms are frozen mid-sweep and resume exactly where they left off; the same for The Frame's charge and The Press's wall/stamp.
- [ ] Two picks in quick succession give one fresh 0.6 s hold from the later pick, never stacking; no new HUD element, key, sound or scene is added; `npm run check` and `npm run smoke` pass on desktop and mobile.
