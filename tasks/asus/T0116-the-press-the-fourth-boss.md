---
id: T0116
title: The Press — the fourth boss
assignee: asus
size: L
priority: 2
status: todo
depends_on: [T0098]
attempts: 0
created: 2026-10-27T14:32:00Z
---

## Goal
The run's late act gets its own fight: The Press at the top of the page pushes a solid wall of ink down the page, and you shoot the wall to damage it while clearing the rows of type blocks it prints to pull the wall back — the arena closes in around the fight, so surviving the fourth boss takes space management, not just DPS.

## Details
- Rotation and slot: The Press is the fourth boss — the rotation becomes Frame → Grid → Palette → Press, then the cycle repeats with the existing +50% HP-per-respawn scaling (unchanged). In a standard run the first Press arrives at the fourth boss slot (20:00). It gets everything other bosses get for free: the 5 s boundary warning (T0070), the spawn sting (T0058), the "THE PRESS" nameplate on first sighting (T0064), and the 64 BPM boss-music hold (T0108).
- The wall (the boss body): a flat ink band, 70 units thick, spanning the full crop-safe width, with the standard hard paper-cut shadow. Its leading edge starts at the top of the crop-safe area and advances down at 1/150 of the safe-area height per second. The wall is solid: it blocks the player, enemies and projectiles alike. Unopposed, the wall crosses the safe area in about 60 s (base advance plus stamps); keeping the type-block rows cleared stretches that past 100 s.
- The stamp: every 5 s the Press stamps — a 1.0 s telegraph (a 2 u red rule draws along the leading edge, the Gutter telegraph idiom from T0099, plus the existing low thud; no new SFX), then the leading edge jumps down 1/20 of the safe height with a small screen shake (the smallest amplitude the T0040 shake system offers).
- Type blocks: 3 s after the Press lands it prints a row of 4 type blocks on the leading edge — flat grey squares, 24 units across, 30 HP each, 4 contact damage, placed at the 20%, 40%, 60% and 80% positions of the safe width. A new row prints every 9 s; a new row replaces any undestroyed old blocks (the old ones vanish — the Press reprints). When all 4 blocks of the current row are destroyed, the wall retracts upward by 1/16 of the safe height over 0.6 s.
- The blocks are boss parts, not enemies — like the Palette's swatches: targetable, take normal damage (crits and Underexposure apply as they do to the boss), give no XP or score, get no marginalia, and do not count against the 10-enemy regular pool.
- The wall is the body: any player projectile that hits the wall (any weapon, Orbit contacts included, Inkwell burst included) is absorbed and deals normal damage to the boss; the boss has 520 HP in the standard boss bar. Enemy projectiles also die on the wall's underside.
- Push and burn: the wall is a moving floor — if its leading edge catches the player or an enemy, it pushes them down. While the wall is in contact with the player, they burn 8 damage/s. Enemies are pushed, not damaged. If the leading edge reaches the bottom of the safe area it clamps there — the fight is decided by HP, not by outrunning the wall.
- The world adjusts while the Press is alive: the spawn director treats the region above the leading edge as off-limits to normal spawns (as it already does for the crop margin); the Gutter (T0099) sweeps only the free region below the wall; wall progress is expressed as a fraction of the crop-safe area, so the T0045 shrink (which can be active mid-fight) moves the wall's pixels, not its progress.
- Death: at 0 HP the band shatters — it breaks into 4–6 large flat ink fragments that drop 40–80 units and fade over 1 s — then the standard boss death plays (heavy shake, +50 score with the "+50" kill feed via the normal kill path, music release).
- No new HUD element, key or SFX.
- A pure `pressWall` timing module (advance rate, stamp cadence and jump, row cadence, retract rule, bottom clamp) with unit tests, in the same pattern as `gridSweep` (T0044) and `swatchCascade` (T0097); the boss-rotation test (T0061, as updated by T0097) is updated to the four-boss rotation in this task.

