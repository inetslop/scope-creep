---
id: T0216
title: "The end card names the towers that worked: kills by tower"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T15:52:06Z
---

## Goal
When a run ends, the player sees which of their towers did the most work, so they learn what carried the run.

## Details
- On the end-of-run screen (the card that shows the score and the best wave), add one small new card beneath it, titled “By tower”: a wrapping row of the run's towers, each a small chip with the tower's first-augment icon and its kills this run (“×N”).
- The chips are sorted by kills, highest first. A tower with zero kills still appears as “×0”, so an idle tower is visible.
- Each chip uses the tower's own first-augment icon and color (the same icon the hand and the tower panel already use), so a tower is recognized at a glance.
- It reads each tower's existing per-tower kill count (the one the tower panel already shows, attributed by the source-of-kill rule). It changes nothing on the board, adds no new tracking, and does not re-derive any number already on the card — the score, best wave and coins are untouched.
- It is a readout: no sound, no input, no button.
- It is the game's white rounded card and fits the end screen at 412x915 and 1280x720; when a run has many towers the row wraps to a second line (it never scrolls, clips or overlaps the score).

## Acceptance criteria
- [ ] After any run ends, the end-of-run screen shows a new “By tower” card listing every tower built that run, each chip showing its first-augment icon and its kill count.
- [ ] The chips are ordered highest kills first, and a tower that killed nothing shows “×0”.
- [ ] It reads the towers' existing kill counts; the board, the towers, and the score / best-wave / coins lines on the end card are all unchanged.
- [ ] At both 412x915 and 1280x720 the card sits beneath the score card without overlapping or clipping, wrapping to a second line when the run has many towers.
- [ ] It is silent and takes no input.
