---
id: T0064
title: Boss nameplate intro
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T03:07:33Z
claimed_at: 2026-10-27T03:27:41Z
designer: desktop
---

## Goal
The first time each boss spawns in a run, its name is printed in small caps near the top of the page and fades out over 2 s — the player learns who they are fighting, landing on top of the T0058 boss sting.

## Details
- When The Frame first spawns in a run, the text "THE FRAME" is printed horizontally centered near the top of the page, in clean geometric small caps, ink color, and fades out linearly (opacity 1 → 0) over 2.0 s, then is removed.
- When The Grid first spawns in a run, the same treatment with "THE GRID".
- Take the name from the boss's existing content data (the FRAME/GRID registry), not a hardcoded string — a future third boss should get its nameplate for free.
- First appearance only: later respawns of the same boss (the +50% HP ones) show no nameplate. The T0058 boss sting still plays on every spawn — no new audio here.
- Placement: top of the page, centered, clearly above the boss health bar and clear of the HUD readouts (note: T0054, on desktop-4070, is adding a "SCORE n" readout to the HUD — re-read the HUD scene before editing and keep both clear). It is decorative only: no input blocking, no pointer events.
- Text style should match the existing HUD/flash labels (same type as the "RHYTHM" flash / marginalia labels); it should scale with the rest of the HUD on mobile.
- No new art, no new SFX, no new scene.

## Acceptance criteria
- [ ] The first Frame spawn of a run prints "THE FRAME" top-center and it is fully faded within ~2 s; the first Grid spawn of a run prints "THE GRID" the same way.
- [ ] Second and later spawns of the same boss show no nameplate, and the T0058 boss sting still plays on those respawns.
- [ ] The nameplate never overlaps the boss health bar or the HUD readouts and does not block input.
- [ ] `npm run check` and `npm run smoke` pass.
