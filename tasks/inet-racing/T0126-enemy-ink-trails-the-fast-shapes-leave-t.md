---
id: T0126
title: Enemy ink trails — the fast shapes leave their path
assignee: inet-racing
size: M
priority: 2
status: todo
depends_on: [T0109]
attempts: 0
created: 2026-10-27T15:42:50Z
---

## Goal
The two fastest shapes — the weaving Dart and the chasing Wedge — are the ones you lose track of at speed. A short fading ink line behind them makes their path readable, in the spirit of the readability pillar (shape and color carry meaning).

## Details
- The Dart and the Wedge — and their elite variants — leave a thin flat ink trail behind them: a 2 u line tracing the last 0.5 s of the enemy's path, sampled one point every 60 ms.
- The trail fades linearly from 35% ink alpha at the enemy's tail to 0 at the oldest point; no fill, no outline, no shadow — a flat stroke in the house ink, drawn under the entities, on the same layer the puddles are drawn (T0111).
- Only the Dart and the Wedge trail. No other enemy (Block, Sentry, Splitter, Platen, Hare, Wash) leaves a trail, and bosses and boss parts never trail.
- Pooled: at most 24 live trails (each a small buffer of 9 sample points); when the pool is exhausted the oldest trail is recycled. 60 fps on a mid-range phone.
- A dead enemy's remaining points keep fading over their remaining 0.5 s and the trail slot is released.
- No gameplay change of any kind (no damage, no slowdown, no pickup effect), no sound, no HUD, no input, no new scene.

## Acceptance criteria
- [ ] In a run, the Dart and the Wedge (elite variants included) leave a short fading ink line of at most 0.5 s of path behind them; no other enemy type does.
- [ ] A dead Dart/Wedge's remaining points fade out within 0.5 s and the trail slot is released for reuse.
- [ ] With 24 or more Darts/Wedges on screen the trails stay pooled (oldest recycled, no growth) and the smoke test still passes at 60 fps on desktop and mobile.
- [ ] No change to damage, speed, shards, HUD, sound or input; `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, inet-racing)

### Files
- create `src/systems/TrailSystem.ts` - pooled ink trails for the Dart and Wedge (all new logic lives here)
- edit `src/scenes/GameScene.ts` - five one-line insertions only (import, field, construct, update call, invariant). No other file is touched: `SpawnSystem`, `Enemy`, content and types are untouched, so no merge surface beyond GameScene.

### Interfaces
```ts
// src/systems/TrailSystem.ts
export class TrailSystem {
  constructor(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group);
  get maxTrails(): number;   // 24 - the 'ink-trail-pool' invariant reads this
  get activeCount(): number; // slots with owner !== -1
  update(dt: number): void;
}
```

### Steps
1. Create `src/systems/TrailSystem.ts` with exactly this content:

```ts
import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { Enemy } from '../entities/Enemy';

const POOL = 24;               // most live trails
const MAX_POINTS = 9;          // sample buffer per trail (9 x 60 ms ≈ 0.5 s)
const SAMPLE_INTERVAL = 0.06;  // seconds between samples
const TRAIL_LIFE = 0.5;        // seconds a point lives
const LINE_WIDTH = 2;
const TAIL_ALPHA = 0.35;
// The two fastest shapes only. Elite variants share these defs, so they trail too. Bosses are not Enemies.
const TRAIL_IDS = new Set(['wedge', 'dart']);

interface TrailPoint { x: number; y: number; age: number; }
interface Trail { g: Phaser.GameObjects.Graphics; owner: number; points: TrailPoint[]; sampleTimer: number; hasTail: boolean; tailX: number; tailY: number; }

