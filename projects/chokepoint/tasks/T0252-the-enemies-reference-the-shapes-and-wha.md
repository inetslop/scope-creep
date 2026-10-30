---
id: T0252
title: "The enemies reference: the shapes and what they do, off the pause"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T02:57:28Z
claimed_at: 2026-10-30T03:03:23Z
designer: inet-racing
---

## Goal
A reference for the shapes at any pause: one screen that shows every enemy with its token, name, description and the wave it comes from — the shape that just got through is readable at the next pause, and a first-time player can learn the road's occupants before the run does it for them. Groundwork for E5's bosses: the screen reads the enemy content, so a boss added later shows up here with no change to it.

## Details
- The pause card gains one new "Enemies" button: the same white 240-wide button as Resume/Quit/Sound (T0245's column), its own row after the Sound row; the card's height comes from its content as T0245 built it, so it still fits.
- Tapping it opens a new screen — a new scene file in the codex's pattern (T0221): the dim shade, one white rounded card, a bold "Enemies" title, and a "Back" button that returns to the pause card. The run stays paused while it is open.
- One row per enemy in the game's enemy content, in fromWave order: the enemy's on-board token at ~2x the wave preview's size (~32 px), its name in bold ink, its description (the content's own line, verbatim) in muted ink, and a muted "wave N" for its fromWave. The one that never walks in on its own (the Splinter) reads "from a Splitter" instead of a wave.
- The screen is data-driven off the enemy content: a new enemy added later (including E5's boss) shows up with no change to this screen.
- The pause's controls list (T0245's CONTROLS list) gains its line: "Enemies — the shapes and what they do".
- No gameplay change: nothing the screen shows is ever written back; the screen is read-only over the content.

## Acceptance criteria
- [ ] The pause card shows the "Enemies" button in the other buttons' style, the card still fits its content, and the controls list names the button.
- [ ] It opens the white card over the dimmed pause with the "Enemies" title, the rows as specified, and a "Back" button that returns to the pause card with the run still paused.
- [ ] One row per enemy in the content, in fromWave order, each with the token (~32 px), the bold name, the content's description and "wave N" (the split-piece's row reads "from a Splitter").
- [ ] The card fits without scrolling or overlapping text at 412x915 and 1280x720.
- [ ] A normal run is byte-identical: no new HUD element, no board mark, no new input, no change to waves, gold or resume.
