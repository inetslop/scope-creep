---
id: T0045
title: "Crop marks — the arena shrinks after 12:00"
assignee: desktop-4070
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-26T23:11:30Z
designer: desktop-4070
---

## Goal
Late-run pressure with a print-shop theme: after 12:00 the page gets cropped — the safe area slowly shrinks toward the center, and standing in the cropped margin burns you, forcing late-game fights to the middle of the sheet.

## Details
- Timing (put it in a pure module, like `src/core/boss.ts`): before 720 s (12:00) the safe area is 100% of the arena. From 720 s to 1020 s (17:00) the safe fraction shrinks linearly from 1.0 to 0.7. From 1020 s onward it stays at 0.7. The safe area is always the arena rectangle scaled about its center.
- Visuals: the cropped margin (outside the safe rectangle) is a slightly darker paper tone. At the four corners of the safe rectangle sit crop marks — small L-shaped ink marks (like the registration marks on a printed page), 24 units long per leg, 3 units thick, ink color. The marks move inward as the safe area shrinks.
- Player damage: while any part of the player is outside the safe rectangle, they burn for 5 damage per second. This is a continuous burn (apply 5 × dt per frame), it does NOT use the post-hit invulnerability window, and it does not shake the screen. While burning, a small red damage number pops every 0.5 s so the drain is readable.
- Enemies, bullets, shards and bosses are unaffected by the margin — only the player burns.
- At 12:00, a "CROPPING" label flashes in the HUD (reuse the existing HUD flash style, like the RHYTHM flash).
- Add `cropDamageTaken: number` to the stats in `debug/testHook.ts`.
- Unit test in `tests/core/` for the shrink schedule: safe fraction is 1.0 at 719 s, strictly between 0.7 and 1.0 at 870 s, and exactly 0.7 at 1020 s and 1200 s.

## Acceptance criteria
- [ ] Before 12:00 the full arena is safe: no crop marks, no margin, no burn
- [ ] At 12:00 "CROPPING" flashes in the HUD and crop-mark corners appear at the arena edges
- [ ] The safe area shrinks steadily and reaches 70% of the arena at 17:00, then holds; the crop marks track the safe-area corners the whole time
- [ ] Standing in the cropped margin drains 5 HP/s with a small red damage number every 0.5 s; leaving the margin stops the drain immediately
- [ ] Enemies and the boss are unaffected by the margin
- [ ] `cropDamageTaken` is tracked in the debug stats
- [ ] Unit test for the shrink schedule in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass
