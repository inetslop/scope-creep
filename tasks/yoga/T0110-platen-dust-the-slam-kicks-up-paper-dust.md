---
id: T0110
title: Platen dust — the slam kicks up paper dust
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T14:35:34Z
---

## Goal
The moment the Platen's slam shockwave fires (T0091), three small paper-dust puffs pop at the Platen — the shove gets physicality, seen at the exact moment the page lurches.

## Details
- The moment the Platen's slam shockwave fires (the existing slam moment in its 5 s cycle — the same instant the ink shockwave shoves the player and nearby enemies), spawn three flat paperLight circles at the Platen's center: radius 4–7 units, no outline, no shadow.
- Each puff drifts outward 10–20 units at a random angle (chosen with the run's seeded RNG, like the other spawn-driven visuals) and fades linearly over 400 ms, then is discarded.
- Closest example: the streak-break ink specks (T0101) — the same flat dot style, the same scatter-and-fade shape; this is that juice for the Platen's slam, reusing the Platen's existing slam trigger, not a new one.
- No sound. No gameplay change: the Platen's 60 hp, speed 20, 160-unit slam radius, shove and 5 s cycle are untouched. No HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] The moment the Platen's slam shockwave fires, three small paperLight puffs (radius 4–7) pop at the Platen's center, drift outward 10–20 units and are gone within 400 ms.
- [ ] No puffs at any other moment — not on spawn, not on the flatten telegraph, not on contact, not while the Platen crawls.
- [ ] No new sound plays, the Platen's hp, speed, slam radius, shove and 5 s cycle are unchanged, and no HUD element, input or scene is added.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/systems/FxSystem.ts` — new `slamDust(x, y, rng)`: three flat paperLight dots (tinted `TEX.dot`, no outline/shadow) pooled as Images and tweened out over 400 ms — same pattern as the existing platemark pool in this file, same dot style as the T0101 streak specks
- edit `src/systems/SpawnSystem.ts` — one line in the existing slam trigger `performSlam()` (the only call site)
- edit `src/scenes/GameScene.ts` — one pool invariant + its name in the trailing `INVARIANTS` const

### Interfaces
```ts
// FxSystem.ts — new public method (after slamRing), private helper, and getter:
slamDust(x: number, y: number, rng: Rng): void
private dustSlot(): Phaser.GameObjects.Image
get dustCount(): number
```

### Steps
1. `src/systems/FxSystem.ts`: add `import type { Rng } from '../core/rng';` (above the `CameraShake` import), `const DUST_MAX = 6;` and `const DUST_LIFE_MS = 400;` (after the PLATEMARK consts), and fields after `lastPlatemarkAt`:
```ts
  /** Slam dust: flat paperLight puffs kicked up when a Platen's slam fires. Pooled like platemarks. */
  private readonly dust: (Phaser.GameObjects.Image | undefined)[] = [];
  private dustCursor = 0;
```
2. In `FxSystem`, right after `slamRing()`:
```ts
  /** A Platen slam: three paperLight puffs pop at the body, drift 10–20 units out and fade over 400 ms. */
  slamDust(x: number, y: number, rng: Rng): void {
    for (let i = 0; i < 3; i += 1) {
      const slot = this.dustSlot();
      const angle = rng.range(0, Math.PI * 2);
      const dist = rng.range(10, 20);
      const radius = rng.range(4, 7);
      this.scene.tweens.killTweensOf(slot);
      slot.setPosition(x, y).setScale(radius / 4).setAlpha(1).setVisible(true);
      this.scene.tweens.add({ targets: slot, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0, duration: DUST_LIFE_MS, ease: 'Linear', onComplete: () => slot.setVisible(false) });
    }
  }

  /** One slot from the dust pool; lazily created, oldest reused. TEX.dot is a 4-radius circle, so scale = radius / 4. */
  private dustSlot(): Phaser.GameObjects.Image {
    const i = this.dustCursor;
    this.dustCursor = (i + 1) % DUST_MAX;
    let slot = this.dust[i];
    if (!slot) slot = this.scene.add.image(0, 0, TEX.dot).setOrigin(0.5).setTint(PALETTE.paperLight).setDepth(DEPTH.fx).setVisible(false);
    this.dust[i] = slot;
    return slot;
  }
```
and after the `platemarkCount` getter:
```ts
  /** Puffs currently on screen (the slam-dust invariant reads this). */
  get dustCount(): number {
    let n = 0;
    for (const s of this.dust) if (s && s.alpha > 0) n += 1;
    return n;
  }
```
3. `src/systems/SpawnSystem.ts` in `performSlam()`: insert `this.fx.slamDust(e.x, e.y, this.run.rng);` directly after `this.fx.slamRing(e.x, e.y);`.
4. `src/scenes/GameScene.ts`: in `registerInvariants()` after the `'platemark-pool'` line add `hook.addInvariant('slam-dust-pool', () => (this.fx.dustCount <= 6 ? null : \`${this.fx.dustCount} slam dust puffs on screen\`));` and append `'slam-dust-pool'` to the `INVARIANTS` array at the end of the file (after `'platemark-pool'`).

### Pitfalls
- The only call site is `performSlam` (fired once per cycle via `consumeSlam()`): that alone guarantees no puffs on spawn/telegraph/contact/crawl. Do not add other call sites.
- Don't use `drawShape()` (it adds ink outline + shadow — the task requires neither) and don't use a Phaser `ParticleEmitter` (its per-particle randomization can't be seeded); the tween pool is the point.
- Use the passed `rng`, never `Math.random()`; keep the exact call order angle→dist→radius (seeded reproducibility).
- `killTweensOf(slot)` before reusing a slot is required or two tweens fight for the target.
- The invariant name MUST be added to the trailing `INVARIANTS` const or it leaks across scene restarts.
- 3+ Platens slamming within 400 ms reuse in-flight slots (oldest puff ends early) — cosmetic, by design (same as platemarks).

### Tests
- none
