---
id: T0425
title: "The combo says what it pays: the first ×5 chain's one-time chip"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T13:12:56Z
---

## Goal
A first-time player who sees the extra gold pop on quick kills knows why: the run's first kill chain to reach ×5 says, once, at the moment the first +2 lands, that quick kills pay extra — taught with the one-time board chip the game already uses, not a new card, line or mark.

## Details
- **The rule already pays:** the kill-combo chain (T0031) pays +2 gold on the fifth kill of a chain and +4 on the tenth (T0066), each shown as its own small gold pop at the kill spot ~100 ms after the normal kill gold. Nothing anywhere says why the extra gold appears.
- **When:** the moment the run's kill chain first reaches ×5 — the same moment that fifth kill's "+2" pop lands at the kill spot.
- **What:** one small chip in the first-leak chip's own look (T0107/T0384: muted ink on a small white rounded chip) that pops at the kill spot, reading "×5 chains pay +2 gold", and fades after ~1.5 s (the first-leak chip's own timing: pop, hold, fade). It never covers the ×N counter (which rises above the kill) or the +2 pop.
- **Once per run:** the run remembers the moment it has shown — the far-gate chip's own once rule (T0384): a later ×5 or ×10 chain in the same run shows no chip, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- **Nothing else:** no sound (the +2 pop, the ×N counter, the combo bar (T0220) and the ×10 milestone — the yellow counter, the chime, the 12-chip burst (T0034, T0254) — all play exactly as they do), no button, no new line on any card, no permanent mark on the board.

## Acceptance criteria
- [ ] In a fresh run, the moment a kill chain first reaches its fifth kill within the chain's 1.5 s window, a small white chip reading "×5 chains pay +2 gold" pops at the kill spot with that kill's "+2" gold pop, holds, and fades after ~1.5 s.
- [ ] The chip shows exactly once per run: no later chain (×5 or ×10) shows it, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] The chip never appears on kills that make the chain ×1–×4, never covers the ×N counter or the +2 pop.
- [ ] The +2/+4 payouts, the gold pops, the kill-gold coin trail, the ×N counter, the combo bar, the ×10 milestone and the combo-break note (T0398) are all byte-identical to before.
- [ ] No new sound, button, card line or permanent board mark; the chip is board-space like the first-leak chip's and fits at 412x915 and 1280x720.
