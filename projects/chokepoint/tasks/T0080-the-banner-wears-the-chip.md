---
id: T0080
title: The banner wears the chip
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
---

## Goal
A tagged wave is seen where it lands, not only in the preview: when the wave banner (T0067) slides in, it wears the wave's own chip.

## Details
- When the "Wave N" banner slides in at the start of a tagged wave, the banner shows the wave's chip to the right of the number — today the only tag is T0071's quiet wave, so wave 8, 12, 16, … read "Wave 8 · quiet", using the same muted-blue chip look and size as the preview card's (T0071).
- The chip slot is generic: the wave carries its tag(s) from the wave plan, the banner shows them if there are any, and shows none if there are not — an untagged wave's banner is byte-identical to today (same width, same motion).
- Reuse the shared top-center slide-and-fade card (T0067's topBanner) with its existing motion (~200 ms in, ~500 ms hold, ~300 ms out); the card grows by the chip width and nothing else.
- No sound, no input. Later tags (E5's boss wave) wear the same slot.
- Closest example: the preview card's chip row (T0071) for the chip's look, and T0067's WaveBanner part for where the text goes.

## Acceptance criteria
- [ ] When a quiet wave (4, 8, 12, …) starts, the top banner shows "Wave N" with the same muted-blue "quiet" chip the preview card uses.
- [ ] An untagged wave's banner is unchanged: no chip, same width, same timing.
- [ ] The banner's in/hold/out timing is unchanged by the chip.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with a quiet wave and a plain wave.
