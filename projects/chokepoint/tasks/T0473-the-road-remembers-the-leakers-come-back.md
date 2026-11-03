---
id: T0473
title: "The road remembers: the leakers come back in the next wave"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T05:01:11Z
epic: E27
---

## Goal
A leak costs a life and nothing else: the waves are fully decided by the seed and the wave number, so a run's worst moments pass without a trace. Now the run's play shapes the run's next wave — every regular walker that got through comes back in the next wave, one per different type — so holding the road is worth more than a life.

## Details
- The rule: when a wave ends, every regular enemy type that leaked during that wave adds one of itself to the next wave's plan — one per different type, on top of the planned wave (the planned wave keeps its full threat; the additions are extra, not a swap of planned enemies). The remembered walkers take the next wave's own hp scale and join the plan's own gate and interval rules, like any other enemy in it, and leak as normal (a life each, the wave card's "held" chip, the leak warning — the existing rules).
- The cap: when more than 3 different regular types leaked, only 3 walkers come back — the types that leaked most, ties to the higher threat, then the type that leaked first.
- What never comes back: the boss (its lane is its own), and the split pieces (Shard, Splinter — spawnOnly, only from a split). A wave whose only leakers were the boss, a Shard or a Splinter leaves the next plan unchanged.
- What never remembers: a quiet wave and a boss wave never take additions. If the wave after a leaky one is quiet (every 4th) or a boss wave, the leakers are dropped, not queued — the breather stays a breather, the boss wave stays the whole wave in one shape.
- Where it is seen: nowhere new. The next-wave preview already shows the plan's tokens and counts, so the added walkers appear in its token row with no change to the preview, the banner or the wave card. No new chip, line or mark anywhere on screen (the one-time teach is its own later task).
- The run's leak record: the run already knows what each wave leaked (the wave card's "held · N" chip and the Gorge's feed on the Splinters' leaks both read the run's leaks); if that record is only a count, extend it to per type with the smallest change the run's state allows.
- A run with no leaks is byte-identical to before: same plans, same preview, nothing new shown.

## Acceptance criteria
- [ ] After a wave in which, say, two Dots and one Ward got through, the next wave's plan carries one extra Dot and one extra Ward on top of the planned wave, and the next-wave preview shows both tokens during the build phase with no new line or chip.
- [ ] Four or more different regular types leaking caps the addition at 3 walkers: the three most-leaked types come back (ties to the higher threat, then the type that leaked first).
- [ ] A quiet wave or a boss wave never wears additions: if the wave after a leaky one is the 4th (quiet) or a boss wave, its plan is the plain planned wave and the leakers are dropped, not queued.
- [ ] A wave whose only leakers were the boss, a Shard or a Splinter leaves the next plan unchanged.
- [ ] The remembered walkers take the next wave's own hp scale and leak as normal.
- [ ] A run with no leak is byte-identical to before the change: same plans, same preview, nothing new on screen.
- [ ] Unit tests cover the per-type leak ledger, the +1 per different type with the cap and its tie-breaks, the quiet and boss drops, and the spawnOnly exclusion.
