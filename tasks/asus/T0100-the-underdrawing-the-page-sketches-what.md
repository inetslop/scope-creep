---
id: T0100
title: The Underdrawing — the page sketches what is coming
assignee: asus
size: L
priority: 2
status: in-progress
depends_on: [T0098]
attempts: 1
created: 2026-10-27T10:32:47Z
claimed_at: 2026-10-27T15:11:49Z
---

## Goal
After 8:00 the page warns of what is coming: about 1.5 s before a normal enemy spawns, a faint grey pencil outline of its shape is sketched at the spawn point and fades as the enemy lands — the dense late-run swarm stays legible, and you can see what is arriving and where, instead of shapes popping into existence on top of you.

## Details
- From 8:00 (480 s) of a run onward, every normal enemy the spawn director is about to place — Wedge, Dart, Block, Sentry, Splitter, and anything that joins later (e.g. the Platen, T0091) — is announced by a sketch: a flat grey "pencil" outline (2 u stroke, PALETTE pencil-grey, no fill, no eye, no shadow, no paper-cut) of that enemy's shape, at the size it will actually appear — elites are announced at their 1.8× scale (T0005).
- The sketch is drawn at T−1.5 s, at the exact spot the enemy will occupy, and fades linearly to zero by the moment the enemy appears — it never lingers over a live enemy and never moves (it stays where it was sketched).
- Bosses get no underdrawing — they keep their own warning and nameplate (T0070, T0064). Elite enemies do get one.
- The director must preview, not guess: it has to be able to report what it is about to spawn and where, for the next ~1.5 s, without changing what, when or where anything actually spawns. The real spawn schedule stays identical — the spawn-unlock tests (T0030) and elite-schedule tests (T0066) must stay green.
- If a previewed spawn never materializes (spawn cap, scene change), its outline simply fades out with no enemy appearing.
- No gameplay effect: outlines deal no damage, have no hitbox, attract or repel nothing, and block no input. Pure legibility, rendered below the gameplay art (nearest examples: the marginalia paper layer from T0027 and the platemark ×s from T0094).
- The 8:00 gate is a single named constant; before it, the game looks exactly as it does today. Desktop and mobile are identical — it is rendering tied to the same spawn events.

## Acceptance criteria
- [ ] Before 8:00 no underdrawing is ever visible; the early game looks exactly as it does today.
- [ ] After 8:00, ~1.5 s before a normal enemy appears, a faint grey pencil outline of its shape is sketched at its exact spawn point and is fully faded by the moment the enemy lands.
- [ ] Elites are announced at their 1.8× scale; bosses are never underdrawn.
- [ ] Outlines deal no damage, have no hitbox, attract no enemies and block no input; the real spawn schedule is unchanged and the T0030/T0066 tests stay green.
- [ ] A previewed spawn that never materializes leaves an outline that fades out with no enemy appearing.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/systems/Underdrawing.ts` - single Graphics layer (depth `DEPTH.underdrawing`) holding the pencil outlines of announced spawns; cosmetic only, no listeners, no physics, no input
- edit `src/art/shapes.ts` - add `drawShapeOutline()` (outline only: no fill, no shadow, no eye, no rotation)
- edit `src/content/palette.ts` - add `pencil: 0x8a857a,` after `gray` (faint warm grey, darker than `gray`)
- edit `src/config.ts` - add `UNDERDRAW` constant and `DEPTH.underdrawing: 1` (above floor, below everything playable)
- edit `src/systems/SpawnSystem.ts` - pending queue: after the gate a decision is announced (spot picked now + sketch), released after the lead; before the gate the exact old path
- edit `src/scenes/GameScene.ts` - construct Underdrawing before SpawnSystem, pass in, call update, register invariant
- edit `docs/ARCHITECTURE.md` - one clause in the frame description (step 5): from 8:00 each director spawn is announced `leadSec` early as a pencil underdrawing at its fixed spawn spot

### Interfaces
```ts
// config.ts
/** Pencil underdrawing: from 8:00 on, a director spawn is sketched leadSec before it lands. */
export const UNDERDRAW = { atSec: 480, leadSec: 1.5 } as const;
// DEPTH: add `underdrawing: 1,` between floor and arena

// shapes.ts (reuse the file-private stroke(); inset like drawShape)
export function drawShapeOutline(g: Graphics, kind: ShapeKind, cx: number, cy: number, r: number, color: number, width: number, alpha: number, points?: number): void;

