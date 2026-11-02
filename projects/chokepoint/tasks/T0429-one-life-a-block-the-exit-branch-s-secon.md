---
id: T0429
title: "One life a Block: the exit branch's second node, a leaking Block costs 1 life"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T15:49:41Z
claimed_at: 2026-11-02T16:10:10Z
epic: E20
designer: inet-racing
---

## Goal
The tech tree's "The exit" branch grows its second node: spend 85 coins once and, on every run after, a Block that leaks costs 1 life instead of 2 — a between-run buy that softens the run's single heaviest leak.

## Details
- The "The exit" branch (the row added by T0423) gains a second node, "One life a Block", priced 85 coins by the branch's depth rule — the depth-2 price on the same curve the thin road (T0369) and Held pays (T0348) use. Bought once, on for every run after, and bought independently of the branch's other nodes (no gate inside the branch).
- While owned, a leaking Block costs 1 life instead of 2. The Block's own data stays `livesCost: 2`; the leak applies the reduced cost only when the node is owned, read through one pure function in the tech read path (the long-watch node's own pattern, T0423), so a run without the node is byte-identical for every enemy.
- The tech card's description reads "a Block that leaks costs 1 life instead of 2".
- The run's first Block leak in a node-owned run wears the existing first-Block-leak chip's look (T0349) reading the live cost: "the Block takes 1 life" when the node is owned, "the Block takes 2 lives" otherwise — the softened cost is taught at the moment it is paid, not left unexplained (Pillar 8).
- The new node and its read live in the tech content and the tech read path (the exit content file and core/tech.ts) plus the single leak call site; the Block's data, every other enemy, and the branch's existing node (The long watch) are untouched.

## Acceptance criteria
- [ ] The tech tree's "The exit" branch shows a second node "One life a Block" at 85 coins; it buys once, persists in the profile, and its card description reads the 1-life rule.
- [ ] In a run with the node owned, a Block that leaks costs 1 life; in a run without it, a Block that leaks still costs 2 lives (non-owned runs are byte-identical to before).
- [ ] The run's first Block leak in a node-owned run shows the exit chip reading "the Block takes 1 life"; in a non-owned run it reads "the Block takes 2 lives".
- [ ] The branch's existing node (The long watch) and its pricing are unchanged; only the new node is added to the row.
