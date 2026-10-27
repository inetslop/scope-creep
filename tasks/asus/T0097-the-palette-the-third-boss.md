---
id: T0097
title: The Palette — the third boss
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T09:43:38Z
claimed_at: 2026-10-27T10:07:49Z
---

## Goal
The third boss completes the rotation and is the first boss that rewards surviving: five color swatches fall down the page one at a time — shoot each one before it reaches the bottom, and every swatch you dodge paints your circle. The first boss fight where staying alive is part of the fight.

## Details
- Identity: "THE PALETTE", the third boss in the rotation. Its body is a thin ink rail across the top of the page with five color swatches docked in it, drawn left to right in the page's palette: red, orange, yellow, green, blue. Each swatch is a flat 60×30 color tile (2:1, the existing rect language) with the standard ink outline. Draw the rail and swatches with the same custom-drawing approach The Grid uses for its ink arms — no new art system, no new texture pipeline.
- Rotation: `bossForKill` becomes tri-cyclic — kill 0 → The Frame (5:00), kill 1 → The Grid (10:00), kill 2 → The Palette (15:00), kill 3 → The Frame (20:00), and so on. The existing 5-minute interval and the +50% HP-per-respawn multiplier stay unchanged. Update the T0061 rotation test in `tests/core/boss.test.ts` in this task: first boss is The Frame, strict Frame → Grid → Palette repetition, deterministic.
- The fight, one swatch at a time:
  - The first swatch detaches 1.0 s after the boss appears and falls straight down from the top edge, taking exactly 6.0 s to reach the bottom edge (speed = arena height / 6, computed at detachment).
  - Swatches detach in docked order (red first, blue last). Each falls at a different horizontal position: at least 120 units from the previous swatch's X (chosen with the run's seeded RNG, at least 60 units inside the current safe-area edges), so the player has to cross the page.
  - The falling swatch is the boss body while it is down: 90 HP (× the current boss respawn multiplier), taking damage from the player's weapons the way The Grid does. It does not interfere with enemies on screen — the player fights the swarm as usual. Between swatches the boss takes no damage; the docked rail is not shootable.
  - The boss health bar (which already reads the boss name from content data) shows "THE PALETTE" at 450 total HP on a fresh spawn — undeployed swatches × 90 plus the falling swatch's remaining HP.
  - Contact with the falling swatch: 12 damage, once per swatch (1.0 s of invulnerability after being hit).
  - A destroyed swatch shatters with the standard death FX (fragments + ink ring) and drops 6 shards where it broke. A swatch that reaches the bottom edge sinks into the paper — a faint ink stain at its position fades over 3 s — and counts as resolved.
  - The next swatch detaches 1.2 s after the previous one resolves (destroyed or sunk).
  - All five resolved → the standard boss-death flow (bossKills++, the next Palette arrives +50% HP). The existing sting (T0058), warning (T0070) and nameplate (T0064) all fire for it as "any boss" — no new intro elements.
- Player reward: each swatch that does not touch the player paints a 2 u ring stripe on the player's outline in the swatch's color, red innermost, then orange, yellow, green, blue outermost. Stripes persist for the rest of the run; a swatch that hit the player paints nothing. Five clean dodges = a five-color ring — the most legible trophy in the game. Pure form: no stat effect. The player-side change is additive only (a per-run stripe list + outline render) — do not touch the player's movement/knockback code (T0091, on desktop, adds knockback there in parallel).
- Teaching: the first Palette in a run shows a small ink marginalia note above the docked rail, "SHOOT THE SWATCHES", for 2.5 s (reuse the existing marginalia API additively).
- Swatches are not enemies: they do not count toward the enemy cap, cannot be elite-rolled, do not trigger the enemy bestiary, and do not react to knockback or enemy shoves.
- Pure timing module (pattern: `src/core/gridSweep.ts`): given elapsed time, arena size and the seeded RNG, which swatch is active, its Y position, its detachment X, and the resolved count; unit-tested in a new test file (pattern: `tests/core/gridSweep.test.ts`).

