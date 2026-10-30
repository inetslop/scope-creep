---
id: T0257
title: "The preview says boss: the every-10 plan's tag, the preview chip, the teach line and the banner chip"
size: S
priority: 2
status: design
depends_on: [T0253]
attempts: 0
created: 2026-10-30T05:08:57Z
epic: E5
---

## Goal
The player sees the boss coming before the wave starts: every 10th wave wears a "boss" tag in the build-phase preview and on the wave banner, taught once — E5's "the wave preview (T0015) shows it coming".

## Details
- **The tag (src/core/waves.ts):** the boss plan branch (T0253's `isBossWave` early return) carries `tags: ['boss']` — today it is `tags: []`, "no tag in this slice". The tag lives on the boss branch, so it follows whatever the branch sends (T0259's wave-20 Titan wears it with no change here).
- **The preview chip (src/ui/hud/NextWavePreview.ts):** while the next wave is a boss wave, one small "boss" chip beside the token row — the "tight" chip's own look, size and position (its closest example, in the same file) in the boss's own purple, muted the same way the other tag chips are muted.
- **The teach line (same file, T0092's pattern):** the first boss wave's preview shows one muted line under the card: "boss: one big shape instead of a crowd" — the file's TEACH table plus its `teachLine()` derivation from the run's state. Shown only while the run has not yet held a boss wave: wave 20's and 30's previews do not show it, and a resumed run past wave 10 never does.
- **The banner chip (the wave banner card — src/ui/hud/WaveBanner.ts, or src/ui/hud/topBanner.ts, whichever one holds the "quiet" and "tight" chip T0080 added):** a boss wave's banner reads "Wave 10 · boss" — the chip beside the number, T0080's pattern, the same muted purple.
- No new keys, no new card; the pause screen's controls are unchanged.

## Acceptance criteria
- [ ] The build-phase preview before wave 10 (and 20, 30, …) shows the boss token row and a muted purple "boss" chip; the preview before every non-boss wave is byte-identical to today.
- [ ] Wave 10's preview in a fresh run shows the teach line "boss: one big shape instead of a crowd" under the card, once; wave 20's preview does not show it, and a resumed run past wave 10 never does.
- [ ] A boss wave's banner reads "Wave 10 · boss" with the chip beside the number (T0080's pattern); every untagged wave's banner is byte-identical to today.
- [ ] The chip and the teach line fit their cards at 412x915 and 1280x720; the pause screen is unchanged.
