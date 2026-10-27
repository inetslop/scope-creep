---
id: T0050
title: "Still Life — second active: the slow bubble"
assignee: desktop
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T00:32:39Z
claimed_at: 2026-10-27T00:40:44Z
---

## Goal
A second active alongside the Understudy decoy: Still Life slows time in a bubble around the player, buying a few seconds of breathing room in late-game swarms and a moment to think mid-boss.

## Details
- A new active, available from the start of every run, on top of the Understudy — no unlock, no choice; both are always available, each with its own trigger and its own cooldown.
- Desktop trigger: the **Q** key (Space stays with the Understudy, mouse click keeps firing). Register it in `src/scenes/keys.ts` next to the others.
- Mobile trigger: a second 60 px round touch button in the bottom-left thumb zone, next to the Understudy button (no overlap with it).
- On trigger, a pale **blue** disc with a dashed blue ink ring appears around the player, radius **160 units**, lasting **5 seconds**. The bubble follows the player while it lasts.
- While the bubble is up, every enemy inside it — including elites and bosses — moves at **50% speed**, and enemy projectiles inside it fly at **50% speed**. Enemies that walk in get slowed immediately; when the bubble ends, everything snaps back to full speed at once. A boss's own movement is slowed, but the timing of its attack patterns (The Frame's bursts, The Grid's arms) is unchanged. The player is never slowed.
- **12 s cooldown** from the moment of trigger (the bubble ends at 5 s; the active re-triggers at 12 s).
- HUD: a second cooldown icon beside the Understudy icon — clockwise fill, solid when ready (desktop); the mobile button dims while on cooldown. Reuse the Understudy's cooldown rendering.
- Audio: one new quiet synthesized SFX on activation (a soft descending "shush"); nothing on end.
- Keep the active window and cooldown in a pure core module with unit tests (5 s window, 12 s cooldown), modeled on `src/core/understudy.ts` and its test; expose the active state in `debug/testHook.ts` so the smoke test can verify it, as T0015 did for the decoy.

