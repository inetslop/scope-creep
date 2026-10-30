---
id: T0307
title: "The Hauler's extra leak cost, taught once"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T21:22:19Z
claimed_at: 2026-10-30T21:22:39Z
designer: yoga
---

## Goal
A Hauler that gets through costs 5 gold on top of its life, but the player learns that only from the enemies reference — teach it at the exit, once, at the moment the cost is paid.

## Details
- Once per run, on the first Hauler leak, a small muted chip pops at the exit gate in the first-leak chip's look (T0107, `fx/leakCost.ts`): "the Hauler also takes 5 gold", ~1.5 s, then fades. A white chip, muted ink — the name-tag chip's language (T0085).
- It is a leak hook: a new file beside the other leak hooks in `src/systems/enemyHooks/` (`tollLeak.ts` from T0255, `leakEcho.ts` from T0250) and its entry in `enemyHooks/index.ts`. It changes nothing about the leak itself: same life cost, same 5 gold, same thud, jolt and gold pop.
- If the Hauler's leak is also the run's first leak, the "leaks cost a life" chip (T0107) fires on the same leak: the Hauler chip then starts 1.2 s after that chip, so the two lines read one after the other instead of on top of each other.
- Once per run, and never again after a resume: the Hauler that leaked has already paid. Later Hauler leaks in the same run show nothing.
- No sound, no new HUD element: the chip is a one-time teach and is gone after 1.5 s.

## Acceptance criteria
- [ ] In a fresh run, the first Hauler to reach the exit shows "the Hauler also takes 5 gold" at the exit gate for ~1.5 s; a second Hauler leak in the same run shows no chip.
- [ ] When the Hauler's leak is also the run's first leak, the chip appears ~1.2 s after the "leaks cost a life" chip and the two chips never overlap.
- [ ] Closing and resuming a run in which a Hauler already leaked does not show the chip again.
- [ ] A run that holds every Hauler (or dies before wave 9) never shows the chip; the leak's life cost, gold, sound and jolt are unchanged.
