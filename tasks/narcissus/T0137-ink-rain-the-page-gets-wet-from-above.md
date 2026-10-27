---
id: T0137
title: Ink rain — the page gets wet from above
assignee: narcissus
size: M
priority: 2
status: todo
depends_on: [T0119, T0121, T0122, T0125, T0126, T0127, T0131, T0134, T0136]
attempts: 0
created: 2026-10-27T18:14:35Z
---

## Goal
After 10:00 the page starts raining ink: drops fall from the top of the page and splat into slow puddles — the earliest late-run hazard on the clock, and the warning that the Gutter (14:00) and Tide (16:00) are coming.

## Details
- From 10:00 (600 s), ink drops fall from the top of the page: one every 1.4 s (seeded jitter ±0.2 s), at a random x inside the crop-safe rect (the same rect the spawn director uses), falling straight down at 150 u/s. A drop is a small flat ink circle (radius 6, no outline or shadow — the flat idiom of the enemy trails, T0126).
- A drop that reaches the bottom of the safe rect splats and is gone, leaving a flat ink puddle 100 u across: 3.0 s life, fading over the last 0.5 s, slowing the player 25% while their center is inside — the Wash puddle idiom (T0111) at a stronger value — and it combines with other slows exactly the way two Wash puddles do today.
- Pooled: at most 8 live puddles, oldest recycled.
- The drops are weather, not enemies: no contact damage, untargetable, no collision, unaffected by weapons.
- Sound: a splat plays the existing paper slap (T0099) at half gain, throttled to one per 300 ms.
- Teaching: the first splat of a run prints the marginalia "THE PAGE RAINS" (the T0027 idiom, 2 s).
- The schedule is a pure module + unit tests in the crop/gutter pattern (T0045/T0099): no drops before 600 s, the first at 600 s, ~1.4 s spacing (within the jitter) after, seeded-deterministic.
- No new key, HUD element or scene.

## Acceptance criteria
- [ ] Before 10:00 nothing rains; from 10:00 a drop falls about every 1.4 s from inside the safe rect, and the first splat prints "THE PAGE RAINS".
- [ ] Each splat leaves a 100 u ink puddle lasting 3.0 s; a player standing inside (center) moves 25% slower, two puddles at once combine the way two Wash puddles do, and the puddle fades out on schedule.
- [ ] Drops deal no damage and cannot be shot; at most 8 puddles are on the page at once.
- [ ] The schedule is seeded-deterministic with no drops before 600 s (unit tests); no new key, HUD element or scene.

## Design (architect, desktop)

### Files
- create `src/core/inkRain.ts` - pure rain schedule (`INK_RAIN` constants, `InkRainSchedule`), crop/gutter pattern
- create `src/systems/InkRainSystem.ts` - pooled drops + splats; puddles ride the existing `PuddleSystem`
- create `tests/core/inkRain.test.ts` - schedule unit tests
- edit `src/systems/PuddleSystem.ts` - `drop()` gains an optional texture; add `countOwner()`
- edit `src/audio/Sfx.ts` - add `splat()` (the existing paper slap at half gain, 300 ms throttle)
- edit `src/art/textures.ts` - add `TEX.inkPuddle` (flat ink circle, 100 px)
- edit `src/scenes/GameScene.ts` - construct, update call, 2 invariants, imports

