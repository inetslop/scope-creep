---
id: T0099
title: The mark shows on the enemy
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
epic: E4
---

## Goal
The Mark's effect is seen on the road: a marked enemy wears the mark (T0012) — the Epic rule-changer is visible, not only felt as extra damage.

## Details
- Today an enemy marked by the Mark augment looks exactly like any other enemy; the mark (T0012: marked enemies take 25% more damage from everything) is only felt when the damage lands.
- While an enemy is marked, one small tick in the Mark's own pink (the Mark is a pink square, T0012) rides just above the enemy — the name tag's chip language (T0085) shrunk to a glyph: a small rounded chip in the Mark's pink, no text, about a third of the name chip's size.
- The tick appears the instant the mark is applied and clears the instant the mark is off that enemy — however the mark's lifetime actually works (refreshed by re-marks, moved to a new target, or timed out — the architect reads the mark's state from the existing mark system and follows it exactly). A marked enemy that dies shows no tick, and a new or resumed run never shows a stale one.
- Display only: the mark's rule is untouched (which enemy is marked, the 25% more damage from everything, the cadence). No new input, no sound, no HUD element, no pause-screen line.
- It lands in its own files — one new enemy-hook file on T0085's pattern (one hook, one small effect) — and must not edit the shared augment files, the enemy token paint or the shape library: it reuses the name chip's look as-is.
- Closest examples: the name tag (T0085) for the chip look and the hook pattern; the Mark augment (T0012) for the color and the rule.
- This is the first slice of the parked enemy-telegraph idea (IDEAS): the Mark only — later slices (the Sprinter's ramp, the Splitter's crack) park behind it.

## Acceptance criteria
- [ ] An enemy marked by the Mark augment wears one small pink tick above it from the moment it is marked until the mark is off it; re-marking refreshes the tick, a retarget clears it from the old enemy.
- [ ] The tick is the Mark's pink in the name chip's shape (T0085) at glyph size with no text; unmarked enemies render byte-identically.
- [ ] The mark's rule is untouched (same target, same 25%, same cadence); a dead enemy shows no tick; a new or resumed run shows no stale tick.
- [ ] The work lives in one new enemy-hook file (plus a small effect file only if the chip needs one) and its registration line — the shared augment files, the enemy token paint and the shape library are untouched.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop-4070)

Add a per-enemy "mark tick" — the Mark's own small pink chip riding just above each marked enemy, appearing on first mark and vanishing the moment the mark comes off (death, leak, or re-spawn). It is purely display, keyed on `e.markPct > 0` (the exact field the existing ink chevron in `enemyMarks.ts` and the damage rule read), so the mark's lifetime behavior is untouched — the tick just mirrors it.

### Files
1. **NEW** `src/systems/enemyHooks/markTick.ts` — one `markTick: MakeEnemyHook`. Full source (transcribe verbatim):