## Acceptance criteria
- [ ] The 15:00 boss is The Palette: the boss bar reads "THE PALETTE" at 450 HP, the generic warning/sting/nameplate all fire, and a docked row of five color tiles (red, orange, yellow, green, blue) is visible at the top of the page.
- [ ] Swatches fall one at a time, each taking exactly 6.0 s from top to bottom, at X positions at least 120 units apart; 90 total damage (fresh multiplier) destroys one and it shatters into 6 shards; a swatch that reaches the bottom sinks with a 3 s fading stain.
- [ ] The next swatch starts 1.2 s after the previous one resolves; all five resolved ends the fight via the standard boss death; the following bosses are The Frame at 20:00 and The Grid at 25:00.
- [ ] Contact with a falling swatch deals 12 damage once per swatch (1.0 s invulnerability); each swatch dodged adds a 2 u ring stripe of its color to the player's outline, and the stripes persist for the rest of the run.
- [ ] The updated rotation test passes: first boss The Frame, strict Frame → Grid → Palette repetition, deterministic; the new timing-module unit tests pass.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/content/bosses/palette.ts` — `PALETTE_BOSS` def (constant named `PALETTE_BOSS`, not `PALETTE`, to avoid clashing with the color `PALETTE` imported in `content/bosses/index.ts`)
- create `src/core/swatchCascade.ts` — pure timing module (pattern `gridSweep.ts`)
- edit `src/content/bosses/types.ts` — `behavior: 'frame' | 'grid' | 'palette'`; add `PaletteBossDef`
- edit `src/content/bosses/index.ts` — add `PALETTE_BOSS` to `BOSSES`, re-export type + const
- edit `src/core/boss.ts` — `bossForKill` becomes tri-cyclic
- create `tests/core/swatchCascade.test.ts`; edit `tests/core/boss.test.ts` (rotation), `tests/content.test.ts` (palette sanity)
- edit `src/art/textures.ts` — `paletteSwatchTextureKey(i)` + `drawBossPalette()` (5 tile textures via existing `graphicsTexture` + `drawShape(g,'rect',…)`); call it in `generateTextures()` after `drawBossGrid`
- edit `src/entities/Boss.ts` — palette branch in `spawn()` (rect body, no core)
- edit `src/systems/Marginalia.ts` — additive `noteAt()` (fixed-position, no-enemy labels)
- edit `src/entities/Player.ts` — additive stripe list + outline ring (do NOT touch `drive`/`hurt`/movement)
- edit `src/systems/BossSystem.ts` — the palette fight state machine (bulk of work)
- edit `src/debug/testHook.ts` — add `paletteKills` to `HookStats` + init; edit `src/scenes/GameScene.ts` — pass `marginalia` to `BossSystem`, fix `boss-state` invariant, add `palette-swatch` invariant + `INVARIANTS` entry

### Interfaces
```ts
// content/bosses/types.ts
export interface PaletteBossDef extends BossDef {
  behavior: 'palette';
  swatchHp: number;          // 90, before respawn multiplier
  swatchWidth: number;       // 60
  swatchHeight: number;      // 30
  swatchColors: readonly number[]; // [red, orange, yellow, green, blue] PALETTE values, dock order
  shardCount: number;        // 6
}

// core/boss.ts
export function bossForKill(kills: number): FrameBossDef | GridBossDef | PaletteBossDef {
  const n = kills % 3;
  return n === 0 ? FRAME : n === 1 ? GRID : PALETTE_BOSS;
}

