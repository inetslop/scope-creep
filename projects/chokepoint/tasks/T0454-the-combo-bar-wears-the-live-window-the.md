---
id: T0454
title: "The combo bar wears the live window: the Feast's +0.4 s on the drain"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T23:41:13Z
claimed_at: 2026-11-02T23:42:02Z
designer: yoga
---

## Goal
The drain bar under the ×N kill-combo counter drains over the chain's live window: with Feast in the run the window is longer than the flat 1.5 s, and the bar should say so — the bar and the chain break should agree. (The T0442 re-file: that file was lost 2026-11-02; the fx files are free now.)

## Details
- The bar (the ComboBar in `src/systems/FxSystem.ts`, the thin drain bar under the ×N counter, built as T0220) drains over a flat 1.5 s today; the chain's own window is the 1.5 s base plus 0.4 s per Feast copy in the run (Feast's added form, T0235).
- The fix: the bar drains over the same live window that decides when the chain breaks — read the window from where the chain break already reads it (one source of truth). If the break does not extend by the Feast copies yet, extend it first the same way, so the bar and the break agree.
- No Feast in the run: the bar drains over 1.5 s exactly as today (byte-identical).
- No change to the bar's look, the counter, the ×10 milestone (T0034's yellow), the combo gold or any sound: only the drain time moves.

## Acceptance criteria
- [ ] With no Feast in the run, the bar drains over 1.5 s, byte-identical to today.
- [ ] With N Feast copies in the run, the bar drains over 1.5 + 0.4×N seconds and empties the moment the chain can no longer extend (the break moment).
- [ ] The bar's look, the counter, the ×10 milestone and the combo gold are unchanged; no new readout, mark or sound.
- [ ] `npm run check` and the desktop + mobile smoke pass.
