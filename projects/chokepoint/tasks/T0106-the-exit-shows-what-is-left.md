---
id: T0106
title: The exit shows what is left
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:35:30Z
designer: yoga
---

## Goal
A board readout where the wave ends: a small white chip above the exit gate counts the enemies still alive or still to come this wave, so the wave's size is seen at the exit and the last few going through are watched.

## Details
- During a wave, a small white rounded chip — the name tag's chip look (T0085: rounded white card, bold muted-ink text) — sits just above the exit gate, at the spot the leak warning already paints its copy (T0014), holding one muted-gray number about 14 px: the enemies still alive on the board plus the enemies still to come this wave (the wave's own plan, the T0015/T0079 read — plan total minus killed minus leaked).
- Hidden (not painted at all) when the count reaches 0, between waves (build phase, draft), and under the pause overlay.
- A board-space element (it scales with the board like the leak warning, not like the HUD cards), so it sits right at 412x915 and 1280x720 alike; it never collides with the leak warning's pulsing red copy.
- No rule change, no input, no sound; a new HUD file on the ExitWarning pattern (T0014), so it lands in its own file.

## Acceptance criteria
- [ ] During a wave, the chip above the exit gate shows plan total − killed − leaked (e.g. a wave of 5 with 2 killed and 1 leaked shows 2).
- [ ] The chip disappears the moment the count reaches 0, during the build phase, during the draft, and under the pause overlay.
- [ ] The number updates live as enemies spawn, die and leak; the wave's actual composition, gold and bonus are untouched.
- [ ] At both resolutions the chip sits just above the gate and never overlaps the leak warning's pulsing copy.
