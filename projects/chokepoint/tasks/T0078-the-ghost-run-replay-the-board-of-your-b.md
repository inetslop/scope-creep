---
id: T0078
title: "The ghost run: replay the board of your best run"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T22:13:10Z
claimed_at: 2026-10-28T22:28:24Z
epic: E1
designer: desktop
---

## Goal
The profile remembers one more thing — the exact board your best wave was fought on — and the menu offers a run on that same board, so "one more run" has a target: beat your own record on the board you beat it on.

## Details
- The profile stores the seed of the run that currently holds the best wave (a new field; saved the moment a finished run sets a new best wave; absent for a player with no finished run). The seed → board mapping is already deterministic (T0056's board code is a pure function of it, unit-tested for shape, determinism and distinctness).
- The menu gains a "Ghost · Wave N" button (N = the saved best wave) below Play — the Resume button's shape, place and white card (T0042) — with one muted line under the button: "the board of your best run". The button and the line appear only when the profile has a saved seed; with none, the menu is exactly today's.
- Pressing it starts a completely new run on the board grown from the saved seed — the same road, rocks and build cells as the best run's board — with fresh towers, full lives and the normal starting gold, and a normal first draft (the Common-Bolt floor, T0048). It is a normal run in every other way: it earns coins, it lands in the last-four runs (T0018), and a wave reached on it sets the best wave as usual.
- A ghost run replays the best board, so it never changes the saved seed: the seed stays the current best run's until an ordinary run on a new board sets a new best wave, which then stores its own seed.
- The menu demo (T0049) is untouched: it keeps its fresh seed.

## Acceptance criteria
- [ ] After a run that sets a new best wave, the menu shows "Ghost · Wave N" (N the new best) with "the board of your best run" under it; a player with no finished run sees exactly today's menu.
- [ ] Pressing Ghost starts a new run — empty towers, full lives and starting gold, a normal first draft — whose board is identical to the best run's board (same road, rocks and build cells).
- [ ] A ghost run earns coins, appears in the menu's last-four runs, and a wave reached on it updates the best wave like any run.
- [ ] A ghost run that sets a new best wave keeps the saved seed (the same board); only a run on a new board stores a new seed, and the button then points to it.
- [ ] The saved seed survives a page reload: the Ghost button is still offered at the same wave, and starting a normal run afterwards behaves exactly as it does today.
