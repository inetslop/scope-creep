---
id: T0132
title: "The Grid's second voice — the compass changes shape at the midpoint"
assignee: asus
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T17:52:12Z
---

## Goal
The Grid's second half should play differently from its first: the moment its HP first drops below half, the compass grows a third arm and spins 25% faster — so the fight changes shape at the midpoint instead of just showing a lower bar, and the 50% bar tick (T0118) lands in the same moment as the changed fight.

## Details
- First state: while The Grid's HP is at or above 50% of its (scaled) max HP, the fight is exactly as today — two arms, the current spin speed, the existing telegraphs and damage. Nothing changes.
- The crossing: the moment its HP first drops below 50% of max HP (evaluated after each hit), the second state begins. One small flat ink ring pops at the boss's center (the existing ring FX). No new SFX, no new HUD element, no new key.
- Second state: the Grid grows a **third arm** with the same spec as its existing arms — a 200×12 ink arm, 12 damage, the same 0.5 s red telegraph and the same sweep cadence — phase-locked 90° ahead of the first arm in the boss's own rotation, so the cross becomes a three-spoke asterisk with one quadrant left empty. Its spin becomes 25% faster (the existing rotation speed ×1.25), applied immediately at the crossing, with no ramp.
- The state latches: the second state persists for the rest of this Grid's life even if its HP fraction ever rises back above 50% (nothing heals bosses today, but the rule must not depend on that). A fresh Grid — including a respawn with the existing +50% HP-per-respawn scaling — starts in the first state: two arms, base spin.
- Scope: the Grid's own content def, its pure `gridSweep` timing module (plus its unit tests) and the boss's own update. Do not touch the shared boss system, the boss rotation/schedule, the other bosses (The Frame, The Palette, and The Press — in flight), the boss bar, the boss warning/sting, or the boss-music hold. The small-caps "SECOND STATE" note under the bar is a separate task (see IDEAS) and is not part of this one.

## Acceptance criteria
- [ ] While The Grid's HP is at or above 50% of max, the fight plays exactly as today: two arms, the current spin speed, the existing telegraphs and damage.
- [ ] The first hit that drops it below 50% of max grows the third arm at a right angle to the existing pair (three-spoke asterisk, one empty quadrant) and the spin is 25% faster from that moment; the new arm behaves exactly like the others — 0.5 s red telegraph, 12 damage — and one flat ink ring pops at the crossing.
- [ ] The second state is latched: if the Grid's HP fraction later rises above 50% it keeps three arms and the faster spin; a respawned Grid (with scaled HP) starts in the first state with two arms and base spin.
- [ ] Unit tests in the `gridSweep` pattern pin the rule: 2 arms / 1.0× spin at ≥50% of max HP, 3 arms / 1.25× spin after the first drop below 50%, latched when the fraction rises again, and a fresh boss instance starts in the first state.
- [ ] The Frame, The Palette, and (once The Press lands) The Press are unchanged; the boss bar, warning, sting, nameplate and boss-music hold are untouched; `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- edit `src/core/gridSweep.ts` - add the pure second-state rule: `GridSecondStateSpec`, `GRID_SECOND_STATE`, class `GridSecondState` (latched state machine)
- edit `src/art/textures.ts` - new `bossGridArmSingle` texture key + its generation in `drawBossGrid()`, export `GRID_ARM_SINGLE_ORIGIN`
- edit `src/systems/BossSystem.ts` - grid-only wiring: `thirdArm` image, `gridState` field + getter, spin ×1.25, third-arm telegraph/sweep/hit-test, crossing ring in `onProjectileHit`, reset in `startEntering`, hide in `killBoss`
- edit `src/scenes/GameScene.ts` - one invariant placed right after `'boss-state'` (+ import)
- edit `tests/core/gridSweep.test.ts` - `GridSecondState` tests
- unchanged: `src/content/bosses/grid.ts` (third arm reuses `armLength`/`armThickness`/`armDamage` — no new def fields), Frame/Palette/Press code, boss bar/warning/sting/nameplate/music

### Interfaces
```ts
// src/core/gridSweep.ts
export interface GridSecondStateSpec {
  /** HP fraction (hp / maxHp) below which the second state begins. */
  hpFraction: number;
  /** Body spin speed multiplier in the second state. */
  spinMultiplier: number;
}
export const GRID_SECOND_STATE: GridSecondStateSpec = { hpFraction: 0.5, spinMultiplier: 1.25 };