## Acceptance criteria
- [ ] Pressing Q (or the new mobile button) shows a pale blue disc + dashed blue ring of 160 u radius around the player for exactly 5 s, with the new quiet SFX playing once per activation.
- [ ] While the bubble is up, enemies and their projectiles inside it move at half speed; enemies outside it keep full speed.
- [ ] A boss inside the bubble moves at half speed while its attack patterns keep their normal timing.
- [ ] A second cooldown indicator (clockwise-filling icon on desktop, dimmed 60 px button on mobile) counts a 12 s cooldown from trigger; the active cannot re-trigger before it completes.
- [ ] The Understudy (Space / bottom-left button) still works unchanged alongside the new active.
- [ ] `npm run check` (including the new core-module tests) and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/core/stillLife.ts` - pure timing, modeled 1:1 on `core/understudy.ts`. Exports `BUBBLE_LIFE_SEC = 5`, `BUBBLE_COOLDOWN_SEC = 12`, `BUBBLE_RADIUS = 160`, `SLOW_FACTOR = 0.5`, and `class StillLife` with `get active`, `get ready`, `get cooldownFrac`, `trigger(): boolean` (false while on cooldown; sets life=5, cooldown=12), `update(dt): boolean` (true on the tick the bubble ends).
- create `src/systems/StillLifeSystem.ts` - owns the disc Image + the slow pass (code below).
- create `tests/core/stillLife.test.ts` - mirror of `tests/core/understudy.test.ts`.
- edit `src/entities/EnemyBullet.ts` - add `baseVx = 0; baseVy = 0;`; in `fire()` compute them (`Math.cos(angle) * speed`) and call `this.setVelocity(this.baseVx, this.baseVy)` (reset both — pooling rule).
- edit `src/debug/testHook.ts` - `HookStats`: add `stillLifeActivations: number` (after `understudyDrops`) and `stillLifeActive: boolean` (in the live section, after `enemiesAlive`); init `0` / `false`.
- edit `src/scenes/keys.ts` - add `import type { StillLifeSystem } from '../systems/StillLifeSystem';` and `export function getStillLife(scene: Phaser.Scene): StillLifeSystem | undefined { return scene.registry.get('stillLife') as StillLifeSystem | undefined; }`.
- edit `src/scenes/GameScene.ts` - (a) import + `private stillLife!: StillLifeSystem;`; (b) in `create()` right after `this.boss = new BossSystem(...)`: `this.stillLife = new StillLifeSystem(this, this.player, this.spawns.enemies, this.spawns.enemyShots, this.boss.boss, this.sfx); this.registry.set('stillLife', this.stillLife);`; (c) in `update()` add `this.stillLife.update(dt);` on the line after `this.understudy.update(dt);`; (d) in `bindSceneEvents()`: `const onStillLife = (): void => { this.stillLife.trigger(); };`, `this.input.keyboard?.on('keydown-Q', onStillLife);` after the SPACE line, and in the SHUTDOWN block `this.input.keyboard?.off('keydown-Q', onStillLife);` + `this.registry.remove('stillLife');`; (e) in `updateHookStats()` add `s.stillLifeActive = this.stillLife.active;`; (f) in `registerInvariants()` add `hook.addInvariant('still-life', () => { const frac = this.stillLife.cooldownFrac; return frac < -1e-6 || frac > 1 + 1e-6 ? 'still-life cooldownFrac ' + frac : null; });` and append `'still-life'` to the `INVARIANTS` array.
- edit `src/scenes/HudScene.ts` - fields `stillLifeButton?: Phaser.GameObjects.Container;` and `stillLifeG?: Phaser.GameObjects.Graphics;`. In `create()`'s touch block, after the understudy button: `this.stillLifeG = this.add.graphics(); this.stillLifeButton = this.add.container(0, 0, [this.stillLifeG]).setSize(60, 60).setInteractive({ useHandCursor: true }); this.stillLifeButton.on('pointerdown', () => getStillLife(this)?.trigger());`. In `update()` add `this.drawStillLife(height);` after `this.drawUnderstudy(height);`. New method mirroring `drawUnderstudy`: `if (this.stillLifeButton && this.stillLifeG) { this.stillLifeButton.setPosition(PAD + 110, height - PAD - 36).setAlpha(sl.ready ? 1 : 0.55); this.stillLifeG.clear(); this.drawCooldownIcon(this.stillLifeG, 30, 30, 30, sl.cooldownFrac); } else { this.drawCooldownIcon(this.g, PAD + 66, height - PAD - 36, 18, sl.cooldownFrac); }` where `sl = getStillLife(this)` (return if undefined).
- edit `src/audio/Sfx.ts` - after `decoyPop()`: `bubbleOn(): void { if (!this.canPlay()) return; this.noise(0.6, 0.16, 1400, 'bandpass'); this.tone('sine', 540, 180, 0.6, 0.08); }` (soft descending "shush"; nothing on end).
- edit `src/art/textures.ts` - add `bubble: 'bubble'` to `TEX`; call `drawBubble(scene);` in `generateTextures()` after `drawDecoy(scene);`; new function: `graphicsTexture(scene, TEX.bubble, BUBBLE_RADIUS * 2 + 16, BUBBLE_RADIUS * 2 + 16, (g) => { const c = (BUBBLE_RADIUS * 2 + 16) / 2; g.fillStyle(PALETTE.blue, 0.14); g.fillCircle(c, c, BUBBLE_RADIUS); g.lineStyle(4, PALETTE.blue, 1); const step = (Math.PI * 2) / 24; for (let i = 0; i < 24; i++) { g.beginPath(); g.arc(c, c, BUBBLE_RADIUS - 2, i * step, i * step + step * 0.5, false); g.stroke(); } });` (import `BUBBLE_RADIUS` from `../core/stillLife`).
- edit `src/config.ts` - add `bubble: 15,` to `DEPTH` between `pickups: 10` and `enemies: 20` (disc under enemies).
- edit `docs/ARCHITECTURE.md` - in the frame list insert new step 8 after Understudy: "StillLifeSystem.update ages the bubble (5 s) and, while up, re-scales the velocity SpawnSystem/BossSystem wrote this frame to 50 % for every enemy, enemy shot and the boss inside its 160-unit disc (runs after them; timers untouched)"; renumber old 8→9. In the Input section add: Still Life bypasses ControlState the same way — Q (desktop) and a second round touch button right of the decoy button (mobile) call `StillLifeSystem.trigger()` directly.

### Interfaces
`class StillLifeSystem` — constructor `(scene, player: Player, enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: Boss, sfx: Sfx)`; getters `active`, `ready`, `cooldownFrac`; `trigger(): boolean`; `update(dt: number): void`. Body of `update`: `const ended = this.timing.update(dt); if (this.timing.active) { this.disc.setPosition(this.player.x, this.player.y); this.applySpeeds(true); } else if (ended) { this.disc.setVisible(false); this.applySpeeds(false); }`. `private applySpeeds(slow: boolean)`: distance-squared test vs player at `BUBBLE_RADIUS`; enemies loop `if (!e.active || !slow || !inside(e.x, e.y)) continue; const body = e.body as Phaser.Physics.Arcade.Body; e.setVelocity(body.velocity.x * SLOW_FACTOR, body.velocity.y * SLOW_FACTOR);`; shots loop `const f = slow && inside(p.x, p.y) ? SLOW_FACTOR : 1; p.setVelocity(p.baseVx * f, p.baseVy * f);` (only for `p.active`); boss: same halve-current-velocity pattern, only when `b.active && slow && inside`. Disc: `scene.add.image(0, 0, TEX.bubble).setDepth(DEPTH.bubble).setVisible(false)`, created in constructor. `trigger()`: `if (!this.scene.sys.isActive() || !this.timing.trigger()) return false; this.disc.setPosition(this.player.x, this.player.y).setVisible(true); hook.stats.stillLifeActivations += 1; this.sfx.bubbleOn(); return true;`

### Steps
1. `core/stillLife.ts` + its test; run `npm test`. 2. `EnemyBullet.ts` baseVx/baseVy. 3. `Sfx.bubbleOn()`, `TEX.bubble` + `drawBubble`, `DEPTH.bubble`. 4. `StillLifeSystem.ts`. 5. `testHook.ts` + `keys.ts`. 6. `GameScene.ts` wiring (all of (a)–(f)). 7. `HudScene.ts` button + icon. 8. `docs/ARCHITECTURE.md`. 9. `npm run check` then `npm run smoke`.

### Pitfalls
- `stillLife.update` MUST run after `spawns.update` and `boss.update` (it multiplies the velocity they wrote this frame). Placing it earlier silently does nothing.
- Never multiply a bullet's *current* body velocity every frame — `fire()` sets velocity once, so repeated ×0.5 compounds to a crawl and bullets that leave the bubble would stay slow. That is why `baseVx/baseVy` exist and the system re-applies `base × factor` every frame.
- On the end tick (`timing.update` returns true) run one final `applySpeeds(false)` pass, or shots inside the bubble keep 50 % forever.
- Boss slide-in ('entering') moves via `setPosition`, so a bubble during that 0.5 s entrance doesn't slow it — acceptable; in 'fighting' it is `setVelocity` and is slowed. Attack timers (`cycleTimer`, `dashTimer`) advance on real `dt`, so pattern timing is unchanged by design. The Grid's arms, if spawned as enemies, are covered by the enemies loop.
- Layout: understudy button center `PAD + 40`, still-life center `PAD + 110` (60 px each, 10 px gap, no overlap, ≥44 px targets); desktop icons `PAD + 22` / `PAD + 66` at r 18. Verify at 412×915.
- `'keydown-Q'` is the correct Phaser event name (verified in KeyMap). Do not route Q through `ControlState`.
- FP in tests: use 12.1 s total (71×0.1 after end), never exactly 12.0 s, to avoid a 1e-15 rounding failure.
- Clean up on shutdown: keyboard listener off, `registry.remove('stillLife')`, invariant in `INVARIANTS`.

### Tests
- `tests/core/stillLife.test.ts`: ready/frac at start; not re-triggerable at 11.9 s, ready at 12.1 s; `update` returns false 49× then true on the 50th tick (5 s) with `active` false while `ready` still false (cooldown outlives the window); constants 5/12/160/0.5.
