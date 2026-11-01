---
id: T0360
title: "The far gate's send: one ring when its walkers come in"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T12:52:50Z
claimed_at: 2026-11-01T13:09:11Z
---

## Goal
The far gate comes alive where its walkers come in: on a board with a far gate, the moment a non-boss wave starts, one quiet ring pulses at the far gate — the ring language of the boss's arrival (T0312).

## Details
- A new small system file `src/systems/fx/farGateSend.ts` (closest example: `src/systems/PushWindup.ts` — one thin ring drawn on the board): it draws one thin muted-ink ring that grows out from the far gate and fades over ~0.6 s.
- It fires once per wave, at the wave's start — the same point the "Wave N" banner (T0067) is raised — and only when the wave's plan sends walkers through the far gate: a non-boss wave on a far-gate board. A boss wave sends none through it, and a board without a far gate has no gate to pulse.
- Display only: no sound, no text, no HUD element, and no change to spawns, timing, damage or gold.
- The ring is visible at 412x915 and 1280x720.

## Acceptance criteria
- [ ] On a far-gate board, the moment each non-boss wave starts, one muted ring pulses once at the far gate (~0.6 s) and nowhere else on the board.
- [ ] Boss waves and boards without a far gate show no ring.
- [ ] No sound, no text, no new HUD element; the wave's spawns, timing and gold are unchanged.

## Design (architect, yoga)

### Files
- create `src/systems/fx/farGateSend.ts` - the effect: one thin muted-ink ring that grows out from the far gate and fades over 600 ms (model: `src/systems/fx/bossRing.ts`)
- edit `src/systems/RunFlow.ts` - call the effect at the wave's start, in both places a wave starts

### Interfaces
```ts
// src/systems/fx/farGateSend.ts
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The far gate's send: one thin muted-ink ring that blooms out from the far gate and fades, over ~0.6 s (T0360). */
export function farGateSend(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = CELL; // the gate's own cell (the boss blooms to two; this is the gate, not the boss)
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, PALETTE.ink, 0.6);
  g.setScale(0.35);
  fx.track(g, 600, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
```
RunFlow additions (exact):
```ts
import { farGateSplit } from '../core/farGate';    // next to the other core/ imports
import { isBossWave } from '../core/waves';
import { farGateSend } from './fx/farGateSend';   // next to the './fx/holdRoad' import

/** The far gate's send: one muted ring at the far gate when this wave sends its walkers out of it (T0360). */
private farGatePulse(): void {
  const map = this.s.board.map;
  const fg = map.farGate;
  const plan = this.s.waves.currentPlan;
  // A boss wave sends none through it, and a wave under three has no gate share at all.
  if (!fg || !plan || isBossWave(plan.number) || farGateSplit(plan.spawns.length) <= 0) return;
  const pts = this.s.board.path.points; // the same gate anchor the art uses (art/board.ts)
  const i = map.path.findIndex((c) => c.col === fg.col && c.row === fg.row);
  const a = pts[i + 1]!;
  const b = pts[i + 2]!;
  farGateSend(this.s.fx, (a.x + b.x) / 2, (a.y + b.y) / 2);
}
```

### Steps
1. Create `src/systems/fx/farGateSend.ts` exactly as above (copy `bossRing.ts`'s shape: `fx.full` early-out, one graphics on `fx.scene`, one `fx.track` — the track destroys it; no pooling state).
2. In `src/systems/RunFlow.ts`: add the three imports next to the related ones (do not sort the whole block).
3. Add `private farGatePulse()` directly after the `heldMoment()` method (same style: a wave moment derived from the run's systems).
4. In `update()`, in the `run.buildLeftSec <= 0` block (~line 74), after `this.s.sfx?.waveStart();` add the one line `this.farGatePulse();`.
5. In `startWaveNow()`, after `this.s.sfx?.waveStart();` (before `return banked;`) add the same one line.
6. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Both start sites exist (countdown end + Space/Next-wave button); add the call exactly once in each, or the ring doubles or is missed on one path.
- The ring anchor is the gate's edge midpoint `(pts[i+1] + pts[i+2])/2` (same as `art/board.ts`), NOT `board.centerOf(fg)` — at the cell center it sits visibly off the gate token. `pts[i+2]` always exists: `farGateCell`'s window keeps the gate at most at index `floor(n/2)`.
- Keep the three conditions: no `map.farGate` (no far-gate board), boss wave, and `farGateSplit <= 0` (a 1–2 spawn wave sends nothing through the gate) — the acceptance bar says the ring shows only when the plan actually sends walkers through.
- Display only: no Sfx method, no text, no HUD part, no changes to `WaveSystem`/spawns/timing/gold; do not put it in `systems/enemyHooks/` (a wave start is not a kill/leak reaction) and do not touch `GameScene`.
- Ring is board units on the board (`DEEP`th `DEPTH.preview` like `bossRing`); no screen-space math, so it shows at 412x915 and 1280x720 without layout work.

### Tests
- none
