---
id: T0437
title: "The Block's leak chip reads the live rule"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T18:33:27Z
---

## Goal
Since the exit branch's One life a Block (T0429), a leaking Block costs 1 life — but the run's one-time teach chip (T0349) still pops "the Block takes 2 lives" at the first Block leak of every later run, stating a rule the run no longer has. The chip reads the live rule, so nothing on screen lies.

## Details
- First verify the chip does not already read the live cost — if it does, the task is void; say so.
- **Plain runs (the node not owned):** unchanged. The run's first Block leak pops the muted chip "the Block takes 2 lives" at the exit gate (T0349's chip, the first-leak chip's own look, T0107), once per run, then it is gone.
- **Runs with One life a Block owned:** the chip does not show at all on a Block leak — the Block's leak is no longer special (it costs the same 1 life as any other leak, and the run's first-leak chip already taught that a leak costs a life; restating it for the Block would be a second statement of the same rule).
- The run's one-time flag still sets on the run's first Block leak in both cases (a chip never shows later in the run), and it rides the run's save as it does today — a resumed run never re-shows it.
- Read the node's effect through the pure function T0429 added in core/tech.ts (import only — do not edit core/tech.ts). The chip's look, position and timing are untouched in the plain case.
- No new key, button, HUD element, sound or board mark.

## Acceptance criteria
- [ ] In a run without One life a Block, the first Block leak pops "the Block takes 2 lives" at the exit exactly as today; later Block leaks and the next run never do.
- [ ] In a run with One life a Block owned, no chip pops on any Block leak, and the run's one-time flag still sets (it never shows later in the run or after a resume).
- [ ] The chip's look, position and timing in the plain case are byte-identical to today; no new key, button, sound or mark; `npm run check` and the desktop + mobile smoke pass.
