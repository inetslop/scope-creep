---
id: T0105
title: "The splitter's crack widens as it weakens"
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
epic: E4
---

## Goal
The third slice of the enemy-telegraph idea: the Splitter's split is its whole deal and there are no hp bars — so its crack (the line that is part of its token) widens the moment it is at half hp or less, making "about to split into two" readable before it happens.

## Details
- While a Splitter's hp is at 50% or less of its max, one small overlay line thickens the token's own crack: the same crack line, twice as thick, in the token's own darker crack color (the crack is already painted on the token; the hook only adds the widening while weak).
- Above 50% hp the hook paints nothing: the token is byte-identical to today.
- The threshold is display only: the split still happens on death from any source, at any hp (T0068), with the same two splinters at the same offsets and speed; no rule change, no input, no new sound.
- A new enemy-hook file on T0099's pattern (the mark tick), so it lands in its own files beside the shared-augment queue.

## Acceptance criteria
- [ ] A Splitter above half hp looks exactly as it does today; at 50% hp or less its crack line is visibly twice as thick, until it dies.
- [ ] The split behavior is unchanged: on death from any source, two splinters at the same offsets and speed as today.
- [ ] No other enemy is affected.

## Design (architect, inet-racing)

### Files
- create `src/systems/enemyHooks/crackTick.ts` — enemy hook: while a Splitter (any enemy with `def.splitsInto`) is at 50% hp or less, one Graphics line redraws the token's own crack, twice as thick, in the token's own deep color. Modeled on `src/systems/enemyHooks/markTick.ts` (same Map-of-Graphics-per-enemy pattern).
- edit `src/systems/enemyHooks/index.ts` — one import line and one registry line, both directly after the `markTick` entries.

### Interfaces
No new types. Exports, exactly:
```ts
export const crackTick: MakeEnemyHook; // (ctx: EnemyHookContext) => EnemyHook, from './hook'
```

### Steps
1. Create `src/systems/enemyHooks/crackTick.ts` with exactly this content:
```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { deepOf } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// The Splitter's crack is its whole deal, and there are no hp bars: at half hp or less the
// token's own crack line is redrawn twice as thick in the token's own deep color, so
// "about to split" reads before it happens. Above half hp nothing is drawn. The split
// itself is unchanged: still on death from any source (split.ts). The line's numbers copy
// the crack painted in art/entities.ts (same path, same width formula, doubled).

export const crackTick: MakeEnemyHook = ({ fx, enemies }) => {
  const lines = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = lines.get(e);
    if (!g) return;
    lines.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        // Only the enemy whose token paints a crack, at half hp or less (a dead one too,
        // so a same-frame kill can't leave a line on a corpse).
        if (!e.active || e.def.splitsInto === undefined || e.hp <= 0 || e.hp * 2 > e.maxHp) {
          drop(e);
          continue;
        }
        let g = lines.get(e);
        if (!g) {
          g = makeLine(fx, e);
          lines.set(e, g);
        }
        // The face's center: the token's face sits depth/2 above the enemy's point (art/entities.ts).
        const r = e.def.look.size * CELL;
        g.setPosition(e.x, e.y - Math.max(2, r * 0.18) / 2);
      }
    },
    onKill({ enemy }) {
      drop(enemy); // gone the frame it dies, even on the wave's last frame
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};

/** One line = one Graphics: the crack drawn once at the face-center origin, moved with setPosition. */
function makeLine(fx: FxSystem, e: Enemy): Phaser.GameObjects.Graphics {
  const r = e.def.look.size * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.lineStyle(2 * Math.max(1, r * 0.1), deepOf(e.def.look.color), 1); // twice the painted crack, in its own deep
  g.setLineCap('round');
  g.setLineJoin('round');
  g.beginPath();
  g.moveTo(-r * 0.55, -r * 0.1);
  g.lineTo(r * 0.05, r * 0.12);
  g.lineTo(r * 0.55, -r * 0.02);
  g.strokePath();
  return g;
}
```
2. Edit `src/systems/enemyHooks/index.ts`: add `import { crackTick } from './crackTick';` on the line after `import { markTick } from './markTick';`, and add `crackTick,` on the line after `markTick,` in `ENEMY_HOOKS`. Nothing else.
3. Run `npm run check`.

### Pitfalls
- The path, offsets and width must mirror the painter in `src/art/entities.ts` (crack at lines 18-30) exactly: same three points scaled by `r`, width `Math.max(1, r * 0.1)` doubled, face `depth/2 = Math.max(2, r * 0.18)/2` above `e.y`. Do not "clean up" the painter; the hook copies its numbers.
- Board units cancel to 1:1 (texture painted at 3x, enemy shown at `ART_SCALE` 1/3), so draw the line in raw board units and never `artScale()` or `setScale()` the Graphics.
- The Map is keyed by the pooled `Enemy` object: destroy the Graphics in every exit (`onKill`, `onLeak`, and the `update` drop when the condition flips) — never `destroy()` the enemy itself. A weak enemy recycled later gets a fresh line; above 50% no object exists, so the token is byte-identical to today.
- Do not touch `split.ts`, `Enemy.ts` or the painter: the split still happens on death from any source, at any hp, same splinters. Only the Splitter has `splitsInto`, so no other enemy is affected. No invariant needed (display-only, no "should never happen" state); no sound, no input.

### Tests
none (display-only hook; no core rule added or changed)
