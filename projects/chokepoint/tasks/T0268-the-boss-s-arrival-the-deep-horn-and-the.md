---
id: T0268
title: "The boss's arrival: the deep horn and the gate pulse"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: [T0253, T0254]
attempts: 1
created: 2026-10-30T08:43:10Z
claimed_at: 2026-10-30T11:34:42Z
epic: E5
---

## Goal
The run's peak should be felt the moment it begins, not after you have read the name: the instant the boss walks in, a deep horn plays and the entrance gate pulses, so the arrival is a moment the way the death already is (T0258) — E5's "the boss's arrival is a moment too (a deep horn and a pulse at the gate)".

## Details
- **Who triggers it:** the enemy the current boss wave's plan declares as its boss — T0253's `isBossWave` plan (today the Colossus, its only spawn; the second and third boss — T0259's Titan, T0266's Orb — ride the same plan rule with no change to this hook). Data-driven off the plan and the def, never a hard-coded id.
- **The horn (a new Sfx method, the sting/coin-blip class):** when the boss's token first spawns, one low two-note horn plays, rising — e.g. 65 Hz then 82 Hz, 180 ms each, ~90 ms apart, volume 0.12. It sits below the leak thud's 98 Hz (T0267), so it reads as "the big one is coming," not as a leak; it is distinct from the last-stand sting's E3→G3 (T0091) and from the wave-start (silent banner, T0067). Procedural, no sound file, silent when sound is off (T0035).
- **The gate pulse (transient, inert, display-only):** at the same instant a single wide ring blooms from the entrance gate in muted ink — grows from the gate out to ~2 cells over ~500 ms and fades (the wave's last-kill ring's transient language, T0229). It is muted ink, not the leak warning's red (ExitWarning, at the exit), not the last-kill road-white, and not the clean-wave green — a different place (the entrance, where the road begins) and a different color, so it marks the moment rather than repeating a readout.
- **Once per boss wave:** the horn and the pulse fire on the boss's first spawn only, never again that wave. A non-boss wave is byte-identical — no horn, no ring.
- **The split with what already shows:** the name tag (T0085) says *what* (a white "Colossus" chip over the spawn), the boss card (T0256) says *how much* (hp, phase), and this says *the peak is beginning* (a horn you hear, a bloom you see at the gate). No second card, no new readout, no input, no keys; the pause screen is unchanged.
- **Lockstep:** at 2× fast-forward (T019) the horn plays once and unstretched (WebAudio real time, the T0254 note); the ring is simulation-time and scales with the wave like the board.
- **Why it matters now:** the Colossus (wave 10) already spawns today, so the arrival happens in the game as it is; right now the run's biggest threat quietly appears as a shape, unannounced. No new content — a new enemy hook file (the bossDeath T0258 / leakEcho T0250 pattern, registered in the enemy-hooks index) plus the Sfx method and the transient ring.

## Acceptance criteria
- [ ] On a boss wave (a multiple of 10), the moment the boss's token first spawns, one rising two-note horn plays (~65→82 Hz, 180 ms each, ~90 ms apart, volume 0.12) and one muted-ink ring blooms from the entrance gate out to ~2 cells over ~500 ms and fades.
- [ ] The horn and the ring fire once per boss wave, on the boss's first spawn only; every other kill, leak and wave in the run is byte-identical (no horn, no ring on any non-boss wave).
- [ ] At 2× fast-forward the horn plays once and unstretched and the ring scales with the wave's simulation time.
- [ ] With sound off the horn is silent but the ring still plays; lives, gold, damage, waves, the boss's hp/phase and resume are byte-identical with it on.
- [ ] The horn's notes are below the leak thud's 98 Hz and distinct from the last-stand sting; the ring is muted ink, not red / road-white / green, and sits at the entrance gate, not the exit.
- [ ] The name tag, the boss card and the "boss" banner chip (T0257) are unchanged; no new HUD element, readout or key is added.

## Design (architect, cachyos-x8664)

### Files

Four files, one concern each. No shared-file growth beyond the two registry lines.

1. **NEW** `src/systems/fx/gatePulse.ts` — the transient wide ring in muted ink. Modelled on `clearRing.ts`. Signature `gatePulse(fx: FxSystem, x: number, y: number): void`.
2. **NEW** `src/systems/enemyHooks/bossArrival.ts` — the enemy hook that fires once per boss wave, on the boss's first spawn. Modelled on `nameTag.ts` / `waveClose.ts`.
3. **EDIT** `src/audio/Sfx.ts` — add `bossHorn()` next to `sting()` (`Sfx.ts:113`, after the `sting()` block, before `leak()`).
4. **EDIT** `src/systems/enemyHooks/index.ts` — add the `bossArrival` import line (next to the `nameTag` import, `index.ts:10`) and one array entry (next to `nameTag`, `index.ts:27`).

### Interfaces

**`gatePulse.ts`** — a transient fx, early-returns on `fx.full`, so the ring is dropped under FX load but the horn still plays (same as `clearRing`):
```ts
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/pailte'.replace(...) // -> '../../content/palette'
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The boss's arrival: a wide ring in muted ink that blooms from the entrance gate out to two cells, then fades. */
export function gatePulse(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = 2 * CELL; // out to two cells
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 8, 0, Math.PI * 2, PALETTE.ink, 0.6);
  g.setScale(0.15);
  fx.track(g, 500, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
```
(`import { PALETTE } from '../../content/palette';` — corrected to the real path.) It is a **scene tween**, so it is simulation-time and scales with the wave/zoom automatically at 2×. `PALETTE.ink` (0x2c3a40) at alpha 0.6 is the "muted ink" — it is the same ink the FxSystem ink rings use (e.g. `markFlash`).