export class TrailSystem {
  private readonly trails: Trail[] = [];
  private readonly bySerial = new Map<number, Trail>();
  private readonly enemies: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group) {
    this.enemies = enemies;
    for (let i = 0; i < POOL; i++) this.trails.push({ g: scene.add.graphics().setDepth(DEPTH.floor + 1), owner: -1, points: [], sampleTimer: 0, hasTail: false, tailX: 0, tailY: 0 });
  }

  get maxTrails(): number { return this.trails.length; }
  get activeCount(): number { let n = 0; for (const t of this.trails) if (t.owner !== -1) n += 1; return n; }

  update(dt: number): void {
    for (const t of this.trails) {
      if (t.owner === -1) continue;
      t.hasTail = false;
      for (const p of t.points) p.age += dt;
      while (t.points.length > 0 && t.points[0]!.age > TRAIL_LIFE) t.points.shift();
      if (t.points.length === 0) this.release(t);
    }
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active || !TRAIL_IDS.has(e.def.id)) continue;
      const t = this.bySerial.get(e.serial) ?? this.acquire(e.serial, e.x, e.y);
      t.hasTail = true; t.tailX = e.x; t.tailY = e.y;
      t.sampleTimer += dt;
      if (t.sampleTimer >= SAMPLE_INTERVAL) {
        t.sampleTimer -= SAMPLE_INTERVAL;
        t.points.push({ x: e.x, y: e.y, age: 0 });
        if (t.points.length > MAX_POINTS) t.points.shift();
      }
    }
    for (const t of this.trails) {
      if (t.owner === -1 || t.points.length === 0) continue;
      const g = t.g; g.clear();
      const n = t.points.length + (t.hasTail ? 1 : 0);
      if (n < 2) continue;
      for (let i = 0; i < n - 1; i++) {
        const a = i < t.points.length ? t.points[i]! : { x: t.tailX, y: t.tailY };
        const b = i + 1 < t.points.length ? t.points[i + 1]! : { x: t.tailX, y: t.tailY };
        g.lineStyle(LINE_WIDTH, PALETTE.ink, TAIL_ALPHA * (i + 1) / (n - 1));
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  /** A free slot, or the trail with the oldest point if every slot is taken. First sample lands immediately. */
  private acquire(serial: number, x: number, y: number): Trail {
    let slot = this.trails[0]!, oldestAge = -1;
    for (const t of this.trails) {
      if (t.owner === -1) { slot = t; break; }
      if (t.points[0]!.age > oldestAge) { oldestAge = t.points[0]!.age; slot = t; }
    }
    this.bySerial.delete(slot.owner);
    slot.owner = serial;
    slot.points.length = 0;
    slot.points.push({ x, y, age: 0 });
    slot.sampleTimer = 0; slot.hasTail = false;
    this.bySerial.set(serial, slot);
    return slot;
  }

  private release(t: Trail): void {
    const old = t.owner;
    t.owner = -1; t.points.length = 0; t.sampleTimer = 0; t.hasTail = false;
    t.g.clear();
    this.bySerial.delete(old);
  }
}
```

2. Edit `src/scenes/GameScene.ts` — five one-line insertions, each directly after its anchor line:
   - after `import { SpawnSystem } from '../systems/SpawnSystem';` → `import { TrailSystem } from '../systems/TrailSystem';`
   - after `private puddles!: PuddleSystem;` → `private trails!: TrailSystem;`
   - after the `this.arc = new ArcSystem(...)` line → `this.trails = new TrailSystem(this, this.spawns.enemies);`
   - after `this.puddles.update(dt);` → `this.trails.update(dt);`
   - after the `hook.addInvariant('puddle-pool', ...)` line → `hook.addInvariant('ink-trail-pool', () => (this.trails.activeCount <= this.trails.maxTrails ? null : \`${this.trails.activeCount} ink trails on screen\`));`
3. Run `npm run check`, then `npm run smoke`.
4. Do not add anything else: no `bindSceneEvents` listener, no `shutdown` code, no `Enemy`/`SpawnSystem`/content edits.

### Pitfalls
- Key trails by `e.serial` (per-spawn), never by the `Enemy` object: pooled enemies are reused and a stale reference would attach a fading trail to a fresh spawn. No object refs are stored at all — `hasTail`/`tailX`/`tailY` are refreshed each frame while the owner is alive.
- `bySerial` must be pruned in both `acquire()` (stolen slot's old owner) and `release()`, or it grows one entry per spawn for the whole run.
- Reset every field in `acquire()` — the pooled-object rule. A dead enemy simply stops appearing in the group loop: no new points, `hasTail` false, remaining points age out ≤ 0.5 s, slot released. Never hook death.
- Depth must be exactly `DEPTH.floor + 1` (the puddle layer from T0111, same expression as `PuddleSystem`), not `DEPTH.underdrawing` or `DEPTH.fx`. Flat ink stroke only: no fill, no shadow.
- Sample on accumulated `dt` (GameScene clamps it to 50 ms), never per frame — the trail must be the same length at 30 and 144 fps.
- The first segment's alpha is `TAIL_ALPHA/(n-1)` ≈ 0.04, so the fade reads as 0 at the oldest point, as specced. With 25+ live tracers the oldest live trail is recycled (its victim blinks one frame) — that is the pool working; the invariant still holds.
- No `Math.random()`, no sound, no HUD, no input, no gameplay reads the trail.

### Tests
none (presentation system; no `src/core` rule added)