export class GridSecondState {
  constructor(spec: GridSecondStateSpec = GRID_SECOND_STATE);
  get inSecondState(): boolean;  // latched true after the first hit below the fraction, until reset()
  get armCount(): number;        // 2 first state, 3 second state
  get spinMultiplier(): number;  // 1 first state, spec.spinMultiplier second state
  onHit(fraction: number): boolean; // called after each hit with new hp/maxHp; true only on the crossing hit
  reset(): void;                 // fresh boss (incl. scaled respawn) starts in the first state
}

// src/art/textures.ts (PAD stays private; the arm's root sits at texture (PAD, h/2))
export const GRID_ARM_SINGLE_ORIGIN = { x: PAD / (GRID.armLength + PAD * 2), y: 0.5 };

// src/systems/BossSystem.ts
get gridSecondState(): GridSecondState; // read by the GameScene invariant
```

### Steps
1. `core/gridSweep.ts`: add the interface, const and class above (no new imports; match the file's doc-comment style).
2. `tests/core/gridSweep.test.ts`: extend the existing import with `GRID_SECOND_STATE, GridSecondState`; add the tests below.
3. `art/textures.ts`: (a) in `TEX`, add `bossGridArmSingle: 'bossGridArmSingle'` directly after `bossGridArm` with a doc comment; (b) in `drawBossGrid()`, after the arm-bar block, generate it exactly like that block but one arm long: `graphicsTexture(scene, TEX.bossGridArmSingle, GRID.armLength + PAD * 2, GRID.armThickness + PAD * 2, (g) => { g.fillStyle(PALETTE.ink, 0.18); g.fillRect(PAD + SHADOW_OFFSET, PAD + SHADOW_OFFSET, GRID.armLength, GRID.armThickness); g.fillStyle(PALETTE.ink, 1); g.fillRect(PAD, PAD, GRID.armLength, GRID.armThickness); });` (c) after the `PAD` const, export `GRID_ARM_SINGLE_ORIGIN`.
4. `systems/BossSystem.ts` (grid paths only — never the frame/palette branches):
   - imports: `GRID_ARM_SINGLE_ORIGIN` into the `../art/textures` import; `GridSecondState` into the `../core/gridSweep` import.
   - after the `readonly arm` declaration: `readonly thirdArm: Phaser.GameObjects.Image;` with a comment (the Grid's second-state third arm: one bar at a right angle to the sweep pair).
   - after `private readonly sweep`: `private readonly gridState = new GridSecondState();`
   - constructor, after the `this.arm = ...` line: `this.thirdArm = scene.add.image(0, 0, TEX.bossGridArmSingle).setVisible(false).setDepth(DEPTH.enemies + 1).setOrigin(GRID_ARM_SINGLE_ORIGIN.x, GRID_ARM_SINGLE_ORIGIN.y);`
   - after the `bodyActive` getter: the `gridSecondState` getter.
   - `updateGridFighting`: spin line becomes `b.setRotation(b.rotation + grid.spinRadPerSec * this.gridState.spinMultiplier * dt);`. Telegraph draw: after the bar's `lineBetween`, add `if (this.gridState.inSecondState) this.hint.lineBetween(0, 0, 0, grid.armLength);` (hint local +y = +90° in world). Retract branch: also `this.thirdArm.setVisible(false);`. Replace the sweep-branch hit test with:
     ```ts
     const angle = this.sweepStartAngle + this.sweepDir * this.sweep.sweepProgress * Math.PI;
     this.arm.setPosition(b.x, b.y).setRotation(angle);
     const second = this.gridState.inSecondState;
     const a3 = angle + Math.PI / 2;
     if (second) this.thirdArm.setPosition(b.x, b.y).setRotation(a3);
     const dx = Math.cos(angle) * grid.armLength, dy = Math.sin(angle) * grid.armLength;
     const dx3 = Math.cos(a3) * grid.armLength, dy3 = Math.sin(a3) * grid.armLength;
     const now = this.scene.time.now;
     const inArm = pointToSegmentDistance(this.player.x, this.player.y, b.x - dx, b.y - dy, b.x + dx, b.y + dy) <= grid.armThickness / 2 + PLAYER_RADIUS;
     const inThird = second && pointToSegmentDistance(this.player.x, this.player.y, b.x, b.y, b.x + dx3, b.y + dy3) <= grid.armThickness / 2 + PLAYER_RADIUS;
     if ((inArm || inThird) && !this.player.isInvulnerable(now) && !this.run.isDead) { /* existing damage block, unchanged */ }
     ```
   - `startEntering`, after the palette if-block: `else if (this.def.behavior === 'grid') { this.gridState.reset(); this.thirdArm.setVisible(false); }` (mirrors the palette's `cascade.reset()` there).
   - `onProjectileHit`, between `this.run.bossHp = Math.max(0, b.hp);` and `if (died) this.killBoss();`: `if (this.def.behavior === 'grid' && !died && this.gridState.onHit(b.hp / b.maxHp)) this.fx.critRing(b.x, b.y);`
   - `killBoss` grid branch: also `this.thirdArm.setVisible(false);`
5. `scenes/GameScene.ts`: import `GRID_SECOND_STATE` from `../core/gridSweep`; in `registerInvariants()`, immediately after the `'boss-state'` invariant add `hook.addInvariant('grid-second-state', () => { if (!this.run.bossAlive || this.run.bossId !== 'grid') return null; return this.run.bossHp < this.run.bossMaxHp * GRID_SECOND_STATE.hpFraction && !this.boss.gridSecondState.inSecondState ? `grid below half hp but still first state` : null; });` (shutdown's `clearInvariants()` removes it).
6. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The third arm is ONE 200 u bar rooted at the center (three-spoke asterisk, one quadrant empty). Reusing `TEX.bossGridArm` (a 400 u bar) would grow a fourth arm; a wrong origin shifts the root 6 px off the compass center — use `GRID_ARM_SINGLE_ORIGIN` (`PAD` is not exported).
- The `+Math.PI / 2` offset is constant, not `sweepDir * Math.PI / 2` — otherwise the arm jumps sides each time the sweep direction re-rolls.
- One damage block per frame: do not run the existing block once per arm — the rested path calls `restForgive()` with no i-frames and would ring/sfx twice.
- `gridState.reset()` belongs in `startEntering` (fresh spawn, including the +50 % HP-per-kill respawn), NOT in `updateEntering`'s slide-in-complete branch — that would clear a crossing earned during the 0.5 s slide-in.
- `onHit` only when `!died`: a killing blow below 50 % must not pop a second ring on top of `killBoss`'s death ring.
- `thirdArm` is persistent like `this.arm` (never destroyed); it must be hidden on retract, in `startEntering` and in `killBoss` or it freezes on the page after death.
- No new SFX/HUD/keys; the hint's extra half-line IS the third arm's 0.5 s telegraph. Boss bar 50 % tick (HudScene), warning, sting, nameplate, music hold: untouched.

### Tests
`describe('GridSecondState')` in `tests/core/gridSweep.test.ts`: fresh instance → `inSecondState` false, `armCount` 2, `spinMultiplier` 1; `onHit(0.5)` → false and still 2 arms / 1.0× (≥50 % is first state); `onHit(0.75)` then `onHit(0.499)` → true, 3 arms, 1.25×; latch: after the crossing `onHit(0.9)` → false, still 3 arms / 1.25×; repeated sub-50 % hits report the crossing exactly once; `reset()` → first state again; `GRID_SECOND_STATE` toEqual `{ hpFraction: 0.5, spinMultiplier: 1.25 }`; a custom spec (`{ hpFraction: 0.25, spinMultiplier: 2 }`) crosses and multiplies per spec.
