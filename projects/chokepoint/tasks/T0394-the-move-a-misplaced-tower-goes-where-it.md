---
id: T0394
title: "The move: a misplaced tower goes where it should (the T0382 re-file)"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T01:03:06Z
claimed_at: 2026-11-02T01:23:29Z
epic: E15
designer: cachyos-x8664
---

## Goal
In the build phase a tower can move to any free build cell for a fee, keeping its augments and its kills — repositioning against the wave preview is a real decision with a price (E15). The T0382 re-file, split smaller: the core only.

## Details
- The selected tower's panel wears a "Move · −N" bottom line, build phase only (like the Sell line): N = floor(60% of the tower's slots' total cost), minimum 5 — the sell's own rule at a lower rate. While the gold is short the line dims with the price in red, the reroll button's own short-gold pattern.
- Tapping the line opens the move state: the tower dims to ~50% alpha, every free build cell gets the placement's thin outline, and a tap on a free cell shows the what-if range ring at that cell (the placement ring's own look, the tower's current range) with the placement's own ✓/✗ beside it.
- ✓ commits: the gold pays the fee and a small muted "−N" chip pops at the old cell (the sell's gold-pop language, a minus), and the same tower object slides to the new cell over ~300 ms (ease-out), landing in the placement's drop-in bounce and place haptic. Its augments, kills, damage tally, tier pips and targeting mode all carry — no rebuild, no re-draw.
- A tower that lands on the marked cell wears its buff (the panel's "marked · +N%" line reads it live, T0387's line); a tower that moves off the marked cell loses it.
- ✗ or a tap on anything but a free cell cancels: the tower brightens, the outlines clear, nothing is paid.
- The resume needs no new state: the save at the wave's start carries the moved cell, and a tab closed mid-build resumes the pre-move snapshot with the fee unspent (the existing save timing, T0042).
- Not in this slice: the one-move-per-build-phase limit (the line's "moved" state) and the one-time teach line — they land behind this one; the commit's note is T0392.

## Acceptance criteria
- [ ] Build phase: the selected tower's panel shows "Move · −N" (N = floor(0.6 × its slots' cost), min 5) beside its sell line; the line is hidden during a wave
- [ ] Gold short: the line is dimmed with the price in red; tapping it does nothing
- [ ] Tapping it dims the tower, outlines the free build cells; a tap on a free cell shows its range ring and the ✓/✗ confirm
- [ ] ✓ pays the fee (the gold drops, the "−N" chip at the old cell), slides the same tower over in ~300 ms, drop-in bounce and place haptic on landing; its augments, kills and targeting mode are unchanged, and the marked cell's buff follows the tower (the panel line reads it)
- [ ] ✗ or a tap elsewhere cancels: no gold moves, the tower is back at full alpha, the outlines clear
- [ ] The sell line and the rest of the panel are untouched; the pause screen's controls list is unchanged (no new key or button); the panel fits at 412x915 and 1280x720
- [ ] `npm run check` and the desktop + mobile smoke pass
