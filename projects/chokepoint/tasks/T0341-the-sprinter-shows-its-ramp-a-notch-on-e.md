---
id: T0341
title: "The Sprinter shows its ramp: a notch on each hit that speeds it up"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T05:22:57Z
---

## Goal
A first-time player sees the Sprinter's trap as it happens: each hit that speeds it up pops a small orange notch at its base, so its own line — "melt it before it takes off" — is read on the board instead of learned by watching it get away.

## Details
- Display only. The Sprinter's ramp is untouched: it gains 0.28 cells/s per damaging hit, 2.52 up to its cap of 5.32 (10 steps). This task adds no behavior, no numbers, no wave-mix or art-file change.
- The moment a hit raises the Sprinter's speed — exactly when the existing ramp rule applies, whatever source it counts — one small notch in the Sprinter's own orange pops at the chevron's base: scales in over ~150 ms, holds ~100 ms, fades over ~150 ms, gone within 0.4 s. About a third of the token's wide (the Hauler coin's scale, T0098). The hit's white flash stays exactly as it is.
- A Sprinter at its cap shows no notches on further hits — the notches stopping reads as "it is already at top speed."
- Re-derived every frame from the enemy's current speed (the buildTeach pattern, T0319): an enemy seen for the first time — spawn, or a resumed run loading a mid-ramp Sprinter — sets the baseline silently, so nothing replays on load.
- Per enemy: two Sprintsers on the board notch independently.
- No sound, no text, no input, nothing on the HUD or cards; the notch is a transient board mark like the hit flash, never a permanent one.
- Closest examples: the Dasher's streak (T0328) and the Ward's ring (T0335) — display-only reactions re-derived each frame. New file: `src/systems/fx/sprinterRamp.ts` (the architect confirms the directory and the registration point; the quiet tower dot, T0233, shows where such a system is constructed and updated).

## Acceptance criteria
- [ ] Hitting a Sprinter below its cap pops one small orange notch at its base per hit that raises its speed; the notch is gone within ~0.4 s and the white hit flash is unchanged.
- [ ] A Sprinter at its cap (5.32 cells/s) shows no notch on further hits.
- [ ] No notch on spawn, and none when a run with mid-ramp Sprintsers resumes.
- [ ] Each Sprinter on the board notches independently.
- [ ] No new HUD element, card line, sound or text; the Sprinter's numbers and the wave mix are byte-identical.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/sprinterRamp.ts` - the hook: one small orange notch at the Sprinter's chevron base per speed rise, re-derived every frame (architect confirms: this is an **enemy hook**, not `systems/fx/` — the task's own closest examples `dasherStreak.ts` and `wardDeny.ts` are hooks, and only a hook gets the per-frame `update` + fresh-per-run state where the silent baseline lives; a file in `systems/fx/` is an event-only function with no per-frame driver)
- edit `src/systems/enemyHooks/index.ts` - one import + one `ENEMY_HOOKS` line, each right after `dasherStreak`'s (import line 20, list line 47)

### Interfaces
No new types. `export const sprinterRamp: MakeEnemyHook` — `MakeEnemyHook = (ctx: EnemyHookContext) => EnemyHook` (from `./hook`).

### Steps
1. Create `src/systems/enemyHooks/sprinterRamp.ts` exactly:

```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/** The notch's scale-in / fade-out (scene ms); the hold sits between them. */
const IN_MS = 150;
const HOLD_MS = 100;
const OUT_MS = 150;

/**
 * The Sprinter's ramp notch: the moment a hit raises its speed (the existing ramp rule in
 * Enemy.damage(), whatever source counts) one small notch in its own orange pops at the
 * chevron's base: scales in 150 ms, holds 100 ms, fades 150 ms, about a third of the token's
 * wide. Re-derived every frame from the enemy's current speed, so an enemy's first sight — a
 * spawn, or a resumed run's mid-ramp Sprinter — sets its baseline silently. One notch at a
 * time per Sprinter: a new rise restarts it from the top. At the cap the speed never rises,
 * so a capped Sprinter shows none. Ground level under the token (DEPTH.preview); rides it.
 * Display only: ramp rule, white hit flash, numbers and wave mix stay as they are.
 */
export const sprinterRamp: MakeEnemyHook = ({ scene, enemies }) => {
  /** Per-enemy: last speed seen (board units/s), and the live notch while one plays. */
  const seen = new Map<Enemy, { last: number; g?: Phaser.GameObjects.Graphics; tin?: Phaser.Tweens.Tween; tout?: Phaser.Tweens.Tween }>();
  const drop = (e: Enemy): void => {
    const s = seen.get(e);
    if (!s) return;
    seen.delete(e);
    if (!s.g) return;
    s.tin?.remove();
    s.tout?.remove();
    s.g.destroy();
  };
  const pop = (e: Enemy): void => {
    const s = seen.get(e)!;
    if (s.g) {
      s.tin?.remove(); // a new rise restarts it from the top (never stacks)
      s.tout?.remove();
      s.g.destroy();
    }
    const r = e.def.look.size * CELL;
    const w = (2 * r) / 3; // about a third of the token's wide
    const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y).setScale(0);
    g.fillStyle(PALETTE[e.def.look.color], 1);
    g.fillTriangle(-w / 2, r, w / 2, r, 0, r + w); // the wedge at the chevron's base, pointing down
    s.g = g;
    s.tin = scene.tweens.add({ targets: g, scale: 1, duration: IN_MS, ease: 'Quad.easeOut' });
    s.tout = scene.tweens.add({
      targets: g,
      alpha: 0,
      delay: IN_MS + HOLD_MS,
      duration: OUT_MS,
      ease: 'Quad.easeIn',
      onComplete: (): void => {
        const cur = seen.get(e);
        if (cur && cur.g === g) drop(e);
      },
    });
  };
  return {
    update() {
      for (const e of [...seen.keys()]) if (!e.active) drop(e); // a slot gone: killed, leaked or recycled
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== 'sprinter') continue;
        const s = seen.get(e);
        if (s === undefined) {
          seen.set(e, { last: e.speed }); // first sight: baseline, silent
          continue;
        }
        if (s.g) s.g.setPosition(e.x, e.y); // the notch rides the walking token
        if (e.speed > s.last) {
          s.last = e.speed;
          pop(e);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
```

2. In `src/systems/enemyHooks/index.ts`: add `import { sprinterRamp } from './sprinterRamp';` on the line after `import { dasherStreak } from './dasherStreak';`, and `  sprinterRamp,` on the line after `  dasherStreak,` in `ENEMY_HOOKS`.
3. `npm run check`.

### Pitfalls
- The wedge is **not rotated**: the chevron token is an unrotated up-arrow (`art/shapes.ts`); the notch sits below it (screen-down) at its base. Do not copy dasherStreak's `Math.atan2(-dirY, -dirX)` — that orients a trailing wedge for the Dasher.
- `e.speed > s.last` is strict: at the cap (5.32) a hit never raises speed → no notch. Never `>=`.
- Keep all three cleanups (`onKill`, `onLeak`, the `!e.active` sweep): the pool recycles Enemy objects; a stale `seen` entry would replay or suppress notches on the next Sprinter that reuses the slot.
- On restart, `remove()` both tweens before destroying the old `g`; a surviving fade tween's `onComplete` would destroy the new notch — hence the `cur.g === g` guard (the wardDeny pattern).
- `DEPTH.preview` (5), under the token (20): at `DEPTH.fx` (40) the wedge draws over the token instead of at its base.
- Two hits in one frame → one notch (per-frame re-derivation can't count hits; do not add a counter or touch `Enemy.damage()` — the ramp must stay byte-identical).
- No throttle: under a 4 Hz beam the notch stays lit through the ramp (a pop every 250 ms restarts it) — intended: it reads "still speeding up"; at the cap it stops.

### Tests
none (display-only; no `src/core` rule added or changed)
