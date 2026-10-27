---
id: T0094
title: Platemark — the page records where you got hurt
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0040]
attempts: 1
created: 2026-10-27T08:45:39Z
claimed_at: 2026-10-27T11:53:59Z
---

## Goal
The moment you take a hit, a small red × prints on the paper at your position and fades over 2 s — the page itself records where you got hurt, so a close fight leaves a readable history of your worst moments.

## Details
- When the player takes a discrete hit — enemy contact, an enemy bullet, a boss attack — a small red × (two crossed red strokes, about 16 units wide, PALETTE.red, flat Bauhaus strokes — no glow, no gradient) prints at the player's current position.
- The × is stationary: it stays where it printed (it does not follow the player) and fades out linearly over 2 s, then is removed.
- At most one × prints per 0.5 s — further hits inside the window are suppressed (the player can be hit often). The continuous crop burn (T0045, 5 hp/s) prints no ×s at all; only discrete hits do.
- Pool cap of 12 ×s on screen: when the cap is hit the oldest × is dropped early (nearest patterns: the damage-numbers pool cap of 60 from T0004, and the crit ring from T0019).
- The marks sit on the paper below the gameplay art, do not block input, and do not obscure the player's circle.
- No damage, no gameplay effect, no input, no new scene — pure juice in the Fx system (nearest examples: `FxSystem.critRing()` from T0019 and the floating damage numbers from T0004).

## Acceptance criteria
- [ ] Taking a hit from an enemy (contact or bullet) or a boss prints a small red × at your position that stays in place and fades over 2 s.
- [ ] Two hits within 0.5 s print only one ×; standing in the crop burn prints none.
- [ ] At most 12 ×s are on screen at once, with the oldest dropped early beyond the cap.
- [ ] The ×s render below the gameplay art and never obscure the player's circle or block input.

## Design (architect, yoga)

### Files
- edit `src/art/textures.ts` - add `TEX.platemark` key + draw the 16-unit red × texture
- edit `src/systems/FxSystem.ts` - pool of 12 ×s, printed from `playerHit()` (all four discrete-hit sites — enemy contact `CombatSystem.onPlayerTouched`, enemy bullet `onPlayerShot`, boss arm + boss contact in `BossSystem` — already call it; the crop burn does NOT)
- edit `src/scenes/GameScene.ts` - invariant `platemark-pool` + one `INVARIANTS` array entry
### Interfaces
```ts
// src/systems/FxSystem.ts, top of file, next to the other consts:
const PLATEMARK_MAX = 12; const PLATEMARK_LIFE_MS = 2000; const PLATEMARK_COOLDOWN_MS = 500;
// new members of FxSystem:
get platemarkCount(): number;            // ×s currently on screen
private printPlatemark(x: number, y: number): void;  // playerHit() ends with: this.printPlatemark(x, y);
```
### Steps
1. `src/art/textures.ts`: in `TEX`, after the `bossGridArm` entry add `platemark: 'platemark'`. In `generateTextures`, after the badge line add:
```ts
graphicsTexture(scene, TEX.platemark, 22, 22, (g) => {
  g.lineStyle(3, PALETTE.red, 1);
  g.lineBetween(3, 3, 19, 19);
  g.lineBetween(3, 19, 19, 3);
});
```
2. `src/systems/FxSystem.ts`: after the `trail` field add:
```ts
private readonly platemarks: (Phaser.GameObjects.Image | undefined)[] = [];
private platemarkCursor = 0;
private lastPlatemarkAt = -Infinity;
```
then add the getter and method, and append `this.printPlatemark(x, y);` as the last line of `playerHit()`:
```ts
get platemarkCount(): number {
  let n = 0;
  for (const s of this.platemarks) if (s && s.alpha > 0) n += 1;
  return n;
}
private printPlatemark(x: number, y: number): void {
  const now = this.scene.time.now;
  if (now - this.lastPlatemarkAt < PLATEMARK_COOLDOWN_MS) return; // already printed for this hit
  this.lastPlatemarkAt = now;
  const i = this.platemarkCursor;
  this.platemarkCursor = (i + 1) % PLATEMARK_MAX;
  let slot = this.platemarks[i];
  if (!slot) slot = this.scene.add.image(0, 0, TEX.platemark).setOrigin(0.5).setDepth(DEPTH.floor + 1);
  this.platemarks[i] = slot;
  this.scene.tweens.killTweensOf(slot);
  slot.setPosition(x, y).setAlpha(1).setVisible(true);
  this.scene.tweens.add({ targets: slot, alpha: 0, duration: PLATEMARK_LIFE_MS, ease: 'Linear', onComplete: () => slot.setVisible(false) });
}
```
3. `src/scenes/GameScene.ts`: in `registerInvariants()`, after the `damage-numbers-pool` line add `hook.addInvariant('platemark-pool', () => (this.fx.platemarkCount <= 12 ? null : `${this.fx.platemarkCount} platemarks on screen`));` and append `'platemark-pool'` to the `INVARIANTS` array. Then `npm run check` and `npm run smoke` must pass.
### Pitfalls
- Depth `DEPTH.floor + 1` (=1): above the paper floor, below arena 5/pickups 10/enemies 20/player 40 — never obscures the player; a plain Image (no body, no input) blocks no input.
- Throttle must use `scene.time.now` (ms) — same clock as the fade tweens; both stop on scene pause, so they stay in sync.
- No `Math.random` jitter (unlike `DamageNumbers`): print exactly at the hit position.
- The × is printed on the paper, not a paper-cut shape: no shadow, no outline (do not use `drawShape`), flat `PALETTE.red` strokes like the crop marks.
- Cursor wrap is always safe: a slot is revisited after 11 prints (≥5.5 s), longer than the 2 s life, so its old fade has ended; `killTweensOf` is the belt-and-braces guard.
- Do NOT destroy slots on shutdown — scene shutdown destroys scene-owned game objects and tweens (as with `DamageNumbers` and the FxSystem emitters).
- The invariant must land in BOTH `registerInvariants()` and the `INVARIANTS` array, or the shutdown removal and the smoke check silently miss it.
### Tests
- none (pure juice in a Phaser scene; the `platemark-pool` smoke invariant is the check, the T0004 pattern)
