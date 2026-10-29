---
id: T0105
title: "The splitter's crack widens as it weakens"
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:44:26Z
epic: E4
designer: inet-racing
---

## Goal
The third slice of the enemy-telegraph idea: the Splitter's split is its whole deal and there are no hp bars — so its crack (the line that is part of its token) widens the moment it is at half hp or less, making "about to split into two" readable before it happens.

## Details
- While a Splitter's hp is at 50% or less of its max, one small overlay line thickens the token's own crack: the same crack line, twice as thick, in the token's own darker crack color (the crack is already painted on the token; the hook only adds the widening while weak).
- Above 50% hp the hook paints nothing: the token is byte-identical to today.
- The threshold is display only: the split still happens on death from any source, at any hp (T0068), with the same two splinters at the same offsets and speed; no rule change, no input, no new sound.
- A new enemy-hook file on T0099's pattern (the mark tick), so it lands in its own files beside the shared-augment queue.

## Acceptance criteria
- [ ] A Splitter above half hp looks exactly as it does today; at 50% hp or less its crack line is visibly twice as thick, until it dies.
- [ ] The split behavior is unchanged: on death from any source, two splinters at the same offsets and speed as today.
- [ ] No other enemy is affected.
