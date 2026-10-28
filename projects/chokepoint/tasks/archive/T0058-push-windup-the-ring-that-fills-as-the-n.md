---
id: T0058
title: "Push windup: the ring that fills as the next gust charges"
assignee: yoga
size: S
priority: 3
status: done
depends_on: [T0027]
attempts: 1
created: 2026-10-28T13:29:40Z
claimed_at: 2026-10-28T16:00:05Z
finished_at: 2026-10-28T16:26:49Z
epic: E4
---

## Goal
A Push tower's next shove is readable before it lands: a thin ring at the tower's base fills as the gust charges, so the player sees when the next push is coming.

## Details
- Push (T0027) gusts on a fixed cadence (2.4/2.0/1.8 s by tier). While the next gust is charging, a thin ring (~2 px) in Push's own color draws around the tower's base: it sweeps from 0° to 360° over the full charge interval, starting at the top (12 o'clock) and going clockwise, so a half-full ring means about half a gust of time left.
- The moment the gust fires, the ring completes and fades over ~100 ms, and the sweep restarts for the next charge.
- The ring sits at the tower's base (the plinth edge), inside the tower's own footprint — it does not draw the 2.5-cell gust radius, and nothing else about the tower changes.
- Closest existing look: the leak warning's pulsing red copy of the exit (T0014) — a quiet ring at the edge of a thing, in its own color. The gust's numbers, radius, cadence and sounds are untouched.

## Acceptance criteria
- [ ] Every Push tower shows a thin ring at its base that sweeps 0°→360° once per charge interval (2.4/2.0/1.8 s by tier) and, on each gust, completes, fades over ~100 ms and restarts.
- [ ] The ring is Push's own color, ~2 px, inside the tower's footprint — it does not show the 2.5-cell radius.
- [ ] No other tower shows the ring; the gust's numbers, radius, cadence and all sounds are unchanged.
- [ ] Works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/systems/PushWindup.ts` — the windup ring: one thin Graphics per Push tower at its base, redrawn each frame from the tower's cooldown (exact file below)
- edit `src/scenes/GameScene.ts` — 4 one-line wirings (import, field, construct, update)
- edit `src/debug/runChecks.ts` — one INVARIANTS line

### Interfaces
`export class PushWindup { constructor(scene: Phaser.Scene, towers: TowerSystem); update(dt: number): void; broken(): string | undefined; }` — the full file is the spec:

```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { TOWER_BODY } from '../art/textures';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { Tower } from '../entities/Tower';
import { fillRing } from '../ui/ring';
import type { TowerSystem } from './TowerSystem';

/** The completed ring fades for this long after each gust. */
const FADE_SEC = 0.1;
/** At the plinth's edge, the same base ring as Mark's (entities/towerLook.ts); board units. */
const RING_R = TOWER_BODY * CELL * 1.95;
const RING_W = 2;

/**
 * The push windup: a thin ring in Push's own color at the tower's base, sweeping from the top
 * clockwise once per charge interval, so the next gust is readable before it lands. When the
 * gust fires the ring completes, fades over FADE_SEC, and the sweep restarts. The charge is the
 * tower's own cooldown (systems/TowerSystem.ts): it counts down to the next gust and jumps back
 * to the full interval the moment the gust fires. Driven by `dt`, so it freezes while paused.
 */
export class PushWindup {
  private readonly scene: Phaser.Scene;
  private readonly towers: TowerSystem;
  private readonly color: number;
  private readonly rings = new Map<Tower, { g: Phaser.GameObjects.Graphics; prev: number; fade: number }>();

  constructor(scene: Phaser.Scene, towers: TowerSystem) {
    this.scene = scene;
    this.towers = towers;
    this.color = PALETTE[getAugment('push').look.color];
  }

  update(dt: number): void {
    for (const t of this.towers.towers) {
      if (t.spec.firstId !== 'push') continue; // only Push towers wind up
      let ring = this.rings.get(t);
      if (!ring) {
        // Just built: the sweep starts from whatever charge is already left.
        ring = { g: this.scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(t.x, t.y), prev: t.cooldown, fade: 0 };
        this.rings.set(t, ring);
      }
      const fired = t.cooldown > ring.prev + 1e-6; // the gust fired this frame: cooldown jumped back up
      ring.fade = fired ? FADE_SEC : Math.max(0, ring.fade - dt);
      ring.prev = t.cooldown;
      const interval = 1 / (t.spec.rate * t.rallyRateMul);
      const progress = Math.min(1, Math.max(0, 1 - t.cooldown / interval));
      ring.g.clear();
      if (ring.fade > 0) fillRing(ring.g, 0, 0, RING_R, RING_W, 0, Math.PI * 2, this.color, ring.fade / FADE_SEC);
      if (progress > 0.004) fillRing(ring.g, 0, 0, RING_R, RING_W, 0, progress * Math.PI * 2, this.color, 1);
    }
  }

  /** Invariant: every windup ring sits on its tower with a finite position and state. */
  broken(): string | undefined {
    for (const [t, ring] of this.rings) {
      if (!Number.isFinite(ring.g.x) || !Number.isFinite(ring.g.y) || !Number.isFinite(ring.prev) || !Number.isFinite(ring.fade))
        return `push windup at (${t.cell.col}, ${t.cell.row})`;
    }
    return undefined;
  }
}
```

### Steps
1. Verify T0027 has landed: in `src/systems/TowerSystem.ts`, the push tower's next gust must count down in `t.cooldown` (the `update()` loop: `t.cooldown -= dt`, reset to `1 / (t.spec.rate * t.rallyRateMul)` after each gust). If the gust timer lives in a different field, read that field in the `interval` line and the `fired` check — nothing else changes.
2. Create `src/systems/PushWindup.ts` exactly as above.
3. `src/scenes/GameScene.ts`: add `import { PushWindup } from '../systems/PushWindup';` after the `ProjectileSystem` import; add `windup!: PushWindup;` after `exitWarn!: ExitWarning;`; add `this.windup = new PushWindup(this, this.towers);` after the `this.rally = new RallySystem(...)` line; add `this.windup.update(dt);` after `this.rally.update(dt);`.
4. `src/debug/runChecks.ts`: add `['pushWindup.valid', (g) => g.windup.broken()],` after the `rally.valid` entry.
5. Run `npm run check`.

### Pitfalls
- Key on `spec.firstId === 'push'`, never on the new `AttackKind` name (unknown); the first augment never changes, so the guard is stable.
- No tweens, no screen pixels: the ring is redrawn in board units from state each frame, so pausing/draft freeze it for free and it scales at 412x915 and 1280x720; `RING_R` (≈27.5 units) stays inside the 32-unit cell and never draws the 2.5-cell (160-unit) gust radius.
- The file only reads tower state: gust numbers, radius, cadence and all sounds stay untouched; no other tower gets a ring.
- Towers are never destroyed mid-run, so the `Map` needs no cleanup; scene shutdown destroys the Graphics with the scene.

### Tests
none

## Result (attempt 1, yoga)

Push towers now show a thin purple windup ring at their base that sweeps 0°→360° clockwise from 12 o'clock over the full gust charge interval (2.4/2.0/1.8 s by tier), completes and fades over 100 ms on each gust, then restarts — so the next shove is readable before it lands. Added `src/systems/PushWindup.ts` (one Graphics per Push tower, redrawn from the tower's own cooldown each frame in board units), four one-line wirings in `GameScene.ts` and one new `pushWindup.valid` invariant in `debug/runChecks.ts`. The gust's numbers, radius, cadence and all sounds are untouched, and no other tower gets a ring; verified with `npm run check` and `npm run smoke` (desktop + mobile).

- Self-review: APPROVE
- Time: 26.7 min

```
projects/chokepoint/game/src/debug/runChecks.ts    |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts   |  4 ++
 projects/chokepoint/game/src/systems/PushWindup.ts | 63 ++++++++++++++++++++++
 3 files changed, 68 insertions(+)
```
