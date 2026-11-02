---
id: T0449
title: "The tag's haptic: a special wave you feel before it happens"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T22:27:29Z
epic: E22
---

## Goal
On mobile, a tagged wave (anything but the quiet breather) is felt before it happens: one short buzz at the banner, so a phone player knows a special wave is coming without reading the chip.

## Details
- A new tagHaptic() in input/haptics.ts: one guarded navigator.vibrate(30) — the guarded pattern's own shape (T0265: place 20 ms, leak 80 ms, never throws on a desktop or a haptics-less browser).
- It plays once per wave start whenever the wave's plan wears a tag other than "quiet" — the tight, rush and short-cut waves now, and double and clumps (T0447, T0448) automatically when they land, because the buzz reads the plan's tags field (T0080), not a tag list.
- The moment: the wave banner's trigger point — the closest example is the boss-death haptic (T0428), which hooked its run moment's flag the same way.
- A quiet wave (the breather) never buzzes.
- No HUD element, no sound, no text, no toggle — the haptic's own pattern (T0265: no HUD or toggle).

## Acceptance criteria
- [ ] On mobile, a tight, rush or short-cut wave start plays one 30 ms vibration; a quiet wave start plays none.
- [ ] On a desktop (no navigator.vibrate) nothing plays and nothing throws.
- [ ] No new HUD element, no sound, no text.
