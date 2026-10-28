---
id: T0011
title: "The odds shift: rarer cards the deeper the run goes"
assignee: asus
size: M
priority: 1
status: design
depends_on: [T0002]
attempts: 0
created: 2026-10-28T02:08:37Z
epic: E4
---

## Goal
The draft gets more exciting the deeper a run goes: the rarity odds improve with the wave, and the draft's odds line always shows the live odds of the draft in front of the player.

## Details
- Supersedes T0002's fixed 70/25/5 from wave 5 on. The odds depend on the upcoming wave W (the draft before wave 1 uses W = 1; the draft after clearing wave N uses W = N + 1).
- Exact curve — epic grows first and faster, rare a little, both capped:
  - W 1–4: Common 70 · Rare 25 · Epic 5 (unchanged from T0002)
  - from W 5: Epic +1 per wave (cap 15, reached at W 14); Rare +1 per wave (cap 33, reached at W 12)
  - Common = 100 − Rare − Epic. So W 14+ settles at 52/33/15.
  - Examples: W 5 → 69/26/6 · W 10 → 58/31/11 · W 15 → 52/33/15.
- The draft's odds line (T0002) shows the odds of THIS draft: "Common 58 · Rare 31 · Epic 11". For W ≤ 4 it reads exactly "Common 70 · Rare 25 · Epic 5", so early drafts look unchanged.
- The roll must stay on the run's seeded rng (as T0002's roll is) — never Math.random. A unit test must show the same seed produces the same tier sequence, and that the epic share of 3000 rolls at W 15 is clearly higher than at W 5.
- Keep the curve a single pure function in the tier module (closest example: T0002's `TIER_ODDS` / `rollTier` in core/tiers.ts) so later tasks (and E3's levels) can read it.

## Acceptance criteria
- [ ] The draft before wave 1 shows the odds line "Common 70 · Rare 25 · Epic 5".
- [ ] The draft before wave 10 shows "Common 58 · Rare 31 · Epic 11"; from the draft before wave 15 on it shows "Common 52 · Rare 33 · Epic 15".
- [ ] A unit test: the epic share of many seeded rolls at W 15 is higher than at W 5, and the three odds always sum to 100 for any wave.
- [ ] A run replayed with the same seed produces the same card tiers as the original run.
- [ ] The odds line keeps T0002's style and fits the draft at 412x915 and 1280x720.
