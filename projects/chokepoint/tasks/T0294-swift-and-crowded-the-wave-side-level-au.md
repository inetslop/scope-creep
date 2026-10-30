---
id: T0294
title: "Swift and Crowded: the wave-side level augments"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T17:33:38Z
epic: E9
---

## Goal
The level picker (T0285) grows from one rule to three: two more level augments that change what a wave sends, so the long-term ladder (E9) has its first real choices to pick between.

## Details
- Two new level augments, each its own content file beside `src/content/levels/tough.ts` in the same shape (name, plain line, its number, its multiplier bonus):
  - **Swift** — card line "enemies walk 15% faster". Every enemy that spawns in the run walks at 1.15× its normal speed: one speed factor applied where Tough's hp factor already applies (T0285), so every spawn takes it — regulars, the reserved big ones, the bosses and their spawns (the Guard, the Hive's popped Dots). The per-wave hp growth is untouched. Bonus: +15%.
  - **Crowded** — card line "waves send 20% more enemies". The wave plan's enemy count ×1.2, rounded to the nearest integer (half up), applied to the final plan the wave would otherwise send (after the quiet halving); a boss wave keeps its own plan (wave 10 the Colossus alone, wave 20 the Titan and its Guard, wave 30 the Orb). The next-wave preview shows the inflated counts because it reads the plan. Bonus: +20%.
- Same wiring as Tough: the picker gains a row for each (capped at the slot count, saved in the profile, preselected for the next run), the run save carries the selection so a resumed run keeps its rules, and the menu's multiplier readout recomputes as 1 + the sum of the selected augments' bonuses (the same way it reads Tough's +25%): ×1.15 Swift alone, ×1.20 Crowded alone, ×1.35 both, ×1.60 Tough + both. The picker card grows to fit the whole set (the menu's fit-sum pattern), at 412x915 and 1280x720.
- The rules are pure, with unit tests beside T0285's `tests/core/levels.test.ts`: the count table (a 5-enemy wave → 6, a 10-enemy wave → 12, a boss wave keeps its plan, a quiet wave's final plan inflated), the spawn speed factor (1.15 on a regular and on a boss's spawn), and the bonus summing.

## Acceptance criteria
- [ ] The menu picker lists Swift and Crowded under Tough, each with its number, toggled on and off up to the slot count; the multiplier line reads ×1.15 / ×1.20 / ×1.35 for Swift / Crowded / both, and ×1.60 with Tough + both.
- [ ] In a Swift run, every spawned enemy walks at 1.15× the speed the same wave sends without Swift (asserted on a spawn in a test, including a boss's spawn); without Swift the speed is byte-identical to today.
- [ ] In a Crowded run, the wave preview shows the inflated counts (a 5-enemy wave shows 6, a 10-enemy wave shows 12) and every boss wave still shows its own plan; without Crowded the plans are byte-identical to today.
- [ ] A resumed run keeps its selection: after closing and resuming, spawn speeds and wave counts still carry the factors.
- [ ] With both off, the plans, the spawn speeds and the multiplier line are exactly as today.
