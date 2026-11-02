---
id: T0400
title: The near miss gets its note
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T03:05:38Z
---

## Goal
The near miss (T0271) — the wave's last enemy dying within 1.5 cells of the exit — is shown as a small "close" chip but never heard. The close call is one of the run's tensest beats; giving it a soft note makes it felt as well as seen.

## Details
- One new method in `src/audio/Sfx.ts`, `nearMiss()`, placed next to `leakWarn()` (T0014): one soft sine at A3 (~220 Hz), 0.15 s, volume 0.09 — the leak-tick's own quiet class, pitched up a touch and shorter than the leak thud (140→70 Hz, 0.3 s), so the near miss reads as a close call, not the leak itself.
- It plays **once, on the near miss**: the same point where the "close" chip pops — the wave's last kill, that enemy within 1.5 cells of the exit (T0271's own trigger). One new hook file beside the other enemy hooks, registered in `src/systems/enemyHooks/index.ts` (the combo-break-note's own pattern, T0398).
- It plays **never** on an ordinary kill (only the wave's last kill within 1.5 cells of the exit), never on an actual leak (the leak thud plays instead), and never twice in the same moment (no stacking).
- Silent with sound off; no screen change (the chip already shows the moment), no new HUD element, no new key or button.

## Acceptance criteria
- [ ] When the wave's last enemy dies within 1.5 cells of the exit, the soft note plays once, in the same frame the "close" chip pops
- [ ] An ordinary kill and an actual leak (the leak thud) never play it; it is quieter than and shorter than the leak thud
- [ ] Silent with sound off; the chip, the pause screen's controls list and all other feedback are untouched; `npm run check` and the desktop + mobile smoke pass

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/nearMissNote.ts` - hook that plays the soft near-miss note on T0271's exact trigger
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` entry, both next to `nearMiss`
- edit `src/audio/Sfx.ts` - one new `nearMiss()` method after `leakWarn()`

### Interfaces
```ts
// Sfx.ts: new method, placed directly after leakWarn() (line 169), before beamHumStart
nearMiss(): void
// hook file: existing shape, no new types
export const nearMissNote: MakeEnemyHook
```

### Steps
1. `src/audio/Sfx.ts` — after the `leakWarn()` method, add:
```ts
  /** The wave's last kill within 1.5 cells of the exit: one soft sine at A3 — the leak tick's quiet class,
   *  a touch higher and shorter than the leak thud (140→70 Hz, 0.3 s), so it reads as a close call, not the leak. */
  nearMiss(): void {
    this.tone(220, 0.15, 'sine', 0.09);
  }
```
2. Create `src/systems/enemyHooks/nearMissNote.ts` — a copy of the `nearMiss.ts` trigger with the chip call replaced by the sound:
```ts
import { CELL } from '../../config';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** The wave's last kill within 1.5 cells of the exit plays the soft near-miss note — the nearMiss
 *  hook's own trigger (T0271); an ordinary kill or a leak plays nothing (the leak thud is onLeak's). */
export const nearMissNote: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    if (enemy.remaining > 1.5 * CELL) return; // its own route: a flyer's crossing, not the road
    ctx.sfx?.nearMiss();
  },
});
```
3. `src/systems/enemyHooks/index.ts` — add `import { nearMissNote } from './nearMissNote';` right after the `import { nearMiss } from './nearMiss';` line, and `nearMissNote,` right after `nearMiss,` in `ENEMY_HOOKS`.

### Pitfalls
- Keep the four trigger checks byte-identical to `nearMiss.ts` so the note fires the same frame the chip pops; do not edit `nearMiss.ts` itself.
- `ctx.sfx` is `Sfx | undefined` (see `comboBreakNote.ts`) — use `ctx.sfx?.nearMiss()`, never a bare call.
- `onKill` fires per kill; `aliveCount !== 1` makes only the wave's last kill eligible, so it plays at most once per wave and never on ordinary kills; leaks take `onLeak`, so the 140→70 Hz thud is untouched and nothing stacks.
- Sound-off, locked audio and cleanup need no code: `tone()` is silent when muted/locked, and the hook keeps no state.
- No invariant needed: it is a stateless sound hook (the `comboBreakNote` precedent has none).

### Tests
- none (audio/juice task)