```ts
import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A marked enemy wears the Mark's own pink tick: a small rounded chip (a third the name chip's
// size, no text) riding just above the token. It appears on first mark and is gone the moment the
// mark comes off -- dead, leaked, or re-spawned -- so a dead or unmarked enemy shows nothing.

const W = 16; // chip width (the name chip body is ~2x this wide once its text is out)
const H = 9; // chip height (the name chip body is 20)
const R = 4; // corner radius, <= H/2 so it keeps the same rounded token look
const LIFT = 10; // chip centre sits this far above the token's top

/** One chip = one Graphics, drawn once at its local origin and moved with setPosition. */
function makeChip(fx: FxSystem): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(PALETTE.pinkDeep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R); // side face: peeks 2 below the body
  g.fillStyle(PALETTE.pink, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R); // body
  return g;
}

export const markTick: MakeEnemyHook = ({ fx, enemies }) => {
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
        if (!e.active || e.markPct <= 0) {
          drop(e); // dead, leaked, unmarked or re-spawned: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          g = makeChip(fx);
          chips.set(e, g);
        }
        g.setPosition(e.x, e.y - e.def.look.size * 64 - LIFT); // just above the token
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

2. **EDIT** `src/systems/enemyHooks/index.ts` — two lines, both next to its kin (`nameTag`), never at the very end:
   - Import directly after `import { nameTag } from './nameTag';`:
     `import { markTick } from './markTick';`
   - In `ENEMY_HOOKS`, on the line directly after `nameTag,`:
     `markTick,`

### Interfaces
- `markTick: MakeEnemyHook` in `markTick.ts` — built once per run by `EnemySystem`; no module-level mutable state (only geometry consts). Destructures `{ fx, enemies }` from the hook context; returns `update()`, `onKill(kill)`, `onLeak(enemy)`.
- A chip is one bare `Phaser.GameObjects.Graphics` (NOT pooled, NOT `fx.track`ed), held in a closure `Map<Enemy, ...>`. Geometry in board units about the local origin: side face `fillRoundedRect(-8, -2.5, 16, 9, 4)` in `PALETTE.pinkDeep`, body `fillRoundedRect(-8, -4.5, 16, 9, 4)` in `PALETTE.pink` (the side face peeks 2 units below — the name-chip look at a smaller scale). Created at depth `DEPTH.fx` (=40), drawn once, then moved each frame via `g.setPosition(e.x, e.y - e.def.look.size * 64 - 10)`.
- Show condition is exactly `e.active && e.markPct > 0` — the same state the damage rule and the existing ink chevron read.

### Steps
1. Create `markTick.ts` exactly as above.
2. Add the one import line and the one array line in `enemyHooks/index.ts` (both immediately after the `nameTag` entries).
3. Run `npm run check`; then `npm run smoke`.
Do nothing else: no `fx/` file, no edit to `EnemySystem`, `FxSystem`, `enemyMarks.ts`, `Enemy.ts`, augment content, painters, or `runChecks.ts`.

### Pitfalls
- Do NOT make this one shared Graphics cleared each `update()` — hooks' `update` runs only while `run.phase === 'wave'` (see `RunFlow.update`), so a chip would linger through the build/draft phase as a stale tick. Per-enemy objects destroyed in `onKill`/`onLeak` fix this: a chip never outlives its enemy even when no further `update()` follows.
- Do NOT gate on `fx.full` and do NOT route chips through `fx.track` (the one-shot auto-destroy pattern). The tick must persist while marked and survive a big wave; it is bounded by the live enemy count, not effect spam. Create directly on `fx.scene`, destroy manually in `drop`.
- Do NOT read `e.markAge` or add any timer: `markPct > 0` alone is the truth. First-mark-wins means a re-mark changes nothing, so the "refresh" is simply the chip keeping to follow — no state change needed.
- Chip colors are exactly `PALETTE.pink` / `PALETTE.pinkDeep` (the Mark's own pink from `attacks/mark.ts`) — no new palette entry, no texture, no text object.
- Draw the rect once at creation and move it with `setPosition` each frame (the `FxSystem.ring` idiom), at depth `DEPTH.fx`. Do not redraw per frame and do not forget the depth or the chip renders under the tokens/bars.
- Pooled enemies are reused: key chips by the `Enemy` instance, delete the map entry on `drop`. Both `onKill` (same-frame) and the `update` else-branch (`!e.active`) drop the chip, so neither a kill at wave end nor pool reuse can leave one behind; a new run gets a fresh hook + all pools re-`spawn()` with `markPct = 0`.
- No invariant to add: this is display-only and reads `markPct`, whose range is already guarded by `brokenMark()` in `debug/runChecks.ts`. Keeps the footprint to the one hook + one registration line.

### Tests
- `npm run check` (typecheck + lint + unit tests) — must pass.
- `npm run smoke` — desktop 1280x720 and phone 412x915: a marked enemy wears exactly one small pink chip above it from first mark until death/leak; re-marks never make it vanish or duplicate; unmarked enemies show nothing new.
- Manual acceptance if smoke lacks mark coverage: draft the Mark augment, build one tower with it, watch an enemy get marked mid-wave — the chip appears the same frame at the tower's hit, rides the enemy along the road, and is gone on its death chips; pause → resume shows no stale ticks; a fresh run shows none until the first mark.
