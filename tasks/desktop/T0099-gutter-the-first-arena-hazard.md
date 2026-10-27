---
id: T0099
title: Gutter — the first arena hazard
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T09:43:38Z
---

## Goal
The first arena hazard: after 14:00 an ink band periodically sweeps across the page, so the late game becomes a moving layout, not just a growing swarm. The concrete first of the arena-hazards family in the roadmap's "Later" list.

## Details
- From 14:00 (840 s) on, every 20 s a 40-unit-wide vertical band of flat ink sweeps horizontally across the page — a strip running the full height of the safe area, moving left or right. The first sweep starts at exactly 840 s. Direction alternates: sweep 1 left → right, sweep 2 right → left, and so on.
- The band's path is the crop-safe rect (T0045): it enters just off one safe edge, exits just off the other, and is clipped to the safe area (it never overlaps the crop margin — the margin is already burning). Its center crosses the safe width in exactly 4.0 s (speed = safe width / 4).
- Telegraph: 1.5 s before the band enters, a thin red rule (2 u) runs the full height of the safe area at the entering edge, opacity pulsing 0 → 0.6 → 0 over 1 s, repeating — the same pulse language as the boss approach (T0070). Red stays reserved for things that hurt.
- Damage: standing in the band burns the player for 4 damage per second (the same continuous-damage plumbing as the crop margin burn). The band does not damage, slow or move enemies, and it does not touch shards, bullets or knockback.
- Look: a flat ink band (the same ink as the enemy outlines), alpha 0.85, sharp edges, the hard paper-cut shadow on its leading edge.
- Teaching: the first sweep in a run shows a small ink marginalia note near the top of the page, "THE PAGE INKS", for 2 s alongside the telegraph (reuse the existing marginalia API additively). No new HUD element, no new key, no new SFX.
- Pure schedule module (pattern: `src/core/crop.ts`): given run time, whether a sweep is active, its X position (as a fraction of the safe width), its direction, and the telegraph window (the 1.5 s before entry); unit-tested in a new test file (pattern: `tests/core/crop.test.ts`): nothing (no sweep, no telegraph) before 838.5 s; sweep active at 840 s; next entries at 860 s and 880 s; direction alternates; the telegraph window is exactly [entry − 1.5, entry).
- Pause: the sweep freezes with the game (dt-driven, like the crop and the boss approach) and resumes without a jump.

## Acceptance criteria
- [ ] Nothing new happens before 838.5 s; at 838.5 s the red rule appears at one safe edge, and at 840 s the ink band enters and sweeps the safe area, taking 4.0 s to cross.
- [ ] Sweeps repeat every 20 s with alternating direction; with the crop active (after 12:00) the band is clipped to the crop-safe rect and burns the player 4 damage/s while inside.
- [ ] Enemies pass through the band unaffected; the band does not touch shards, bullets or knockback.
- [ ] The first sweep in a run shows the marginalia "THE PAGE INKS" for 2 s.
- [ ] Pausing freezes the band mid-sweep; resuming continues it with no jump.
- [ ] The new schedule unit tests pass: nothing before 838.5 s, first entry at 840 s, 20 s period, alternating direction, telegraph window exactly [entry − 1.5, entry).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/core/gutter.ts` - pure sweep schedule (`GUTTER` constants + `gutterAt()`), pattern `src/core/crop.ts`; zero imports (lint forbids Phaser in core/)
- create `src/systems/GutterSystem.ts` - engine-side band, telegraph rule, burn, first-sweep note; copy `CropSystem.ts` structure (public `totalDamage`, 0.5 s red damage numbers), plus public `bandX`/`bandActive` for the invariant
- create `tests/core/gutter.test.ts` - schedule unit tests, pattern `tests/core/crop.test.ts`
- edit `src/systems/Marginalia.ts` - additive `freeNote(text, x, y)` for a note with no enemy; age null-enemy labels to the usual 2 s
- edit `src/scenes/GameScene.ts` - construct + update the system, two new invariants

### Interfaces
```ts
// src/core/gutter.ts — exact contents (add a crop.ts-style doc comment)
export const GUTTER = { startSec: 840, periodSec: 20, widthUnits: 40, crossSec: 4, telegraphSec: 1.5, burnPerSec: 4 } as const;

