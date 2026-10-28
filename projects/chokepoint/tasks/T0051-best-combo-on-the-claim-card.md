---
id: T0051
title: Best combo on the claim card
size: S
priority: 3
status: design
depends_on: [T0039, T0047]
attempts: 0
created: 2026-10-28T12:34:55Z
epic: E1
---

## Goal
The claim card remembers the run's loudest moment: the longest kill-combo chain the run reached.

## Details
- The rewards claim card (T0003) counts up its lines: waves held, stopped, and — when any — a green "Clean N" line (T0033), with a "Score N" line above the coins line once T0047 lands.
- This task adds a "Best combo ×N" line: N is the longest kill-combo chain of the run (the rising ×N counter from T0031), recorded in the run ledger (T0001) as the counter rises — the card reads the ledger and never recomputes.
- The line sits just above the "Score N" line, counts up with the others, and is shown only when N is 2 or more.
- Color: muted ink under ×10; at ×10 and up the same yellow the ×10 milestone uses on the board (T0034).
- The end-of-run screen before the claim is unchanged.

## Acceptance criteria
- [ ] A run whose longest chain was 5 shows a muted "Best combo ×5" line on the claim card, counting up in step with the other lines, just above the "Score N" line.
- [ ] A run whose longest chain reached 10 or more shows the line in the milestone yellow (T0034's color).
- [ ] A run with no chain of 2 or more shows no combo line, and every other line and the card layout are unchanged.
