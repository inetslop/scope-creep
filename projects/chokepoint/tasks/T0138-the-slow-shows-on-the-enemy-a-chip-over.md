---
id: T0138
title: "The slow shows on the enemy: a chip over the slowed"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T11:23:58Z
epic: E4
---

## Goal
A slowed enemy wears a small chip, so the player sees Frost is working on it — instead of a slowed enemy looking like one of the naturally slow types (Block, Hauler, Mute).

## Details
- While an enemy is slowed (its slow is active — the Frost tower's aura, or a hit from any tower with Frost added), one small 16x9 rounded chip in Frost's ice (the mark tick's chip look, T0099) rides just above the token, and clears the instant the slow ends.
- If the same enemy is slowed while another chip already rides above it (the Mark's pink tick, T0099, or the burn's chip, T0113), the chips sit side by side above the token without overlap.
- Display only: the slow's strength, its duration, and the enemy's movement are unchanged; no new sound, key, button, or pause-screen line.
- A new enemy hook file on the markTick pattern (T0099), so it builds beside the shared augment queue; the hook reads the enemy's existing slow state, so it adds no new field.

## Acceptance criteria
- [ ] While a Frost tower's aura slows an enemy, a small ice chip rides above that enemy's token; the chip clears the instant the slow ends.
- [ ] A hit from a tower with Frost added that slows an enemy shows the same chip.
- [ ] A slowed-and-marked enemy shows the ice chip and the Mark's pink tick side by side, without overlap.
- [ ] The slow's strength, duration and the enemy's speed are byte-identical to before; no new sound, key, button, or pause-screen line.

## Design (architect, narcissus)

### Files
- create `src/systems/enemyHooks/slowTick.ts` — enemy hook: while an enemy is slowed it wears Frost's ice chip (markTick's chip look) above its token, clearing the instant the slow ends; sits right of the mark tick and burn chip when present
- edit `src/systems/enemyHooks/index.ts` — one import line, one line in `ENEMY_HOOKS`

### Interfaces
No new types. New export, mirroring `markTick`: `export const slowTick: MakeEnemyHook = ({ fx, enemies }) => { ... }` returning `{ update(), onKill({ enemy }), onLeak(enemy) }` (all as in markTick). The hook reads existing fields only: `e.slowPct`, `e.markPct`, `e.burn.left` — no new Enemy field.

### Steps
1. Copy `src/systems/enemyHooks/markTick.ts` to `src/systems/enemyHooks/slowTick.ts`, then change exactly these spots:
   - Header comment: "A slowed enemy wears Frost's ice chip, the mark tick's chip look, for as long as the slow is live (a Frost aura or a hit from any tower with Frost added); the mark's pink keeps its spot and so does the burn's, and this one shifts right beside them."
   - `PALETTE.pinkDeep` → `PALETTE.iceDeep`, and `PALETTE.pink` → `PALETTE.ice` (both lines in `makeChip`).
   - `export const markTick` → `export const slowTick`.
   - In `update()`: condition `!e.active || e.markPct <= 0` → `!e.active || e.slowPct <= 0` (fix its end-of-line comment to "no slow"); keep the rest of that block.
   - Replace the `g.setPosition(...)` line with:
     `g.setPosition(e.x + (W + 6) * ((e.markPct > 0 ? 1 : 0) + (e.burn.left > 0 ? 1 : 0)), e.y - e.def.look.size * 64 - LIFT);`
     with end-of-line comment `// right of the mark tick, then the burn chip, like burnTick shifts for the mark`.
   - Keep `W/H/R/LIFT`, `makeChip()`, the `chips` Map, `drop()`, `onKill` and `onLeak` byte-identical to markTick (same comments).
2. In `src/systems/enemyHooks/index.ts`: add `import { slowTick } from './slowTick';` after the `import { rampTick } ...` line (line 11), and add `slowTick,` directly after the `burnTick,` line in `ENEMY_HOOKS`.

### Pitfalls
- Display only: never touch `slowPct`, `slowLeft`, speed or any Enemy field; the chip's show/hide test is exactly `e.slowPct > 0` (Enemy sets `slowPct = 0` when `slowLeft` runs out, so it clears the instant the slow ends).
- Create/destroy Graphics per enemy like markTick (Map + `g.destroy()` in `drop()`); `spawn()` resets `slowPct = 0`, so no stale chip after re-spawn. Don't track them through `fx.track()`.
- The side-by-side offset is computed from enemy state (`markPct`, `burn.left`), not from the other hooks, so it never overlaps regardless of `ENEMY_HOOKS` order — don't "fix" the array ordering.
- Copy `e.y - e.def.look.size * 64 - LIFT` verbatim; no screen-pixel math, no new depth (use `DEPTH.fx`).
- A future tick hook (T0139 root chip) must shift past these three — not this task's code; don't pre-reserve space.

### Tests
none
