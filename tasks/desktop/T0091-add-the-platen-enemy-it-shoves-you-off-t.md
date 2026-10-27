---
id: T0091
title: Add the Platen enemy — it shoves you off the page
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T08:45:39Z
claimed_at: 2026-10-27T10:47:32Z
---

## Goal
A new enemy that asks something no existing enemy does: the Platen pushes. It crawls toward you and every few seconds flattens and slams — a radial ink shockwave that shoves the player and the swarm away with no direct damage. It is the first enemy that changes where things are instead of how much they hurt, and it becomes a tool: bait its slam to push a swarm into the crop burn (T0045) or shove yourself out of an ambush.

## Details
- Closest existing enemy: the Block (charger). The Block charges at the player — aimed, kinetic, it comes to you. The Platen instead emits a radial push from itself that moves everything around it, including the player. The new behavior is the shove: a telegraphed, radial, zero-damage knockback wave.
- Shape and stats: yellow circle (yellow = heavy in the color language), radius 26, standard ink outline and hard paper-cut shadow. 60 hp, speed 20 (crawls toward the player — a wall that drifts), 10 contact damage, 4 xp, threat 3, spawn weight 2, unlocks at 150 s, knockbackResist 0.5 (heavy — it shrugs off about half of any push and keeps crawling).
- Slam cycle, repeating every 5 s (first slam 5 s after the Platen spawns):
  - Telegraph, 0.5 s: the Platen flattens to 40% of its height (scaleY) and a thin ink ring at 160-unit radius fades in around it. The telegraph is ink, not red — the slam does no damage, so red stays reserved for things that hurt (the Grid's sweep).
  - Slam: the ink ring ripples outward from the Platen (radius 26 → 160) over 0.25 s and fades. Any player within 160 units takes a 220-strength knockback impulse directly away from the Platen (for scale, Orbit's contact knockback is 90); every enemy within 160 units (including other Platens) takes a 120-strength impulse away. The slam itself deals no damage — the only damage a Platen does is its 10 contact damage.
  - The Platen returns to full height, and the next cycle starts 5 s later.
- First-encounter marginalia (T0027): "IT SHOVES", 2 s.
- Elites: the regular 45 s elite schedule can roll an elite Platen (1.8× scale, elite hp, same slam behavior).
- One new enemy content data file following the existing pattern (closest example: the Splitter content file, T0009) plus the slam behavior; the slam should reuse the existing knockback plumbing, so no new physics.
- No new weapon, no new key, no new scene.

## Acceptance criteria
- [ ] From 150 s onward a yellow circle (radius 26) spawns among the late-run enemies, crawls toward the player at speed 20 and deals 10 contact damage; the spawn-unlock test passes with the expanded roster (absent before 150 s, present at/after).
- [ ] Every 5 s (first at 5 s after spawning) it flattens to 40% of its height while a thin ink ring at 160 radius fades in over 0.5 s, then the ring ripples outward to 160 over 0.25 s.
- [ ] On the slam, the player within 160 units is visibly shoved away with the 220-strength impulse and enemies within 160 units with 120; the slam itself deals no damage.
- [ ] A Platen resists about half of the push (knockbackResist 0.5) and keeps crawling; an elite Platen appears on the normal elite schedule with the elite scale and hp.
- [ ] The first Platen in a run shows the marginalia "IT SHOVES" for 2 s.
- [ ] The telegraph reads as "get out of the way" (flattening + ink ring) and is clearly distinct from the red damage telegraphs (the Grid sweep).

## Design (architect, desktop)

### Files
- create `src/core/slam.ts` - pure slam-cycle timing + `SLAM` tuning (no Phaser, lint-enforced)
- create `src/content/enemies/platen.ts` - the Platen EnemyDef (copy `splitter.ts` shape)
- create `tests/core/slam.test.ts` - SlamCycle unit tests (model: `tests/core/gridSweep.test.ts`)
- edit `src/content/types.ts` - add `'slam'` to `EnemyBehavior`
- edit `src/content/enemies/index.ts` - import + append `platen` to `ENEMIES`
- edit `src/art/textures.ts` - add `TEX.ringWide` (thin white ring, radius 160 in a 320x320 texture, tint it) + one `graphicsTexture` draw call next to `TEX.ring`
- edit `src/entities/Player.ts` - decaying `knock` vector + `knockback()` (the only new "physics" is a velocity impulse, same decay as `Enemy.knock`)
- edit `src/entities/Enemy.ts` - `'slam'` case in `steer()`, telegraph ring image, `consumeSlam()`, resets
- edit `src/systems/FxSystem.ts` - `slamRings` particle emitter + `slamRing()`
- edit `src/audio/Sfx.ts` - `slam()` thud
- edit `src/systems/SpawnSystem.ts` - consume slams, apply the shove; constructor gains `fx` + `sfx`
- edit `src/scenes/GameScene.ts` - pass `fx`/`sfx` to `SpawnSystem` (line 92), one new invariant + entry in `INVARIANTS`

### Interfaces
```ts
// core/slam.ts
export type SlamPhase = 'idle' | 'telegraph' | 'ripple';
export interface SlamTiming { periodSec: number; telegraphSec: number; rippleSec: number; }
export const PLATEN_SLAM: SlamTiming = { periodSec: 5, telegraphSec: 0.5, rippleSec: 0.25 };
export const SLAM = { radius: 160, playerKnock: 220, enemyKnock: 120, flatten: 0.4 } as const;
export class SlamCycle { constructor(timing?: SlamTiming); get cycleSec(): number; get phase(): SlamPhase;
  get phaseProgress(): number; update(dt: number): boolean; /* true exactly once per cycle, on the frame crossing into ripple */ reset(): void; }
// content/types.ts
export type EnemyBehavior = /* ...existing... */ | 'slam';
// entities/Player.ts (new)
knockback(dir: Vec2, strength: number): void;
// entities/Enemy.ts (new)
readonly slamRing: Phaser.GameObjects.Image;
consumeSlam(): boolean; // mirrors consumeShot()
```

### Steps
1. `core/slam.ts`: phases by `t` in `[0,period)` / `[period,period+telegraph)` / else; `update`: `const prev=this.t; this.t=(this.t+dt)%this.cycleSec; if(this.t<prev)return false; return prev<slamAt && this.t>=slamAt;` where `slamAt=periodSec+telegraphSec`.
2. `platen.ts`: `id:'platen'`, `name:'Platen'`, `note:'IT SHOVES'`, hp 60, speed 20, contactDamage 10, xp 4, threat 3, spawnWeight 2, unlockAtSec 150, behavior `'slam'`, knockbackResist 0.5, `look:{shape:'circle',radius:26,body:PALETTE.yellow,accent:PALETTE.ink,spin:0.4}`. Register in `enemies/index.ts`.
3. `textures.ts`: `graphicsTexture(scene, TEX.ringWide, 320, 320, (g) => { g.lineStyle(3, 0xffffff, 1); g.strokeCircle(160, 160, 160); });`
4. `Player.ts`: field `private knock: Vec2 = {x:0,y:0}`; `drive()` becomes `this.setVelocity(dir.x*speed + this.knock.x, dir.y*speed + this.knock.y)`; `knockback()` adds `dir*strength` into `knock`; in `preUpdate` decay `knock *= Math.exp(-8*(delta/1000))`.
5. `Enemy.ts`: import `{ SLAM, SlamCycle }`; fields `readonly slamRing` (created in constructor like `badge`, texture `TEX.ringWide`, `setTint(PALETTE.ink)`, depth `DEPTH.enemies + 1`, hidden), `private readonly slamCycle = new SlamCycle()`, `private slamPending = false`. In `spawn()` after `shotPending`: `slamCycle.reset(); slamPending=false; slamRing.setVisible(false).setAlpha(0);`. In `despawn()` hide it; in `destroy()` destroy it. Change `preUpdate` early-return to `if(!this.active) return; if(this.elite){...} if(this.slamRing.visible) this.slamRing.setPosition(this.x,this.y);`. New steer case:
```ts
      case 'slam': {
        vx = toTarget.x * this.def.speed;
        vy = toTarget.y * this.def.speed;
        const fired = this.slamCycle.update(dt);
        if (this.slamCycle.phase === 'telegraph') {
          // Route through baseScale: a plain setScale(0.4) would crush an elite Platen to normal height.
          this.setScale(this.baseScale, this.baseScale * SLAM.flatten);
          this.slamRing.setVisible(true).setAlpha(this.slamCycle.phaseProgress * 0.7);
        } else {
          this.setScale(this.baseScale);
          this.slamRing.setVisible(false);
        }
        if (fired) this.slamPending = true;
        break;
      }
```
6. `FxSystem.ts`: emitter `slamRings` on `TEX.ringWide`, `{ lifespan: 250, scale: { start: 26 / SLAM.radius, end: 1 }, alpha: { start: 0.9, end: 0 }, tint: PALETTE.ink, emitting: false }`, add to the `setDepth(DEPTH.fx)` loop; method `slamRing(x, y) { this.slamRings.explode(1, x, y); }` (import `SLAM`).
7. `Sfx.ts`: field `lastSlamAt = 0`; `slam()`: throttle 300 ms, then `this.tone('sine', 120, 50, 0.28, 0.3); this.noise(0.15, 0.18, 600, 'lowpass');`.
8. `SpawnSystem.ts`: constructor gains `fx: FxSystem, sfx: Sfx` (append after `marginalia`); in the steer loop after `consumeShot()`: `if (e.consumeSlam()) this.performSlam(e);`. New private method:
```ts
  private performSlam(e: Enemy): void {
    const r2 = SLAM.radius * SLAM.radius;
    const px = this.player.x - e.x, py = this.player.y - e.y;
    if (!this.run.isDead && px * px + py * py <= r2) this.player.knockback(normalize({ x: px, y: py }), SLAM.playerKnock);
    for (const obj of this.enemies.getChildren()) {
      const o = obj as Enemy;
      if (!o.active || o === e) continue;
      const dx = o.x - e.x, dy = o.y - e.y;
      if (dx * dx + dy * dy <= r2) o.hit(0, e, SLAM.enemyKnock);
    }
    this.fx.slamRing(e.x, e.y);
    this.sfx.slam();
  }
```
(import `SLAM`, `normalize`; `o.hit(0, e, kb)` is the established zero-damage knockback call — it applies `knockbackResist`, so Platens shrug off half and elites' 1.0 resist is the existing `ELITE` formula).
9. `GameScene.ts`: line 92 → `new SpawnSystem(this, this.run, this.player, this.bounds, this.marginalia, this.fx, this.sfx)`; add invariant `'slam-ring'` (any active enemy with `slamRing.visible` must have `def.behavior === 'slam'`) to `registerInvariants()` and to the `INVARIANTS` array.
10. `tests/core/slam.test.ts`: expect `{periodSec:5, telegraphSec:0.5, rippleSec:0.25}`, `cycleSec 5.75`; first slam fires (returns true) exactly at t=5.5 after reset, false otherwise; second slam 5.75 s later; wrap (5.7→0.05) never fires; `reset()`; `SLAM` equals `{radius:160, playerKnock:220, enemyKnock:120, flatten:0.4}`.
11. `npm run check`, then `npm run smoke`.

### Pitfalls
- Pooling: reset `slamCycle`/`slamPending`/`slamRing` in `spawn()` or a reused enemy slams early with a stale ring; hide in `despawn()`, destroy in `destroy()` (mirrors `ring`/`badge`).
- Never resize the physics body for the flatten — Arcade circle bodies resync from sprite scale; the charger already scales the sprite the same way.
- Frame order: GO `preUpdate` runs before `GameScene.update`, so the knock must be added inside `drive()` (last velocity writer before physics); setting `body.velocity` in `performSlam` gets overwritten next frame.
- Keep `o === e` self-exclusion in `performSlam` (direction from itself is undefined).
- `ParticleEmitter` has no per-call `setScale` in 3.90 — the 26→160 ripple is baked into the emitter config; that is intentional.
- `FxSystem.ts`/`GameScene.ts` are also touched by open tasks (T0040 in progress, T0090/T0064/T0070 queued): only ADD new methods/invariant lines, never move or reformat existing ones; do not touch `src/debug/testHook.ts` at all.
- Telegraph peak alpha 0.7 and ripple alpha 0.9 are fixed choices — don't "tune" them.

### Tests
- `tests/core/slam.test.ts` (new, SlamCycle + SLAM tuning). Existing `tests/content.test.ts` and `tests/content/spawn.test.ts` cover the new def and the 150 s unlock automatically.
