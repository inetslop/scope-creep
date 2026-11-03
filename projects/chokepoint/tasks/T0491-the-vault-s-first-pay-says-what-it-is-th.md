---
id: T0491
title: "The vault's first pay says what it is: the last-stand doubling taught once"
size: S
priority: 2
status: designing
depends_on: [T0490]
attempts: 0
created: 2026-11-03T11:18:16Z
claimed_at: 2026-11-03T11:18:26Z
epic: E29
designer: yoga
---

## Goal
The last stand's vault (T0490) doubles the bank's pay at one life; the run's first time that doubled pay is about to land should say so once, so the tech reads as working at the moment it fires instead of as a quiet +8 becoming a +16.

## Details
- One-time, per run, on the first build phase where all three hold: the vault node is owned, the run is at exactly 1 life, and the bank has gold to pay on (gold above zero). A small white chip — the first-leak chip's look (T0107) — pops under the stats card's "bank +N" line and fades over ~1.5 s, reading "at one life the bank pays double."
- It shows once per run (a flag the run save carries), never on a run without the node, never at 2 or more lives, and never twice.
- No sound, no HUD change beyond the one-time chip; the "bank +N" line itself still shows the doubled number.

## Acceptance criteria
- [ ] On the first build phase of a run with the vault owned at exactly 1 life and some gold banked, the chip pops under the "bank +N" line once, reads "at one life the bank pays double," and fades in ~1.5 s.
- [ ] The chip never shows on a run without the node, at 2 or more lives, or a second time in the same run; the flag survives a resume (the run save carries it).
- [ ] No other HUD element, sound, or permanent mark is added; the "bank +N" line is unchanged.
