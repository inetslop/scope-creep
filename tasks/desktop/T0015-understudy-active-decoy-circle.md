---
id: T0015
title: Understudy active — decoy circle
assignee: desktop
size: L
priority: 2
status: todo
depends_on: [T0005, T0011, T0014]
attempts: 0
created: 2026-10-26T19:20:22Z
---

## Goal
A new active ability that gives the player an escape verb: drop a decoy that draws all enemy fire for 3 seconds, so you can reposition, kite, or bait a Sentry's shot.

## Details
- New active ability "Understudy". Trigger: Space on desktop; a dedicated round touch button on mobile (large target, placed so it does not conflict with either stick).
- On trigger, a decoy appears at the player's position: a blue circle the same size as the player, with a thin dashed ink ring around it so it reads as "not you". It is stationary, takes no damage, blocks nothing, and is not an enemy: weapons, shards and damage numbers ignore it.
- The decoy lasts 3 seconds, then pops: a small burst of ink fragments plus a soft low "pop" SFX.
- While the decoy is alive, every normal enemy that targets the player instead targets the decoy's position: all chasers chase it, and shooters (Sentry) aim their shots at it. Enemy bullets already in flight are unaffected. When the decoy pops, enemies return to the player immediately.
- The Frame boss is unaffected: its drift and attack patterns keep targeting the player.
- Cooldown: 8 seconds from the moment the decoy is dropped. Triggers during cooldown do nothing.
- HUD: a small round icon in the bottom-left of the screen — solid blue when ready; while cooling, an ink arc sweeps clockwise from the top and fills as the cooldown recovers. On mobile the touch button shows the same state (dimmed while cooling).
- SFX: two new sounds in the existing synthesized style — a soft high "pop" on drop, a lower "pop" on expire.
- Add `understudyDrops: number` to the stats in `debug/testHook.ts`.
- Unit test in `tests/core/` for the cooldown: ready at the start, not ready for 8 s after a drop, ready again after.

