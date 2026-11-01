---
id: T0373
title: "The flyer's preview teach: the first flyer preview says it doesn't walk the road"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T18:48:59Z
claimed_at: 2026-11-01T18:49:36Z
epic: E10
designer: yoga
---

## Goal
The regular Flyer (T0353) joins the wave mix on wave 13 as the first enemy that doesn't walk the road, but nothing says so: the player sees a new token in the next-wave preview and learns at the first leak, and the boss's build line (T0346) comes 37 waves later. A one-time line under the next-wave preview — the wave-tag teach pattern (T0092) — teaches the read in the build before the first crossing, so the island's cover is chosen before it is needed.

## Details
- **When:** the build phase before the first wave of the run whose plan contains a Flyer (today: wave 13 — the Flyer is one on 13, 17, 21, …, fromWave 13; the wave-50 boss wave is not the first). The decision is a pure function of the next plan, like T0346's: no run state, no save field — a resumed run that enters the build before wave 13 shows the line, a resumed run at wave 14 or later never does, and the builds before waves 17, 21, … show the Flyer's token and count exactly as today, with no line.
- **What:** one muted line under the preview card, in the same style and place as the wave-tag teach line (T0092, the closest example — a tagged wave's first preview names the tag once under the preview card, in `src/ui/hud/NextWavePreview.ts` or wherever that line is drawn): "the flyer doesn't walk the road". It is up for the whole build phase and gone with the preview card when the wave starts.
- **Nothing else:** no sound, no board mark, no new card, no change to the preview's tokens or counts (T0353's token + count already show the Flyer; the line is the new information). It occupies the card for exactly one build phase of the run and never again — the T0092/T0272 one-time teach family, not a permanent mark. The line is 12 px muted ink, the tag line's own size, and fits the card's width at 412x915.

## Acceptance criteria
- [ ] The build phase before wave 13 shows one muted line under the next-wave preview card reading "the flyer doesn't walk the road", up for the whole build phase and gone when the wave starts; every other build phase (17, 21, …, and the wave-50 boss build) shows the preview exactly as today.
- [ ] A resumed run that enters the build before wave 13 shows the line; a resumed run at wave 14 or later never does; there is no new save field and no run-state flag — the line is a pure function of the next plan.
- [ ] No sound, no board mark, no new card, no change to the preview's tokens or counts; a run plays end to end from wave 1 to game over, and the desktop 1280x720 / mobile 412x915 smoke passes.