// core/swatchCascade.ts — exact API
export type SwatchCascadePhase = 'idle' | 'falling' | 'waiting' | 'done';
export interface SwatchCascadeTiming { count: number; firstDetachSec: number; detachDelaySec: number; fallSec: number; minGap: number; edgeMargin: number; }
export const SWATCH_CASCADE: SwatchCascadeTiming = { count: 5, firstDetachSec: 1, detachDelaySec: 1.2, fallSec: 6, minGap: 120, edgeMargin: 60 };
export class SwatchCascade {
  constructor(arenaSize: number, rng: Rng, timing: SwatchCascadeTiming = SWATCH_CASCADE);
  get phase(): SwatchCascadePhase;
  get activeIndex(): number;   // -1 unless falling; = resolvedCount while falling
  get activeX(): number;
  get activeY(): number;       // -half at detach, +half at sink, clamped
  get resolvedCount(): number;
  update(dt: number): void;    // t += dt; detach when t>=nextDetachAt (idle|waiting); sink when t-fallStart>=fallSec
  destroyActive(): void;       // no-op unless falling; resolves early
  reset(): void;               // t=0, resolved=0, idle, nextDetachAt=firstDetachSec, prevX=null
}
// Internals: private t, resolved, phase, nextDetachAt, activeX, fallStart, prevX.
// pickX(): lo=-half+edgeMargin, hi=half-edgeMargin; up to 8 tries of rng.range(lo,hi) until |x-prevX|>=minGap (prevX null for swatch 0);
// fallback (unreachable): prevX<=0 ? hi : lo — always satisfies both constraints. Set prevX=activeX after each detach.
// resolve(): resolved++; phase = resolved>=count ? 'done' : 'waiting'; on waiting: nextDetachAt = t + detachDelaySec.

// systems/Marginalia.ts (additive; note() keeps working)
noteAt(x: number, y: number, text: string, lifeSec: number): void;
// Label gains `life: number` (+ `x?: number; y?: number`); note() sets life=LIFE, enemy anchor; noteAt sets enemy=null, fixed pos.
// update() dead condition: l.age >= l.life || (l.enemy !== null && (!l.enemy.active || l.enemy.serial !== l.serial)); alpha fade uses l.life (clamp 0..1).
// pinLabel(): enemy null -> t.setPosition(l.x!, l.y!) with NO bounds clamping; else existing clamp code.

// entities/Player.ts (additive)
readonly stripes: { color: number; slot: number }[];      // per-run; slot 0=red innermost … 4=blue outermost
paintStripe(color: number, slot: number): void;           // no-op if slot taken; redraws ring
// private stripeRing: Graphics at DEPTH.playerBarrel; per stripe: lineStyle(2,color,1); strokeCircle(0,0, PLAYER_RADIUS+3+slot*2);
// syncBarrel() gains: this.stripeRing.setPosition(this.x, this.y).setAlpha(this.alpha);  destroy() destroys stripeRing.

