---
id: T0366
title: "The Hive's pop gets its burst"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T16:18:26Z
claimed_at: 2026-11-01T17:12:04Z
---

## Goal
The Hive's "growing the group" lands at the moment it happens: when a telegraphed Dot materializes on the road, a small burst marks the pop, separate from the pre-pop warning ring.

## Details
- The Hive (the wave-40 boss) pops one small Dot every 6 s (up to 5), each pop telegraphed in advance by a thin purple ring at its base.
- The moment a telegraphed Dot actually spawns, play one small 4-chip burst in the Hive's own purple (the boss's body color) at the pop spot, over ~0.3 s, fading out. The ring warns before the pop; the burst is the Dot arriving — a two-beat moment (warning, then event) at the same spot.
- Display only: no sound, no text, no chip, no HUD. It rides the existing enemy-hook pattern — a new hook file, registered once alongside the others.
- It changes nothing about the Hive's numbers, the popped Dot's numbers, the wave plan, the boss's hp, or the pop's timing.

## Acceptance criteria
- [ ] When the Hive pops a Dot, a small purple 4-chip burst plays at the pop spot at the moment the Dot appears; the pre-pop telegraph ring is unchanged and still plays first.
- [ ] The burst is purple (the Hive's own body color), ~0.3 s, and display-only (no sound, no text, no HUD element).
- [ ] It plays once per pop (up to 5 per Hive), never on the Hive's own spawn or death, and never for any other enemy or boss.
- [ ] The Hive's pop cadence (6 s), the popped Dot's stats, the wave plan and the boss's hp are all unchanged.
- [ ] A new enemy-hook file is added and registered; no other enemy's behavior or look changes.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/hivePopBurst.ts` - the new enemy hook: per live Hive, ticks the same pop clock as `hivePops` and plays one 4-chip burst in the Hive's own color at the pop spot per due pop
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` line, each directly after `hivePops`

### Interfaces
```ts
// src/systems/enemyHooks/hivePopBurst.ts — full file:
import { PALETTE } from '../../content/palette';
import { popsDue } from '../../core/hivePops';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The Hive's popped Dot landing (T0366): the moment a telegraphed Dot actually spawns — one
 * every `everySec` at the Hive's spot, up to `max` (systems/enemyHooks/hivePops.ts) — one small
 * 4-chip burst in the Hive's own purple (the boss's body color) plays at the pop spot, over
 * ~0.3 s, fading out. The thin telegraph ring still warns first, in its own file: two beats,
 * warning then event, at the same spot. This hook ticks the same pop clock as hivePops — one
 * per live Hive, fresh on a recycled slot — so each due pop fires exactly one burst at the
 * Hive's spot; the pop, the telegraph and the popped Dot's numbers stay exactly as they are.
 * Display only: no sound, no text, no HUD.
 */
export const hivePopBurst: MakeEnemyHook = ({ fx, enemies }) => {
  // One state per live hive: its spawn's serial (the pool reuses objects) and its own clock,
  // ticking in step with hivePops's: kept in the closure, never module-level (a new run makes
  // a new hook).
  const hives = new Map<Enemy, { serial: number; clock: number; pops: number }>();
  return {
    update(dt) {
      for (const e of enemies.all) {
        if (!e.active) { hives.delete(e); continue; } // a dead hive pops no more
        const rule = e.def.pops;
        if (rule === undefined) continue; // never any other enemy or boss: only the Hive pops
        let h = hives.get(e);
        if (h === undefined || h.serial !== e.serial) { h = { serial: e.serial, clock: 0, pops: 0 }; hives.set(e, h); } // a recycled slot starts its clock fresh
        h.clock += dt;
        const due = popsDue(h.clock, rule);
        while (h.pops < due) {
          h.pops += 1;
          fx.burst(e.x, e.y, PALETTE[e.def.look.color], 4); // the Dot arriving: the Hive's own color, at its spot
        }
      }
    },
  };
};
```
`index.ts`: after `import { hivePops } from './hivePops';` add `import { hivePopBurst } from './hivePopBurst';`; in the `ENEMY_HOOKS` array, after `hivePops,` add `hivePopBurst,`.

### Steps
1. Create `src/systems/enemyHooks/hivePopBurst.ts` exactly as above.
2. Add the two lines to `src/systems/enemyHooks/index.ts` (import + array entry, each directly after its `hivePops` line — never at the list's end).
3. Run `npm run check`.

### Pitfalls
- The clock must stay in step with `hivePops.ts`: same `dt` per frame, first frame the Hive is active, reset on `serial` change — so the first burst lands at clock ≥ 6 s, never on the Hive's own spawn, and exactly 5 per Hive (`popsDue` caps at `max`).
- Color is the Hive's own purple via `PALETTE[e.def.look.color]` (like the telegraph ring does) — not the Dot's red; the existing small red ring at the pop spot stays, untouched.
- No white-pop concern: `fx.burst` is the game's canonical chip burst (see `orbSplit.ts`'s 12-chip call); chips=4 makes it the small one, ~0.3 s (380 ms) fade. Do not write a new fx file, do not add sound/text/HUD.
- State is closure-only; prune inactive slots and reset recycled ones exactly as `hivePops.ts` does — no module-level variables.
- No `hivePops.ts`, `core/hivePops.ts` or `content/enemies/hive.ts` edits; no invariant (nothing persistent to check), no tests.

### Tests
- none (juice)