**`bossArrival.ts`** — fires once per boss wave, on the boss's first active frame:
```ts
import type { MakeEnemyHook } from './hook';
import type { WaveSystem } from '../WaveSystem';
import { gatePulse } from '../fx/gatePulse';

export const bossArrival: MakeEnemyHook = ({ scene, board, run, fx, sfx, enemies }) => {
  let announcedWave = -1;
  // The entrance gate: the midpoint of the two path points around the road's start (art/board.ts).
  const pts = board.path.points;
  const gx = (pts[0]!.x + pts[1]!.x) / 2;
  const gy = (pts[0]!.y + pts[1]!.y) / 2;
  return {
    update() {
      const waves = scene.registry.get('waves') as WaveSystem | undefined;
      const plan = waves?.currentPlan;
      if (!plan || !plan.tags.includes('boss')) return;       // never on a non-boss wave
      if (announcedWave === run.wave) return;                // already sounded this wave
      const bossId = plan.spawns[0]?.enemy;                  // the boss wave's single spawn
      if (!bossId) return;
      if (!enemies.all.some((e) => e.active && e.def.id === bossId)) return; // the boss's first frame on the board
      announcedWave = run.wave;
      sfx?.bossHorn();
      gatePulse(fx, gx, gy);
    },
  };
};
```
`scene.registry.get('waves')` is the established pattern (`waveClose.ts:9`); the registry key `'waves'` is set by `GameScene.ts`. The gate position is computed once in the factory (the path is static for the run).

**`Sfx.bossHorn()`** — the deep two-note horn, next to `sting()`:
```ts
/** The boss arrives: a deep two-note horn rising (65 then 82 Hz), 180 ms each, ~90 ms apart, the sting's volume class. */
bossHorn(): void {
  this.tone(65, 0.18, 'sine', 0.12);
  this.tone(82, 0.18, 'sine', 0.12, undefined, 0.09);
}
```

**`index.ts`** — `import { bossArrival } from './bossArrival';` next to the `nameTag` import; `bossArrival` in the `ENEMY_HOOKS` array next to `nameTag`.

### Steps

1. Create `src/systems/fx/gatePulse.ts` from `clearRing.ts`.
2. Create `src/systems/enemyHooks/bossArrival.ts`.
3. Add `Sfx.bossHorn()` after the `sting()` block in `Sfx.ts`.
4. Register `bossArrival` in `index.ts` (import + array line, next to `nameTag`).
5. Run `npm run check` (typecheck + lint + unit tests) and `npm run smoke`.

### Pitfalls

- **Fires exactly once per boss wave, byte-identical elsewhere.** `announcedWave` is closure state, fresh per run (`MakeEnemyHook` is called once per run — `hook.ts` contract). The three guards gate it: `plan.tags.includes('boss')` (only boss waves reach the rest; on a non-boss wave this returns *before* touching `announcedWave`, so no state mutates and the wave is byte-identical), `announcedWave === run.wave` (fires once), and the boss being active (`enemies.all.some(...)`) = the boss's first frame on the board. `run.wave` is monotonic and `announcedWave` only ever equals a prior boss-wave number, which never repeats.
- **Entrance-gate center.** `board.path.points[0]` is one cell before the entrance and `[1]` the entrance cell; their midpoint is exactly the painted grey gate (`art/board.ts:55` `edgeStart`). Using `PALETTE.ink` for the ring is right — the ring is a transient FX in ink (like the FxSystem ink rings), not a repaint of the entrance gate itself (which is `faint`).
- **Horn is WebAudio real-time; ring is simulation-time.** The horn plays once, unstretched, at 2× because `Sfx.tone` schedules on `ctx.currentTime` (real time). The ring is a scene tween, so it is simulation-time and scales with the board/zoom at 2× like everything else. No special lockstep handling needed for either.
- **Silent when sound off, ring still plays.** `sfx?.bossHorn()` is a no-op when `Sfx.muted` (every `tone` guard-checks `this.muted`), but the hook unconditionally calls `gatePulse`, so the ring plays even with sound off.
- **No HUD / readout / input / keys.** The hook only sounds and pulses; the name tag, boss card, and boss-banner chip are untouched. The ring is drawn at `DEPTH.preview` on the board (under enemies), reading as a board-level pulse, not a HUD overlay.
- **`fx.full` drops the ring, not the horn.** Consistent with `clearRing`; under FX load the ring is skipped but the horn still plays (and vice versa — they are independent).
- **No invariant added.** This is a fire-once effect hook like `nameTag`/`waveClose` — no persistent state to assert on — so no `INVARIANTS` entry in `debug/runChecks.ts` is warranted, matching the existing hooks.

### Tests

- `npm run check` passes (typecheck + lint + existing unit tests). No new unit test is required: `bossArrival` is an effect hook (not pure `core/` logic), so it is verified by smoke, per the existing hooks.
- `npm run smoke` (must pass):
  - Plays to wave 10 (the Colossus boss wave). On the boss's spawn: the **deep two-note horn plays once** and the **wide muted-ink ring pulses from the entrance gate out to ~2 cells over ~500 ms, fading**.
  - **Non-boss waves are silent** — no horn, no ring on waves 1–9 and 11+; the boss fires exactly once on 10, 20, 30.
  - **2× fast-forward:** the horn plays once **unstretched** (real time) and the ring is simulation-time, scaling with the wave like the board.
  - **Sound off:** the horn is silent; the ring still plays.
  - Liveness: the run reaches and clears the boss wave without a crash; `brokenEnemy`/invariants in `EnemySystem` stay clean.
- Layout: at 412x915 (phone) and 1280x720 the ring is centered on the entrance gate and reads as a board-level pulse (not clipped by the HUD bars).
