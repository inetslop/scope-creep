---
id: T0492
title: "The claim's remembered line: the road-remembers run says how often the leakers came back"
size: M
priority: 2
status: design
depends_on: [T0473]
attempts: 0
created: 2026-11-03T11:18:16Z
epic: E27
---

## Goal
The road remembers (T0473) folds a run's leakers back into later waves; on the claim card the run should say how often that happened, so a player can see at a glance whether a run was punished for leaking or held the road clean.

## Details
- A muted "remembered · N" line on the claim card (the rewards card's own column, the other muted lines' style), where N is the number of waves in which the memory fired (leakers came back) this run.
- The line shows only when the memory fired at least once (N ≥ 1); a run the memory never touched shows no line — the card's column is unchanged for those runs.
- It reads the run's per-type leak ledger that T0473 keeps (how many of the run's waves the memory added leakers to); it does not re-derive or re-count, and it shows on the main claim card, not the run's last page.

## Acceptance criteria
- [ ] In a run where the memory fired in at least one wave, the claim card shows a muted "remembered · N" line with N the count of waves the memory fired.
- [ ] In a run the memory never fired (every wave held clean, or the run never leaked a different regular type), no "remembered" line appears and the claim card's column is otherwise unchanged.
- [ ] The line fits its card at 412x915 and 1280x720 with the other muted lines; it shows nothing the screen already shows.
