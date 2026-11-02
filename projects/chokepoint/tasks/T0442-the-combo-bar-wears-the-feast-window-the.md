---
id: T0442
title: "The combo bar wears the Feast window: the drain bar follows the live chain window"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T20:29:42Z
---

## Goal
The drain bar under the ×N kill-combo counter shows the chain's real clock: when a run holds Feast copies the chain's window is longer than 1.5 s (Feast's added form), and the bar must drain over that live window — it never empties while the chain is still alive.

## Details
- **What exists:** the chain's window bar (T0220) — a thin bar under the ×N counter (T0031) that drains over the chain's 1.5 s window, the counter's own color (the muted ink; the milestone yellow from ×10 up) over a ~20%-alpha muted-ink track. Feast (T0235, landed 2026-11-02) lengthens the chain's window by +0.4 s per Feast copy added in a tower's later slot (Feast's added form, the `chainWindowSec` field on the augment).
- **The gap:** the bar was built when every chain's window was 1.5 s. In a run with Feast added, the chain lives longer than the bar says — the bar empties at 1.5 s while the chain still chains to 1.9 s (or 2.3 s), reading the clock wrong at the exact moment the player is deciding whether the next kill will chain.
- **The change:** the bar's drain duration becomes the run's live chain window — the same number the chain-break logic already uses (1.5 s base + 0.4 s per Feast added copy) — so the bar empties exactly as the chain breaks. Nothing else changes: no new width, color, position or readout; no sound; the bar stays under the ×N counter.
- **Check first:** if the bar already drains over the live chain window (T0235 may have wired it), this task is a no-op — reject it.
- **Where it lives:** the bar is the ComboBar system (the drain bar under the ×N kill-combo counter; the counter's own clock lives in `FxSystem.killCount`) — the architect confirms which file owns the drain duration; the live window is read from the same chain/Feast state the counter's break uses (core/feast.ts reads the Feast state; FeastGlow already reads the chain's state).

## Acceptance criteria
- [ ] A run with no Feast in it: the bar is byte-identical — it drains over 1.5 s exactly as before.
- [ ] A run with one Feast copy added in a tower's later slot: the bar drains over 1.9 s — half-empty 0.95 s after the last kill, and empty exactly as the chain breaks.
- [ ] A run with two Feast added copies: 2.3 s, the same behavior.
- [ ] The bar's look (its colors, its ~20%-alpha track, its place under the ×N counter) is unchanged; the ×N counter, the combo gold pops, the ×10 milestone and the combo-break fade are all byte-identical to before.
- [ ] `npm run check` and the desktop + mobile smoke pass.
