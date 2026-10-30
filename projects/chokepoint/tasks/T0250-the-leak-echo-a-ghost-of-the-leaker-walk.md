---
id: T0250
title: "The leak echo: a ghost of the leaker walks back up the road"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T01:33:38Z
claimed_at: 2026-10-30T01:40:36Z
designer: desktop
---

## Goal
When an enemy leaks, a ghost of it walks back up the road from the exit, so the player sees exactly which enemy got through — the exit warning and the jolt never say that.

## Details
- The moment an enemy leaks (reaches the exit), one ghost of its token spawns at the exit: the leaker's exact shape, color and size at 40% alpha — no health bar, no chips or marks, no interaction. It can never be targeted, hit or affected by anything.
- The ghost walks backward along the road (toward the entrance) at a constant 2.5 cells/s for 2.0 s, then fades out over 0.5 s — about 5 cells of road in 2.5 s total. It is display-only: it pays no gold, costs no life, triggers no leak warning, never counts in the wave's enemy total, and never feeds Mint, Toll or the combo.
- At most 3 ghosts on the board at once; a leak while three are alive skips the echo. Ghosts are live-wave transients: a resumed run shows none.
- No new sound (the leak's jolt and the warning's tick already carry the moment), no new input, no HUD element: the ghost is a board transient like the wave's last-kill ring (T0229) — it replaces nothing and leaves the board exactly as it was when it fades.
- A new leak-hook file on the comboBreak pattern (src/systems/enemyHooks/comboBreak.ts, registered in the hook index): the hook spawns the ghost, which reuses the enemy token's painter at the ghost's alpha. The leak's own effects (life, gold, jolt, warning, combo break, Toll payment) are untouched.

## Acceptance criteria
- [ ] Every leak spawns one ghost of the leaker's token at the exit (same shape, color and size as on board, 40% alpha) that walks toward the entrance at a steady speed for 2.0 s and fades over 0.5 s; the leak's life cost, gold, jolt, warning, combo break and Toll payment are byte-identical to before.
- [ ] The ghost is inert: no tower targets or hits it, it triggers no warning, the next-wave button's count and the wave's flow are unchanged, and a run resumed after a leak shows no ghost.
- [ ] A run in which four enemies leak in quick succession shows at most 3 ghosts at once; a run that leaks at least once passes the desktop and mobile smoke tests.
