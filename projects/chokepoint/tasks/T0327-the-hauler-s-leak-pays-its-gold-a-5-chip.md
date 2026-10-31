---
id: T0327
title: "The Hauler's leak pays its gold: a -5 chip at the exit"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T23:47:13Z
---

## Goal
A Hauler that gets through is the run's priciest leak — a life **and** 5 gold — but T0307's teach covers only the run's first Hauler leak, and every Hauler leak after that takes its gold silently. A small "-5" chip at the exit names the cost on every Hauler leak after the first, so the priciest leak is seen paying where it pays.

## Details
- New enemy-hook file `src/systems/enemyHooks/haulerLeak.ts`, registered in `src/systems/enemyHooks/index.ts`. Closest examples: `src/systems/enemyHooks/leakEcho.ts` (a hook that fires on a leak) and the Toll leak hook (an exit moment ~100 ms after a leak, T0255).
- On every Hauler leak, one small white rounded chip just above the exit gate, in the first-leak chip's look (T0107, T0307): the HUD's own coin icon (~10 px, PALETTE yellow) with a bold "-5" in muted ink (~12 px, the chip's own text style). It pops ~100 ms after the leak, holds ~1.5 s and fades. Nothing else on the chip.
- Suppressed on the run's first Hauler leak — T0307's teach chip ("the Hauler also takes 5 gold") sits alone at that same spot there, including its 1.2 s delay when it is also the run's first leak. The hook reads the same first-Hauler-leak state T0307 owns (it survives a resume): in a resumed run where a Hauler already leaked, the next Hauler leak shows the "-5" chip and the teach chip stays seen; the first Hauler leak in a run where none has been seen shows the teach chip, not this one.
- It is a moment, not a mark: nothing stays on the board and it replaces nothing (after the one-time teach, a Hauler leak is the run's only chance to see what it cost). When the same leak also pays a Toll (T0234), the chip stacks with the Toll's gold pop in the exit chip's own arrangement — never two chips in one spot.
- No sound (leak sounds are closed, T0267), no input, no new HUD element. The gold rule is untouched: the run's gold changes exactly as it does today; the chip names the Hauler's defined cost, it does not compute or alter it.

## Acceptance criteria
- [ ] A Hauler leak that is not the run's first Hauler leak pops a small white chip — coin icon + bold "-5" — just above the exit gate, holding ~1.5 s and fading; the stats card's gold changes exactly as before this change.
- [ ] The run's first Hauler leak shows T0307's teach chip and no "-5" chip; if it is also the run's first leak, the teach chip's 1.2 s delay is unchanged.
- [ ] A resumed run in which a Hauler already leaked shows the "-5" chip on the next Hauler leak; the teach chip never re-shows.
- [ ] Non-Hauler leaks (a Dot, a Block, a boss) show no "-5" chip.
- [ ] When a Hauler leak also pays a Toll, the "-5" chip and the Toll's gold pop both show, stacked, never overlapping in one spot.
- [ ] The leak's existing thud, camera jolt and echo are unchanged; the chip is silent and takes no input.
- [ ] The chip is readable at 412x915 and 1280x720 (the exit chip's own footprint, T0307's).
