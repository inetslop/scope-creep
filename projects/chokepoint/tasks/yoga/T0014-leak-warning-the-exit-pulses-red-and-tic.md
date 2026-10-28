---
id: T0014
title: "Leak warning: the exit pulses red and ticks before a leak"
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T02:08:37Z
---

## Goal
Leaks are never a surprise: in the last 3 seconds before an enemy reaches the exit, the exit pulses red with a quiet tick, so the player has time to react.

## Details
- When the enemy closest to the exit is within 3 seconds of reaching it (remaining path distance at its current speed, slows included), the exit token at the end of the road pulses red: scale 1.0 → 1.15 → 1.0 over 0.4 s, repeated (a red tint over the exit's existing look).
- Each pulse plays a quiet tick — a low sine blip at volume 0.1, quieter than the existing hit blip (closest example: the blip methods in audio/Sfx — add one new method next to them). One tick per pulse, never stacked, even with several enemies in range.
- The warning stops at once when the enemy leaks (the existing leak juice plays) or dies; it continues if another enemy is already within 3 seconds.
- It behaves like the other in-run animations: frozen while paused.
- No new inputs, no pause-screen change.

## Acceptance criteria
- [ ] An enemy approaching the exit triggers the red pulse + tick in its last ~3 seconds; the pulse and tick stop on the leak or on the kill.
- [ ] The tick is quieter than the hit blip and plays once per pulse, with no doubling when several enemies are in range.
- [ ] The pulse reads clearly at 412x915 (the exit stays visible, the road is not covered) and never triggers for an enemy more than 3 seconds away.
- [ ] Pausing the game freezes the pulse and the tick; resuming restarts it.

## Design (architect, yoga)

### Files
- create `src/systems/ExitWarning.ts` - the leak warning: owns the red pulse image at the exit, checks "any alive enemy within 3 s", drives the pulse + tick each frame from `dt` (so it freezes when GameScene is paused).
- edit `src/audio/Sfx.ts` - add `leakWarn()` right after `leak()`.
- edit `src/scenes/GameScene.ts` - construct the system and call `exitWarn.update(dt)` (wiring only).
- edit `src/art/board.ts` - add `paintExitWarn()` right after `paintBoard()` (a red copy of the exit gate).
- edit `src/debug/runChecks.ts` - add one invariant line after `enemies.count`.
- Do NOT touch `config.ts`, `art/generate.ts`, or `systems/RunFlow.ts`.

### Interfaces
```ts
// src/systems/ExitWarning.ts  (the whole file)
import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { paintExitWarn } from '../art/board';
import { artScale } from '../art/textures';
import type { Board } from './Board';
import type { EnemySystem } from './EnemySystem';
import type { Sfx } from '../audio/Sfx';

export class ExitWarning {
  private readonly board: Board;
  private readonly enemies: EnemySystem;
  private readonly sfx: Sfx | undefined;
  private readonly img: Phaser.GameObjects.Image;
  private t = 0;
  private active = false;
  constructor(scene: Phaser.Scene, board: Board, enemies: EnemySystem, sfx: Sfx | undefined) {
    this.board = board; this.enemies = enemies; this.sfx = sfx;
    const pts = board.path.points;
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    this.img = scene.add.image(x, y, paintExitWarn(scene));
    artScale(this.img);
    this.img.setDepth(DEPTH.preview).setVisible(false);
  }
  update(dt: number): void {
    if (!this.inRange()) { this.active = false; this.t = 0; this.img.setVisible(false); return; }
    if (!this.active) { this.active = true; this.t = 0; this.sfx?.leakWarn(); }
    this.t += dt;
    while (this.t >= 0.4) { this.t -= 0.4; this.sfx?.leakWarn(); }
    artScale(this.img, 1 + 0.15 * Math.sin((this.t / 0.4) * Math.PI));
    this.img.setVisible(true);
  }
  private inRange(): boolean {
    const len = this.board.path.length;
    for (const e of this.enemies.all) {
      if (!e.active) continue;
      const speed = e.speed * (1 - e.slowPct);
      if (speed > 0 && (len - e.distance) / speed <= 3) return true;
    }
    return false;
  }
  broken(): string | undefined {
    if (!this.img.visible) return undefined;
    return Number.isFinite(this.img.x) && Number.isFinite(this.img.scaleX) ? undefined : `exit warn at (${this.img.x}, ${this.img.y})`;
  }
}
```

### Steps
1. Add `src/systems/ExitWarning.ts` exactly as above.
2. In `src/audio/Sfx.ts`, after `leak()` add: `leakWarn(): void { this.tone(200, 0.08, 'sine', 0.1, 150); }` (one line body, low/short, volume 0.1 < the kill/leak blips).
3. In `src/scenes/GameScene.ts`: add `import { ExitWarning } from '../systems/ExitWarning';` (next to the other `systems` imports); add field `exitWarn!: ExitWarning;` after `fx!: FxSystem;`; after the `this.enemies = ...` line add `this.exitWarn = new ExitWarning(this, this.board, this.enemies, sfx);`.
4. Change `GameScene.update()` to: `const dt = Math.min(deltaMs / 1000, 0.05); this.flow.update(dt); this.exitWarn.update(dt); syncHookStats(this);`
5. In `src/art/board.ts`, after `paintBoard`, add (all symbols already imported there): `export function paintExitWarn(scene: Phaser.Scene): string { const c = CELL * 0.3; const size = c * 2 + 32; paintTexture(scene, 'exit-warn', size, size, (ctx) => { const x = size / 2, y = size / 2; ctx.save(); setShadow(ctx, 0.8); roundRectPath(ctx, x - c, y - c, c * 2, c * 2, CELL * 0.16); ctx.fillStyle = rgba(PALETTE.red, 1); ctx.fill(); ctx.restore(); shapePath(ctx, 'circle', x, y, CELL * 0.12); ctx.lineWidth = CELL * 0.07; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }); return 'exit-warn'; }` — a red copy of the ink exit gate (same square/ring).
6. In `src/debug/runChecks.ts`, after the `enemies.count` line add: `['exitWarn.valid', (g) => g.exitWarn.broken()],`

### Pitfalls
- Drive the pulse from `dt`, never a Phaser tween/timer: a tween keeps running while GameScene is paused and would break "frozen while paused / resumes restart it". The single `t` accumulator makes the scale and the tick always in sync and exactly one tick per 0.4 s.
- The tick must not double per enemy: `inRange()` is one boolean; the pulse/tick are independent of how many enemies are in range. Guard `speed > 0` (a full slow can't happen today, max 0.4).
- The red gate is its own texture shown over the baked board; the board texture itself is never repainted. `paintTexture` early-returns if the key exists, so it paints once per run and is fine.
- Depth `DEPTH.preview` (5) puts it above the board, below enemies/towers (20/10), so the approaching enemy still walks over it and the road is never covered. The texture is `~0.6*CELL` big with 16-unit padding so the baked soft shadow isn't clipped (scaling won't hard-edge).
- Image is scene-managed (`scene.add.image`), destroyed on scene shutdown; no manual cleanup. `broken()` only checks while `visible` (cheap).
- `art/board.ts` is also where T0005 (a chip at the exit, still designing) may add a painter; keep `paintExitWarn` self-contained right after `paintBoard`.

### Tests
- none
