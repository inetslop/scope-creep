---
id: T0140
title: Settings — the pause screen gets a SETTINGS card
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T19:37:42Z
claimed_at: 2026-10-27T20:40:53Z
designer: desktop
---

## Goal
The game should fit the room and the thumbs: music on or off, sound effects on or off, screen shake on or off, and hold-to-fire or always-fire — all remembered between runs. This is the "Settings" line of roadmap M4.

## Details
- A SETTINGS card on the pause screen in the ink idiom of The Index and the controls card (T0104/T0123): a small-caps "SETTINGS" header, 200 px wide, four rows. Each row: a small-caps label on the left and two small flat ink toggle buttons on the right — the active one filled ink with paper-color text, the inactive one outlined. At 1280x720 the card sits in the left column beside the buttons (below The Index / the controls card, wherever it fits without overlap); at 412x915 the pause cards stack between the title and Resume and everything still fits without scrolling.
- Rows:
  1. "MUSIC" — OFF / ON: the generative score (T0011). The existing M key toggles the same state, and the row and the key always stay in sync in both directions.
  2. "SFX" — OFF / ON: all sound effects. A new key N toggles the same state; the N line is listed on the pause controls card (T0123) the way M is.
  3. "SHAKE" — OFF / ON: ON (the default) is today's screen shake (T0040); OFF makes the camera completely still — no jolt on heavy deaths, nothing else changes.
  4. "FIRE" — MANUAL / AUTO: MANUAL (the default) is today's hold-aim-to-fire. AUTO fires continuously as soon as the volley cooldown allows, in the current aim direction — the mouse on desktop, the right stick on gamepad and touch (with the aim stick released, the last aim direction holds).
- Persistence: all four states in localStorage (the bestScore/warmStart try/catch pattern, one key per setting), surviving restarts and page reloads. First-launch defaults: MUSIC ON, SFX ON, SHAKE ON, FIRE MANUAL.
- Toggling a row plays the existing menu button tick (no new sound).
- No new scene.

## Acceptance criteria
- [ ] The pause screen shows a SETTINGS card with MUSIC, SFX, SHAKE and FIRE rows, each with two flat ink toggle buttons (active filled, inactive outlined), laid out for 1280x720 and 412x915 without overlap or scrolling.
- [ ] Toggling a row takes effect immediately (the score stops/starts, SFX gate, camera still, fire mode) and is remembered after a restart and a page reload.
- [ ] First launch defaults to MUSIC ON, SFX ON, SHAKE ON, FIRE MANUAL; with FIRE AUTO the player fires continuously without holding the aim input, and MANUAL requires the aim hold exactly as before.
- [ ] The M key and the MUSIC row toggle the same state in both directions; the new N key toggles SFX and is listed on the pause controls card the way M is.
- [ ] No new scene and no new sound (the existing button tick plays on a toggle).
