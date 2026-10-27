---
id: T0120
title: Heavy burst — the Inkwell burst is a boss tool
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
Saving the Inkwell meter (T0090) for a boss fight becomes a real decision: while a burst's projectiles are still out on the page, your volleys hit bosses and elites much harder.

## Details
- The burst window: from the moment an Inkwell burst fires until the last projectile of that burst is gone (killed, off-screen or absorbed), the player is "in burst".
- While in burst, the player's volley projectiles (the Point, Line, Arc and Counterpoint volleys — the standard projectile hits) deal +50% damage to bosses and elites only; hits on normal enemies are unchanged. The rule composes on top of the existing damage multipliers (damage upgrades, crits, Underexposure (T0105)) as an extra ×1.5.
- Fixed-damage effects are out of scope: the Orbit's contact damage is unaffected, and any other non-volley damage is untouched.
- The burst itself is unchanged: the same 3× projectiles, 2× knockback, deeper shoot sound and ink ring. No new HUD element, key, scene or sound.
- No boss attack changes: a burst hit stuns nothing (the stun variant stays in IDEAS, held until after The Press (T0116) lands).
- The rule lives as a pure, unit-tested helper in the combat path, in the pattern of `src/core/underexposure.ts`: given (in burst?, target is boss or elite?) → the multiplier.

## Acceptance criteria
- [ ] While any projectile of the last Inkwell burst is still on screen, volley hits on bosses and elites deal exactly 50% more damage than the same volley without the burst; hits on normal enemies are unchanged.
- [ ] The moment the last burst projectile is gone, damage returns to normal; a burst spent against normal enemies changes nothing about their damage taken.
- [ ] The burst still fires 3× projectiles with 2× knockback, the deeper sound and the ink ring; the Orbit's contact damage is unaffected; no new HUD element, key, scene or sound; no boss attack pattern changes.
- [ ] A new pure unit test locks the rule (in burst + boss/elite ×1.5, in burst + normal ×1.0, out of burst + boss ×1.0) and the existing tests stay green.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, inet-racing)

- **Two damage paths**: `CombatSystem.onProjectileHit` (enemies, has `e.elite`) and `BossSystem.onProjectileHit` (bosses — the boss is a separate `Boss` entity, not an `Enemy`). Both already compose crit + `underexposureDamage` on the final damage — that's where ×1.5 composes.
- **Bursts fire from two places**: `WeaponSystem.fireVolley` (real projectiles) and `ArcSystem.fire` (bolt-only, **no projectiles** — "No projectiles; damage is applied immediately"). So an Arc burst opens no window, and Arc bolt damage is non-projectile damage — untouched, consistent with the "standard projectile hits" scope.
- **All four player-projectile despawn sites**: `WeaponSystem` lifetime (line 65) + world-bounds bounce death (line 45), `CombatSystem` pierce-exhaust (line 81), `BossSystem` pierce-exhaust (line 520). `SpawnSystem:90` is enemy shots — not a player projectile.
- **Subtle hazard**: a projectile killed in the physics step can be re-acquired by `fireVolley` the *same frame* (groups re-issue inactive children), so the window counter must be decremented **at each despawn site**, not by polling the aging loop.
- `Enemy.elite` exists; `Boss.hit(damage)`; `INKWELL` burst tuning untouched; invariant block in `GameScene.registerInvariants()` with `hook.clearInvariants()` on shutdown already in place.

DESIGN:
### Files
- create `src/core/heavyBurst.ts` - pure rule: `HEAVY_BURST_MULTIPLIER` + `heavyBurstMultiplier(inBurst, bossOrElite)`, in the pattern of `src/core/underexposure.ts`
- create `tests/core/heavyBurst.test.ts` - unit tests for the multiplier and the RunState window lifecycle
- edit `src/core/run.ts` - burst-window state next to `inkwell`
- edit `src/entities/Projectile.ts` - mark burst projectiles (pooling: reset in `fire()`)
- edit `src/systems/WeaponSystem.ts` - open the window on burst fire; close it at both of its despawn sites
- edit `src/systems/CombatSystem.ts` - apply the multiplier on enemy hits; close window at pierce-exhaust despawn
- edit `src/systems/BossSystem.ts` - apply the multiplier on boss hits; close window at pierce-exhaust despawn
- edit `src/scenes/GameScene.ts` - one invariant line after the `'inkwell'` invariant in `registerInvariants()`

