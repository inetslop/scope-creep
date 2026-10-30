---
id: T0247
title: Pierce shots fly straight through the line instead of homing
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T00:51:08Z
claimed_at: 2026-10-30T02:15:54Z
---

## Goal
A shot with pierce (a Lance tower, or any shot tower with Lance added) should feel like a lance, not a homing missile. Today it homes in on its target, then jumps to a nearby enemy and homes in again (`pickPierceTarget` in `src/core/targeting.ts`), so it can turn corners. Make it fly in a straight line instead, through every enemy in its path, until its pierce is used up or it flies out of reach. Then where you place a Lance matters: along a straight stretch of road it hits a whole queue, across a bend only a few.

## Details
- **The shot:** a shot with pierce 1 or more is fired at its target and then flies straight; it never turns. It strikes each enemy it touches, once each, until it has hit pierce + 1 enemies or flown 1.5 × the tower's range from the tower, then it is gone. It never homes and never jumps to an enemy off its line.
- **It still hits its first target:** aim at where the target will be when the shot gets there (its speed along the road and the shot's speed), so the first hit lands as reliably as a homing shot does today. A shot without pierce homes in as now.
- **Effects per hit stay as today:** every enemy it strikes takes the hit's damage and effects (slow, burn, push, mark). Splash bursts at the shot's last hit, as now.
- **Same for pellets:** Spray's pellets already fly straight with pierce; keep them as they are.
- **Code:** the straight flight for pierce shots replaces the jump in `src/systems/ProjectileSystem.ts` (the pierce branch that calls `pickPierceTarget`). Reuse the straight-pellet path that Spray uses (`fireCone`'s flight) rather than writing a second one. If nothing else uses `pickPierceTarget` and `PIERCE_REACH` afterwards, remove them.
- **Card lines:** Lance's `asTower` says the shot flies straight through the line, e.g. "A long thin shot straight through the line: 12 damage every 0.9 s, hits one beyond." (keep each tier's numbers), and `description` matches.

## Acceptance criteria
- [ ] A Lance tower's shot hits its target, then keeps going in a straight line and hits the enemies behind it on that line, up to its pierce + 1 enemies.
- [ ] A pierce shot never turns toward an enemy that isn't on its line, and is gone after 1.5 × the tower's range.
- [ ] Against a single walking enemy, a Lance tower hits as reliably as before (aims ahead).
- [ ] Shots without pierce still home in as before; Spray's pellets are unchanged.

## Design (architect, desktop)

### Files
- create `src/core/aim.ts` — pure math: `leadPoint()`, the point where a walking target will be when a straight shot arrives
- create `tests/core/aim.test.ts` — unit tests for `leadPoint`
- edit `src/systems/ProjectileSystem.ts` — `fire()` sends pierce bolts down the straight-pellet path; `land()` loses its pierce branch; imports; class comment
- edit `src/systems/TowerSystem.ts` — one line: `fireBolt` passes `1.5 * range` as the straight flight's `maxDist`
- edit `src/core/targeting.ts` — delete `pickPierceTarget` (lines 67–86, incl. its doc comment)
- edit `src/config.ts` — delete `PIERCE_REACH` (lines 7–8)
- edit `tests/core/targeting.test.ts` — delete the `describe('pickPierceTarget')` block and drop it from the import on line 2
- edit `src/content/augments/lance.ts` — file comment (lines 4–5), `description`, `asTower`

### Interfaces
```ts
// src/core/aim.ts (entire file, plus the doc comment)
/**
 * The point a straight shot should fly to: where the target — at (x, y), walking at `speed`
 * board units per second along the unit vector (dirX, dirY) — will be when a shot fired from
 * (sx, sy) at `shotSpeed` arrives. Aims at the target's current spot when it is on top of the
 * target, not moving, or as fast or faster than the shot (a slower shot can never catch up).
 */
export function leadPoint(sx: number, sy: number, shotSpeed: number, x: number, y: number, dirX: number, dirY: number, speed: number): { x: number; y: number } {
  const wx = x - sx;
  const wy = y - sy;
  const w = Math.hypot(wx, wy);
  if (w < 1e-6 || speed <= 0 || shotSpeed <= speed) return { x, y };
  const a = shotSpeed * shotSpeed - speed * speed;
  const wu = wx * dirX + wy * dirY;
  const t = (speed * wu + Math.sqrt(speed * speed * wu * wu + a * w * w)) / a;
  return { x: x + dirX * speed * t, y: y + dirY * speed * t };
}

// ProjectileSystem.fire — signature changes (only caller is TowerSystem's fireBolt closure):
fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, maxDist: number): void; // was: (…, asTracer = false)
```
`Projectile.ts` is **untouched** — `firePellet`/`advance`/`settle`/`touching`/`pathTouches` already do everything a straight pierce shot needs.

### Steps
1. Create `src/core/aim.ts` exactly as above (no Phaser import — `core/` is pure).
2. Create `tests/core/aim.test.ts` (see Tests).
3. In `src/systems/ProjectileSystem.ts`:
   - line 2: `import { CELL, PIERCE_REACH } from '../config';` → `import { CELL } from '../config';`
   - line 3: `import { pickPierceTarget } from '../core/targeting';` → `import { leadPoint } from '../core/aim';`
   - class comment line 8 → `/** Owns the projectile pool: homing bolts, and the straight shots (a Spray's pellets, a pierce bolt). */`
   - replace `fire()` (lines 40–42) with:
     ```ts
     /** A bolt from a shot tower: with pierce it flies straight like a pellet, aimed where the
      * target will be, striking every enemy on its line until its pierce is used up or it flies
      * `maxDist` board units out (from the muzzle, like a pellet); without pierce it homes. */
     fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, maxDist: number): void {
       if (payload.pierce > 0) {
         // Its current speed along the road: the crawl (slowed), the dash surge, or a full stop.
         const c = target.def.dashCycle;
         const v = target.rootLeft > 0 ? 0
           : c !== undefined && target.dashLeg === 'dash' ? (c.dashCells / c.dashSec) * CELL
           : c !== undefined && target.dashLeg === 'pause' ? 0
           : target.speed * (1 - target.slowPct);
         const lead = leadPoint(x, y, speed, target.x, target.y, target.dirX, target.dirY, v);
         const d = Math.hypot(lead.x - x, lead.y - y);
         this.take().firePellet(x, y, d > 1e-6 ? (lead.x - x) / d : 0, d > 1e-6 ? (lead.y - y) / d : -1, payload, speed, maxDist, ++this.blastSeq);
         return;
       }
       this.take().fire(x, y, target, payload, speed);
     }
     ```
   - replace `land()` (lines 76–95) with:
     ```ts
     /** A homing shot that reached its target: it hits (bursting with splash) and despawns.
      * Piercing shots never land here: they fly straight and settle on whatever they touch. */
     private land(p: Projectile): void {
       const target = p.target!;
       const flight = { x: p.fx, y: p.fy }; // the plate halves what a shot flying into the face deals
       this.enemies.hit(target, p.payload!, flight);
       p.despawn();
     }
     ```
4. In `src/systems/TowerSystem.ts`, `fireBolt` closure (lines 131–134) becomes:
   ```ts
   fireBolt: (n, target, payload) => {
     const m = t.muzzle(n);
     // A piercing bolt flies straight: out to 1.5 × the tower's range (from the muzzle, like the pellets).
     this.projectiles.fire(m.x, m.y, target, payload, spec.projectileSpeed * CELL, 1.5 * range);
   },
   ```
   (`range` is the context's `spec.range * CELL`, already in scope.)
5. Delete `pickPierceTarget` from `src/core/targeting.ts` and `PIERCE_REACH` from `src/config.ts` (both their doc comments).
6. Delete the `describe('pickPierceTarget', …)` block (lines 55–84) from `tests/core/targeting.test.ts` and `pickPierceTarget` from its import.
7. In `src/content/augments/lance.ts`:
   - comment lines 4–5 → `* The piercing shot: a long thin shot that flies straight, striking every enemy on its line.` / `* Added to a tower, it lets that tower's shots pass through one more enemy.`
   - `description: 'A long thin shot that flies straight. Added: +1 pierce.',`
   - `asTower: 'Straight through the line: 12 damage every 0.9s, hits one beyond.',` (65 chars — keep these exact numbers)
8. Run `npm run check`; then `npm run smoke`.

### Pitfalls
- Do **not** use the task's literal example line "A long thin shot straight through the line: …" — it is 83 chars and `tests/content.test.ts` caps `asTower` at 70. The 65-char line above is the one to use.
- `maxDist` is measured from the **muzzle**, like Spray's pellets (`traveled` in `advance()`); the barrel offset is under a cell, do not try to correct it for the tower centre.
- Each straight pierce bolt must get a **fresh blast number** (`++this.blastSeq`): Push's per-blast guard in `settle()` would otherwise skip a push for a second bolt hitting the same enemy in the same frame.
- Keep the `shotSpeed <= speed` fallback in `leadPoint` — it guards the `a = S²−v²` division (slower shots can't catch; aim at the current spot, never NaN).
- Don't touch `Projectile.fire()`/`firePellet()`/`advance()`: homing bolts (pierce 0) must fly exactly as before, and the pierce bolt now looks like a pellet (tracer, light tint) — that is intended.
- Pulse towers with Lance: `core/augments.ts` converts pierce to bolts but keeps `pierce > 0` in the bolt payload, so those bolts also fly straight. Intended — do not zero `pierce` there.
- The stuck-projectile invariant (`age > 5 s`) still holds: worst flight ≈ 1.5 × range ÷ speed ≈ 1 s. No new invariant needed.
- Lint fails on the unused `pickPierceTarget`/`PIERCE_REACH` imports if step 3's import edits are forgotten.

### Tests
- `tests/core/aim.test.ts` (new): stationary target returns its spot; moving away: `leadPoint(0, 0, 10, 10, 0, 1, 0, 2)` → `{ x: 12.5, y: 0 }` (t = d/(S−v) = 1.25, and shot arrival time 12.5/10 equals enemy travel time); moving toward: `leadPoint(0, 0, 10, 10, 0, −1, 0, 2)` → x ≈ 8.3333 (t = d/(S+v)); perpendicular: `leadPoint(0, 0, 10, 0, 10, 1, 0, 5)` → `{ x: 5*10/Math.sqrt(75), y: 10 }`; shot as slow or slower than target → current spot; target on top of the shot → current spot. Use `toBeCloseTo`.
- `tests/core/targeting.test.ts`: only the removal in step 6; all other blocks unchanged.
- Existing `tests/core/augments.test.ts` pierce specs and `tests/content.test.ts` must pass unmodified (no spec numbers change).
