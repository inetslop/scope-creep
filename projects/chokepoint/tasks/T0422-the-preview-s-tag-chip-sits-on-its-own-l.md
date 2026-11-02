---
id: T0422
title: "The preview's tag chip sits on its own line"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T11:43:00Z
claimed_at: 2026-11-02T11:43:19Z
designer: yoga
---

## Goal
The next-wave preview's tag chip (quiet, tight, rush, boss) currently sits at the token row's left edge, where it crowds the first token and can read as a token itself; on its own line under the row it reads as the label of the whole wave — the wave's pace, planned in the build.

## Details
- File: `src/ui/hud/NextWavePreview.ts` only. The chip already exists (the banner chip's own look: the tag's fill, the 11 px label, the label.width+14 × 18 rounded rect, shown only during the build phase on tagged waves) — this task moves it, it does not add it.
- Move the chip from the token row's left edge to its own line directly under the token row, above the card's muted "+N gold" line (the gold line's placement is the closest example of a line under the tokens).
- The chip's look is unchanged; only its position moves. The token row keeps its full width (no chip space reserved at its left edge). While a tag is present the card grows by the chip's line (18 px) plus a 4 px gap.
- Untagged waves: the card is byte-identical (no chip line, no height change).
- The one-time teach line under the card (T0092) and the flyer's one-time teach (T0373) are untouched; the storm's preview chip (E17) will ride this placement.

## Acceptance criteria
- [ ] During a tagged wave's build phase the chip shows on its own line under the token row, above the "+N gold" line, in its unchanged look (tag fill, 11 px label, label.width+14 × 18 rounded).
- [ ] The first token in the row is no longer pushed over by the chip.
- [ ] Untagged waves: the card is byte-identical to before.
- [ ] With the longest tag and the longest counts, the card and its lines fit at 412x915 and 1280x720 (the layout gate passes).
