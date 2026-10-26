---
id: T0044
title: The Grid — second boss
assignee: desktop-4070
size: L
priority: 1
status: designing
depends_on: [T0006]
attempts: 0
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-26T23:09:30Z
designer: desktop
---

## Goal
A second boss for late runs: The Grid, a rotating compass that sweeps damaging ink arms across the arena, giving runs a new endgame threat after The Frame.

## Details
- Reuse the existing boss infrastructure from The Frame (T0006): the same boss scheduling, the same `bossHpMultiplier` (+50% HP per respawn), the same boss health bar in the HUD, and the same boss-death handling (shard burst, respawn).
- Schedule: the boss schedule continues as it does today (a boss every 5 minutes, first at 5:00). From the second boss spawn onward, The Grid and The Frame alternate: 5:00 The Frame, 10:00 The Grid, 15:00 The Frame, 20:00 The Grid, and so on. The existing +50%-per-respawn HP scaling applies to each spawn exactly as it does today.
- Look: a large ink compass — a circle (radius 46) with a thick ink outline, a cross/needle through the center, and four short tick marks at the cardinal points. It rotates slowly (0.5 rad/s) as it moves.
- Behavior:
  - Drift: it moves slowly toward the player at speed 40, like a heavy presence; it does not charge or dash.
  - Signature attack — sweeping arms: every 4 s the Grid telegraphs for 0.5 s (it flashes red and a faint ink line hints at the arm path), then two opposite ink arms extend from its center and sweep a half-turn (180°) over 1.5 s. Each arm is a long thin ink rectangle, ~200 units long and 12 units thick. The arms deal 12 contact damage to the player, respecting the player's normal post-hit invulnerability window. After the sweep the arms retract and the 4 s cycle restarts.
  - No projectiles in this version — one clear attack only.
- Values: `hp: 400` (before the bossHpMultiplier), `speed: 40`, contact damage 12 (body and arms), radius 46.
- On its first appearance in a run, a "THE GRID" label flashes in the HUD (reuse the existing HUD flash style, like the RHYTHM flash).
- Add `gridKills: number` to the stats in `debug/testHook.ts`.
- Put the arm-sweep timing in a pure module (like `src/core/boss.ts`) and add a unit test in `tests/core/` for it: arms retracted at rest; the telegraph begins after the 4 s period; the sweep completes 1.5 s after it starts; then the cycle restarts.

## Acceptance criteria
- [ ] At 10:00 The Grid spawns as the second boss, with a health bar in the HUD; later boss spawns alternate Frame / Grid / Frame / Grid
- [ ] The Grid drifts slowly toward the player (speed 40) and rotates as it moves
- [ ] Every 4 s it telegraphs (0.5 s red flash + faint arm hint) and then sweeps two opposite ink arms 180° over 1.5 s; touching an arm deals 12 damage
- [ ] The Grid has 400 base HP and gains +50% HP per respawn, like The Frame
- [ ] On death it drops a shard burst and is handled by the normal boss-death path (including the large screen shake once T0040 exists)
- [ ] On its first appearance in a run, "THE GRID" flashes in the HUD
- [ ] `gridKills` is tracked in the debug stats
- [ ] Unit test for the arm-sweep timing in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass
