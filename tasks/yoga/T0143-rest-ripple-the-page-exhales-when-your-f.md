---
id: T0143
title: Rest ripple — the page exhales when your free hit is in hand
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T21:17:36Z
---

## Goal
The Rest (T0134) gives the patient player a free hit, but arming is silent — only the small REST label holds. The moment the 30 s count completes, the page exhales: a single ink ring ripples out from the player, so the free hit is felt in the middle of the fight, not discovered in the HUD.

## Details
- Trigger: the exact moment the existing rest rule (T0134, `src/core/rest.ts`) transitions to covered — the same state that makes the REST label first hold (30 s without any damage, discrete or burn, per the module's existing rules). The ripple rides that existing transition; it must not add a second timer or its own bookkeeping.
- Effect: one faint flat ink ring ripples out from the player's position — the first-light ring idiom (T0138): a flat 2 u ink circle growing from ~8 u to ~24 u, fading over 400 ms, no outline or shadow, as a new FxSystem emitter in the `firstLightRings` pattern (its own emitter because the lifespan is 400 ms, not 300).
- Once per arming: a negated free hit or fresh damage restarts the 30 s count; when that count completes, the ring ripples again. Exactly one ring per false→true covered transition — never per frame, and never at run start (a fresh count only completes after 30 s of peace).
- Pure juice: no damage, stat, spawn, hazard, weapon, clock or music change; no new sound, key, HUD element or scene.

## Acceptance criteria
- [ ] In a fresh run, staying unharmed for 30 s: the moment the REST label first holds, a single flat ink ring (2 u, growing ~8→24 u, fading over ~400 ms) ripples out from the player.
- [ ] After the free hit is negated — or after taking damage — the next completed 30 s count ripples again; exactly one ring per arming, and no repeated or continuous rings while the label simply holds.
- [ ] No ring at run start, and no ring while the 30 s count is still running.
- [ ] No new sound, key, HUD element, scene or gameplay number change; the rest rule's existing unit tests (T0134) still pass, and if the arming transition is exposed from the pure module a test pins that it is reported exactly once per arming cycle.

## Design (architect, yoga)

### Files
- edit `src/systems/FxSystem.ts` — one new emitter `restRings` (copy of `firstLightRings` with `lifespan: 400`) plus public method `restRing(x, y)`
- edit `src/scenes/GameScene.ts` — in `update()`, catch the false→true `covered` edge around `run.rest.tick(dt)` and fire the ring at the player
### Interfaces
```ts
// src/systems/FxSystem.ts — everything else unchanged
private readonly restRings: Phaser.GameObjects.Particles.ParticleEmitter;
/** Rest arming: the 30 s count completed and the free hit is in hand — one flat ink ring ripples from the player. */
restRing(x: number, y: number): void;
```
### Steps
1. `FxSystem.ts` after line 31 (`private readonly firstLightRings...`), add: `private readonly restRings: Phaser.GameObjects.Particles.ParticleEmitter;`
2. `FxSystem.ts` after the `this.firstLightRings = ...` block (ends line 85), add exactly:
```ts
    this.restRings = scene.add.particles(0, 0, TEX.ring, {
      lifespan: 400,
      scale: { start: 0.29, end: 0.86 }, // TEX.ring radius 28 u: grows 8 -> 24 u
      alpha: { start: 1, end: 0 },
      tint: PALETTE.ink,
      emitting: false,
    });
```
3. `FxSystem.ts` line 103: in `for (const e of [this.fragments, this.sparks, this.rings, this.critRings, this.firstLightRings, this.slamRings]) e.setDepth(DEPTH.fx);` append `, this.restRings` before `]`.
4. `FxSystem.ts` after the `firstLightRing()` method (ends line 120), add:
```ts
  /** Rest arming: the 30 s count completed and the free hit is in hand — one flat ink ring ripples from the player. */
  restRing(x: number, y: number): void {
    this.restRings.explode(1, x, y);
  }
```
5. `GameScene.ts` `update()`: replace the single line 174 `    run.rest.tick(dt); // 30 s of peace puts the player at rest (core/rest.ts)` with exactly:
```ts
    const wasCovered = run.rest.covered;
    run.rest.tick(dt); // 30 s of peace puts the player at rest (core/rest.ts)
    if (!wasCovered && run.rest.covered) this.fx.restRing(this.player.x, this.player.y); // the page exhales: free hit in hand
```
### Pitfalls
- Do NOT modify `firstLightRings`/`firstLightRing` (its 300 ms lifespan belongs to the first-light pickup ring) — the rest ring gets its own emitter because its lifespan is 400 ms.
- The fire condition is the edge `!wasCovered && run.rest.covered` with `wasCovered` read BEFORE `run.rest.tick(dt)`: that is what makes it exactly one ring per arming (never per frame while the REST label holds, never a second ring while holding). Do not add a timer, flag or any other bookkeeping.
- No ring at run start: `covered` starts false and can only turn true via `tick` after 30 s of peace; `update()` early-returns on `ending`/pause/level-up, so no tick and no edge can fire there either.
- Physics steps before `update()`, so a hit landing the same frame restarts the count before the tick — a 30 s count still can't complete on that frame; no spurious ring.
- The emitter is a scene child (`scene.add.particles`) and dies with the scene — no shutdown/cleanup work, no invariant (not a new system; same pattern as the T0138 first-light ring).
- Keep the GameScene edit at the `rest.tick` line (line 174), not at the end of `update()`; do not touch the `'rest'` invariant or `run.rest` internals.
### Tests
none
