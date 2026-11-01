---
id: T0346
title: "The flyer's line before the wave: the build phase shows where it crosses"
size: M
priority: 2
status: designing
depends_on: [T0317]
attempts: 0
created: 2026-11-01T07:42:15Z
claimed_at: 2026-11-01T07:42:19Z
epic: E10
designer: desktop
---

## Goal
The Flyer (T0317) punishes a build that only covers the road, but its route is telegraphed at the wave's start — after the build is done. The build phase before the flyer's wave shows the flyer's route on the board, so the cover for the crossing is chosen in the build, not learned at the wave's door.

## Details
- **When:** during the build phase, whenever the next wave's plan declares the Flyer as its boss (today: wave 50, exactly one Flyer). The decision is a pure function of the plan — no run state, no save field: a resumed run that enters the build phase before the flyer's wave shows the line, and an Iron run shows it too. When the regular Flyer enters the wave mix (E10's next slice), that task extends this element to the mix waves it introduces; this task stays exact to the boss wave.
- **What:** the flyer's own first line — the board's seeded route (T0317's `flyRouteFor`) from the off-board spawn point to the exit gate, in the telegraph's own shape: 2 px, the flyer's red, ~50% alpha (T0317's wave-start line; the telegraph is the enemy's own language, the Dasher's). The bank's line is not shown: the bank is the wave's own beat, telegraphed in-wave by T0317.
- **Life:** the line is up for the whole build phase — it appears when the build phase opens (after the draft, and on a resume into the build) — and the moment the wave starts (the countdown ending or the early send), it fades out over 0.3 s and is destroyed; T0317's wave-start telegraph continues the same line for its 3 s, so the route reads from the build through the crossing's start and leaves no mark.
- **Nothing else:** no HUD card, no chip, no sound, no input, no change to the preview card (the boss chip and the tag's teach line already name the wave; the line is the new information). The board's own draw is untouched — the line is a scene object at the telegraph's depth, on the pattern of T0317's flyLine hook and the ExitWarning system.
- **Why the screen has room (board bar):** it is not a painted hint, teach or mark — it is the enemy's own route, a transient telegraph in the enemy's own language (the Dasher's stop, T0317's wave-start line), the same class as the range ring while placing (Pillar 1): a line that exists to inform a placement, gone the moment the placement is made.

## Acceptance criteria
- [ ] The build phase before wave 50 shows the flyer's route on the board (the spawn → exit line, the flyer's red, 2 px, ~50% alpha); every other build phase shows no line, and the board is otherwise byte-identical.
- [ ] The line is up for the whole build phase — it is there when the build opens after the draft, and when a resume enters the build before the flyer's wave — and it follows the board's seeded route (same seed, same line, the T0317 route).
- [ ] The moment the wave starts (the countdown ending or the early send), the line fades out over 0.3 s and is gone; T0317's wave-start telegraph continues the same line for its 3 s, and no line or mark remains after it.
- [ ] Unit test on the gate: the pure plan check is true for the wave-50 plan and false for the wave-49 and wave-51 plans (the seeded plans stay byte-identical, and no other wave plan declares the Flyer).
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass (the line is on the board, so no card fit is needed).
