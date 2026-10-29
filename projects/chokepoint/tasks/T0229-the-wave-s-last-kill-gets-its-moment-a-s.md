---
id: T0229
title: "The wave's last kill gets its moment: a soft ring where it ends"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T20:16:15Z
---

## Goal
The end of every cleared wave is seen where the fight actually ended: when the last enemy of the wave is killed, a small soft ring blooms from that kill spot, so the wave's closing beat lands on the board, not only in the center text.

## Details
- Trigger: the killing hit that brings the current wave's alive enemy count to zero (a wave that is cleared, not lost).
- The ring: a soft ring in the road's white at low alpha, at ground level (the working-aura ring's placement, T0055; the Mute's ring's placement, T0219), growing from the killed enemy's radius out to ~1.5 cells over ~300 ms, then fading out. One per wave, on the final kill only.
- No ring on any non-final kill, and none when the wave is lost (a leak that ends the run goes straight to game over, no ring).
- No sound, no text, no new HUD element, and nothing left on the board after it fades — a transient flash in the existing ring language, not a mark.
- It does not replace or overlap the "Wave N cleared +gold" line (T0205): that line is at board center, the ring is at the last kill spot; they share the same beat and are seen together.

## Acceptance criteria
- [ ] Killing the last enemy of a wave shows exactly one soft white ring expanding from that kill spot over ~300 ms and fading; killing any other enemy shows no ring.
- [ ] No ring appears mid-wave or when the wave is lost to a leak.
- [ ] The ring adds no sound, no text, and no HUD element, and leaves no mark on the board after it fades; the "Wave N cleared" line is untouched.
- [ ] The effect lives in a new file driven by the existing kill/death flow; no changes to the draft, the wave text, or existing HUD elements.
- [ ] Check and smoke pass on desktop and mobile.
