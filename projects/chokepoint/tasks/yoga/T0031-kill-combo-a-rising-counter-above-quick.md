---
id: T0031
title: "Kill combo: a rising counter above quick kills"
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T06:24:55Z
claimed_at: 2026-10-28T06:37:10Z
designer: yoga
---

## Goal
Quick kills feel chainable: a small rising ×N counter above rapid kills makes a burst from a Splash, a Lance line or a fast volley read as one moment.

## Details
- One change: where the kill chip burst is created (the baseline kill FX — the rounded chips; confirm the exact file and line when you start, it is in the kill path in `src/systems/`), track a kill chain and draw the counter:
  - Chain rule: a kill within 1.5 s of the previous kill continues the chain; any gap of 1.5 s or more resets it to zero. The chain counts kills, not enemies.
  - Look: from chain count 2 up, a small counter floats above the latest kill's chip position: "×2", then "×3", "×4"... Each new step: the counter moves 8 px up from where the previous step sat, and the number pops (scale 1.2 → 1.0 over about 150 ms — the same pop the HUD coin tally uses, T0017). Style: bold rounded 14 px type, muted ink (board text ink, not a HUD color — this lives on the board, not in a card).
  - Fade: when the chain ends (no kill for 1.5 s), the counter fades out over about 400 ms; the next quick pair starts again at ×2.
  - World space: the counter sits where the chip burst happens, at board scale, so it pans and zooms with the board exactly like the chips.
- No new sound (the kill chip sound already plays per kill), no new input, no HUD change.
- Closest example: the coin-tally pop in the HUD StatsCard (T0017) for the 1.2 → 1.0 scale pop; the kill chip burst for the anchor position.

## Acceptance criteria
- [ ] Two kills within 1.5 s: "×2" appears above the second kill's chips, bold 14 px, popping from 1.2 → 1.0; a third kill within 1.5 s of the second shows "×3" 8 px higher.
- [ ] No kill for 1.5 s: the counter fades out over about 400 ms, and the next quick pair starts again at ×2.
- [ ] A single isolated kill shows no counter at all.
- [ ] The counter is in world space: panning or zooming the board moves it with the chips; no HUD element is touched.
