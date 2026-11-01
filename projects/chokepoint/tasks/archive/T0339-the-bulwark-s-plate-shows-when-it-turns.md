---
id: T0339
title: "The Bulwark's plate shows when it turns a hit"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T04:12:33Z
claimed_at: 2026-11-01T07:48:15Z
finished_at: 2026-11-01T08:04:52Z
---

## Goal
The Bulwark's front plate already halves shots into its face, but nothing on the board says so: a first-time player should see the plate working, so the rule is read from the board the moment it happens instead of only from the Enemies reference.

## Details
- Display-only, on the board: the instant a directed shot hits a live Bulwark's face and its damage is halved by the plate (the plate factor the plate module applies), the plate lights up — a brief brightening of the plate (its own color with a touch of white, ~40% white) that fades over ~120 ms.
- One lit state per Bulwark: a new front hit while it is already lit simply keeps it lit (it does not re-bloom or stack). The plate lights the moment a front hit is halved and stays lit ~150 ms after the last such hit, so a spray of front hits reads as a steady glow, not a strobe; when front hits stop it fades. A shot into the back (the side the plate does not halve) does not light it.
- The hook rides the plate-halving path exactly where the plate factor halves a face hit's damage — the same flag-then-read pattern as the Ward's deny ring (T0335): a display-only `plated` flag on the enemy, set where the plate halves a hit and reset in `spawn()`, read and cleared by the hook. New file `src/systems/enemyHooks/bulwarkPlate.ts`, registered in `src/systems/enemyHooks/index.ts` (one import, one `ENEMY_HOOKS` line, the `wardDeny` anchor pattern).
- No sound, no input, no gameplay change: the plate's 0.5 halving and the Bulwark's numbers (hp 120, speed 0.72, gold 10, 1 life) are untouched; the plate still halves face shots and lets back shots through.

## Acceptance criteria
- [ ] A directed shot that hits a live Bulwark's face and is halved by its plate lights the plate briefly; a shot into the back does not.
- [ ] The plate lights the moment a face hit is halved and stays lit ~150 ms after the last face hit (a steady glow while face hits keep landing), fading ~120 ms after the hits stop; it never re-blooms or stacks mid-glow.
- [ ] Display-only: the plate's halving, the Bulwark's hp, speed, gold and leak cost are unchanged; no sound; no new input.
- [ ] No light on any enemy without a plate; the hook is a new file registered in the enemy-hook list; typecheck, lint, unit tests and the smoke test pass.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/bulwarkPlate.ts` — the plate light-up hook (model it on `wardDeny.ts`)
- edit `src/systems/enemyHooks/index.ts` — one import + one `ENEMY_HOOKS` line, each directly after the `wardDeny` ones
- edit `src/entities/Enemy.ts` — the display-only `plated` flag (field after line 60, reset in `spawn()`)
- edit `src/systems/EnemySystem.ts` — set `e.plated = true` in `strike()` where the plate halves a face hit

### Interfaces
No new exported types. One runtime field on `Enemy` (mirrors `deny`, line 60/108):
```ts
/** A face hit was just halved by its front plate (the Bulwark); the hook (bulwarkPlate) reads and clears it. */
plated = false;
```
In `spawn()`, after `this.deny = false;`: `this.plated = false;`

### Steps
1. `src/entities/Enemy.ts`: add the `plated = false;` field + doc after the `deny` field (line 60); add `this.plated = false;` after `this.deny = false;` in `spawn()` (line 108).
2. `src/systems/EnemySystem.ts` `strike()`: replace the `const damage = ...` line (213) with three lines that extract the plate multiplier and set the flag:
```ts
const pMul = flight && e.def.plate !== undefined ? plateMul(e.def.plate, flight.x, flight.y, e.dirX, e.dirY) : 1;
if (pMul < 1) e.plated = true; // the plate halved a face hit; the hook lights it
const damage = payload.damage * pMul * (crit ? 2 : 1);
```
3. Create `src/systems/enemyHooks/bulwarkPlate.ts` (full file below).
4. `src/systems/enemyHooks/index.ts`: `import { bulwarkPlate } from './bulwarkPlate';` after the `wardDeny` import (line 15); `bulwarkPlate,` after the `wardDeny,` array line (line 58).

```ts
import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PLATE_TEXTURE } from '../../art/textures';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

const PEAK = 0.4;    // the touch of white: the plate's own color blended ~40% toward white
const KEEP_MS = 150; // stays lit this long after the last face hit (a spray = a steady glow, not a strobe)
const FADE_MS = 120; // fades this long after the face hits stop

/** The Bulwark's plate light-up: the moment a directed shot hits its face and the plate halves
 * it (EnemySystem sets `plated`), the plate brightens — its own color with a touch of white, a
 * white wash of the plate shape over it — fading over ~120 ms. One lit state per Bulwark: a face
 * hit while already lit (or mid-fade) just keeps it lit (no re-bloom, no stack); it holds ~150 ms
 * after the last face hit, and a back hit never lights it. Display-only: the 0.5 halving and the
 * Bulwark's numbers are untouched; no sound, no input.
 */