// systems/Underdrawing.ts
export class Underdrawing {
  constructor(scene: Phaser.Scene);
  get activeCount(): number;
  sketch(def: EnemyDef, elite: boolean, x: number, y: number): void; // exactly once per announced spawn
  update(dt: number): void;
}
// SpawnSystem: ctor gains `underdrawing: Underdrawing` (after marginalia)
//   private readonly pending: { def: EnemyDef; elite: boolean; x: number; y: number; at: number }[] = [];
//   private announce(def: EnemyDef, elite: boolean): void;  private releaseDue(): void;
```

### Steps
1. config.ts, palette.ts, shapes.ts. `drawShapeOutline` body: `g.lineStyle(width, color, alpha); stroke(g, kind, cx, cy, Math.max(1, r - width / 2), points);`
2. Underdrawing.ts, full class:
```ts
const START_ALPHA = 0.5;
interface Sketch { def: EnemyDef; elite: boolean; x: number; y: number; age: number; }
export class Underdrawing {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly sketches: Sketch[] = [];
  constructor(scene: Phaser.Scene) { this.g = scene.add.graphics().setDepth(DEPTH.underdrawing).setVisible(false); }
  get activeCount(): number { return this.sketches.length; }
  sketch(def: EnemyDef, elite: boolean, x: number, y: number): void { this.sketches.push({ def, elite, x, y, age: 0 }); }
  update(dt: number): void {
    for (let i = this.sketches.length - 1; i >= 0; i--) {
      const s = this.sketches[i]!;
      s.age += dt;
      if (s.age >= UNDERDRAW.leadSec) this.sketches.splice(i, 1); // removed the frame the enemy lands: never lingers
    }
    const g = this.g;
    g.clear();
    if (this.sketches.length === 0) { g.setVisible(false); return; }
    g.setVisible(true);
    for (const s of this.sketches) {
      drawShapeOutline(g, s.def.look.shape, s.x, s.y, s.def.look.radius * (s.elite ? ELITE.scale : 1), PALETTE.pencil, 2, START_ALPHA * (1 - s.age / UNDERDRAW.leadSec), s.def.look.points);
    }
  }
}
```
3. SpawnSystem: in `update()`, replace the two `this.spawn(...)` loops with `for (const id of ids) this.announce(getEnemy(id), false); for (const id of elites) this.announce(getEnemy(id), true);`, pass `this.activeCount + this.pending.length` as the director's aliveCount, and add `this.releaseDue();` right after the `if (!this.run.bossAlive)` block (before the steer loop). New methods:
```ts
private announce(def: EnemyDef, elite: boolean): void {
  if (this.run.timeSec < UNDERDRAW.atSec) { this.spawn(def, undefined, elite); return; } // pre-8:00: identical to today
  const pos = this.pickSpawnPoint(); // spot fixed at announcement, so the sketch never moves
  this.pending.push({ def, elite, x: pos.x, y: pos.y, at: this.run.timeSec + UNDERDRAW.leadSec });
  this.underdrawing.sketch(def, elite, pos.x, pos.y);
}
private releaseDue(): void {
  for (let i = this.pending.length - 1; i >= 0; i--) {
    const p = this.pending[i]!;
    if (this.run.timeSec < p.at) continue;
    this.pending.splice(i, 1);
    this.spawn(p.def, { x: p.x, y: p.y }, p.elite); // null from a full pool: sketch just fades out, no enemy
  }
}
```
4. GameScene: `private underdrawing!: Underdrawing;`; `this.underdrawing = new Underdrawing(this);` before the spawns line; add the arg to the `SpawnSystem` ctor call; `this.underdrawing.update(dt);` immediately after `this.spawns.update(dt);`; in `registerInvariants()` add `hook.addInvariant('underdrawing-count', () => (this.underdrawing.activeCount <= 240 ? null : `${this.underdrawing.activeCount} underdrawing sketches active`));` and add `'underdrawing-count'` to the `INVARIANTS` array.
5. ARCHITECTURE.md sentence; then `npm run check` and `npm run smoke`.

### Pitfalls
- RNG stream: the position draw (`pickSpawnPoint`) must happen exactly once per decision, after all director draws, in the same order as today; the sketching path must never call `run.rng` (no wobble/jitter) or the whole run diverges.
- Gate: before 480 s `pending` is always empty, so `activeCount + pending.length` equals today's aliveCount and the early game is byte-identical — `announce()` must take the immediate path there.
- Bosses, split children and Frame minions spawn via direct `spawn(def, at)` calls that bypass `announce()` — that *is* the no-boss-underdrawing rule; add no special cases.
- Pool exhaustion: `spawn()` returning null is final (pending entry already spliced); never retry or the schedule shifts.
- Underdrawing adds no scene listeners, so nothing to remove on SHUTDOWN; the only cross-restart hazard is forgetting the `INVARIANTS` entry (`hook.addInvariant` is window-global and name-replaces).
- Frame-rate: everything is `dt`/`run.timeSec` (seconds); both freeze correctly while paused since `run.timeSec` only advances in `GameScene.update`. World-space rendering: no HUD/input changes, so 412x915 and 1280x720 are identical for free.

### Tests
- none (director untouched — T0030/T0066 stay green by construction; no src/core rule added)