// systems/BossSystem.ts
get bodyActive(): boolean;  // off|warning -> false; palette -> cascade.phase==='falling'; else true
readonly cascade: SwatchCascade;  // new ctor param: marginalia: Marginalia (last position)
```

### Steps
1. **Content**: `PaletteBossDef` in types.ts; `palette.ts` with `hp: 450 /* 5×90 */, speed: 40, contactDamage: 12 /* the swatch contact, used by onPlayerTouched */, bodyRadius: 30 /* half swatch width; palette uses a rect body */, coreSize: 0 /* unused */, deathXp: 30, deathPickups: 10, swatchHp: 90, swatchWidth: 60, swatchHeight: 30, swatchColors: [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.green, PALETTE.blue], shardCount: 6, look: { body: PALETTE.ink, core: PALETTE.paperLight }`. Register in index.ts. `bossForKill` tri-cycle in core/boss.ts (update its comments).
2. **Core + tests**: write `swatchCascade.ts` exactly as above; update `boss.test.ts` (first boss Frame; strict `frame,grid,palette,frame,grid,palette` for kills 0..5 / bosses #1..#6; deterministic); `content.test.ts` palette block: swatchHp/swatchWidth/swatchHeight>0, shardCount int≥1, `swatchColors.length === SWATCH_CASCADE.count`, colors in `Object.values(PALETTE)`, `hp === swatchHp * SWATCH_CASCADE.count`. Run `npm run check` — green before engine work.
3. **Art**: `paletteSwatchTextureKey = (i) => `bossPaletteSwatch${i}``; texture size `(60+2PAD)×(30+2PAD)` (`PAD = SHADOW_OFFSET+3`, already in textures.ts), draw `drawShape(g, 'rect', PAD+30, PAD+15, 30, color, { outlineWidth: 3 })` so the tile spans exactly `[PAD, PAD+60]×[PAD, PAD+30]`. `Boss.spawn` palette branch: `setTexture(paletteSwatchTextureKey(0))`, `enableBody(true,x,y,true,true)`, `body.setSize(60,30)`, `body.setOffset((this.width-60)/2, (this.height-30)/2)`, `setCollideWorldBounds(false)`, core `setVisible(false)`; keep the existing shared tail (setVelocity(0,0), takeSerial, hp, flashMs, reset transforms). (Verify: `setSize` sets `isCircle=false`, so it is safe after a previous grid `setCircle` on the same persistent body.)
4. **Marginalia + Player**: additive changes per Interfaces.
5. **BossSystem** — constants: `RAIL_INSET=8, RAIL_THICKNESS=10, DOCK_DROP=20, RAIL_Y=-ARENA_SIZE/2+RAIL_INSET, STAIN_FADE_SEC=3, SWATCH_INVULN_MS=1000, SWATCH_SHARD_SPREAD=26`. New fields: `rail` (Graphics, DEPTH.enemies+1), `stain` (Graphics, DEPTH.arena+1), `cascade = new SwatchCascade(ARENA_SIZE, this.run.rng)`, `cascadePhase='idle'`, `swatchHit=false`, `swatchDestroyed=false`, `lastSwatchPos={x:0,y:0}`, `stains:{x,age}[]=[]`.
   - `startEntering`: compute `const mult = bossHpMultiplier(this.run.bossKills); const hp = this.def.behavior==='palette' ? SWATCH_CASCADE.count * Math.round(this.def.swatchHp*mult) : Math.round(this.def.hp*mult);` (rounding 5×round(90m) separately — `round(450m)` can be 2 less at m=2.25 and would break the hp invariant). After `boss.spawn(...)`, palette: `boss.disableBody(true,true)` (hidden until first detach — `disableBody(true,true)` also clears GameObject active/visible, which the invariant reads), `cascade.reset()`, reset flags/stains, `drawRail()`, `rail.setVisible(true).setPosition(0, -ARENA_SIZE/2-100)`. Common sting/warning/`run.*` lines untouched.
   - `update()`: in `'entering'`, if palette `this.cascade.update(dt)` BEFORE `updateEntering(dt)` (clock starts at the sting so first detach is 1.0 s after appearance, not after the 0.5 s slide).
   - `updateEntering` palette branch: slide `rail.setPosition(0, -half-100 + (100+RAIL_INSET)*e)`; at end: `rail.setPosition(0, RAIL_Y)`, `phase='fighting'`, and only if `this.run.bossKills === 2` (the first Palette of the run): `this.marginalia.noteAt(0, RAIL_Y-40, 'SHOOT THE SWATCHES', 2.5)`. No boss body positioning for palette.
   - `updateFighting`: third branch → `updatePaletteFighting(dt, def)`:
     ```ts
     this.cascade.update(dt);
     // age stains (age+=dt, drop at 3), redrawStains()
     if (this.cascade.phase === 'done') { this.killBoss(); return; }
     if (this.cascade.phase !== this.cascadePhase) { const prev = this.cascadePhase; this.cascadePhase = this.cascade.phase;
       if (this.cascade.phase === 'falling') this.onSwatchDetach(def);
       else if (this.cascade.phase === 'waiting' && prev === 'falling' && !this.swatchDestroyed) this.onSwatchSunk(); }
     this.run.bossHp = this.paletteHpRemaining(def);
     ```
   - `onSwatchDetach(def)`: `i=cascade.activeIndex, x=cascade.activeX`; `this.boss.spawn(x, -ARENA_SIZE/2, this.swatchHpNow(), def)`; `this.boss.setTexture(paletteSwatchTextureKey(i))`; `this.boss.setVelocity(0, ARENA_SIZE/SWATCH_CASCADE.fallSec)` (velocity, not setPosition, so Arcade overlaps see integrated positions); `swatchHit=swatchDestroyed=false`; `drawRail()`.
   - `onSwatchSunk()`: `x=cascade.activeX`; `lastSwatchPos={x, y: ARENA_SIZE/2}`; `stains.push({x, age:0})`; `boss.setPosition(x, ARENA_SIZE/2)` (snap); `resolveSwatch()`.
   - `resolveSwatch()`: `boss.disableBody(true,true)`; if `!swatchHit`: `i=cascade.resolvedCount-1; this.player.paintStripe(def.swatchColors[i]!, i)`.
   - `onSwatchHit(died)` (called from `onProjectileHit` for palette instead of `run.bossHp = max(0,b.hp)` + `killBoss`): if `!died` → `run.bossHp = paletteHpRemaining(def)` and return. Else: `x,y = boss.x,boss.y`; `lastSwatchPos={x,y}`; `cascade.destroyActive()`; `i=cascade.resolvedCount-1`; `this.fx.death(x, y, def.swatchColors[i]!, PALETTE.ink, 30)`; `this.sfx.enemyDeath(30)`; 6 shards in an even ring radius 26, value 1 each (`pickups.drop`); `swatchDestroyed=true`; `resolveSwatch()`; `run.bossHp = paletteHpRemaining(def)`; if `cascade.phase==='done'` → `killBoss()`.
   - `paletteHpRemaining(def)`: `per = swatchHpNow()`; falling → `(SWATCH_CASCADE.count-1-resolved)*per + max(0, boss.hp)`; else `(count-resolved)*per`. `swatchHpNow() = Math.round(def.swatchHp * bossHpMultiplier(run.bossKills))`.
   - `onPlayerTouched`: after the existing guards, palette: `if (this.swatchHit) return;` then set `this.swatchHit = true` and after `player.hurt(now)`: `this.player.invulnerableUntil = Math.max(this.player.invulnerableUntil, now + SWATCH_INVULN_MS);` (damage stays `def.contactDamage` = 12).
   - `killBoss`: `x,y = palette ? lastSwatchPos : boss`; palette branch (alongside the grid branch): `hook.stats.paletteKills += 1; rail.setVisible(false); stain.clear().setVisible(false); stains.length = 0;` (required — otherwise the stain freezes, since `updatePaletteFighting` stops running).
   - `drawRail()`: clear; ink bar with 0.18 shadow: local bar at `(-half, -RAIL_THICKNESS/2, ARENA_SIZE, RAIL_THICKNESS)`; docked tiles via `drawShape(g,'rect', dockX(i), DOCK_DROP, def.swatchWidth/2, color, {outlineWidth:3})` for `i` from `cascade.resolvedCount + (phase==='falling'?1:0)` up; `dockX(i) = -ARENA_SIZE/2 + ARENA_SIZE*(i+0.5)/SWATCH_CASCADE.count`. Rail graphics is positioned at `(0, RAIL_Y)` so local y=0 is the centerline; tiles hang below (top edge at bar bottom).
   - `redrawStains()`: clear; per stain `fillStyle(PALETTE.ink, 0.25*(1-age/3)); fillEllipse(s.x, ARENA_SIZE/2-12, 80, 24)`; `setVisible(stains.length>0)`.
6. **testHook + GameScene**: `paletteKills` (interface + init). GameScene: pass `this.marginalia` as the last `BossSystem` arg; in `registerInvariants` replace the `boss-state` first line `this.run.bossAlive !== b.active` with `b.active !== this.boss.bodyActive` (message accordingly; the palette body is only active while a swatch falls) and add:
   ```ts
   hook.addInvariant('palette-swatch', () => {
     const c = this.boss.cascade;
     if (c.resolvedCount > SWATCH_CASCADE.count) return `${c.resolvedCount} swatches resolved`;
     if (c.phase === 'falling') {
       const half = ARENA_SIZE / 2;
       if (!Number.isFinite(c.activeX) || !Number.isFinite(c.activeY) || c.activeY < -half - 1 || c.activeY > half + 1)
         return `swatch at (${c.activeX}, ${c.activeY})`;
     }
     return null;
   });
   ```
   Add `'palette-swatch'` to `INVARIANTS` (after `'boss-state'`).
7. `npm run check` then `npm run smoke`.

### Pitfalls
- **`boss-state` invariant**: with the palette docked/`waiting`, `bossAlive` is true but the boss body is disabled — the old `bossAlive !== b.active` line would fire every frame. Use `bodyActive`.
- **Rounding**: `bossMaxHp` must be `count * round(90·mult)`, never `round(450·mult)` (they differ at mult=2.25: 1015 vs 1013 → hp-range invariant fires).
- **Persistent body**: one `Boss` instance per run survives frame→grid→palette; `setSize` clears circle mode (verified in Phaser source), but always call it in the palette `spawn` branch.
- **Cascade clock**: update it during `'entering'` too, or the first swatch detaches 1.5 s after the sting; it consumes `run.rng` (seeded, deterministic — no `Math.random`).
- **Shootability**: the docked rail is pure Graphics (no body); the boss body is enabled only while falling, so docked/waiting phases take zero damage by construction.
- **Player.ts is shared with T0091 (Platen, parallel on desktop)**: keep the change strictly additive (new field, new Graphics, `paintStripe`, one line in `syncBarrel`, `destroy`). Stripe slots are per-color (red=0…blue=4), not per-dodge-order, so a late dodge of blue paints the outermost ring even if dodged first.
- **Marginalia**: `enemy === null` labels must NOT be treated as dead in `update()`; pin them without arena clamping (the note sits above the arena edge at `RAIL_Y-40`, visible when the camera is near the top — that is the spec'd "above the docked rail" position).
- **Cleanup**: rail/stain/`stripeRing`/5 swatch textures are scene objects destroyed on scene shutdown; no new scene listeners, so `bindSceneEvents` is untouched.
- **Mobile/412×915**: boss bar, warning text and nameplate are screen-space HUD (unchanged, they key off `run.bossId`/`bossAlive`); the rail spans the arena; nothing new is input-driven.
- T0064/T0070 (desktop, todo) also touch `core/boss.ts`, `BossSystem.ts`, `boss.test.ts` — re-read those files before editing in case they landed; no hard dependency.

### Tests
- `tests/core/swatchCascade.test.ts` (new): timing constant equals spec; idle until 1.0 s then `falling` with `activeIndex 0` and `activeY ≈ -1600`; at detach+5.999 s still falling with `activeY > 1599`, at +6.000 s `waiting`/`resolvedCount 1`; next detach exactly 1.2 s after `destroyActive` (`update(1.199)` still waiting, `update(0.001)` falling, `activeIndex 1`); all five resolve in dock order `[0,1,2,3,4]` then `done`; all 5 X in `[−1540,1540]` with consecutive `|Δx| ≥ 120`; same seed → same X sequence; `destroyActive` no-op when idle; `reset()`; custom timing.
- `tests/core/boss.test.ts`: replace the alternation tests with the tri-cycle (Frame first; strict `frame,grid,palette,frame,grid,palette` for kills 0–5; deterministic; BossTimer/multiplier tests unchanged).
- `tests/content.test.ts`: palette sanity block as in Step 2.