export const bulwarkPlate: MakeEnemyHook = ({ fx, enemies }) => {
  type S = { img: Phaser.GameObjects.Image; keepUntil: number; tw?: Phaser.Tweens.Tween };
  /** One lit state per Bulwark: its white-wash image, the real-ms it holds lit until, its fade. */
  const lit = new Map<Enemy, S>();
  const drop = (e: Enemy) => {
    const s = lit.get(e);
    if (!s) return;
    lit.delete(e);
    if (s.tw) s.tw.remove();
    s.img.destroy();
  };
  const light = (e: Enemy, now: number) => {
    const s = lit.get(e);
    if (s) { // already lit or mid-fade: keep it lit — no re-bloom, no stack
      if (s.tw) { s.tw.remove(); s.tw = undefined; }
      s.img.setAlpha(PEAK);
      s.keepUntil = now + KEEP_MS;
      return;
    }
    const img = fx.scene.add.image(0, 0, PLATE_TEXTURE);
    img.setTintFill(0xffffff).setAlpha(PEAK).setDepth(DEPTH.enemies + 1); // a white wash, over the plate
    lit.set(e, { img, keepUntil: now + KEEP_MS });
  };
  const track = (e: Enemy, s: S, now: number) => {
    s.img.setPosition(e.x, e.y).setScale(e.scale).setRotation(Math.atan2(e.dirX, -e.dirY)); // rides the walking Bulwark
    if (now < s.keepUntil || s.tw) return; // steady at the peak, or already fading
    s.tw = fx.scene.tweens.add({ targets: s.img, alpha: 0, duration: FADE_MS, ease: 'Quad.easeOut', onComplete: () => {
      const cur = lit.get(e);
      if (cur && cur.img === s.img) { lit.delete(e); s.img.destroy(); }
    } });
  };
  return {
    update() {
      const now = fx.scene.time.now;
      for (const e of enemies.all) {
        if (!e.active) continue;
        if (e.plated) { e.plated = false; light(e, now); } // the plate just halved a face hit
        const s = lit.get(e);
        if (s) track(e, s, now);
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
```

### Pitfalls
- The overlay is a scene object, not a child of the enemy: it must follow the walking Bulwark each frame — position `e.x,e.y`, scale `e.scale` (=== the enemy body's `ART_SCALE*pop`, exactly matches the real plate's scale), rotation `atan2(e.dirX,-e.dirY)` (identical to the plate's).
- "Keeps it lit, no re-bloom/stack": a single `img` per Bulwark; a face hit removes any running fade tween and resets alpha to `PEAK` (no brightening tween), refreshing `keepUntil`. It never re-blooms.
- Cleanup/double-destroy: `drop()` is idempotent (guard `if(!s) return`), removes the fade tween (`tw.remove()`, not firing onComplete) and destroys the image; `onComplete` guards `cur.img === s.img` so kill/leak and natural completion never double-destroy. `onKill`+`onLeak` both call `drop`.
- Only plated enemies light: `e.plated` is set only when `pMul < 1` (the plate applies), so no light on any enemy without a plate.
- No stale light on a recycled slot: `plated` is reset in `spawn()`; a killing blow sets `plated` but the enemy is already dead/dropped, so no overlay is ever created for it.
- Depth: `DEPTH.enemies + 1` puts the wash over the plate and every enemy token, under projectiles/fx.
- Frame-rate: `keepUntil`/`FADE_MS` use `fx.scene.time.now` (real ms); the fade is a tween, so no per-frame `dt` math; `dirX/dirY` are set each `advance()`, so `atan2` is never NaN.

### Tests
none

## Result (attempt 1, yoga)

The Bulwark's front plate now flashes when it turns a hit: a directed shot that the plate halves lights the plate — a brief ~40%-white wash over the plate shape that holds lit ~150 ms after the last face hit (a steady glow under fire, no re-bloom or stacking) and fades over ~120 ms when hits stop; back shots and un-plated enemies never light it. Implemented as the new enemy hook `src/systems/enemyHooks/bulwarkPlate.ts` (registered in `enemyHooks/index.ts` after `wardDeny`), driven by a display-only `plated` flag on `Enemy` that `EnemySystem.strike()` sets exactly where the plate multiplier halves a face hit. No gameplay, sound or input changes; typecheck, lint, unit tests and the smoke test all pass.

- Self-review: APPROVE
- Time: 16.6 min

```
projects/chokepoint/game/src/entities/Enemy.ts     |  3 ++
 .../chokepoint/game/src/systems/EnemySystem.ts     |  4 +-
 .../game/src/systems/enemyHooks/bulwarkPlate.ts    | 62 ++++++++++++++++++++++
 .../game/src/systems/enemyHooks/index.ts           |  2 +
 4 files changed, 70 insertions(+), 1 deletion(-)
```
