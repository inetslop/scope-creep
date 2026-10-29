---
id: T0104
title: The sprinter shows its ramp
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
epic: E4
---

## Goal
The second slice of the enemy-telegraph idea (T0099 was the Mark's): a ramped Sprinter wears its speed on itself, so the orange chevron that gets faster the more it is hit is readable at a glance.

## Details
- While a Sprinter's current speed is above its base speed (T0006: +10% of Dart's base speed per damaging hit, capped at 190% after 10 hits; the ramp never decays, so "ramped" = it has taken at least one damaging hit), one small rounded tick rides above the token — the mark tick's chip language (T0099: a 16x9 rounded chip, no text) in the Sprinter's own orange (the Dart/Sprinter orange).
- The tick appears the moment the ramp engages (the first damaging hit, with the hit flash) and clears the instant the enemy dies.
- A Sprinter at base speed (never hit) is byte-identical to today; no other enemy is affected.
- Display only: the ramp's numbers, cap, hit flash and sounds are unchanged; no rule change, no input, no new sound.
- A new enemy-hook file on T0099's pattern (the mark tick), so it lands in its own files beside the shared-augment queue.

## Acceptance criteria
- [ ] A Sprinter that has taken at least one damaging hit shows the small orange tick above it for the rest of its life; a Sprinter that has taken no hits shows none.
- [ ] The tick clears the instant the Sprinter dies; no other enemy ever shows it.
- [ ] The ramp itself is unchanged: still +10% of Dart's base speed per damaging hit, capped at 190% after 10 hits.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/rampTick.ts` - the ramp tick: a rampler with `speed > def.speed * CELL` wears one 16x9 rounded chip in its own color above the token (same chip as markTick, orange for the Sprinter); cleared on kill/leak
- edit `src/systems/enemyHooks/index.ts` - one import line next to `markTick` (after line 8) and one `rampTick,` entry next to `markTick,` (after line 20)

### Interfaces
No type changes. New export:
```ts
export const rampTick: MakeEnemyHook; // (ctx: EnemyHookContext) => { update?, onKill?, onLeak? }
```

### Steps
1. Create `src/systems/enemyHooks/rampTick.ts`, modelled line-for-line on `markTick.ts`:
```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE, deepOf } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A rampler (one damaging hit taken, so speed > base) wears its own tick: the mark tick's
// chip (16x9 rounded, no text) in its own color, just above the token -- and above the mark
// tick's chip when it is marked too. It appears on the first damaging hit (with the hit
// flash) and is gone the moment it dies. A rampler at base speed (never hit) shows nothing.
const W = 16; // same chip as the mark tick (markTick.ts)
const H = 9;
const R = 4;
const LIFT = 10; // chip centre sits this far above the token's top, same as the mark tick

function makeChip(fx: FxSystem, color: number, deep: number): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(deep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R); // side face: peeks 2 below the body
  g.fillStyle(color, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R); // body
  return g;
}

export const rampTick: MakeEnemyHook = ({ fx, enemies }) => {
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
        if (!e.active || e.def.speedRamp === undefined || e.speed <= e.def.speed * CELL) {
          drop(e); // dead, leaked, not a rampler, or at base speed: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          const c = e.def.look.color;
          g = makeChip(fx, PALETTE[c], deepOf(c)); // the enemy's own color: orange for the Sprinter
          chips.set(e, g);
        }
        const extra = e.markPct > 0 ? H + 4 : 0; // a marked rampler already wears the pink mark tick
        g.setPosition(e.x, e.y - e.def.look.size * 64 - LIFT - extra);
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
```
2. In `src/systems/enemyHooks/index.ts`: add `import { rampTick } from './rampTick';` after the `markTick` import, and `rampTick,` after the `markTick,` line in `ENEMY_HOOKS`. Do not touch any other file.

### Pitfalls
- Never add a field to `Enemy`: "ramped" is derived each frame from `e.speed > e.def.speed * CELL`, so `spawn()` (which resets `speed` to `def.speed * CELL`) and pooling need no change; a reused Sprinter at base speed shows nothing.
- `>` is exact: after one hit `speed` is strictly greater (adding a positive float), never-hit is equal.
- A marked AND ramped Sprinter stacks the two chips (`extra`): do not move the mark tick, and do not drop `extra` — without it both 16x9 chips land on the same spot and the later-created one hides the other.
- State stays in the closure (`chips` map): a new run makes a new hook; never a module-level map.
- This is a hook, not an `fx/` effect: create the Graphics on `fx.scene` (not `fx.track`), destroy only in `drop` (called from update/onKill/onLeak); they die with the scene on shutdown, same as markTick.
- Display only: no change to `Enemy.hit()`, the ramp numbers or `waves.ts` — the tick only reads `speed`.

### Tests
none
