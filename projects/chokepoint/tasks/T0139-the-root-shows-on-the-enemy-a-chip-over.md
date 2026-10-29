---
id: T0139
title: "The root shows on the enemy: a chip over the rooted"
size: S
priority: 2
status: todo
depends_on: [T0138]
attempts: 0
created: 2026-10-29T11:23:58Z
epic: E4
---

## Goal
A rooted (fully stopped) enemy wears a small chip, so the player sees the Anchor is holding it — and can tell a rooted enemy from a Dasher that has simply paused.

## Details
- While an enemy is rooted (fully stopped by an Anchor — the Anchor tower's pulse, or a hit from any tower with Anchor added), one small 16x9 rounded chip in Anchor's pink (the mark tick's chip look, T0099) rides just above the token, and clears the instant the root wears off.
- If the same enemy is rooted while another chip already rides above it (the Mark's pink tick, T0099, or the slow's chip, T0138), the chips sit side by side above the token without overlap.
- Display only: the root's duration, the enemy's stop, and the post-root root-resistance (the 2 s shrug, core/root.ts) are unchanged; no new sound, key, button, or pause-screen line.
- A new enemy hook file on the markTick pattern (T0099), so it builds beside the shared augment queue; the hook reads the enemy's existing root state, so it adds no new field.

## Acceptance criteria
- [ ] While an Anchor tower's pulse roots an enemy, a small pink chip rides above that enemy's token; the chip clears the instant the root wears off.
- [ ] A hit from a tower with Anchor added that roots an enemy shows the same chip.
- [ ] A rooted-and-marked enemy shows both chips (the Anchor's and the Mark's) side by side, without overlap.
- [ ] The root's duration, the enemy's stop, and the post-root resistance are byte-identical to before; no new sound, key, button, or pause-screen line.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/rootTick.ts` — the rooted chip hook, on the markTick pattern (T0099): one 16x9 pink chip per rooted enemy, same `makeChip` as markTick, cleared when the root wears off
- edit `src/systems/enemyHooks/index.ts` — `import { rootTick } from './rootTick';` (after the `rampTick` import) and one line `rootTick,` in `ENEMY_HOOKS`, right after the `markTick,` line
- edit `src/systems/enemyHooks/markTick.ts` — its chip's x becomes the row formula below (add `rootLeft` to the row count; ~1–2 lines, its y unchanged)
- edit `src/systems/enemyHooks/slowTick.ts` — same: add `(e.rootLeft > 0 ? 1 : 0)` to its row count `n` (1 line; its rank and y unchanged)

### Interfaces
No new types. New export only: `export const rootTick: MakeEnemyHook` from `rootTick.ts`.

Row rule (all three tick hooks agree on it): chips sit in a row above the token in the order **mark, slow, root**, 20 apart centre-to-centre (chips are 16 wide → 4px gap), the row centred on the token. For a hook: `n` = how many of {mark: `e.markPct > 0`, slow: `e.slowPct > 0`, root: `e.rootLeft > 0`} show; `rank` = how many of those come before this hook in the order; x = `e.x + (rank - (n - 1) / 2) * 20`. mark has rank 0, slow has rank `(e.markPct > 0 ? 1 : 0)`, root has rank `(e.markPct > 0 ? 1 : 0) + (e.slowPct > 0 ? 1 : 0)`. y stays `e.y - e.def.look.size * 64 - LIFT` (LIFT = 10), exactly as markTick/slowTick already place theirs.

`rootTick.ts` in full:
```ts
import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A rooted enemy (rootLeft > 0) wears the Anchor's pink chip: the mark tick's look, riding just
// above the token, last in the status-chip row (mark, slow, root). Gone the moment the root ends.
const W = 16;
const H = 9;
const R = 4;
const LIFT = 10;
const STEP = 20;

function makeChip(fx: FxSystem): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(PALETTE.pinkDeep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R);
  g.fillStyle(PALETTE.pink, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R);
  return g;
}

export const rootTick: MakeEnemyHook = ({ fx, enemies }) => {
  const chips = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = chips.get(e);
    if (!g) return;
    chips.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        if (!e.active || e.rootLeft <= 0) {
          drop(e);
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          g = makeChip(fx);
          chips.set(e, g);
        }
        const n = (e.markPct > 0 ? 1 : 0) + (e.slowPct > 0 ? 1 : 0) + 1; // +1: this chip
        const rank = (e.markPct > 0 ? 1 : 0) + (e.slowPct > 0 ? 1 : 0);
        g.setPosition(e.x + (rank - (n - 1) / 2) * STEP, e.y - e.def.look.size * 64 - LIFT);
      }
    },
    onKill({ enemy }) {
      drop(enemy);
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};
```
markTick's final x line: `g.setPosition(e.x - (n - 1) * 10, e.y - e.def.look.size * 64 - LIFT); // leftmost of the row` with `const n = (e.markPct > 0 ? 1 : 0) + (e.slowPct > 0 ? 1 : 0) + (e.rootLeft > 0 ? 1 : 0);` (rank 0).

### Steps
1. T0138 must have landed first: read its `markTick.ts`/`slowTick.ts` as they now are (it owns the mark/slow row).
2. Create `rootTick.ts` exactly as above; add its import and registry line in `index.ts` next to `markTick`.
3. In `markTick.ts` and `slowTick.ts`, change only the x expression (and the count `n`) to the row rule — add `(e.rootLeft > 0 ? 1 : 0)` to `n`; nothing else moves.
4. `npm run check`.

### Pitfalls
- The row formula must stay in sync across all three files; one stale count re-overlaps the chips. Edit only the count/x in the two existing files, keep their y and everything else byte-identical.
- Condition is `e.rootLeft > 0` only — not `rootImmuneLeft` (the 2s shrug shows nothing), and the root timers are never touched: display only, no core change.
- Pooling: chips key off the pooled `Enemy`; `spawn()` resets `rootLeft = 0`, so a recycled enemy's chip drops on the next frame; `onKill`/`onLeak` drop it immediately, as markTick does.
- The chip is one `Graphics` at `DEPTH.fx` (above the enemy depth), painted once, moved with `setPosition` — never a text object, no new texture.
- No new sound, key, button, pause-screen line, invariant or core rule; no test.

### Tests
none
