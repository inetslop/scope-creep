---
id: T0044
title: The Grid — second boss
assignee: desktop-4070
size: L
priority: 1
status: in-progress
depends_on: [T0006]
attempts: 1
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-26T23:37:11Z
---

## Goal
A second boss for late runs: The Grid, a rotating compass that sweeps damaging ink arms across the arena, giving runs a new endgame threat after The Frame.

## Details
- Reuse the existing boss infrastructure from The Frame (T0006): the same boss scheduling, the same `bossHpMultiplier` (+50% HP per respawn), the same boss health bar in the HUD, and the same boss-death handling (shard burst, respawn).
- Schedule: the boss schedule continues as it does today (a boss every 5 minutes, first at 5:00). From the second boss spawn onward, The Grid and The Frame alternate: 5:00 The Frame, 10:00 The Grid, 15:00 The Frame, 20:00 The Grid, and so on. The existing +50%-per-respawn HP scaling applies to each spawn exactly as it does today.
- Look: a large ink compass — a circle (radius 46) with a thick ink outline, a cross/needle through the center, and four short tick marks at the cardinal points. It rotates slowly (0.5 rad/s) as it moves.
- Behavior:
  - Drift: it moves slowly toward the player at speed 40, like a heavy presence; it does not charge or dash.
  - Signature attack — sweeping arms: every 4 s the Grid telegraphs for 0.5 s (it flashes red and a faint ink line hints at the arm path), then two opposite ink arms extend from its center and sweep a half-turn (180°) over 1.5 s. Each arm is a long thin ink rectangle, ~200 units long and 12 units thick. The arms deal 12 contact damage to the player, respecting the player's normal post-hit invulnerability window. After the sweep the arms retract and the 4 s cycle restarts.
  - No projectiles in this version — one clear attack only.
- Values: `hp: 400` (before the bossHpMultiplier), `speed: 40`, contact damage 12 (body and arms), radius 46.
- On its first appearance in a run, a "THE GRID" label flashes in the HUD (reuse the existing HUD flash style, like the RHYTHM flash).
- Add `gridKills: number` to the stats in `debug/testHook.ts`.
- Put the arm-sweep timing in a pure module (like `src/core/boss.ts`) and add a unit test in `tests/core/` for it: arms retracted at rest; the telegraph begins after the 4 s period; the sweep completes 1.5 s after it starts; then the cycle restarts.

