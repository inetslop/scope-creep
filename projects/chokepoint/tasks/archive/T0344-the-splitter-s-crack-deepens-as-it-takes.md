---
id: T0344
title: "The Splitter's crack deepens as it takes damage"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T07:03:24Z
claimed_at: 2026-11-01T07:18:04Z
finished_at: 2026-11-01T07:31:11Z
---

## Goal
A Splitter is "a cracked Dot" and splits on death — its crack should read as a countdown: the closer it is to splitting, the deeper the crack, so a first-time player sees the shape that is about to break before it does.

## Details
- The Splitter's token (red circle, size 0.264) wears one crack line across its face. The line is drawn in muted ink (the token's own dark-side shade — no new color), and its alpha tracks the damage taken:
  - alpha = 0.25 + 0.75 × (1 − hp / maxHp), re-derived every frame from the enemy's live hp.
  - A full-health Splitter wears a faint 25% crack (its resting look); at half health ~63%; at the split edge it is full strength.
  - No width change, no sound, no text, no chip, no HUD.
- If the token already bakes a crack into its shape, the hook owns that line: exactly one crack line is visible at all times (align with the baked line, never add a second).
- A fresh spawn and a resumed run set the baseline silently: the crack matches the live hp from the first frame and never replays a "deepening" (the re-derived-every-frame pattern; the closest example is `src/systems/enemyHooks/sprinterRamp.ts`).
- Display only: the split rule, the Splinter, and the Splitter's numbers (hp 90, speed 1.2, gold 8, from wave 9) and the wave mix are untouched.

## Acceptance criteria
- [ ] A full-health Splitter shows the crack at ~25% alpha; as it takes hits the same line deepens, reaching full alpha just before it splits, and two Splitters at different health show different crack depths at the same time.
- [ ] Exactly one crack line is visible on the token at all times.
- [ ] On a fresh spawn or a resumed run, the crack matches the live hp from the first frame with no replay animation.
- [ ] One new enemy-hook file in `src/systems/enemyHooks/` registered in its index (one import + one line, the `sprinterRamp` pattern); the split, the Splinter, the numbers and the wave mix are unchanged; no sound, no text, no HUD element.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/crackDeep.ts` - the Splitter's crack line, always visible, alpha re-derived every frame from live hp (replaces `crackTick`'s half-hp-only line)
- delete `src/systems/enemyHooks/crackTick.ts` - superseded; its 2×-width, ≤half-hp line must go, else two crack lines show at once
- edit `src/systems/enemyHooks/index.ts` - swap `import { crackTick } from './crackTick';` (line 22) for `import { crackDeep } from './crackDeep';`, and swap the list entry `crackTick,` (line 50) for `crackDeep,` — same spot, next to `sprinterRamp`/`split`
- edit `src/art/entities.ts` - delete the `if (e.splitsInto !== undefined) { ... }` block (lines 18–30, the white baked crack + its comment); the token no longer bakes the crack, the hook draws it. Only the Splitter has `splitsInto`, so no other token changes.

### Interfaces
No types change. New export in `crackDeep.ts`:
```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { deepOf } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

/** The Splitter's crack, always on: alpha = 0.25 + 0.75 * (1 - hp / maxHp), re-derived from the live
 *  hp every frame, so a spawn or a resumed run's Splitter matches its hp from the first frame, no
 *  replay. One line per Splitter, the same path/width as the crack the token used to bake
 *  (art/entities.ts), in its own deep color. Display only: the split (split.ts), the Splinter,
 *  the numbers and the wave mix stay as they are. */
export const crackDeep: MakeEnemyHook = ({ fx, enemies }) => {
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
        // Only the enemy whose token paints a crack (the splitter; `splitsInto` is the only one),
        // alive (a dead one too, so a same-frame kill can't leave a line on a corpse).
        if (!e.active || e.def.splitsInto === undefined || e.hp <= 0) {
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
        g.setAlpha(0.25 + 0.75 * (1 - e.hp / e.maxHp));
      }
    },
    onKill({ enemy }) { drop(enemy); }, // gone the frame it dies, even on the wave's last frame
    onLeak(enemy) { drop(enemy); },
  };
};

/** One line = one Graphics: the crack drawn once at the face-center origin, moved with setPosition. */
function makeLine(fx: FxSystem, e: Enemy): Phaser.GameObjects.Graphics {
  const r = e.def.look.size * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.lineStyle(Math.max(1, r * 0.1), deepOf(e.def.look.color), 1); // the painted crack's width, its own deep
  g.beginPath();
  g.moveTo(-r * 0.55, -r * 0.1);
  g.lineTo(r * 0.05, r * 0.12);
  g.lineTo(r * 0.55, -r * 0.02);
  g.strokePath();
  g.setAlpha(0.25 + 0.75 * (1 - e.hp / e.maxHp));
  return g;
}
```
(`sprinterRamp.ts` and the deleted `crackTick.ts` are the two models: state in the closure Map, no tweens, no spawn event.)

### Steps
1. Create `crackDeep.ts` exactly as above (copy `crackTick.ts`'s imports/structure, replace the half-hp condition and the doubled width).
2. In `index.ts`: replace the `crackTick` import line and list line with `crackDeep` (one item per line, same position).
3. Delete `crackTick.ts`.
4. In `art/entities.ts`, delete only the `if (e.splitsInto !== undefined) { ... }` block and its two comment lines; leave the `hauler`/`ward`/`orb` blocks as they are.
5. Run `npm run check`.

### Pitfalls
- Leaving the white baked crack in `art/entities.ts` fails the top criterion: a full-hp Splitter would show the crack at 100%, not ~25%.
- Leaving `crackTick` registered shows two lines (its 2×-width line over this one) at ≤ half hp; "exactly one crack line" fails.
- Alpha must be re-derived from `e.hp`/`e.maxHp` every frame — no tween, no first-sight event; a resumed run's mid-damage Splitter must land at its hp's alpha from frame one.
- Width stays the painted crack's `Math.max(1, r * 0.1)` — not the old doubled `2 * ...`; no sound, text, chip or HUD.
- `drop` on `onKill`/`onLeak` and the `e.hp <= 0` drop keep no line on a corpse or a recycled slot; the Map lives in the factory closure, fresh every run.
- Selector is structural (`e.def.splitsInto === undefined`), exactly as the old hook — only the Splitter matches today.

### Tests
- none

## Result (attempt 1, yoga)

The Splitter's crack is now a live countdown: a new enemy hook `crackDeep` draws one crack line per Splitter (replacing the baked-in token crack removed from `art/entities.ts` and the superseded `crackTick` hook), and its alpha re-derives every frame from live hp — `0.25 + 0.75 × (1 − hp/maxHp)` — so a full-health Splitter shows a faint 25% crack that deepens to full strength as it nears splitting, with spawn and resumed-run Splitters matching hp from frame one. Only the Splitter is affected (selector: the `splitsInto` field, unique to it); the split rule, the Splinter, the numbers, the wave mix, and all other tokens are unchanged.

- Self-review: APPROVE
- Time: 13.1 min
- Deleted src/systems/enemyHooks/crackTick.ts, as the agent asked.

```
projects/chokepoint/game/src/art/entities.ts       | 13 ---------
 .../enemyHooks/{crackTick.ts => crackDeep.ts}      | 31 ++++++++++------------
 .../game/src/systems/enemyHooks/index.ts           |  4 +--
 3 files changed, 16 insertions(+), 32 deletions(-)
```
