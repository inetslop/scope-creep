---
id: T0121
title: "Spectrum — the Palette's colors leak into your fire"
assignee: cachyos-x8664
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
The third in the boss-payout line: for 8 s after The Palette (T0097) dies, your volleys print in the five swatch colors — the boss's palette leaks into your fire.

## Details
- The moment The Palette dies: a small-caps "SPECTRUM" note flashes in the HUD in the style of the RHYTHM flash (T0014), and an 8-second window opens.
- While the window is open, every projectile your volleys fire prints in the five swatch colors — red, orange, yellow, green, blue — in the same order as the Palette's swatches, cycling one color per projectile fired: the first projectile after the death is red, the next orange, and so on, wrapping back to red.
- Color is a tint only: projectile size, damage, speed, pierce, knockback and lifetime are all unchanged; hit flashes and damage numbers stay as they are.
- The color is decided at fire time: a projectile already in flight keeps the color it was printed with. At exactly 8 s, newly fired projectiles print in normal ink again.
- A second Palette death in the same run (respawns come with the +50% HP scaling) restarts the 8 s window and reprints the note.
- No new HUD element beyond the one flash note; no keys, no scene, no sound. The other bosses' deaths change nothing.

## Acceptance criteria
- [ ] The moment The Palette dies, a "SPECTRUM" note flashes in the HUD and your volleys print in the five swatch colors (red, orange, yellow, green, blue, one per projectile, wrapping) for exactly 8 s, after which newly fired projectiles print in normal ink again.
- [ ] Colored projectiles behave exactly like normal ones: same size, damage, speed, pierce and lifetime.
- [ ] A second Palette death in the same run restarts the 8 s window and reprints the note; killing The Frame or The Grid does nothing.
- [ ] No new HUD element, key, scene or sound is added; `npm run check` and `npm run smoke` pass.
