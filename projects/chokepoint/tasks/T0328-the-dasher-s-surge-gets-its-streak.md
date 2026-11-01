---
id: T0328
title: "The Dasher's surge gets its streak"
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T01:14:01Z
claimed_at: 2026-11-01T01:24:38Z
---

## Goal
The only dashing enemy's burst has no motion feedback once it leaves its white wind-up — a 3-cell surge in 0.3 s with no trail. Give the Dasher's surge a short purple streak trailing behind it, so the burst reads as speed the instant it happens.

## Details
- Only while a Dasher is in its dash (the 0.3 s surge of its `dashCycle`): a short flat purple streak trails behind the token along the road, opposite to its direction of travel.
- The Dasher's own purple at ~40% alpha — a single flat shape, widest at the token and tapering to a point at the tail, about one cell long (no color gradient, no glow, no outline; the board FX's "soft and quick" language).
- It fades out over ~100 ms the moment the dash ends and the Dasher returns to crawling.
- No sound, no input, no gameplay change. The Dasher's numbers, its white wind-up flash, its token look and its 3-cell dash distance are all untouched.
- A new per-frame enemy hook in its own file (`src/systems/enemyHooks/`), the same pattern as the Mute's silence ring and the boss's phase wind-up ring — a per-frame Graphics draw that shows while a condition holds and reads the enemy's own dash state. Add its one registration line to the enemy hooks index (`src/systems/enemyHooks/index.ts`). Nothing else changes.

## Acceptance criteria
- [ ] While a Dasher is in its 0.3 s dash, a short flat purple streak (its own color, ~40% alpha) trails behind it along the road, about one cell long, tapering to a point at the tail.
- [ ] The streak is absent while the Dasher crawls or winds up (the white telegraph is unchanged), and it fades out over ~100 ms the moment the dash ends.
- [ ] No sound, no new input, no gameplay change: the Dasher's hp/speed/gold, its 3-cell dash distance, its white wind-up flash and its token look are unchanged outside the streak.
- [ ] Only a new enemy-hook file and its one registration line are touched; the streak is drawn on the board only (no HUD element, no status chip over the token).

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/dasherStreak.ts` - the Dasher's dash streak: while `e.dashLeg === 'dash'`, a flat purple triangle (its own color, 40% alpha) trails one cell behind the token opposite to travel; fades over 0.1 s (sim dt) when the dash ends
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` entry, both directly after the `bossPhase` lines (lines 18 and 44)

### Interfaces
```ts
// dasherStreak.ts — full file (model on bossPhase.ts):
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/** Streak length (board units): one cell along the road. */
const LEN = CELL;
/** Seconds the streak takes to fade out once the dash ends (simulation dt). */
const FADE_SEC = 0.1;
/** Resting alpha: the Dasher's own purple, one flat shape. */
const ALPHA = 0.4;

/**
 * The Dasher's surge trail: while a Dasher is in its 0.3 s dash leg, a flat streak in its own
 * purple trails one cell behind the token, widest at the token and tapering to a point at the
 * tail — so the burst reads as speed the instant it happens. A per-frame draw on the enemy's
 * own state (`dashLeg`), ground level under the token (DEPTH.preview); it fades out over
 * 100 ms the moment the dash ends. No sound, no input, no gameplay change: the Dasher's
 * numbers, white wind-up and token look stay as they are.
 */
export const dasherStreak: MakeEnemyHook = ({ scene, enemies }) => {
  /** One live streak per dashing Dasher: its Graphics and its fade (1 while dashing). */
  const streaks = new Map<Enemy, { g: Phaser.GameObjects.Graphics; a: number }>();
  const drop = (e: Enemy): void => {
    const s = streaks.get(e);
    if (!s) return;
    streaks.delete(e);
    s.g.destroy();
  };
  /** Tip on the token; local +X rotated to point opposite the travel (as enemyMarks.ts does). */
  const draw = (e: Enemy, s: { g: Phaser.GameObjects.Graphics; a: number }): void => {
    s.g.setPosition(e.x, e.y);
    s.g.setRotation(Math.atan2(-e.dirY, -e.dirX));
    s.g.clear();
    s.g.fillStyle(PALETTE[e.def.look.color], ALPHA * s.a);
    s.g.fillTriangle(0, 0, LEN, e.def.look.size * CELL, LEN, -e.def.look.size * CELL);
  };
  return {
    update(dt) {
      for (const e of [...streaks.keys()]) if (!e.active) drop(e); // a slot gone without a kill
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== 'dasher') continue;
        const s = streaks.get(e);
        if (e.dashLeg === 'dash') {
          if (s === undefined) streaks.set(e, { g: scene.add.graphics().setDepth(DEPTH.preview), a: 1 });
          draw(e, streaks.get(e)!);
        } else if (s) {
          s.a -= dt / FADE_SEC; // the crawl follows; the tip rides on it while it fades
          if (s.a <= 0) drop(e); else draw(e, s);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); }, // gone the frame it dies, mid-dash included
    onLeak(enemy) { drop(enemy); },
  };
};
```
`index.ts` — add `import { dasherStreak } from './dasherStreak';` after the `bossPhase` import, and `dasherStreak,` after the `bossPhase,` line in `ENEMY_HOOKS`.

### Steps
1. Create `dasherStreak.ts` exactly as above.
2. Add the two registration lines in `index.ts` at the `bossPhase` anchor.
3. `npm run check`; play one wave at wave 5+, watch a Dasher surge: streak on during the 0.3 s dash, gone (100 ms fade) on the first crawl frame.

### Pitfalls
- Fading must run on simulation `dt`, never `scene.time` or a tween, so it stays 0.1 s of road-time at 2× speed; the bossPhase ring is the precedent (reads the enemy's own clock).
- `drop()` must run from `onKill`/`onLeak` AND the inactive sweep — a Graphics left in the Map would draw at a dead slot's stale position (pooled enemies are reused); `g.destroy()` never `setVisible(false)`.
- `fillTriangle` is 6 points after a `fillStyle` (enemyMarks.ts pattern): no gradient/glow/outline, base width = `look.size * 2 * CELL` (token diameter) so it is widest at the token and tapers to the point at the tail.
- Depth is `DEPTH.preview` (under the token); do not touch the white telegraph (`Enemy.advance` tint), `dashCycle` numbers, or `Enemy` itself.

### Tests
- none
