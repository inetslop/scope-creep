---
id: T0423
title: "The exit branch and its first node, The long watch: the leak warning starts 5 s out"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T12:03:44Z
epic: E20
---

## Goal
The tech tree gains a seventh branch, "The exit," for surviving the leak; its first node, The long watch (30 coins), starts the leak warning earlier — 5 s out instead of 3 s — so a between-run coin spend buys more time to see a leak coming.

## Details
- The tech screen gains a seventh branch row, "The exit," below the existing six (Run start, The board, The pool, The claim, The wave, The tower), in the same white-card row style and the same owned / locked / affordable states as every branch.
- The branch carries one node for now: "The long watch," 30 coins (the depth-1 price, the same 30 as every branch's first node), bought once with profile coins; while owned it is on for every run after and wears the owned mark on its card.
- The effect, on for the whole run while the node is owned: the leak warning — the pulsing red copy of the exit gate with its quiet tick per pulse — now starts when the enemy closest to the exit is within 5 s of reaching it, instead of 3 s. Same look, same tick, same trigger (the closest enemy's time-to-exit); only the threshold moves from 3 s to 5 s. Without the node the warning stays at 3 s, byte-identical to before.
- The node's card reads: name "The long watch," line "The leak warning starts 5 s out," price 30 coins — the branch's dry one-line style.
- The buy is recorded in the profile's owned list like every other node and survives a resume.

## Acceptance criteria
- [ ] The tech screen shows a seventh row "The exit" below "The tower," its card reading "The long watch" at a 30-coin price in the owned / locked / affordable states like the other nodes.
- [ ] Buying "The long watch" deducts 30 coins, marks the node owned on the profile, and the mark persists after a resume.
- [ ] In a run with the node owned, the red exit-gate warning pulse and its tick begin when the closest enemy is 5 s from the exit; the look and the per-pulse tick are unchanged, only the threshold moved.
- [ ] In a run without the node, the warning still starts at 3 s, byte-identical to before.
- [ ] The node is on for every run after it is bought and off for every run before it is bought; normal and Iron runs are otherwise unchanged.
