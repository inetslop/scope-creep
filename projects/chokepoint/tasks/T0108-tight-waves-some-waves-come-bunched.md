---
id: T0108
title: "Tight waves: some waves come bunched"
size: M
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:50:29Z
designer: baby-mama
---

## Goal
Wave content the multi-hit augments are made for: some waves send their enemies bunched close together, tagged "tight" in the preview, so Splash's 3-cap, Lance's pierce, Chain's leaps, Spray's needles and Beam's second target earn their keep in dedicated waves.

## Details
- Schedule: from wave 6, every 8th wave is tight — waves 6, 14, 22, 30, … (never a quiet wave: quiet is every 4th, and 6, 14, 22, … are never multiples of 4).
- A tight wave has the same count, same mix, same hp, same kill gold and same clear bonus as the normal wave of that number; only the cadence changes: the spawn interval between consecutive enemies is halved (the wave's total spawn time halves; the first spawn comes at its usual time). The 2x fast-forward scales it like everything else (one scaled clock, T0019).
- The wave plan carries a "tight" tag (the WavePlan tags field, T0071's "quiet").
- Readability: a muted "tight" chip — the same rounded chip look and slot as the quiet chip (T0071) — at the left edge of the wave preview card during the build phase before a tight wave (T0080's generic chip slot), and on the wave banner when a tight wave starts ("Wave 6 · tight", T0080's slot); untagged waves are byte-identical. The chip is muted gray (the quiet chip stays muted blue); a wave is never both.
- Teach once: one small muted line under the preview card's counts on the first tight wave's preview only — "tight: they come bunched" — the T0092 per-tag pattern: shown while the previewed wave is tagged tight and the run has held fewer than 6 waves; "taught" = 6 or more held, derived from the ledger, re-derived on resume, never shown again.
- The quiet wave (T0071), its double kill gold, and the last-stand product (×4) are untouched.

## Acceptance criteria
- [ ] Waves 6, 14, 22, … are visibly bunched: the same enemies as the normal wave of that number, spawning at half the interval; waves 1–5 and every quiet wave (4, 8, 12, …) are byte-identical to today.
- [ ] The build phase before wave 6 shows the muted-gray "tight" chip on the preview card and the teach line "tight: they come bunched" under the counts; the wave banner reads "Wave 6 · tight".
- [ ] The teach line shows on a fresh run only, on wave 6's preview; a second run — or a resumed run past wave 6 — shows the chip but never the line again.
- [ ] A tight wave's clear bonus and kill gold are exactly what the normal wave of that number pays.
