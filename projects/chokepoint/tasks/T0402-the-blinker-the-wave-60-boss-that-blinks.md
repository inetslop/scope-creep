---
id: T0402
title: "The Blinker: the wave-60 boss that blinks the road"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T03:32:09Z
claimed_at: 2026-11-02T12:40:20Z
---

## Goal
The sixth every-10 boss: the wave-60 Blinker, a pink almond that walks the road and blinks 2.5 cells forward on a committed 1 s telegraph — the first boss that skips the road, so a build concentrated on the choke does not hold the wave. The T0364 re-file, deliberately smaller: one periodic reposition, no second mechanic.

## Details
- **The enemy:** `blink`, a new way of moving (no enemy has it — the Dasher's dash is a fast walk, this is a step): it walks at the boss norm, then every cycle it stops, spends 1.0 s in the telegraph and repositions 2.5 cells forward along the road in one step. The cycle: 4.0 s of plain walking, then the telegraph, then the step. It never blinks the last 2.5 cells of the road — it walks the rest.
- **The telegraph:** the blink's own language — its small white eye slides forward toward the destination and one thin pink ring blooms once at the destination the moment it is set.
- **Committed:** a root, a slow, a Push gust or a Mute's silence during the telegraph does not cancel it — it lands where the ring showed, and the road between the jump is never walked, so nothing on that stretch sees it.
- **Numbers:** hp 720 (wave-scaled, the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 60, spawnOnly (never in a wave's mix — the regular cap, 10 of 10, is untouched). It comes one, as the whole wave-60 budget (the every-10 boss slot). Threat: the wave-60 budget itself — read the number from core/waves.ts the way the Flyer's 250 prices wave 50; every every-10 boss carries its whole wave's budget (50/95/150/200/250 for waves 10–50).
- **The wave:** the wave plan names it as the wave-60 boss (the plan's own boss declaration, the Flyer's line for 50, T0317) — the BossCard, the death banner and the boss horn pick it up with no change. The thin road's 0.9× walk factor (T0369) slows its walk segments, not the step (the step is a fixed 2.5 cells).
- **Look:** a pink almond (a new shape in art/shapes.ts; the closest example is the Flyer boss's triangle, T0317) at the boss scale (size 0.5), one small white eye near the back of the face. Pink is the warm family's last color and the silhouette is new (the Mute lesson). The first spawn wears the name chip (T0085) like every new enemy.
- **Card line (dry):** "The whole wave in one shape: it blinks 2.5 cells forward every 4 s — kill it while it blinks, or cover the road between."
- **What it punishes:** a build concentrated on one choke — the blink skips the choke's coverage between jumps, so a choke tower sees the boss only during its 4 s walk segments; a build that kills by holding one spot.
- **What counters it:** the 1 s telegraph is a committed kill window (longer than the Dasher's 0.5 s stop); spread cover across the road (each walk segment is 4 s of plain 0.9 cells/s); the last 2.5 cells are pure walking — cover the final stretch; a sustained line (the Beam) holds on through a blink, the target never changes.

## Compared with what exists
`blink` is a new behavior — no enemy shares it — so the table holds the enemies this one names as similar: the Dasher.

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dasher | a periodic forward burst on a telegraph | its dash is a fast walk — it is on the road, hittable the whole way, and its whole cycle is the burst; the Blinker walks plainly between blinks, and its blink is a committed reposition: it lands where the ring showed, controls or no controls, and the road between is never walked |

## Acceptance criteria
- [ ] The wave-60 plan sends the Blinker as the whole wave (the boss slot, like the Flyer at 50): the BossCard names it with its live hp while it is alive, and the death banner and the boss horn fire on its death with no change to either.
- [ ] It walks at 0.9 cells/s for 4.0 s, then spends 1.0 s in the telegraph — the eye slides forward, one thin pink ring blooms at the destination — then repositions 2.5 cells forward in one step; it never blinks the last 2.5 cells and walks the rest.
- [ ] A root, a slow, a Push gust or a Mute's silence during the telegraph does not cancel the blink: it lands where the ring showed; the 2.5 cells of road between the jump are never walked.
- [ ] Its look is a pink almond at the boss scale with one small white eye — a silhouette no enemy has — and its first spawn wears the name chip.
- [ ] hp 720 wave-scaled, 20 gold, 1 life; spawnOnly, so the regular-enemy cap is untouched; playable menu to game over on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/content/enemies/blinker.ts` - the wave-60 boss def (model: `crosser.ts`)
- edit `src/content/enemies/index.ts` - import `blinker` + one line in `ENEMIES` right after `crosser`
- edit `src/content/types.ts` - `'almond'` on `Shape`, `'blink'` on `EnemyBehavior`, new optional `EnemyDef.blinkCycle` field
- edit `src/core/waves.ts` - `bossId()` returns `'blinker'` at 60 + its name in the two doc comments that list the bosses
- edit `src/art/shapes.ts` - `almond: 0` in the `sides` record
- edit `src/art/paint.ts` - `almond` branch in `shapePath`
- edit `src/art/textures.ts` - `EYE_TEXTURE` export
- edit `src/art/entities.ts` - flat almond branch in the enemy loop + paint `EYE_TEXTURE`
- edit `src/entities/Enemy.ts` - blink state fields, spawn resets, `case 'blink'` in `advance()`, rotation, eye placement, despawn
- create `src/systems/fx/blinkRing.ts` - the thin pink ring at the destination
- create `src/systems/enemyHooks/blinkTelegraph.ts` - fires the ring the frame the telegraph is set
- edit `src/systems/enemyHooks/index.ts` - import + one line in `ENEMY_HOOKS` after `flyLine`
- edit `src/debug/runChecks.ts` - one invariant line after `enemies.hive`
- edit `tests/content.test.ts` - `'blinker'` in the 0.5 size-cap list + a `blinkCycle` sanity block
- edit `tests/core/waves.test.ts` - wave-60 boss plan tests (model the wave-50 ones)

### Interfaces
```ts
// content/types.ts
export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'pillar' | 'chevron' | 'ring' | 'wings' | 'almond';
export type EnemyBehavior = 'walk' | 'dash' | 'fly' | 'blink';
/** on EnemyDef, after dashCycle: */
blinkCycle?: { walkSec: number; teleSec: number; cells: number };
// content/enemies/blinker.ts
export const blinker: EnemyDef = {
  id: 'blinker', name: 'Blinker',
  description: 'The whole wave in one shape: it blinks 2.5 cells forward every 4 s — kill it while it blinks, or cover the road between.',
  behavior: 'blink', hp: 720, speed: 0.9, gold: 20, livesCost: 1,
  threat: 300, // 5*60, exactly waveBudget(60) — BossesScene filters on this equality
  fromWave: 60, spawnOnly: true,
  blinkCycle: { walkSec: 4, teleSec: 1, cells: 2.5 },
  look: { shape: 'almond', color: 'pink', size: 0.5 },
};
// core/waves.ts bossId: return wave === 60 ? 'blinker' : wave === 50 ? 'crosser' : ... (rest unchanged)
// art/textures.ts: export const EYE_TEXTURE = 'enemy:eye';
// systems/fx/blinkRing.ts: export function blinkRing(fx: FxSystem, x: number, y: number): void
// systems/enemyHooks/blinkTelegraph.ts: export const blinkTelegraph: MakeEnemyHook
// entities/Enemy.ts new public fields (the hook reads blinkTold/blinkDest):
blinkLeg: 'walk' | 'tele' = 'walk'; blinkLeft = 0; blinkTeleAge = 0; blinkDest = 0; blinkTold = false;
private eye?: Phaser.GameObjects.Image;
```

### Steps
1. `content/types.ts`: the three additions above (doc-comment `blinkCycle` like `dashCycle`).
2. `art/shapes.ts`: `almond: 0` in `sides`. `art/paint.ts`: in `shapePath`, before the `shapePoints` fallback, add: `if (shape === 'almond') { ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.quadraticCurveTo(x + radius * 0.55, y, x, y + radius); ctx.quadraticCurveTo(x - radius * 0.55, y, x, y - radius); ctx.closePath(); return; }` (a lens, pointed at both ends, pointing up like the other shapes).
3. Create `blinker.ts` and register it in `index.ts` (import and list line next to `crosser`).
4. `core/waves.ts`: `bossId` + comments. That one line is what wires the BossCard, bossArrival (horn + gate + boss's own ring), bossDeath (banner + `bossDown`), bossEscape and `EnemySystem.kill`'s 24-chip burst — none of them change.
5. `art/textures.ts`: `EYE_TEXTURE = 'enemy:eye'`. `art/entities.ts`: in the enemy loop, after the `e.behavior === 'fly'` branch add `if (e.behavior === 'blink') { shapePath(ctx, e.look.shape, size / 2, size / 2, r); ctx.fillStyle = rgba(PALETTE[e.look.color], 1); ctx.fill(); return; }` (flat: no side face, no shadow, so it may turn). After the Guard disc paint add: `const bR = getEnemy('blinker').look.size * CELL; const eyeR = bR * 0.14; paintTexture(scene, EYE_TEXTURE, eyeR * 2, eyeR * 2, (ctx) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(eyeR, eyeR, eyeR, 0, Math.PI * 2); ctx.fill(); });`
6. `entities/Enemy.ts` (import `EYE_TEXTURE`): add the five fields + `private eye`; in `spawn()` after the `pauseAge = 0` reset add `this.blinkLeg = 'walk'; this.blinkLeft = this.def.blinkCycle?.walkSec ?? 0; this.blinkTeleAge = 0; this.blinkDest = 0; this.blinkTold = false;`, and after the disc-creation block add the eye creation (`if (this.def.blinkCycle !== undefined && this.eye === undefined) { this.eye = this.scene.add.image(0, 0, EYE_TEXTURE); this.eye.setDepth(DEPTH.enemies); } this.eye?.setVisible(false);`); in `advance()` add the case, the rotation line after the `flyLine` rotation (`if (this.def.behavior === 'blink') this.setRotation(Math.atan2(this.dirX, -this.dirY));`), and after the disc placement block: `if (this.eye !== undefined && this.def.blinkCycle !== undefined) { const c = this.def.blinkCycle; const r = this.def.look.size * CELL; const slide = this.blinkLeg === 'tele' ? Math.min(1, this.blinkTeleAge / c.teleSec) : 0; const off = r * (-0.4 + 0.8 * slide); this.eye.setPosition(this.x + this.dirX * off, this.y + this.dirY * off).setScale(ART_SCALE * pop).setVisible(true); }`; in `despawn()` add `this.eye?.setVisible(false);`. The case:
```ts
case 'blink': {
  // Walk plainly; at the line, a committed telegraph and a one-step reposition. The step is a
  // fixed jump (no speed factor on it), and a root, a slow, a gust or a silence during the
  // telegraph does not cancel it: it lands where the ring showed, the road between never walked.
  const c = this.def.blinkCycle!;
  if (this.blinkLeg === 'walk') {
    if (this.rootLeft <= 0) { // rooted it holds, and its cycle holds with it (the Dasher's rule)
      this.distance += speed * dt;
      this.blinkLeft -= dt;
      if (this.blinkLeft <= 0) {
        // Never the last 2.5 cells: within twice the step of the exit it walks the rest.
        if (this.distance + c.cells * CELL <= this.path.length - c.cells * CELL) {
          this.blinkDest = this.distance + c.cells * CELL; // locked the moment it is set
          this.blinkLeg = 'tele';
          this.blinkLeft = c.teleSec;
          this.blinkTeleAge = 0;
          this.blinkTold = true;
        } else {
          this.blinkLeft = c.walkSec;
        }
      }
    }
  } else {
    this.blinkLeft -= dt; // committed: the clock runs even while rooted
    this.blinkTeleAge += dt;
    if (this.blinkLeft <= 0) {
      this.distance = this.blinkDest; // one step
      this.blinkLeg = 'walk';
      this.blinkLeft = c.walkSec;
      this.blinkTeleAge = 0;
    }
  }
  break;
}
```
7. `systems/fx/blinkRing.ts` (model `bossRing.ts`): `if (fx.full) return;` then a graphics at `(x, y)` on `DEPTH.preview`, `fillRing(g, 0, 0, 0.5 * CELL, 2, 0, Math.PI * 2, PALETTE.pink, 0.9)`, `g.setScale(0.5)`, `fx.track(g, 700, { scale: 1, alpha: 0, ease: 'Quad.easeOut' })`.
8. `systems/enemyHooks/blinkTelegraph.ts`:
```ts
export const blinkTelegraph: MakeEnemyHook = ({ enemies, fx }) => ({
  update() {
    for (const e of enemies.all) {
      if (!e.active || !e.blinkTold) continue;
      e.blinkTold = false;
      const p = e.path.pointAt(e.blinkDest);
      blinkRing(fx, p.x, p.y);
    }
  },
});
```
plus its import and `ENEMY_HOOKS` line after `flyLine,`.
9. `debug/runChecks.ts`, after the `enemies.hive` line: `['enemies.blink', (g) => (g.enemies.all.every((e) => !e.active || e.def.blinkCycle === undefined || (e.blinkLeg !== 'tele' || (Number.isFinite(e.blinkDest) && e.blinkDest > e.distance && e.blinkDest <= e.path.length))) ? null : 'a Blinker out of its blink beat')],`
10. Tests: `content.test.ts` line 27 add `|| e.id === 'blinker'` to the 0.5 list, and after the `dash` block add `if (e.behavior === 'blink') { const c = e.blinkCycle!; expect(c.walkSec).toBeGreaterThan(0); expect(c.teleSec).toBeGreaterThan(0); expect(c.cells).toBeGreaterThan(0); }`. In `waves.test.ts` after the wave-50 tests: add `expect(planWave(60, new Rng(seed), ENEMIES).spawns).toEqual([{ enemy: 'blinker', delaySec: 0 }]);` inside the existing every-rng-stream test, plus the three wave-60 tests copied from the wave-50 ones (`bossId(60)` is `'blinker'` and the plan agrees; wave 60 is exactly `[{enemy:'blinker',delaySec:0}]` with `tags ['boss']` and `hpMul waveHpMul(60)` on seeds 1/7/42/60; no wave but 60 sends one, loop 1..60).
11. `npm run check`, then `npm run smoke`.

### Pitfalls
- Pooling: the blinker's slot is recycled by later waves (the run continues past 60) — spawn() must reset all five blink fields and hide the eye for every def (the `this.eye?.setVisible(false)` line, not an `if` on the def); `spawn()` already resets rotation/tint/scale.
- Committed semantics: only the walk leg is gated on `rootLeft`; the telegraph clock and the step must run regardless of root/slow, and `blinkLeft = c.teleSec` must NOT be divided by `waveSpeedMul` or `walkMul` (the step is a fixed 2.5 cells; the walk leg already carries `walkMul` inside `speed`).
- Lock `blinkDest` from `this.distance` at the telegraph-start frame (push-back is consumed at the top of `advance()`, so it is current); a gust during the telegraph slides the body back but the step still lands at `blinkDest`.
- The almond must be painted flat (the `fly`-branch pattern) or rotating it turns its side face and shadow with it.
- Adding `'almond'` to `Shape` breaks the `sides: Record<Shape, number>` until the key exists; BossesScene only lists the boss when `threat === waveBudget(60)` exactly (300) — don't fudge the number.
- `spawnOnly` keeps it out of `planNormalWave` and the seeded plans (waves 1–59 stay byte-identical); never add it to the `walkers`/reserved lists.
- The hook clears `blinkTold` even when `fx.full` skips the ring; all timers use `dt`.

### Tests
- `tests/core/waves.test.ts`: the wave-60 boss-plan tests above (bossId, single spawn, boss tag, hp mul, seed-stable, spawnOnly).
- `tests/content.test.ts`: the size-cap and `blinkCycle` additions. No new core module is added (the cycle lives in `Enemy.advance()` like the Dasher's), so no further unit tests.