### Interfaces
```ts
// src/core/heavyBurst.ts (new)
export const HEAVY_BURST_MULTIPLIER: number = 1.5;
export function heavyBurstMultiplier(inBurst: boolean, bossOrElite: boolean): number; // inBurst && bossOrElite ? 1.5 : 1

// src/core/run.ts — add the field after `inkwell = 0;` (line 32)
burstProjectiles = 0; // projectiles of the last Inkwell burst still on the page
// add after the consumeInkwell() method (line 124)
get inBurst(): boolean;                 // burstProjectiles > 0
openBurst(count: number): void;         // burstProjectiles += count (guard count > 0; overlapping bursts add)
noteBurstGone(): void;                  // burstProjectiles = max(0, burstProjectiles - 1)

// src/entities/Projectile.ts — ShotParams gains: `burst: boolean;`  and the class gains field `burst = false;` set in fire()
```
No constructor or signature changes anywhere; no new listeners, scenes, keys, HUD, or sounds.

### Steps
1. Create `src/core/heavyBurst.ts` exactly as above.
2. `run.ts`: add `burstProjectiles = 0;` after `inkwell = 0;`, and the three members after `consumeInkwell()`. Do not touch the boss fields (lines 41–50; T0116 will edit near them).
3. `Projectile.ts`: add `burst: boolean;` to `ShotParams`, `burst = false;` to the class, and `this.burst = p.burst;` in `fire()` right after `this.knockback = p.knockback;`.
4. `WeaponSystem.ts`: in `fireVolley`, add `burst,` to the `p.fire({...})` object and add `if (burst) this.run.openBurst(1);` after `hook.stats.shotsFired += 1;` inside the loop (keep the existing `if (!p) return;` — each actually-fired projectile opens one slot). In the aging loop, change `if (p.lifeLeft <= 0) p.despawn();` to despawn plus `if (p.burst) this.run.noteBurstGone();` before it. In `onWorldBounds`'s `else` branch, add the same `noteBurstGone()` before `p.despawn();`.
5. `CombatSystem.ts`: import `heavyBurstMultiplier`; in `onProjectileHit` change `const dmg = wound.damage;` to `const dmg = wound.damage * heavyBurstMultiplier(this.run.inBurst, e.elite);`; in the `if (p.pierceLeft < 0) p.despawn();` add `if (p.burst) this.run.noteBurstGone();` before the despawn.
6. `BossSystem.ts`: import `heavyBurstMultiplier`; in its `onProjectileHit` change `const died = b.hit(wound.damage);` to `const died = b.hit(wound.damage * heavyBurstMultiplier(this.run.inBurst, true));` (the target is always the boss); add the same `noteBurstGone()` before the pierce-exhaust despawn.
7. `GameScene.ts`: after the `'inkwell'` invariant (line 384) add: `hook.addInvariant('burst-window', () => (this.run.burstProjectiles >= 0 && this.run.burstProjectiles <= this.weapons.activeCount ? null : `burst window ${this.run.burstProjectiles} vs ${this.weapons.activeCount} active projectiles`));`
8. Create `tests/core/heavyBurst.test.ts`.
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Same-frame pool reuse: a projectile killed in the physics step can be re-`fire()`d by `fireVolley` before the aging loop runs, so NEVER track the window by polling inactive children in the aging loop — decrement at each of the four despawn sites (steps 4–6). `fire()` resetting `burst` is safe because the decrement already happened.
- Do not touch `ArcSystem` or `OrbitSystem`: Arc bursts fire zero projectiles, so they open no window, and Arc bolt / Orbit contact damage is not a "standard projectile hit" and stays ×1.0. Bosses are not `Enemy`s — the boss path is only `BossSystem.onProjectileHit`.
- The window is a player state, not per-projectile: non-burst volleys fired while in burst also get ×1.5 on bosses/elites, and a burst spent on normal enemies changes nothing for them.
- `noteBurstGone()` must floor at 0 and `openBurst` must add (overlapping bursts are possible: inkwell refills in ~1 s with several weapons while Counterpoint shots live 3 s).
- No new scene listeners, so the existing `hook.clearInvariants()` on shutdown covers the invariant — add nothing to the SHUTDOWN handler.
- T0114 (same machine, in progress) also edits `GameScene.ts` and T0116 (asus) edits `run.ts`; re-read each file before editing and keep hunks exactly where specified. A future projectile despawn path (e.g. T0116's TypeBlock absorption) must also call `run.noteBurstGone()` for burst shots.

### Tests
`tests/core/heavyBurst.test.ts`: (a) `HEAVY_BURST_MULTIPLIER` is 1.5 and `heavyBurstMultiplier` is 1.5 for (true,true), 1 for (true,false), (false,true), (false,false), and `10 * heavyBurstMultiplier(true, true)` is exactly 15; (b) window lifecycle on `new RunState(1)`: not in burst initially, `openBurst(3)` → in burst, `noteBurstGone()` ×2 → still in burst, ×3 → out, further `noteBurstGone()` leaves `burstProjectiles` at 0; (c) `openBurst(3)`, `noteBurstGone()`, `openBurst(3)` → `burstProjectiles` is 5.
