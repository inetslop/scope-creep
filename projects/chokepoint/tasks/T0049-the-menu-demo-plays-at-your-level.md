---
id: T0049
title: The menu demo plays at your level
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T12:01:28Z
claimed_at: 2026-10-28T12:22:23Z
epic: E1
designer: baby-mama
---

## Goal
The menu's live demo shows how hard the game has gotten for this player: it plays a wave from around their saved best wave instead of always an early one.

## Details
- The menu's autoplay demo currently plays an early wave. Change it to play a wave of the same difficulty as the player's saved best wave (bestWave from the profile), using the same wave-escalation the game uses (enemy hp, speed and counts for that wave number).
- The demo's wave number is a pure function of bestWave: demo wave = bestWave, clamped to at least 1. So a player whose best is wave 12 sees a wave-12-strength demo.
- If the player has no saved best wave yet (a first-time player), the demo plays the current early wave, exactly as today — no change.
- It stays a demo: no input, no cards, no lives lost, nothing written to the profile, and it loops as it does now — only the wave's difficulty follows the saved best.
- No new UI or HUD element: the demo board looks exactly like the real board, just at the player's level.

## Acceptance criteria
- [ ] A player whose saved best wave is N (N ≥ 2) sees the menu demo playing a wave of roughly wave-N difficulty (escalated enemy hp/speed/counts), not the early wave.
- [ ] A first-time player (no saved best wave) sees the unchanged early-wave demo.
- [ ] The same saved best wave always produces the same demo difficulty (it is a pure function of bestWave).
- [ ] The demo still autoplays with no input, loops, and never writes to the profile.