## Acceptance criteria
- [ ] At 10:00 The Grid spawns as the second boss, with a health bar in the HUD; later boss spawns alternate Frame / Grid / Frame / Grid
- [ ] The Grid drifts slowly toward the player (speed 40) and rotates as it moves
- [ ] Every 4 s it telegraphs (0.5 s red flash + faint arm hint) and then sweeps two opposite ink arms 180° over 1.5 s; touching an arm deals 12 damage
- [ ] The Grid has 400 base HP and gains +50% HP per respawn, like The Frame
- [ ] On death it drops a shard burst and is handled by the normal boss-death path (including the large screen shake once T0040 exists)
- [ ] On its first appearance in a run, "THE GRID" flashes in the HUD
- [ ] `gridKills` is tracked in the debug stats
- [ ] Unit test for the arm-sweep timing in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/bosses/types.ts` — `BossDef` base + `FrameBossDef` + `GridBossDef` (moved out of frame.ts, split by behavior)
- create `src/content/bosses/grid.ts` — `GRID` data
- create `src/content/bosses/index.ts` — `BOSSES` registry, `BOSS_BY_ID`, `getBoss`, re-export types/FRAME/GRID
- create `src/core/gridSweep.ts` — pure arm-sweep timing + point-to-segment distance
- create `tests/core/gridSweep.test.ts` — sweep timing test
- edit `src/content/bosses/frame.ts` — `FRAME: FrameBossDef`; add `bodyRadius: 80`; `look.frame` → `look.body`
- edit `src/core/boss.ts` — add `bossForKill()`
- edit `src/core/run.ts` — add `bossId = ''` next to the other boss fields
- edit `src/entities/Boss.ts` — `spawn()` takes the `BossDef` (texture + body circle); drop FRAME import
- edit `src/art/textures.ts` — 3 new TEX keys + `drawBossGrid()`
- edit `src/systems/BossSystem.ts` — boss selection per kill, Grid drift/spin/sweep, arm + hint objects
- edit `src/scenes/HudScene.ts` — boss name from `run.bossId`, not hardcoded `FRAME.name`
- edit `src/scenes/GameScene.ts` — 'boss-state' invariant also checks the arm
- edit `src/debug/testHook.ts` — `gridKills` in `HookStats` + initializer
- edit `tests/core/boss.test.ts`, `tests/content.test.ts` — see Tests

### Interfaces
```ts
// content/bosses/types.ts — base (Frame-only fields move to FrameBossDef, unchanged values):
export interface BossDef { id: string; name: string; hp: number; speed: number; contactDamage: number; bodyRadius: number; coreSize: number; deathXp: number; deathPickups: number; behavior: 'frame' | 'grid'; look: { body: number; core: number }; }
export interface FrameBossDef extends BossDef { behavior: 'frame'; dashContactDamage: number; frameSize: number; frameThickness: number; dashSpeed: number; dashDurationSec: number; attackCycleSec: number; telegraphSec: number; ringCount: number; ringRadius: number; burstCount: number; ringEnemyId: string; }
export interface GridBossDef extends BossDef { behavior: 'grid'; spinRadPerSec: number; armLength: number; armThickness: number; armDamage: number; }
// content/bosses/grid.ts:
export const GRID: GridBossDef = { id: 'grid', name: 'THE GRID', hp: 400, speed: 40, contactDamage: 12, bodyRadius: 46, coreSize: 12, deathXp: 30, deathPickups: 10, behavior: 'grid', spinRadPerSec: 0.5, armLength: 200, armThickness: 12, armDamage: 12, look: { body: PALETTE.paperLight, core: PALETTE.red } };
// core/boss.ts:
export function bossForKill(kills: number): BossDef { return kills % 2 === 0 ? FRAME : GRID; }
// core/gridSweep.ts (full module):
export type GridSweepPhase = 'rest' | 'telegraph' | 'sweep';
export interface GridSweepTiming { periodSec: number; telegraphSec: number; sweepSec: number; }
export const GRID_SWEEP: GridSweepTiming = { periodSec: 4, telegraphSec: 0.5, sweepSec: 1.5 };
export class GridSweep {
  private readonly timing: GridSweepTiming; private t = 0;
  constructor(timing: GridSweepTiming = GRID_SWEEP) { this.timing = timing; }
  get cycleSec(): number { return this.timing.periodSec + this.timing.telegraphSec + this.timing.sweepSec; }
  get phase(): GridSweepPhase {
    if (this.t < this.timing.periodSec) return 'rest';
    if (this.t < this.timing.periodSec + this.timing.telegraphSec) return 'telegraph';
    return 'sweep';
  }
  get sweepProgress(): number {
    const start = this.timing.periodSec + this.timing.telegraphSec;
    if (this.t <= start) return 0;
    return Math.min(1, (this.t - start) / this.timing.sweepSec);
  }
  update(dt: number): void { this.t = (this.t + dt) % this.cycleSec; }
  reset(): void { this.t = 0; }
}
export function pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax; const aby = by - ay; const len2 = abx * abx + aby * aby;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby));
}
```

### Steps
1. Create types.ts/grid.ts/index.ts as above. index.ts: `export const BOSSES: readonly BossDef[] = [FRAME, GRID]; export const BOSS_BY_ID: ReadonlyMap<string, BossDef> = new Map(BOSSES.map((b) => [b.id, b]));` + `getBoss(id)` (throw like `getEnemy`) + `export type { BossDef, FrameBossDef, GridBossDef } from './types'; export { FRAME } from './frame'; export { GRID } from './grid';`
2. core/boss.ts: import FRAME/GRID/the type, add `bossForKill`. core/run.ts: `bossId = '';` with a comment (BossSystem owns the writes).
3. entities/Boss.ts: `spawn(x: number, y: number, hp: number, def: BossDef): void` — first `this.setTexture(def.behavior === 'grid' ? TEX.bossGrid : TEX.bossFrame)` and `this.core.setTexture(def.behavior === 'grid' ? TEX.bossGridCore : TEX.bossCore)`, then `body.setCircle(def.bodyRadius, this.width / 2 - def.bodyRadius, this.height / 2 - def.bodyRadius)`. Rest unchanged.
4. art/textures.ts: add `bossGrid`, `bossGridCore`, `bossGridArm` to TEX; call `drawBossGrid(scene)` after `drawBoss(scene)`. In it: shadow `fillCircle(c+3, c+3, 46)` ink 0.18; disc `fillCircle(c, c, 46)` `GRID.look.body`; `lineStyle(8, PALETTE.ink, 1); strokeCircle(c, c, 42)`; cross `lineStyle(6,...)` `lineBetween(c-30,c, c+30,c)` + vertical; four ticks `lineStyle(4,...)` from `r-4` to `r-14` along each cardinal axis; core = `drawShape(g, 'circle', coreC, coreC, 6, GRID.look.core, { outlineWidth: 2 })`; arm = one 400×12 ink `fillRect` (+ shadow copy offset 3) in a 412×24 texture (two opposite arms as one bar).
5. BossSystem: fields `private def: BossDef = bossForKill(0); private readonly sweep = new GridSweep(); private sweepPhase: GridSweepPhase = 'rest'; private sweepStartAngle = 0; private sweepDir = 1; readonly arm: Phaser.GameObjects.Image; private readonly hint: Phaser.GameObjects.Graphics;`. Constructor: `this.arm = scene.add.image(0, 0, TEX.bossGridArm).setVisible(false).setDepth(DEPTH.enemies + 1); this.hint = scene.add.graphics().setDepth(DEPTH.enemies + 1).setVisible(false);` (import TEX, DEPTH, PLAYER_RADIUS). `startWarning()`: `this.def = bossForKill(this.run.bossKills); this.run.bossId = this.def.id;`. `startEntering()`: hp from `this.def.hp`; `this.boss.spawn(x, -half - 100, hp, this.def);`. `updateEntering()` finish: frame → existing cycleTimer/dashTimer reset; grid → `this.sweep.reset(); this.sweepPhase = 'rest'; this.sweepStartAngle = 0; this.sweepDir = 1; this.arm.setVisible(false); this.hint.setVisible(false);`. `updateFighting()`: `const def = this.def; if (def.behavior === 'frame') this.updateFrameFighting(dt, def); else this.updateGridFighting(dt, def);` — rename the existing body to `updateFrameFighting(dt, def: FrameBossDef)` with `FRAME.*` → `def.*` (same for `executeAttack(def)`), logic untouched. `onPlayerTouched()`: `let damage = def.contactDamage; if (def.behavior === 'frame' && this.dashTimer > 0) damage = def.dashContactDamage;`. `killBoss()`: pickups from `this.def.deathPickups/deathXp`; add `if (this.def.behavior === 'grid') hook.stats.gridKills += 1; this.run.bossId = '';` and hide arm/hint; keep `this.fx.shake(600, 0.02)` as-is.
6. New `updateGridFighting(dt: number, grid: GridBossDef)`: drift `b.setVelocity(dir.x * grid.speed, dir.y * grid.speed)` with `dir = normalize(sub(this.player, b))`; `b.setRotation(b.rotation + grid.spinRadPerSec * dt)`; `this.sweep.update(dt)`; on phase edge (`ph !== this.sweepPhase`): 'telegraph' → lock `sweepStartAngle = atan2` from boss to player (fallback `b.rotation` if coincident), `sweepDir = this.run.rng.chance(0.5) ? 1 : -1`, `hint.setVisible(true)`; 'sweep' → `hint.setVisible(false); arm.setVisible(true)`; 'rest' → `arm.setVisible(false)`. Per frame: telegraph → `hint.clear().setPosition(b.x, b.y).setRotation(sweepStartAngle); hint.lineStyle(2, PALETTE.ink, 0.3); hint.lineBetween(-grid.armLength, 0, grid.armLength, 0);` and tint body red; sweep → `angle = sweepStartAngle + sweepDir * sweep.sweepProgress * Math.PI`, `arm.setPosition(b.x, b.y).setRotation(angle)`, and if `pointToSegmentDistance(player.x, player.y, b.x - cos(angle)*grid.armLength, b.y - sin(angle)*grid.armLength, b.x + cos(angle)*grid.armLength, b.y + sin(angle)*grid.armLength) <= grid.armThickness / 2 + PLAYER_RADIUS` and `!player.isInvulnerable(now)` and `!run.isDead` → `run.takeDamage(grid.armDamage); player.hurt(now); fx.playerHit(...); sfx.playerHurt();`. Tint: `flashMs > 0` → body `PALETTE.paperLight`, else telegraph → `PALETTE.red`, else `clearTint()` (decrement `flashMs` by `dt * 1000` first, like the frame branch).
7. HudScene: drop FRAME import, import `BOSS_BY_ID` from '../content/bosses'; create `bossWarnText` with `''`; in update `const bossName = run.bossId !== '' ? BOSS_BY_ID.get(run.bossId)?.name ?? '' : '';` → `bossWarnText...setAlpha(run.bossWarning ? 1 : 0).setText(bossName)` and `bossName...setText(bossName)`. Do NOT setText in the death-fade branch (keep the last name during the 0.5 s fade).
8. GameScene 'boss-state' invariant: add `if (this.boss.arm.visible && (!Number.isFinite(this.boss.arm.x) || !Number.isFinite(this.boss.arm.y))) return \`boss arm at (${this.boss.arm.x}, ${this.boss.arm.y})\`;`.
9. testHook.ts: `gridKills: number;` after `bossKills` in `HookStats` and `gridKills: 0` in the initializer.
10. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Arcade bodies do NOT rotate: the arm must be a plain `Image` (no physics body); collision is the manual `pointToSegmentDistance` check. Don't add an overlap for it.
- Lock `sweepStartAngle`/`sweepDir` exactly once, on the rest→telegraph edge (compare with stored `sweepPhase`); recomputing per frame makes the hint line drift.
- The cycle is rest 4 s → telegraph 0.5 s → sweep 1.5 s (6 s total); "retract" = the transition back to 'rest' (arm hidden instantly).
- Frame behavior must stay identical: only rename `FRAME.*` → `def.*` in the frame branch, change no numbers.
- `tests/core/gridSweep.test.ts`: use fresh instances and exact values (4, 4.5, 5.25, 6) — don't chain float additions like `update(3.99); update(0.01)`.
- testHook.ts is also touched by T0015 and killBoss's shake line by T0040 — keep both edits minimal and don't restructure those spots.
- Arm texture is 412×24 (400+2·PAD × 12+2·PAD) so the paper-cut shadow fits inside.

### Tests
- `tests/core/gridSweep.test.ts`: retracted at rest (t=0, t=3.999); telegraph at t=4; sweep at t=4.5 with progress 0; progress 0.5 at t=5.25; at t=6.0 phase is 'rest' again (cycle restarted); `pointToSegmentDistance` sanity (0 on segment, 3 off it, clamped at ends).
- `tests/core/boss.test.ts`: `bossForKill(0..3)` → frame, grid, frame, grid.
- `tests/content.test.ts`: new `describe('bosses')` — unique kebab ids via `expectUniqueIds(BOSSES)`, sane numbers (hp/speed/contactDamage/bodyRadius/deathXp > 0, deathPickups integer ≥ 1, grid arm numbers > 0).
