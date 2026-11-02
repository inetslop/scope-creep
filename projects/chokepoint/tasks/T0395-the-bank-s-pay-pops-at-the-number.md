---
id: T0395
title: "The bank's pay pops at the number"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T01:03:06Z
---

## Goal
The bank's pay (T0363) already wears its quiet "bank +N" line in the build and its coin blip at the pay — the pay itself gets the gold's own moment at the stats card's number (the T0385 re-file).

## Details
- The moment the bank pays at a wave's start (the countdown's end or the big button's early send — the existing pay, once per start), the stats card's gold number pops, scale 1.15 and back over ~150 ms, and its coin icon flashes white while scaling — the coin tally's own pop (T0017), wearing the gold line.
- The pop plays only for the bank's pay: never for kill gold, Mint gold, the wave bonus or the early-send's seconds-gold (those keep their own feedback).
- No new sound (the pay's blip already plays — the T0381 lesson), no new line, no layout change: the "bank +N" line already taught the rule in the build, and the number itself carries the amount.

## Acceptance criteria
- [ ] At a wave's start whose bank pay is greater than 0, the gold number pops 1.15× over ~150 ms and its coin icon flashes white, once per start
- [ ] A pay of 0 plays nothing; kill gold, Mint gold, the wave bonus and the early-send's seconds-gold never trigger the pop
- [ ] The coin tally's own pop and the "bank +N" line are untouched; the stats card's layout is unchanged at 412x915 and 1280x720
- [ ] `npm run check` and the desktop + mobile smoke pass
