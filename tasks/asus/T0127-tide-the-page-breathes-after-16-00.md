---
id: T0127
title: "Tide — the page breathes after 16:00"
assignee: asus
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T16:34:21Z
---

## Goal
After 16:00 the crop-safe boundary itself becomes a hazard — an ink edge that breathes in and out, and the advancing ink burns — so the late page has a rhythm of its own to time against the Gutter sweeps, the swarm and (after 20:00) The Press's wall.

## Details
- Schedule: from 16:00 (960 s) on, the crop-safe boundary breathes on a 6 s period — 3 s sliding inward, 3 s sliding back out, a linear triangular wave. At the inward peak the ink edge sits 4% of the safe area's width (left/right) and 4% of its height (top/bottom) inside the crop-safe boundary; at rest it is exactly on the crop-safe boundary. Before 16:00 the boundary, its burn and everything keyed to it are identical to today.
- The hazard draws as the hazard: the ink edge renders as a flat 6 u dark-ink band on its inside, along the breathing boundary — the Gutter's flat-ink idiom (T0099), no glow, no gradient. The paper between the band and the crop-safe boundary keeps its normal tone.
- Burn: while the ink is advancing (the 3 s inward slide), standing with the player's circle center between the ink edge and the crop-safe boundary burns 4 damage/s through the existing continuous-burn path (the Gutter's 4/s and the crop's 5/s idiom). While the ink is receding, the same margin is safe. At rest there is no band and no burn.
- Telegraph: the crop-mark corners (T0045) brighten toward full alpha as the ink advances (eased, full at the inward peak) and dim back on the retreat — the corners are the early hint that the page is about to breathe.
- Teaching: the first inward phase of a run prints the marginalia note "THE PAGE BREATHES" beside the player in the marginalia idiom (T0027), fading over 2 s.
- The breathing rect is the safe rect: from 16:00 on the Gutter (T0099) sweeps the breathing safe area (clipped to it exactly as it is clipped to the crop-safe rect today), The Press's wall (T0116) measures its progress in fractions of the same breathing rect (so the wall's speed breathes with the page — intended), and the spawn director plus the Underdrawing's announcements (T0100) place spawns within the breathing rect. No system special-cases Tide; everything reads one adjusted safe rect.
- No new SFX, key, HUD element or scene: the ink edge, the brightening corners and the marginalia are the entire teaching.
- The pure schedule lives in its own module in `src/core/` with unit tests in the crop/gutter pattern (T0045/T0099): the inset fraction (0 before 960 s; 0 → 0.04 linear over 3 s; 0.04 → 0 linear over 3 s; 6 s period thereafter; continuous and non-negative) and the phase (advancing / receding / rest). The burn rule (advancing phase only) is tested on the same module.

## Acceptance criteria
- [ ] Before 16:00 nothing changes: the boundary, the crop burn, the Gutter, the spawns and their underdrawing sketches are identical to today.
- [ ] At 16:00 the marginalia "THE PAGE BREATHES" prints once, and the ink edge begins its first 3 s inward slide to 4% of the safe area, reverses at the peak, and slides 3 s back — repeating every 6 s, drawn as a flat 6 u dark-ink band.
- [ ] While the edge is sliding in, standing between it and the crop boundary burns 4 HP/s; while it slides out the same position is safe; at rest there is no band and no burn.
- [ ] The crop-mark corners brighten toward full as the ink advances and dim back on the retreat.
- [ ] The Gutter band sweeps the breathing safe area and The Press's wall (once T0116 lands) tracks the same breathing rect; enemy spawns and their underdrawing sketches stay inside the breathing rect from 16:00 on.
- [ ] The pure tide module's unit tests pass: 0 inset before 960 s, peak 0.04 at 963 s, rest at 966 s, 6 s period after, burn only during the advancing phase; `npm run check` and `npm run smoke` pass on desktop and mobile.