## Acceptance criteria
- [ ] The rotation is Frame → Grid → Palette → Press, then repeats with the existing +50% HP-per-respawn scaling; the first Press is the fourth boss (the 20:00 slot in a standard run); the boss-rotation test passes on the four-boss rotation.
- [ ] While The Press is alive, a 70 u ink band spans the crop-safe width, its leading edge starts at the top of the safe area and advances continuously; stand still and the wall reaches you, pushes you down, and burns 8 damage/s while in contact.
- [ ] Every 5 s the wall telegraphs for 1.0 s (red rule along the leading edge plus the existing low thud) and jumps down 1/20 of the safe height; a row of 4 grey type blocks (24 u, 30 HP) prints on the leading edge 3 s after spawn, then a new row every 9 s.
- [ ] Clearing all 4 blocks of the current row pulls the wall back up 1/16 of the safe height over 0.6 s; a new row replaces undestroyed old blocks.
- [ ] Projectiles that hit the wall are absorbed and damage the 520 HP boss in the standard bar; the "THE PRESS" nameplate, the 5 s warning, the spawn sting and the 64 BPM hold all fire.
- [ ] At 0 HP the band shatters into 4–6 ink fragments (40–80 u drop, fading over 1 s) and the standard boss death plays: +50 score with the "+50" kill feed, heavy shake, music release.
- [ ] `tests/core/press.test.ts` locks the pure timing: advance rate, stamp cadence and the 1/20 jump, row cadence, the 1/16 retract rule, and the bottom clamp.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

