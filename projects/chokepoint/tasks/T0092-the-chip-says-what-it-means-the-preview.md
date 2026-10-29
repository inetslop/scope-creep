---
id: T0092
title: "The chip says what it means: the preview teaches its tag once"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T01:18:08Z
epic: E1
---

## Goal
The wave preview teaches its own tags where they first appear: the first time a tagged wave is previewed, one muted line names the tag in plain words, so a first-time player knows what "quiet" promises before the wave lands (pillar 8).

## Details
- The build-phase wave preview card (`src/ui/hud/NextWavePreview.ts`, T0015) grows one small muted line under the counts row, shown only when the previewed wave is tagged and the run is not yet taught the tag. Today the only tag is the quiet wave (T0071), so the line reads **"quiet: fewer, double gold"** — the tag's word, then its promise in plain words (half the enemies, double gold per kill).
- Taught once per run: from the second tagged wave's preview on, the line is gone. "Taught" is derived from the run's state, not stored: the run's held-wave count (the run ledger's waves-cleared, T0001) is 4 or more — the first quiet wave is wave 4, so a run that has held 4+ waves has already seen the tag. The same re-derivation pattern as the first run's hint dismissal (T0086): a resumed run re-derives and never re-teaches; no new save field.
- Look: the same muted gray and size as the pay line (T0079's "+N gold" line, in this same card); the card grows by one line the way T0079 did — the card's bottom edge and the counts row keep their screen positions, keeping the gap above the send ring — and the line appears and disappears with the card (build phase only).
- The mechanism is per-tag: each tag the preview can show gets its own one-time teach line (today: quiet only). Later tags — E5's boss, a "tight" tag — add their own line text without touching this one.
- No input, no sound, no rule change, no pause-screen line. Closest example: the pay line (T0079) for placement and style inside the same card; the quiet chip (T0071) for the word being taught.

## Acceptance criteria
- [ ] On a fresh run, the build phases previewing waves 2 and 3 show no teach line — untagged previews are byte-identical to today.
- [ ] The build phase previewing wave 4 shows "quiet: fewer, double gold" under the counts, with the pay line (T0079), the counts and the quiet chip (T0071) keeping their positions; the Send button (T0077) is unchanged.
- [ ] The build phase previewing wave 8 (and 12, 16, …) shows the quiet chip but no teach line — the tag was taught on wave 4's preview.
- [ ] A resumed run with 4 or more waves held never shows the line again; a resumed run before that teaches it when wave 4 is previewed.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass; no input and no sound.
