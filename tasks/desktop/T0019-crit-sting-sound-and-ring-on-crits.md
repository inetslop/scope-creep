---
id: T0019
title: "Crit sting: sound and ring on crits"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:05:20Z
---

## Goal
Make crits from the Contrast upgrade land as events, not just red numbers: a distinct higher-pitched hit sound plus a small ink ring at the impact point.

## Details
- Add one new sound to `src/audio/Sfx.ts`, in the style of the existing `hit` sound: a short (~80–120 ms) higher-pitched variant at roughly 2× the base hit pitch, same envelope family and same gain as a normal hit. It must follow the SFX mute and master volume exactly like every other SFX.
- Play it from the two existing crit branches (the ones that already pass the `crit` flag to `DamageNumbers.show`): the projectile-hit path in `CombatSystem.onProjectileHit` and the orbit-contact path in `OrbitSystem.update`.
- At the same moment and position, spawn a small ink ring ripple reusing the existing ring effect in `Fx`: small scale (~20 world units radius), fading over ~300 ms.
- Non-crit hits are untouched: same sound, no ring.
- No rate limiting beyond what the normal hit sound already has; a crit and a normal hit on the same frame both sound.

## Acceptance criteria
- [ ] With Contrast owned, a crit (red double-damage number) plays a clearly higher-pitched sound and a small ink ring at the impact point; a normal hit sounds exactly as before with no ring
- [ ] Both crit paths trigger the sting and ring: projectile hits and Orbit weapon contact
- [ ] Muting SFX silences the crit sound; its volume tracks the SFX master
- [ ] A run without Contrast produces no new audio or FX (paths unchanged)
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile

## Design (architect, desktop)

### Files
- edit `src/audio/Sfx.ts` - add `critHit()` method and a `lastCritHitAt` throttle field
- edit `src/systems/FxSystem.ts` - add a dedicated `critRings` particle emitter and `critRing(x, y)` method
- edit `src/systems/CombatSystem.ts` - play crit sting/ring in the crit branch of `onProjectileHit`
- edit `src/systems/OrbitSystem.ts` - play crit sting/ring in the crit branch of `update`

### Interfaces
No new types. New members:

```ts
// Sfx.ts — field next to `lastHitAt` (line 20):
private lastCritHitAt = 0;

// Sfx.ts — method directly after `hit()` (line 81), same shape as hit():
/** Higher-pitched knock for crits: same envelope and gain as hit(), pitch doubled. */
critHit(): void {
  if (!this.canPlay()) return;
  const now = performance.now();
  if (now - this.lastCritHitAt < THROTTLE_MS) return;
  this.lastCritHitAt = now;
  this.noise(0.07, 0.22, 2400, 'bandpass');
  this.tone('sine', 440, 320, 0.08, 0.18);
}

// FxSystem.ts — field next to `rings` (line 15):
private readonly critRings: Phaser.GameObjects.Particles.ParticleEmitter;

// FxSystem.ts — in constructor, after the `rings` emitter (line 39):
this.critRings = scene.add.particles(0, 0, TEX.ring, {
  lifespan: 300,
  scale: { start: 0.5, end: 0.75 },
  alpha: { start: 1, end: 0 },
  tint: PALETTE.ink,
  emitting: false,
});
// and add `this.critRings` to the depth loop on line 49:
for (const e of [this.fragments, this.sparks, this.rings, this.critRings]) e.setDepth(DEPTH.fx);

// FxSystem.ts — method after `hit()` (line 56):
/** Small ink ring at a crit impact point. */
critRing(x: number, y: number): void {
  this.critRings.explode(1, x, y);
}
```

### Steps
1. `src/audio/Sfx.ts`: add the `lastCritHitAt` field and the `critHit()` method exactly as above. Do not touch `hit()` — it keeps its own `lastHitAt` clock.
2. `src/systems/FxSystem.ts`: add the `critRings` field, its constructor block, the depth-loop entry, and `critRing()`.
3. `src/systems/CombatSystem.ts` in `onProjectileHit` (lines 64–66): replace `this.sfx.hit();` with:
```ts
if (crit) {
  this.sfx.critHit();
  this.fx.critRing(p.x, p.y);
} else {
  this.sfx.hit();
}
```
4. `src/systems/OrbitSystem.ts` in `update` (lines 73–75): same replacement, using `cx, cy` for the ring position.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Shared throttle**: `critHit()` must NOT reuse `lastHitAt` — a crit and a normal hit on the same frame must both sound, so it gets its own `lastCritHitAt` with the same `THROTTLE_MS`.
- **Ring size**: the `TEX.ring` texture's stroke circle has radius 28 at scale 1, so scale 0.5→0.75 gives a ~14–21 unit radius ring — that is the "~20 units" spec. Do not reuse the existing `rings` emitter (its 260 ms / 0.3→1.3 config is tuned for deaths).
- **Tint**: set `tint: PALETTE.ink` in the emitter config (like `trail` does); do not call `setParticleTint` per hit.
- **Non-crit path**: the `else` branch must call `this.sfx.hit()` verbatim; without Contrast, `crit` is always false (the `critChance > 0` guard), so nothing new fires.
- **No new listeners/systems**: no scene events added, so no shutdown cleanup or `hook.addInvariant()` is needed; the emitter dies with the scene.

### Tests
none
