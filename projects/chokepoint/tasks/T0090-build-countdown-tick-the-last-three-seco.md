---
id: T0090
title: "Build countdown tick: the last three seconds are audible"
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T00:51:07Z
claimed_at: 2026-10-29T00:59:13Z
epic: E1
designer: yoga
---

## Goal
The last three seconds of every build break are audible — one soft blip per second — so a player mid-thought hears the wave coming without reading the number, and the break's price (Send, T0077) sits next to its ticking.

## Details
- The build countdown's last three whole seconds — the number going 3, then 2, then 1 — each play one soft blip the moment the number changes: the tier chime's lowest note (T0032, 80 ms, volume 0.1), so no new sound is needed. No blip at 4, 5, … and none at 0: the wave banner (T0067) takes over the moment the wave starts.
- The blip follows the countdown's own clock: pausing the game stops the countdown and the blips together, and resuming continues where it left off. Fast-forward (T0019) is wave-phase only, so it never touches the tick.
- If the wave is started early (Send, T0077), the tick stops with the phase change — the moment of sending plays no extra blip.
- No input, no new HUD element, no pause-screen line: a sound on an element that already exists, nothing new to teach (pillar 8).

## Acceptance criteria
- [ ] Every build countdown's last three whole seconds (the number going 3, 2, 1) each play one soft blip on the number change; seconds four and up are silent, and the wave start itself plays no blip.
- [ ] The blip is the quiet class — at most the tier chime's 0.1 volume, never louder than the UI blip — and the pause sound-off (T0035) silences it.
- [ ] Pausing during the last three seconds stops the blips with the countdown; resuming continues the count and the blips exactly where it left off.
- [ ] Starting the wave early (the Send button, once in) plays no extra blip, and the wave banner is unchanged.
- [ ] No new key, button, HUD element or pause-screen line.