### Interfaces
```ts
// src/core/inkRain.ts
export const INK_RAIN = { startSec: 600, periodSec: 1.4, jitterSec: 0.2, fallSpeed: 150, dropRadius: 6, puddleRadius: 50, puddleLifeSec: 3, puddleFadeSec: 0.5, puddleSlowMul: 0.75, maxPuddles: 8 } as const;
export const INK_RAIN_OWNER = 0; // enemy serials start at 1 (entities/serial.ts), so 0 is never a real Wash
export class InkRainSchedule { constructor(); update(timeSec: number, rng: Rng): number } // drops starting this tick; 0 before 600 s
// src/systems/InkRainSystem.ts
export class InkRainSystem {
  constructor(scene: Phaser.Scene, run: RunState, puddles: PuddleSystem, marginalia: Marginalia, sfx: Sfx);
  update(dt: number): void;
  get dropCount(): number; get maxDrops(): number; get puddleCount(): number; // puddleCount delegates to puddles.countOwner(INK_RAIN_OWNER)
}
// PuddleSystem: drop(x: number, y: number, ownerSerial: number, def: PuddleDef, tex: string = TEX.puddle): void; countOwner(ownerSerial: number): number
// Sfx: splat(): void
```
### Steps
1. Write `src/core/inkRain.ts`: header comment modeled on `gutter.ts`; `INK_RAIN` + `INK_RAIN_OWNER` exactly as above; and
```ts
export class InkRainSchedule {
  private nextAt = INK_RAIN.startSec;
  /** How many drops start falling at `timeSec` (0 before startSec). */
  update(timeSec: number, rng: Rng): number {
    let count = 0;
    while (timeSec >= this.nextAt) {
      count += 1;
      this.nextAt += INK_RAIN.periodSec + rng.range(-INK_RAIN.jitterSec, INK_RAIN.jitterSec);
    }
    return count;
  }
}
```
2. Write `src/systems/InkRainSystem.ts` modeled on `PuddleSystem.ts`. Imports (house order): `type Phaser`, `TEX` from `../art/textures`, `type Sfx` from `../audio/Sfx`, `ARENA_SIZE, DEPTH` from `../config`, `PALETTE`, `type PuddleDef` from `../content/types`, `cropSafeFraction` from `../core/crop`, `INK_RAIN, INK_RAIN_OWNER, InkRainSchedule` from `../core/inkRain`, `type RunState`, `type Marginalia`, `type PuddleSystem`. Constants: `const DROP_POOL = 24;` and `const RAIN_PUDDLE: PuddleDef = { periodSec: 0, radius: INK_RAIN.puddleRadius, lifeSec: INK_RAIN.puddleLifeSec, fadeSec: INK_RAIN.puddleFadeSec, maxAlive: INK_RAIN.maxPuddles, slowMul: INK_RAIN.puddleSlowMul };` (comment: periodSec unused — the rain has its own schedule). `interface Drop { img: Phaser.GameObjects.Image; active: boolean; x: number; y: number; }`. Constructor stores the four deps, then `DROP_POOL` × `{ img: scene.add.image(0, 0, TEX.dot).setTint(PALETTE.ink).setOrigin(0.5).setScale(INK_RAIN.dropRadius / 4).setDepth(DEPTH.pickups).setVisible(false), active: false, x: 0, y: 0 }` (TEX.dot is radius 4, so scale 1.5 = radius 6, flat, no outline or shadow). Getters: `dropCount` counts active; `maxDrops` is `this.drops.length`; `puddleCount` is `this.puddles.countOwner(INK_RAIN_OWNER)`.
```ts
  update(dt: number): void {
    const due = this.schedule.update(this.run.timeSec, this.run.rng);
    for (let i = 0; i < due; i++) this.spawnDrop();
    const bottom = this.safeHalf();
    for (const d of this.drops) {
      if (!d.active) continue;
      d.y += INK_RAIN.fallSpeed * dt;
      if (d.y >= bottom) { this.splat(d.x, bottom, d); continue; }
      d.img.setPosition(d.x, d.y);
    }
  }
  private safeHalf(): number { return (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec); }
  private spawnDrop(): void {
    const d = this.takeDrop();
    const half = this.safeHalf();
    d.x = this.run.rng.range(-half, half); // seeded, inside the crop-safe rect
    d.y = -half;
    d.active = true;
    d.img.setPosition(d.x, d.y).setVisible(true);
  }
  private splat(x: number, y: number, d: Drop): void {
    d.active = false;
    d.img.setVisible(false);
    this.puddles.drop(x, y, INK_RAIN_OWNER, RAIN_PUDDLE, TEX.inkPuddle);
    this.sfx.splat();
    if (!this.taught) { this.taught = true; this.marginalia.freeNote('THE PAGE RAINS', x, y - 70); } // 2 s life is Marginalia's
  }
  private takeDrop(): Drop { // round-robin, oldest visible reused first (FxSystem idiom)
    const i = this.dropCursor;
    this.dropCursor = (i + 1) % DROP_POOL;
    return this.drops[i]!;
  }
```
3. `PuddleSystem.ts`: change `drop()`'s last parameter to `tex: string = TEX.puddle` and make its final line `p.img.setTexture(tex).setPosition(x, y).setAlpha(1).setVisible(true);`; after `activeCount` add `countOwner(ownerSerial: number): number` that counts `p.active && p.owner === ownerSerial`.
4. `Sfx.ts`: add `private lastSplatAt = 0;` next to `lastSlamAt`; after `gutterSlap()` add
```ts
  /** Wet ink splat as a rain drop hits the page: the paper slap at half gain, one per 300 ms. */
  splat(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastSplatAt < 300) return;
    this.lastSplatAt = now;
    this.noise(0.08, 0.055, 800, 'lowpass');
  }
```
5. `textures.ts`: after the `puddle:` entry in `TEX` add `inkPuddle: 'inkPuddle',` (comment: flat ink puddle, 100 px = 100 u across, no outline no shadow); after the `TEX.puddle` draw block add `graphicsTexture(scene, TEX.inkPuddle, 100, 100, (g) => { g.fillStyle(PALETTE.ink, 0.35); g.fillCircle(50, 50, 50); });`
6. `GameScene.ts`, each line placed beside its gutter/crop sibling: import `INK_RAIN` from `../core/inkRain` (after the `core/bestScore` import) and `InkRainSystem` from `../systems/InkRainSystem` (after the GutterSystem import); field `private inkRain!: InkRainSystem;` after the `gutter` field; in `create()` `this.inkRain = new InkRainSystem(this, this.run, this.puddles, this.marginalia, this.sfx);` after the gutter construction; in `update()` `this.inkRain.update(dt);` after `this.gutter.update(dt);`; in `registerInvariants()` after the `gutter-band` invariant add `hook.addInvariant('ink-rain-drops', () => (this.inkRain.dropCount <= this.inkRain.maxDrops ? null : ...));` and `hook.addInvariant('ink-rain-puddles', () => (this.inkRain.puddleCount <= INK_RAIN.maxPuddles ? null : ...));`
7. Run `npm run check`.
### Pitfalls
- No physics body for drops (plain `scene.add.image`) — that is what makes them untargetable/collision-free; never `physics.add`.
- The schedule must draw the rng exactly once per drop, never before 600 s: drop x's also come from `run.rng`, so any early draw desyncs `?seed` runs. No `Math.random()`.
- Everything is driven by `run.timeSec`/`dt`: pausing freezes drops mid-fall and resumes without a jump; the 50 ms dt clamp bounds any catch-up (at most 1 drop/frame).
- Rain puddles share the 12-slot Wash pool but owner 0's per-owner cap (`maxAlive: 8`) keeps rain at ≤ 8; a splat while the pool is full recycles the globally oldest puddle (fine).
- Pre-12:00 the safe rect equals the arena, so splat puddles at the bottom edge are half-clipped by the wall frame — expected, keep the splat exactly on the edge per spec.
- `freeNote` (not `noteAt`) for the one-shot 2 s note; the `sfx.splat()` throttle lives in Sfx only.
- Mobile: no input/UI/HUD changes; the hazard is positional, so 412x915 and 1280x720 work by construction.
### Tests
- `tests/core/inkRain.test.ts`: constants exact; `update(599.999)` = 0 and `update(600)` = 1 (first drop exactly at 600); over [600, 900) at 1/60 s steps with a fixed seed: count in (180, 260) and every consecutive gap in (1.15, 1.65); same seed → identical drop-time array; count identical at 1/60 vs 1/15 steps (frame-rate independence).
