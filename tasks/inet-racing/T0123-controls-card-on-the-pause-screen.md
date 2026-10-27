---
id: T0123
title: Controls card on the pause screen
assignee: inet-racing
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T15:27:21Z
claimed_at: 2026-10-27T15:38:31Z
designer: yoga
---

## Goal
Nothing in the game tells the player that M mutes, P pauses or 1/2/3 pick a level-up card. The pause screen gets a small "CONTROLS" card that lists every input for the device the player is using, so the controls are always one pause away.

## Details
- One card on the pause screen, titled "CONTROLS" in small caps, drawn in the same ink type and size as The Index column's header and lines (T0104), with a thin ink rule under the title. Flat Bauhaus style: ink text on the paper, no box glow, no gradients.
- It lists the inputs for the device the game last saw input from (the `device` the input layer already tracks: keyboard, gamepad or touch), one line each, key first and action second:
  - Keyboard and mouse: "WASD / Arrows — move", "Mouse — aim", "Hold left click — fire", "Esc / P — pause", "M — mute", "1 / 2 / 3 — pick a card".
  - Gamepad: "Left stick — move", "Right stick — aim and fire", "R2 — fire".
  - Touch: "Left thumb — move", "Right thumb — aim and fire", "II button — pause".
- Layout:
  - Landscape (width 760 and up, the breakpoint The Index and the level-up cards use): 200 wide, mirroring The Index. It sits 28 px left of the centered buttons, top-aligned with The Index.
  - Portrait (412x915): between the PAUSED title and the Resume button. If it does not fit, move the title up (no higher than 18% of the height) rather than shrinking the text below The Index's size.
  - It must not overlap the title, the buttons or The Index at 1280x720 or 412x915. It does not take input, so the buttons keep working.
- Only `src/scenes/PauseScene.ts` changes. Other machines are editing GameScene, HudScene and MenuScene right now, so the menu hint is left for a follow-up task.

## Acceptance criteria
- [ ] Pausing after playing with keyboard and mouse shows the six keyboard lines; after touch input it shows the three touch lines; after gamepad input it shows the three gamepad lines.
- [ ] At 1280x720 the card sits left of the buttons, mirroring The Index on the right; at 412x915 it sits between the title and Resume; nothing overlaps in either.
- [ ] Resume, Quit to menu, Esc and P still work, and The Index is unchanged.
- [ ] The diff touches only `src/scenes/PauseScene.ts` (plus a unit test, if the architect adds a pure helper in `src/core/`).
