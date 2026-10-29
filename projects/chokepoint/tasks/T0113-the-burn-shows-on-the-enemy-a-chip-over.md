---
id: T0113
title: "The burn shows on the enemy: a chip over the burning"
assignee: baby-mama
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T09:55:07Z
claimed_at: 2026-10-29T10:18:13Z
epic: E4
---

## Goal
A burning enemy (Ember, T0028) shows its burn on itself: a small chip in Ember's orange above the token for as long as the burn is live, so a new player sees who is ablaze — and will keep taking tick damage — without counting hit flashes. The fourth slice of the enemy-telegraph idea (the Mark T0099, the Sprinter T0104 and the Splitter T0105 are in).

## Details
- While an enemy is burning, one small rounded chip in Ember's own orange (the mark tick's chip look, T0099 — the chip language at glyph size, no text) rides above the token, and it clears the instant the burn ends (the 3 s run out, or the enemy dies or leaks).
- A jumped burn (T0059) shows on the enemy it jumps to: any burning enemy wears the chip, jumped burns included (a jumped burn never jumps again, but it is still burning).
- A marked-and-burning enemy wears both chips: the mark's pink stays where it is (T0099) and the burn's orange stacks beside it, no overlap (one small offset — the architect's call — never a second vertical layer above what the mark tick already established).
- Re-ignition (the burn refreshed, T0028) keeps the chip on — it never blips off and back.
- Display only: the burn's rate, duration, re-ignition, jump and source-of-kill attribution are all unchanged; no sound, no input, no pause-screen line.
- A new enemy-hook file on the display-hook pattern (markTick T0099, the sprinter ramp T0104, the splitter crack T0105), registered in the enemy-hooks index — one import and one list line, beside the others. Closest existing thing is the mark tick (T0099): a state chip on an enemy; new is that it is the first chip for a damage-over-time state.

## Acceptance criteria
- [ ] Ember ignites an enemy: a small orange chip appears above the token with the ignition and stays for the burn's full duration.
- [ ] The burn ends (time runs out, or the enemy dies or leaks): the chip is gone the instant it does.
- [ ] A burning enemy dies and its burn jumps (T0059): the chip appears on the enemy the burn jumped to.
- [ ] Re-ignition refreshes the burn without the chip blipping.
- [ ] A marked-and-burning enemy wears both chips (mark's pink, burn's orange) without overlap.
- [ ] Non-burning enemies are byte-identical to today; no sound, no new input.

## Design (architect, baby-mama)

### Files
- create `src/systems/enemyHooks/burnTick.ts` - the burn chip: one orange chip above any burning enemy (model: `markTick.ts`, T0099)
- edit `src/systems/enemyHooks/index.ts` - one import line, one list line
### Interfaces
`export const burnTick: MakeEnemyHook` - a display hook; no other types, no content, no core.
### Steps
1. Create `src/systems/enemyHooks/burnTick.ts`, copy of `markTick.ts` with these exact differences: chip fill colors `PALETTE.orangeDeep` then `PALETTE.orange` (mark uses `pinkDeep`/`pink`); comment reads "A burning enemy wears Ember's own orange chip, the mark tick's chip look, for as long as the burn is live (time out, refresh, or a leap); the mark's pink keeps its spot and this one shifts right beside it, never up." In `update()`, the skip test is `if (!e.active || e.burn.left <= 0)` (mark's `e.markPct <= 0`); the position line is `g.setPosition(e.x + (e.markPct > 0 ? W + 6 : 0), e.y - e.def.look.size * 64 - LIFT);` - centered above the token when it is the only chip, offset `W + 6` board units to the right when the mark tick's pink is there, same `y` as the mark's (the same one-line `setPosition` formula, never a higher second layer). `onKill({ enemy }) { drop(enemy); }` and `onLeak(enemy) { drop(enemy); }` exactly as markTick.
2. Edit `src/systems/enemyHooks/index.ts`: add `import { burnTick } from './burnTick';` after the `burnLeap` import (line 1), and `burnTick,` after `burnLeap,` in `ENEMY_HOOKS` (line 27) - beside the other burn hook.
### Pitfalls
- Pooled `Enemy` reuse: the chips map is keyed by object; `drop` on `onKill`/`onLeak` plus the `!e.active` drop in `update` cover re-spawn, and `spawn()` resets `burn` to `left: 0` (Enemy.ts:88-90), so a respawned enemy can never wear a stale chip.
- Jumped burns need no special case: the chip tracks `burn.left > 0`; `burnLeap.onKill` calls `best.ignite(...)` on the same kill, so the new host shows its chip on the very next `update`, and the dying enemy's chip is dropped by this hook's `onKill` that same frame.
- Re-ignition keeps `burn.left > 0` (the chip map entry is never dropped while burning), so it never blips off and back.
- Display only: no sound, no input, no core rule, no pause line; non-burning enemies get no Graphics at all.
### Tests
none
DEPENS_ON: none
