---
id: T0116
title: The Press — the fourth boss
assignee: asus
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T14:32:00Z
---

## Goal
The run's late act gets its own fight: The Press at the top of the page pushes a solid wall of ink down the page, and you shoot the wall to damage it while clearing the rows of type blocks it prints to pull the wall back — the arena closes in around the fight, so surviving the fourth boss takes space management, not just DPS.

## Details
- Rotation and slot: The Press is the fourth boss — the rotation becomes Frame → Grid → Palette → Press, then the cycle repeats with the existing +50% HP-per-respawn scaling (unchanged). In a standard run the first Press arrives at the fourth boss slot (20:00). It gets everything other bosses get for free: the 5 s boundary warning (T0070), the spawn sting (T0058), the "THE PRESS" nameplate on first sighting (T0064), and the 64 BPM boss-music hold (T0108).
- The wall (the boss body): a flat ink band, 70 units thick, spanning the full crop-safe width, with the standard hard paper-cut shadow. Its leading edge starts at the top of the crop-safe area and advances down at 1/150 of the safe-area height per second. The wall is solid: it blocks the player, enemies and projectiles alike. Unopposed, the wall crosses the safe area in about 60 s (base advance plus stamps); keeping the type-block rows cleared stretches that past 100 s.
- The stamp: every 5 s the Press stamps — a 1.0 s telegraph (a 2 u red rule draws along the leading edge, the Gutter telegraph idiom from T0099, plus the existing low thud; no new SFX), then the leading edge jumps down 1/20 of the safe height with a small screen shake (the smallest amplitude the T0040 shake system offers).
- Type blocks: 3 s after the Press lands it prints a row of 4 type blocks on the leading edge — flat grey squares, 24 units across, 30 HP each, 4 contact damage, placed at the 20%, 40%, 60% and 80% positions of the safe width. A new row prints every 9 s; a new row replaces any undestroyed old blocks (the old ones vanish — the Press reprints). When all 4 blocks of the current row are destroyed, the wall retracts upward by 1/16 of the safe height over 0.6 s.
- The blocks are boss parts, not enemies — like the Palette's swatches: targetable, take normal damage (crits and Underexposure apply as they do to the boss), give no XP or score, get no marginalia, and do not count against the 10-enemy regular pool.
- The wall is the body: any player projectile that hits the wall (any weapon, Orbit contacts included, Inkwell burst included) is absorbed and deals normal damage to the boss; the boss has 520 HP in the standard boss bar. Enemy projectiles also die on the wall's underside.
- Push and burn: the wall is a moving floor — if its leading edge catches the player or an enemy, it pushes them down. While the wall is in contact with the player, they burn 8 damage/s. Enemies are pushed, not damaged. If the leading edge reaches the bottom of the safe area it clamps there — the fight is decided by HP, not by outrunning the wall.
- The world adjusts while the Press is alive: the spawn director treats the region above the leading edge as off-limits to normal spawns (as it already does for the crop margin); the Gutter (T0099) sweeps only the free region below the wall; wall progress is expressed as a fraction of the crop-safe area, so the T0045 shrink (which can be active mid-fight) moves the wall's pixels, not its progress.
- Death: at 0 HP the band shatters — it breaks into 4–6 large flat ink fragments that drop 40–80 units and fade over 1 s — then the standard boss death plays (heavy shake, +50 score with the "+50" kill feed via the normal kill path, music release).
- No new HUD element, key or SFX.
- A pure `pressWall` timing module (advance rate, stamp cadence and jump, row cadence, retract rule, bottom clamp) with unit tests, in the same pattern as `gridSweep` (T0044) and `swatchCascade` (T0097); the boss-rotation test (T0061, as updated by T0097) is updated to the four-boss rotation in this task.

## Acceptance criteria
- [ ] The rotation is Frame → Grid → Palette → Press, then repeats with the existing +50% HP-per-respawn scaling; the first Press is the fourth boss (the 20:00 slot in a standard run); the boss-rotation test passes on the four-boss rotation.
- [ ] While The Press is alive, a 70 u ink band spans the crop-safe width, its leading edge starts at the top of the safe area and advances continuously; stand still and the wall reaches you, pushes you down, and burns 8 damage/s while in contact.
- [ ] Every 5 s the wall telegraphs for 1.0 s (red rule along the leading edge plus the existing low thud) and jumps down 1/20 of the safe height; a row of 4 grey type blocks (24 u, 30 HP) prints on the leading edge 3 s after spawn, then a new row every 9 s.
- [ ] Clearing all 4 blocks of the current row pulls the wall back up 1/16 of the safe height over 0.6 s; a new row replaces undestroyed old blocks.
- [ ] Projectiles that hit the wall are absorbed and damage the 520 HP boss in the standard bar; the "THE PRESS" nameplate, the 5 s warning, the spawn sting and the 64 BPM hold all fire.
- [ ] At 0 HP the band shatters into 4–6 ink fragments (40–80 u drop, fading over 1 s) and the standard boss death plays: +50 score with the "+50" kill feed, heavy shake, music release.
- [ ] `tests/core/press.test.ts` locks the pure timing: advance rate, stamp cadence and the 1/20 jump, row cadence, the 1/16 retract rule, and the bottom clamp.
- [ ] `npm run check` and `npm run smoke` pass.