- All boss "free" features (5 s warning, sting, nameplate, 64 BPM hold, +50 kill feed, death shake/music release) come from the existing `BossSystem` phase machine + `RunState` — registering the def gets them for free.
- The wall must be the `Boss` sprite itself (invisible dot texture carrying a full-safe-width rect body): the existing `boss↔projectiles` overlap then delivers "any projectile absorbed → normal damage to the 520 HP bar" unchanged. Pushing is a manual clamp (no collider — colliders can't be enabled per-boss without touching other bosses).
- Type blocks are a 4-slot pooled group in `BossSystem` (not the enemies group → no XP/score/kill count, no enemy-count invariant impact).
- The director is already paused while `bossAlive`; the "region above the wall off-limits" rule lands in `pickSpawnPoint` (defensive, for the approach window / explicit spawns), and `run.pressLeadY` (NaN when off-page) is the cross-system channel to `GutterSystem` (clip) — matching the existing `boss*` RunState precedent.
- Timing math checks out: unopposed crossing is exactly 60 s (60/150 + 12×1/20 = 1), fully-cleared rows stretch it to ~100 s.
- File overlap with T0098 (same assignee, in progress): `OrbitSystem.ts`, `textures.ts` → declare dependency.

DESIGN:
### Files
- create `src/content/bosses/press.ts` - `PRESS: PressBossDef` (4th boss data)
- create `src/core/pressWall.ts` - pure wall schedule (timing + state machine)
- create `src/entities/TypeBlock.ts` - pooled type block (boss part, not enemy)
- create `tests/core/press.test.ts` - locks pressWall timing
- edit `src/content/bosses/types.ts` - `'press'` in behavior union + `PressBossDef`
- edit `src/content/bosses/index.ts` - register `PRESS`, re-export
- edit `src/core/boss.ts` - `bossForKill` 4-cycle + doc
- edit `src/core/run.ts` - `pressLeadY` field
- edit `src/entities/Boss.ts` - `spawn()` press branch
- edit `src/systems/BossSystem.ts` - press behavior (wall, blocks, push/burn, shatter, orbit hits)
- edit `src/systems/OrbitSystem.ts` - orbit contact with the wall
- edit `src/systems/GutterSystem.ts` - clip sweep/burn to the region below the wall
- edit `src/systems/SpawnSystem.ts` - `pickSpawnPoint` excludes above the wall
- edit `src/art/textures.ts` - `TEX.typeBlock`, `TEX.pressFragment`, `drawBossPress`
- edit `src/scenes/GameScene.ts` - OrbitSystem args + 2 invariants
- edit `src/debug/testHook.ts` - `pressKills` stat
- edit `tests/core/boss.test.ts` - four-boss rotation
- edit `tests/content.test.ts` - press numbers check
### Interfaces
```ts
// content/bosses/types.ts  (BossDef.behavior gains 'press')
export interface PressBossDef extends BossDef {
  behavior: 'press';
  bandThickness: number;       // 70
  blockHp: number;             // 30 (flat: NO bossHpMultiplier)
  blockSize: number;           // 24
  blockContactDamage: number;  // 4
}
// core/pressWall.ts
export interface PressWallTiming { advancePerSec: number; stampPeriodSec: number; stampTelegraphSec: number; stampJump: number; firstRowSec: number; rowPeriodSec: number; retractAmount: number; retractSec: number; }
export const PRESS_WALL: PressWallTiming = { advancePerSec: 1/150, stampPeriodSec: 5, stampTelegraphSec: 1, stampJump: 1/20, firstRowSec: 3, rowPeriodSec: 9, retractAmount: 1/16, retractSec: 0.6 };
export class PressWall { constructor(timing?: PressWallTiming); reset(): void; update(dt: number): void; clearRow(): void;
  get progress(): number;  // 0..1 leading-edge fraction of safe height, clamped; 0 = top, 1 = bottom
  get stamps(): number; get rows(): number;  // edge-detection counters
  get stampTelegraph(): boolean; get stampTelegraphAlpha(): number; }  // 0→0.6→0 triangle, gutter idiom
// core/run.ts: pressLeadY = Number.NaN;  // world y of the leading edge; BossSystem writes; NaN while off-page
// entities/TypeBlock.ts
export class TypeBlock extends Phaser.Physics.Arcade.Image { hp = 0; maxHp = 0; serial = 0; contactDamage = 0; slot = 0; flashMs = 0;
  spawn(x: number, y: number, hp: number, size: number, contactDamage: number): void; hit(damage: number): boolean; despawn(): void; }
// systems/OrbitSystem.ts: 2 new final ctor params: pressWallRect: () => Phaser.Geom.Rectangle | null; pressWallHit: (x, y, damage, crit) => void
// systems/BossSystem.ts: ctor gains enemyShots group after projectiles; public: readonly pressWall, readonly blocks, pressWallRect(), hitWallFromOrbit(x, y, damage, crit)
```
### Steps
1. `press.ts`: hp 520, speed 40 (unused, content test needs >0), contactDamage 8 (=burn rate/s), bodyRadius 35 (nominal, feed offset), coreSize 0, deathXp 30, deathPickups 10, bandThickness 70, blockHp 30, blockSize 24, blockContactDamage 4, name 'THE PRESS', look ink/paperLight. Register in `index.ts` as the 4th.
2. `core/boss.ts`: `bossForKill` → `kills % 4`, n===3 → PRESS.
3. `pressWall.ts`: fields time, frac, stampCount, rowCount, retracting, retractT, retractFrom, retractTo. `update(dt)`: time+=dt; if retracting: retractT+=dt, u=min(1,retractT/retractSec), frac=retractFrom+(retractTo−retractFrom)·u, finish at u≥1; else frac+=advancePerSec·dt. Then `while (time >= (stampCount+1)*stampPeriodSec) { stampCount++; applyJump(stampJump); }`; then `while (time >= firstRowSec + rowCount*rowPeriodSec) rowCount++;`; finally frac=clamp01. `applyJump(a)`: frac+=a; if retracting also retractFrom+=a, retractTo+=a. `clearRow()`: no-op if retracting or rowCount===0; else retracting=true, retractT=0, retractFrom=frac, retractTo=max(0, frac−retractAmount).
4. `run.ts`: add the field (doc: BossSystem owns the writes).
5. `textures.ts`: `TEX.typeBlock` (24u square, PALETTE.gray, `drawShape 'square'` r=24/Math.SQRT2, outlineWidth 3, texture side `Math.ceil((24/Math.SQRT2+PAD)*2)`), `TEX.pressFragment` (flat 120×36 ink rect + 3px shadow strip), `drawBossPress(scene)` from `generateTextures`.
6. `TypeBlock.ts` (pooled: reset all fields in spawn; body.setSize(size,size) + palette-style setOffset; no knockback in hit, 60ms ink tint flash). `Boss.spawn` press branch: TEX.dot texture, `setVisible(false)` (sprite is the hit region only), core hidden, enableBody, `body.setCollideWorldBounds(false)` (band top sits above the arena at progress 0), serial/hp/flash reset, velocity 0.
7. `BossSystem` press: fields `pressWall=new PressWall()`, `blocks` group (classType TypeBlock, maxSize 4), `band` Graphics (DEPTH.arena+1, hidden), reusable `wallRect`, lazy `fragments: (Image|null)[]` pool (max 6), `pressStamps/pressRows=0`, `pressTelegraphing=false`, `pressBurnTimer=0`, `pressBandWidth=0`. Ctor: enemyShots param + overlaps `blocks↔projectiles` (onBlockHit), `player↔blocks` (onBlockTouched), `boss↔enemyShots` (onEnemyShotWall: press-only, despawn). `update()`: entering branch also does `pressWall.update(dt)`; `updateEntering` press branch: `updatePress(dt); if (phaseTimer<=0) phase='fighting'; return;`; `updateFighting`: `else` → `updatePress(dt)`. `startEntering` press branch (spawn at (0, −halfSafe−bandThickness/2)): reset wall+counters, despawn blocks, band visible, size body once, `if (this.run.bossKills === 3) this.marginalia.noteAt(0, -halfSafe - 80, 'SHOOT THE TYPE BLOCKS', 2.5)`.
8. `updatePress(dt)`: half=(ARENA_SIZE/2)·cropSafeFraction(run.timeSec); leadY=−half+progress·2·half; `run.pressLeadY=leadY`. stamps edge → `fx.shake(4,150)` (smallest shake amplitude). telegraph rising edge → `sfx.slam()` (existing low thud). rows edge → `printRow` (despawn active blocks = reprint, then 4× spawn at (−half+((i+1)/5)·2·half, leadY), slot=i). `placeBand`: setSize(2·half, bandThickness)+setOffset((boss.width−2·half)/2, (boss.height−bandThickness)/2) only when |Δwidth|>0.01; boss.setPosition(0, leadY−bandThickness/2). Pin each active block to (−half+((slot+1)/5)·2·half, leadY), decay flashMs. Push (moving floor, always down): if player.y−PLAYER_RADIUS<leadY → player.setPosition(player.x, leadY+PLAYER_RADIUS) and `run.drain(def.contactDamage*dt)` with a red number every 0.5s (gutter idiom); per active enemy with body.top<leadY → e.setPosition(e.x, leadY+body.halfHeight), no damage. `drawBand`: ink rect [leadY−70, leadY]×safe width, 0.18 shadow offset, 2u red rule at leadY with stampTelegraphAlpha while telegraphing.
9. `onBlockHit`: guards p.active/blk.active/hitSerials; crit=stats.critChance>0&&run.rng.chance(critChance); wound=underexposureDamage(woundThreshold, blk.hp, blk.maxHp, crit?p.damage*2:p.damage); number at blk, fx.hit at p, pierceLeft−−/despawn; on death: fx.death(gray/ink,24)+sfx.enemyDeath(24)+despawn, and if blocks.countActive(true)===0 && pressRows>0 → pressWall.clearRow(). No XP/score/kill/marginalia. `onBlockTouched`: invuln/dead guards, takeDamage(blk.contactDamage)+hurt+fx.playerHit+sfx.playerHurt. `onPlayerTouched`: first line `if (this.def.behavior === 'press') return;`. `onProjectileHit`: damage number at (p.x,p.y) for press. `killBoss` press branch: pressKills++, pressLeadY=NaN, band hidden, blocks despawned, fragment shatter (count 4+floor(random·3), lazy image at random x clamped 40 inside safe width, y=band center, scale 0.7–1.8, tween y+=40+random·40, alpha→0, 1000ms, Cubic.In, hide on complete; killTweensOf first). `hitWallFromOrbit`: underexposure vs boss hp, boss.hit, run.bossHp sync, numbers/fx/sfx at (x,y), killBoss on death.
10. `OrbitSystem`: store both callbacks + `wallLastHit=-Infinity`; in the circle loop after enemy checks: distance from circle center to wall rect ≤ circleRadius and cooldown elapsed → set wallLastHit, crit roll, `pressWallHit(cx,cy,(crit?2:1)·def.damage·stats.damageMul,crit)`.
11. `GutterSystem`: `const top = Number.isFinite(run.pressLeadY) ? Math.max(-half, run.pressLeadY) : -half;` draw telegraph/shadow/band from top to half (height half−top); burn region `p.y+R>top && p.y-R<half`; taught note at top+60.
12. `SpawnSystem.pickSpawnPoint`: `floorY = Number.isFinite(run.pressLeadY) ? run.pressLeadY+40 : inner.top`; require y≥floorY in attempts; clamp fallback y to [max(inner.top,floorY), inner.bottom]. Director stays paused while bossAlive.
13. `GameScene`: wire the two new OrbitSystem args via `this.boss` callbacks; invariants `'press-wall'` ((bossAlive&&bossId==='press')===Number.isFinite(pressLeadY) and pressLeadY within safe rect) and `'type-blocks'` (countActive≤4) (GameScene clears all invariants on shutdown; there is no name list to update). `testHook`: `pressKills` field + init 0.
### Pitfalls
- Boss body = huge rect on the 8×8 dot texture: setSize + palette-style negative setOffset is correct (body pos = sprite + scale·(offset−displayOrigin)); keep scale 1; never let the generic entering path set collideWorldBounds(true) for press.
- Overlap callbacks run during the physics step (after GameScene.update), so row replacement and block hits can't race: replaced blocks are despawned (no body) before any hit this frame.
- Blocks must never enter the enemies group/kill path (no XP, score, run.kills, enemy-count impact); block HP stays flat 30 — only the 520 wall HP scales per respawn.
- Burn = run.drain (no armor/invuln, gutter/crop idiom); block contact = takeDamage+hurt (invuln). Don't cross them. Stamp thud = existing sfx.slam(); no new SFX.
- Crop (T0045): recompute half every frame; resize the body only when width changes. Fragments: killTweensOf before reuse (platemark idiom).
- Smoke run never reaches the Press: every new state must be valid idle (pressLeadY NaN, 0 blocks, band hidden) or the invariants fail.
### Tests
- `tests/core/press.test.ts`: PRESS_WALL toEqual; update(4) → 4/150; telegraph at 4.5 not at 3.99/5.0; stamps 0→1 at exactly 5.0, progress(5.0)=5/150+1/20; unopposed crossing <1 at 59.9, ===1 at 60.0; rows 0@<3, 1@3, 2@12, 3@21; clearRow at 12 (progress 0.18) → 0.18−1/16 at 12.6; retract clamps at 0 (clearRow at 3.5 → 0 at 4.1); 200s run never exceeds 1; stamp mid-retract (clearRow at 9.6, stamp at 10) shifts retractFrom/To by 1/20 (progress 0.1515 at 10.2).
- `tests/core/boss.test.ts`: bossForKill(0..7)=frame,grid,palette,press ×2; extend timer chain to due(1200) with bossForKill(3)='press' (20:00 first Press); boss #1 test adds not.toBe('press').
- `tests/content.test.ts`: press block (bandThickness>0, blockHp>0, blockSize∈[4,80], blockContactDamage≥0).
