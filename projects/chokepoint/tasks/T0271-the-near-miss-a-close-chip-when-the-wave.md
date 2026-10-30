---
id: T0271
title: "The near miss: a 'close' chip when the wave's last kill stops an enemy at the exit"
assignee: baby-mama
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T09:22:16Z
claimed_at: 2026-10-30T09:46:49Z
---

## Goal
A wave won by a hair is felt as a hair: when the last enemy of a wave is killed a short distance from the exit, the board says "close," so the player feels how much that wave just cost — the leak warning (T0014) teaches the danger before, the chip names it after.

## Details
- When a wave ends because its final enemy is killed (its death is what ends the wave — no further enemy alive or still to come) and that enemy's death spot was within 1.5 cells of the exit, one small "close" chip pops above the kill spot and holds for ~1 s, then fades. The chip is the new-enemy name tag's chip look (T0085) with the word "close" in muted ink.
- The distance is the remaining road distance the killed enemy still had to walk to the exit gate — the same quantity the leak warning (T0014) turns into its 3 s estimate. Within 1.5 cells is a near miss; farther is not.
- The chip is the only addition. The wave's existing last-kill ring (T0229) plays exactly as it does today, and the exit's clean/leak treatment is unchanged. No sound, no input, no new card.
- A wave that ends on a leak (its final enemy gets through) shows no chip.
- The chip is transient (clears on its own). If two waves in a row end in near misses, each shows its own chip at its own kill spot.
- It is a board chip, so it shows identically on desktop and mobile and is not a HUD element.

## Acceptance criteria
- [ ] A wave whose final enemy is killed within 1.5 road-cells of the exit shows one small "close" chip above the kill spot for ~1 s; the last-kill ring (T0229) is unchanged.
- [ ] A wave whose final enemy is killed farther than 1.5 cells from the exit shows no chip.
- [ ] A wave that ends on a leak shows no chip.
- [ ] No sound, no input, no new HUD card or line; the board is otherwise unchanged.

## Design (architect, baby-mama)

### Files
- create `src/systems/enemyHooks/nearMiss.ts` — new enemy hook `nearMiss`: on the wave-ending kill, if the dead enemy was within 1.5 cells of the exit, pop the name tag's chip with the word "close" above the kill spot
- edit `src/systems/enemyHooks/index.ts` — register the hook: one import line + one line in `ENEMY_HOOKS`, next to `waveClose`

### Interfaces
No new types or signatures. `nearMiss: MakeEnemyHook` from `nearMiss.ts`; it reuses the existing `nameLabel(fx, x, y, name)` from `src/systems/fx/nameLabel.ts` (its text is already `cssColor(PALETTE.muted)`, the chip already holds ~1 s and fades via `fx.track` — no new fx file, no new art, no new sound).

### Steps
1. Create `src/systems/enemyHooks/nearMiss.ts` exactly:

```ts
import { CELL } from '../../config';
import { nameLabel } from '../fx/nameLabel';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** A wave whose last kill dies within 1.5 cells of the exit: the name tag's chip says "close" above the kill spot. */
export const nearMiss: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    if (ctx.board.path.length - enemy.distance > 1.5 * CELL) return;
    nameLabel(ctx.fx, enemy.x, enemy.y, 'close');
  },
});
```

2. Edit `src/systems/enemyHooks/index.ts`: add `import { nearMiss } from './nearMiss';` on the line after the `waveClose` import, and add `nearMiss,` on the line after `waveClose,` inside the `ENEMY_HOOKS` array (kin go together; never the end of the list).
3. `npm run check`.

### Pitfalls
- The three guards mirror `waveClose.ts:8-12` and are all load-bearing: without `spawningDone`/`aliveCount !== 1` the chip fires on mid-wave kills; without `ctx.run.over` it fires into game over. Do not weaken them.
- The chip must live only in `onKill` — leaks run through `onLeak`, so a wave that ends on a leak shows no chip. Never add an `onLeak` or an `update` here.
- Reuse `nameLabel` — do not copy its body into a new `systems/fx/closeChip.ts`; the task pins the chip's look to the name tag exactly (its text is already muted, its `fx.full` guard and self-destructing `fx.track` are inside it).
- Distance is board units: `ctx.board.path.length - enemy.distance` (the same quantity `ExitWarning.inRange` divides by speed); threshold is `1.5 * CELL`, `<=` counts as near miss. `enemy.x`/`enemy.y` are the kill spot in board units — no screen/CSS-pixel math.
- No module-level state in the hook (fresh closure per run): two near-miss waves in a row each call `nameLabel` and get their own chip.
- Do not touch `waveClose.ts` (the T0229 ring must play unchanged), `EnemySystem`, `Sfx`, HUD files, or `debug/runChecks.ts`.
### Tests
none
