---
id: T0144
title: Counterpoint bounce marks — the wall remembers the bounce
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T21:17:36Z
claimed_at: 2026-10-27T22:04:48Z
---

## Goal
The Counterpoint (T0055) ricochets off the arena walls, but the bounce is only felt in the shot's path. Each wall bounce prints a small ink × at the contact point, so the wall remembers where the point came off it — and a first-time player learns to aim bounces by seeing where they land.

## Details
- Every time a Counterpoint projectile bounces off an arena wall (up to 2 per shot, per T0055), a small flat ink × prints at the contact point — the platemark × (T0094) in size and stroke weight, but ink (not red) and at the wall instead of the player.
- Each mark fades linearly over 2 s and is pooled exactly like the platemark (at most ~16 live marks, oldest recycled), so sustained play never grows unbounded draw work.
- Marks are drawn on the paper, under the entities — so the crop-safe boundary (Crop, T0045) and the breathing edge (Tide, T0127) need no special-casing; a mark lands wherever the bounce already happens today.
- Only Counterpoint shots leave marks — no other weapon (Point, Line, Arc, Orbit, the Plumb), no enemy shot and no boss part. A shot that bounces twice leaves two marks (one per bounce); a shot that never bounces leaves none.
- No sound, key, HUD element, scene or gameplay number change.

## Acceptance criteria
- [ ] A Counterpoint shot that hits a wall leaves a small flat ink × at the contact point that fades over ~2 s; a shot that bounces twice leaves two marks, and a shot that never bounces leaves none.
- [ ] The mark matches the platemark × (T0094) in size and stroke weight, and is ink, not red.
- [ ] Marks are pooled (bounded draw work in sustained play) and sit on the paper under the entities.
- [ ] No other projectile kind (Point, Line, Arc, enemy shots, boss parts) leaves a mark.
- [ ] No new sound, key, HUD element, scene or gameplay number change.

## Design (architect, yoga)

### Files
- edit `src/art/textures.ts` - new `TEX.bounceMark` key + ink × texture (twin of the platemark texture, ink instead of red)
- edit `src/systems/FxSystem.ts` - bounce-mark pool: a second pool identical to the platemark pool (fields, round-robin cursor, 2 s linear-fade tween, `bounceMarkCount` getter, public `bounceMark(x, y)`)
- edit `src/systems/WeaponSystem.ts` - one line: print the mark at the contact point in the bounce branch of `onWorldBounds`
- edit `src/scenes/GameScene.ts` - one line: pool invariant next to `platemark-pool`

### Interfaces
```ts
// FxSystem.ts public additions (fields stay private, next to the platemark ones)
get bounceMarkCount(): number;      // live marks (slot.alpha > 0)
bounceMark(x: number, y: number): void;
```
No type, signature, scene, sound, key, HUD or number changes elsewhere.

### Steps
1. `src/art/textures.ts`: in the `TEX` const, right after the `platemark` entry add `/** Small ink ×; printed on a wall where a Counterpoint point came off it. */` and `bounceMark: 'bounceMark',`. In `generateTextures`, right after the `TEX.platemark` block add the same 22x22 draw with ink:
```ts
graphicsTexture(scene, TEX.bounceMark, 22, 22, (g) => {
  g.lineStyle(3, PALETTE.ink, 1);
  g.lineBetween(3, 3, 19, 19);
  g.lineBetween(3, 19, 19, 3);
});
```
2. `src/systems/FxSystem.ts`, all beside the platemark code:
   - after the `PLATEMARK_COOLDOWN_MS` line add `const BOUNCE_MARK_MAX = 16;` and `const BOUNCE_MARK_LIFE_MS = 2000;`
   - after the `lastPlatemarkAt` field add:
```ts
/** Bounce marks: stationary ink ×s printed on a wall where a Counterpoint point came off it. Pooled like platemarks. */
private readonly bounceMarks: (Phaser.GameObjects.Image | undefined)[] = [];
private bounceMarkCursor = 0;
```
   - after the `platemarkCount` getter add `get bounceMarkCount(): number { let n = 0; for (const s of this.bounceMarks) if (s && s.alpha > 0) n += 1; return n; }`
   - after `printPlatemark()` add:
```ts
/** Prints a flat ink × at the wall a Counterpoint point bounced off; oldest recycled beyond the pool cap. */
bounceMark(x: number, y: number): void {
  const i = this.bounceMarkCursor;
  this.bounceMarkCursor = (i + 1) % BOUNCE_MARK_MAX;
  let slot = this.bounceMarks[i];
  if (!slot) slot = this.scene.add.image(0, 0, TEX.bounceMark).setOrigin(0.5).setDepth(DEPTH.floor + 1);
  this.bounceMarks[i] = slot;
  this.scene.tweens.killTweensOf(slot);
  slot.setPosition(x, y).setAlpha(1).setVisible(true);
  this.scene.tweens.add({ targets: slot, alpha: 0, duration: BOUNCE_MARK_LIFE_MS, ease: 'Linear', onComplete: () => slot.setVisible(false) });
}
```
3. `src/systems/WeaponSystem.ts`: in `onWorldBounds`, inside the `if (p.bouncesLeft > 0) {` branch, add `this.fx.bounceMark(p.x, p.y);` after the `this.sfx.hit();` line. The handler already returns early on `!p.bouncing`, and `bouncing` is set only for weapons with a `bounce` def (Counterpoint is the only one), so no other projectile kind can print a mark; the `else` (third contact, shot stops) branch gets none.
4. `src/scenes/GameScene.ts`: in `registerInvariants()`, directly after the `platemark-pool` line add `hook.addInvariant('bounce-marks-pool', () => (this.fx.bounceMarkCount <= 16 ? null : `${this.fx.bounceMarkCount} bounce marks on screen`));`
5. Run `npm run check`.

### Pitfalls
- Do not tint the red platemark texture to make ink — Phaser tint multiplies, which gives dark red, not ink; the ink × is a separate texture with identical 22x22 geometry and 3 px stroke.
- No cooldown (the platemark has 500 ms): every bounce must print, even rapid successive ones; the pool cap of 16 and oldest-recycled cursor keep draw work bounded.
- `killTweensOf(slot)` before re-tweening a recycled slot, or a stale tween keeps moving the mark.
- Keep depth `DEPTH.floor + 1` and origin 0.5 exactly as the platemark: the × sits on the paper under all entities, so Crop (T0045) and Tide (T0127) need no special-casing — the mark lands at `p.x, p.y`, where the physics already bounced.
- Touch nothing else: no sound (the existing `sfx.hit()` on bounce stays), no key, no HUD, no scene, no gameplay numbers; no new listeners (the `WORLD_BOUNDS` listener is on `physics.world` which dies with the scene) and no new shutdown work (pool images and tweens are scene-owned, same lifetime as the platemark pool).
- Fade is a scene tween (time-driven), so no dt/frame-rate dependence.

### Tests
none