## Acceptance criteria
- [ ] Pressing Space (desktop) or tapping the button (mobile) drops a blue decoy circle at the player's position that lasts 3 s and then pops with a fragment burst
- [ ] While the decoy is alive, enemies chase and shoot the decoy instead of the player; when it pops, they turn back to the player
- [ ] The Frame boss ignores the decoy
- [ ] The ability is on an 8 s cooldown; the HUD icon (and the mobile button) show the cooldown filling and are solid when ready
- [ ] Two new SFX play on drop and on expire
- [ ] Unit test for the cooldown in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/core/understudy.ts` - pure decoy timing: life 3 s, cooldown 8 s counted **from the drop** (ready 5 s after the pop)
- create `src/systems/UnderstudySystem.ts` - decoy image (plain `Image`, **no physics body**), `trigger()`, `update(dt)`, target for enemies
- create `tests/core/understudy.test.ts` - cooldown unit test
- edit `src/art/textures.ts` - add `decoy: 'decoy'` to `TEX` + `drawDecoy()` called in `generateTextures()`
- edit `src/audio/Sfx.ts` - `decoyDrop()`, `decoyPop()`; edit `src/systems/FxSystem.ts` - `decoyPop(x, y)`
- edit `src/debug/testHook.ts` - `understudyDrops: number` in `HookStats` + `0` in the initial object
- edit `src/systems/SpawnSystem.ts` - constructor gains `understudy: UnderstudySystem` (last param); steering and `fireShot()` aim at the decoy
- edit `src/scenes/GameScene.ts` - construct/register system, `keydown-SPACE` listener, `understudy.update(dt)`, invariant
- edit `src/scenes/HudScene.ts` - bottom-left cooldown icon (non-touch) / 60 px round touch button (touch only)
- edit `src/scenes/keys.ts` - `getUnderstudy()`; edit `src/input/Controls.ts` - Space stops firing; edit `src/scenes/MenuScene.ts` - hint; edit `docs/ARCHITECTURE.md` - frame list + input note
### Interfaces
```ts
// src/core/understudy.ts — pure TS, no Phaser (lint-enforced)
export const DECOY_LIFE_SEC = 3;
export const DECOY_COOLDOWN_SEC = 8;
export class Understudy {
  get active(): boolean;       // lifeLeft > 0
  get ready(): boolean;        // cooldownLeft <= 0
  get cooldownFrac(): number;  // 1 - cooldownLeft / DECOY_COOLDOWN_SEC (1 = ready)
  drop(): boolean;             // false if !ready; else lifeLeft = 3, cooldownLeft = 8
  update(dt: number): boolean; // true on the tick the decoy pops
}
// src/systems/UnderstudySystem.ts
export class UnderstudySystem {
  constructor(scene: Phaser.Scene, player: Player, fx: FxSystem, sfx: Sfx);
  get target(): Vec2 | null;   // decoy position while active, else null
  get ready(): boolean; get cooldownFrac(): number;
  trigger(): boolean;          // drops at player pos; no-op while !scene.isActive() or cooling; bumps hook.stats.understudyDrops, sfx.decoyDrop()
  update(dt: number): void;    // on pop: hide image, fx.decoyPop(x, y), sfx.decoyPop()
}
// keys.ts: export function getUnderstudy(scene: Phaser.Scene): UnderstudySystem | undefined;
// Sfx: decoyDrop(): void; decoyPop(): void.  FxSystem: decoyPop(x: number, y: number): void.
```
### Steps
1. `core/understudy.ts` exactly as above, then `tests/core/understudy.test.ts`: ready at start; after `drop()`, `update(0.1)` ×79 → `ready === false`, one more `update(0.2)` → `ready === true` and `drop()` works; and the decoy returns `popped === true` after 3 s of updates. Run `npm run test`.
2. `textures.ts`: `drawDecoy()` — 64×64, `c = size/2 - SHADOW_OFFSET/2`, `drawShape(g, 'circle', c, c, PLAYER_RADIUS + 2, PALETTE.blue, { outlineWidth: 3 })` (same disc as the player, **no yellow core**), then a thin dashed ink ring: `g.lineStyle(2, PALETTE.ink, 1)` and 12 × `{ g.beginPath(); g.arc(c, c, PLAYER_RADIUS + 7, i*step, i*step + step*0.55, false); g.stroke(); }` with `step = 2π/12`. (Phaser 3.90 has no `fillArc`/`strokeArc` — use `arc()` + `fill()`/`stroke()`.)
3. `Sfx.ts`: `decoyDrop()` = `tone('sine', 740, 990, 0.07, 0.18)` + `noise(0.04, 0.08, 3500, 'highpass')`; `decoyPop()` = `tone('sine', 320, 140, 0.12, 0.25)` + `noise(0.08, 0.14, 1000, 'bandpass')` (both behind `canPlay()`, house style). `FxSystem.decoyPop(x, y)` = `fragments.setParticleTint(PALETTE.ink); fragments.explode(8, x, y);`
4. `UnderstudySystem`: image = `scene.add.image(0, 0, TEX.decoy).setDepth(DEPTH.enemies).setVisible(false)`; `trigger()` = `if (!this.scene.isActive() || !this.timing.drop()) return false;` then position at player, show, stat, SFX. `scene.isActive()` is false while the LevelUp/Pause overlay pauses GameScene, so the guard covers overlays.
5. `SpawnSystem`: `update()` → `const target = this.understudy.target ?? { x: this.player.x, y: this.player.y };`; `fireShot()` aims at the same target. In-flight bullets already carry their velocity — untouched.
6. `GameScene`: create `understudy` after `sfx`, `registry.set('understudy', ...)`; pass it to `new SpawnSystem(..., this.understudy)`; in `update()` call `this.understudy.update(dt)` after `pickups.update(dt)`; in `bindSceneEvents()` add `keydown-SPACE` → `this.understudy.trigger()` (same pattern as ESC/P/M, removed on shutdown); `registry.remove('understudy')` on shutdown; invariant `'decoy'`: if `understudy.target !== null` it must be finite and inside the inflated arena; add `'decoy'` to `INVARIANTS`.
7. `Controls.ts`: remove `SPACE` from `addKeys(...)` and change `firing: mouseDown || down('SPACE')` → `firing: mouseDown`; update the class doc comment (Space now drops the decoy, handled by GameScene).
8. `HudScene`: in `create()`, if `this.sys.game.device.input.touch` build a Container with one Graphics, `setSize(60, 60)`, `setInteractive({ useHandCursor: true })`, `on('pointerdown', () => getUnderstudy(this)?.trigger())`. In `update()`: non-touch → draw icon at center `(PAD + 22, height - PAD - 36)`, r 18; touch → position the button at `(PAD + 40, height - PAD - 36)` and draw it at r 30 with `setAlpha(ready ? 1 : 0.55)`. Both: paperLight base circle, then a blue wedge sweeping clockwise from the top — `beginPath(); moveTo(cx, cy); arc(cx, cy, r, -π/2, -π/2 + frac*2π, false); closePath(); fill()` — plus a 2 px ink line from center to the wedge edge while cooling; ink outline; solid blue disc when `frac >= 1`.
9. `MenuScene` desktop hint → `'WASD: move  ·  Mouse: aim  ·  Hold click: fire  ·  Space: decoy  ·  Esc: pause'`. `ARCHITECTURE.md`: insert a frame-list item for `UnderstudySystem.update` (renumber) and one Input-paragraph sentence: the decoy bypasses `ControlState`; Space and the touch button call `UnderstudySystem.trigger()` directly.
10. `npm run check` and `npm run smoke`.
### Pitfalls
- **Space was the fire key.** The smoke test fires via mouse click (the documented desktop control; the menu hint never mentioned Space), so repurposing Space is safe — but keep `firing: mouseDown` exactly, don't leave Space in `addKeys`.
- **Touch button vs sticks:** HudScene is above GameScene and Phaser's `InputManager` skips lower scenes when the top scene captures a pointer (`globalTopOnly` defaults true, `main.ts` never changes it) — an interactive Hud button therefore never starts a stick. No `stopPropagation` needed; do use `pointerdown`, not `pointerup`.
- **No `fillArc`/`strokeArc` in Phaser 3.90** — path arcs only (Step 2/8); a `strokeArc` call compiles but throws at runtime.
- **Frame boss (T0006, not built yet):** it will be a separate `BossSystem` steering at the player directly; the decoy only feeds `SpawnSystem`, so the boss ignores it by construction. Do not route boss targeting through `understudy.target`.
- Holding Space from the menu can auto-repeat into the first frames and drop a free decoy at run start — harmless, don't add a time guard.
- Decoy has no body: weapons/shards/damage numbers ignore it and it blocks nothing for free; don't add one. All timing in seconds via the clamped `dt`.
### Tests
- `tests/core/understudy.test.ts` (Step 1): ready at start; not ready for 8 s after a drop; ready again; pop after 3 s.
