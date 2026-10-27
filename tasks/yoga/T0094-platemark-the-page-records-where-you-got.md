---
id: T0094
title: Platemark — the page records where you got hurt
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T08:45:39Z
---

## Goal
The moment you take a hit, a small red × prints on the paper at your position and fades over 2 s — the page itself records where you got hurt, so a close fight leaves a readable history of your worst moments.

## Details
- When the player takes a discrete hit — enemy contact, an enemy bullet, a boss attack — a small red × (two crossed red strokes, about 16 units wide, PALETTE.red, flat Bauhaus strokes — no glow, no gradient) prints at the player's current position.
- The × is stationary: it stays where it printed (it does not follow the player) and fades out linearly over 2 s, then is removed.
- At most one × prints per 0.5 s — further hits inside the window are suppressed (the player can be hit often). The continuous crop burn (T0045, 5 hp/s) prints no ×s at all; only discrete hits do.
- Pool cap of 12 ×s on screen: when the cap is hit the oldest × is dropped early (nearest patterns: the damage-numbers pool cap of 60 from T0004, and the crit ring from T0019).
- The marks sit on the paper below the gameplay art, do not block input, and do not obscure the player's circle.
- No damage, no gameplay effect, no input, no new scene — pure juice in the Fx system (nearest examples: `FxSystem.critRing()` from T0019 and the floating damage numbers from T0004).

## Acceptance criteria
- [ ] Taking a hit from an enemy (contact or bullet) or a boss prints a small red × at your position that stays in place and fades over 2 s.
- [ ] Two hits within 0.5 s print only one ×; standing in the crop burn prints none.
- [ ] At most 12 ×s are on screen at once, with the oldest dropped early beyond the cap.
- [ ] The ×s render below the gameplay art and never obscure the player's circle or block input.