export interface GutterPhase {
  active: boolean;          // true in [entry, entry + crossSec)
  sweep: number;            // 0 = first, enters at 840 s
  direction: 1 | -1;        // 1 = left→right (enters left safe edge), -1 = right→left; alternates per sweep
  centerFraction: number;   // band center as fraction of safe width: 0 = left safe edge, 1 = right (only when active)
  telegraph: boolean;       // true in [entry − telegraphSec, entry) — half-open, never coexists with active
  telegraphAlpha: number;   // 0→0.6→0 triangle pulse, 1 s period, anchored at entry − telegraphSec; 0 outside window
}

export function gutterAt(timeSec: number): GutterPhase {
  const p: GutterPhase = { active: false, sweep: 0, direction: 1, centerFraction: 0, telegraph: false, telegraphAlpha: 0 };
  const firstTelegraph = GUTTER.startSec - GUTTER.telegraphSec;
  if (timeSec < firstTelegraph) return p;
  const sweep = Math.floor((timeSec - firstTelegraph) / GUTTER.periodSec);
  const entry = GUTTER.startSec + sweep * GUTTER.periodSec;
  p.sweep = sweep; p.direction = sweep % 2 === 0 ? 1 : -1;
  if (timeSec >= entry - GUTTER.telegraphSec && timeSec < entry) {
    p.telegraph = true;
    const phase = (timeSec - (entry - GUTTER.telegraphSec)) % 1;
    p.telegraphAlpha = 0.6 * (1 - Math.abs(2 * phase - 1));
  } else if (timeSec >= entry && timeSec < entry + GUTTER.crossSec) {
    p.active = true;
    const progress = (timeSec - entry) / GUTTER.crossSec;
    p.centerFraction = p.direction === 1 ? progress : 1 - progress;
  }
  return p;
}
```
`GutterSystem` public surface (rest is private, mirrors CropSystem): `constructor(scene: Phaser.Scene, run: RunState, player: Player, marginalia: Marginalia, damageNumbers: DamageNumbers)`; `update(dt: number): void`; `totalDamage = 0; bandX = Number.NaN; bandActive = false;`.

### Steps
1. Write `src/core/gutter.ts` exactly as above.
2. `src/systems/Marginalia.ts`: in `update()`, replace the single despawn condition `if (!l.enemy || !l.enemy.active || l.enemy.serial !== l.serial || l.age >= LIFE)` with two lines: `if (l.age >= LIFE) { this.despawn(i); continue; }` then `if (l.enemy && (!l.enemy.active || l.enemy.serial !== l.serial)) { this.despawn(i); continue; }`. Add `freeNote(text: string, x: number, y: number)` next to `note()`: acquire a pooled Text exactly like `note()` does, then `t.setText(text); t.setPosition(x, y); t.setAlpha(0).setActive(true).setVisible(true); this.labels.push({ text: t, enemy: null, serial: 0, age: 0 });`. `pinLabel()` already skips null-enemy labels, so the note stays fixed.
3. Create `src/systems/GutterSystem.ts` = CropSystem with the crop-mark drawing removed, graphics at `DEPTH.floor + 2`, constructor gaining `marginalia`, private `numberTimer = 0`, `taught = false`, and helper `private safeHalf(): number { return (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec); }`. Imports: `SHADOW_OFFSET` from `../art/shapes`, `ARENA_SIZE, DEPTH, PLAYER_RADIUS` from `../config`, `PALETTE`, `GUTTER, gutterAt` from `../core/gutter`, `cropSafeFraction` from `../core/crop`, types `RunState`, `Player`, `DamageNumbers`, `Marginalia`. Exact `update(dt)` body:
```ts
const ph = gutterAt(this.run.timeSec);
this.bandActive = ph.active;
this.bandX = ph.active ? this.safeHalf() * (2 * ph.centerFraction - 1) : Number.NaN;
this.g.clear();
if (!ph.active && !ph.telegraph) return;
const half = this.safeHalf();
if (ph.telegraph) {
  const x = ph.direction === 1 ? -half : half - 2;   // 2 u red rule, full safe height, at the entering edge
  this.g.fillStyle(PALETTE.red, ph.telegraphAlpha).fillRect(x, -half, 2, 2 * half);
  if (!this.taught) {
    this.taught = true;
    this.marginalia.freeNote('THE PAGE INKS', x + (ph.direction === 1 ? 70 : -70), -half + 60);
  }
  return;
}
const cx = half * (2 * ph.centerFraction - 1), w = GUTTER.widthUnits / 2;
const x0 = Math.max(cx - w, -half), x1 = Math.min(cx + w, half);  // clipped to the crop-safe rect
if (x1 <= x0) return;
const dx = ph.direction * SHADOW_OFFSET;                          // hard paper-cut shadow on the leading edge
const s0 = Math.max(x0 + dx, -half), s1 = Math.min(x1 + dx, half);
if (s1 > s0) this.g.fillStyle(PALETTE.ink, 0.18).fillRect(s0, -half + SHADOW_OFFSET, s1 - s0, 2 * half - SHADOW_OFFSET);
this.g.fillStyle(PALETTE.ink, 0.85).fillRect(x0, -half, x1 - x0, 2 * half);
const p = this.player, R = PLAYER_RADIUS;
const inside = p.x + R > x0 && p.x - R < x1 && p.y + R > -half && p.y - R < half;
if (inside && !this.run.isDead) {
  this.totalDamage += this.run.drain(GUTTER.burnPerSec * dt);
  this.numberTimer -= dt;
  if (this.numberTimer <= 0) {
    this.numberTimer = 0.5;
    this.damageNumbers.show(p.x, p.y - 24, GUTTER.burnPerSec * 0.5, false, true);
  }
} else this.numberTimer = 0;
```
4. `src/scenes/GameScene.ts`: import `GutterSystem` (after the CropSystem import); field `private gutter!: GutterSystem;` after `crop`; in `create()` right after `this.marginalia = new Marginalia(this, this.bounds);` add `this.gutter = new GutterSystem(this, this.run, this.player, this.marginalia, this.damageNumbers);`; in `update()` after `this.crop.update(dt);` add `this.gutter.update(dt);`; in `registerInvariants()` after the `'crop-damage'` invariant add:
   `hook.addInvariant('gutter-damage', () => Number.isFinite(this.gutter.totalDamage) && this.gutter.totalDamage >= 0 ? null : `gutter damage ${this.gutter.totalDamage}`);`
   `hook.addInvariant('gutter-band', () => (!this.gutter.bandActive || Number.isFinite(this.gutter.bandX) ? null : `gutter band at (${this.gutter.bandX})`));`
   and append `'gutter-damage', 'gutter-band'` to the `INVARIANTS` array at the bottom of the file.
5. Write `tests/core/gutter.test.ts` per the Tests section.
6. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Telegraph window is half-open `[entry − 1.5, entry)`: at 840.0 exactly, `telegraph` must be false and `active` true. Never both true.
- At entry the center sits on a safe edge, so half the 40 u band lies outside the safe rect — the x0/x1 clamping (and the shadow clamp) is what keeps it out of the crop margin; don't "simplify" it away.
- The band must not touch enemies, bullets, shards or knockback: it is a plain Graphics object with no physics body; the only player code is the `drain` (no invuln, no shake, no SFX). Do not edit CombatSystem, SpawnSystem or any entity.
- Pause correctness: derive everything from `run.timeSec` each frame; no tweens, no `scene.time` timers inside the system (that is what makes pause/resume jump-free, same as crop).
- `taught` is per-run by construction (system is built in `create()`); don't store it in the registry or a module singleton.
- Do not edit `src/debug/testHook.ts` (T0040 and T0090 are in flight on it) — no new hook stat is needed; the two invariants cover it.

### Tests
`tests/core/gutter.test.ts`, exact expectations:
- `GUTTER` toEqual `{ startSec: 840, periodSec: 20, widthUnits: 40, crossSec: 4, telegraphSec: 1.5, burnPerSec: 4 }`
- for t in [0, 720, 838.49, 838.4999]: `active === false`, `telegraph === false`, `telegraphAlpha === 0`
- `gutterAt(838.5).telegraph === true`; `gutterAt(839.999).telegraph === true`; `gutterAt(840).telegraph === false`; `gutterAt(858.5).telegraph === true`; `gutterAt(860).telegraph === false`
- `gutterAt(840)`: active, `sweep 0`, `direction 1`, `centerFraction 0`; `gutterAt(860)`: sweep 1, direction −1, centerFraction 1; `gutterAt(880)`: sweep 2, direction 1, centerFraction 0; `gutterAt(900)`: direction −1, centerFraction 1
- cross takes 4.0 s: `gutterAt(842).centerFraction === 0.5`; `gutterAt(843.999).active === true`; `gutterAt(844).active === false`; `gutterAt(850).active === false`
- pulse: `gutterAt(838.5).telegraphAlpha === 0`; `gutterAt(839) ≈ 0.6`; `gutterAt(839.5) ≈ 0`; `gutterAt(839.75) ≈ 0.3`
