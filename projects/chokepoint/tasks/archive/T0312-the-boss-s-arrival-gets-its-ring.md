---
id: T0312
title: "The boss's arrival gets its ring"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T23:07:23Z
claimed_at: 2026-10-30T23:38:23Z
finished_at: 2026-10-30T23:52:16Z
---

## Goal
The run's biggest threat announces itself on the board, not only on the top-center card: the moment a boss walks in, its spot is seen.

## Details
- The moment the run's boss first appears on the board (its live spawn), a single muted ring in the boss's own body color expands from its base and fades over ~0.6 s — the working-aura ring's language (T0055) at boss scale.
- One ring per boss: the wave-10, 20 and 30 bosses each get theirs, and later bosses inherit it. The death burst and name card (T0273, T0302), the phase windup (T0286) and the boss card are untouched.
- No sound, no input, no new readout: a ~0.6 s transient at the boss's spot. It replaces nothing — the card is top-center (name and hp), the ring says where the boss is.

## Acceptance criteria
- [ ] In a fresh run, when the wave-10 boss first appears on the board, one muted ring in its own color expands from its base over ~0.6 s and fades.
- [ ] Each later boss (wave 20, 30) gets its own ring on first appearance; no second ring on the same boss.
- [ ] Resuming a run while a boss is already alive shows no ring.
- [ ] No sound plays with the ring, and the boss card, death burst and phase windup behave exactly as before.

## Design (architect, yoga)

### Files
- create `src/systems/fx/bossRing.ts` - the boss-arrival ring effect (model on `src/systems/fx/gatePulse.ts`)
- edit `src/systems/enemyHooks/bossArrival.ts` - fire the new ring at the boss's base in the boss's color, at the same once-per-boss moment as the horn/gate ring

### Interfaces
`src/systems/fx/bossRing.ts` (whole file):
```ts
import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The boss's arrival ring: a muted ring in the boss's own color that blooms from its base out to two cells, over ~0.6 s (T0312). */
export function bossRing(fx: FxSystem, x: number, y: number, color: number): void {
  if (fx.full) return;
  const r = 2 * CELL; // boss scale: out to two cells, as the gate's pulse
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, color, 0.6);
  g.setScale(0.5);
  fx.track(g, 600, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
```

### Steps
1. Create `src/systems/fx/bossRing.ts` exactly as above (radius `2*CELL` = boss scale to match `gatePulse`; thin `thickness 3` = the working-aura ring's language from `auraRing.ts`; `0.6` alpha = muted, as `gatePulse`'s ink; `600` ms = the task's ~0.6 s; `DEPTH.preview` so the boss token stays on top of the ring).
2. In `src/systems/enemyHooks/bossArrival.ts`, add the two imports next to the existing `gatePulse` import:
   `import { bossRing } from '../fx/bossRing';` and `import { PALETTE } from '../../content/palette';`
3. In its `update()`, replace `if (!enemies.all.some((e) => e.active && e.def.id === boss)) return; // the boss's first frame on the board` with:
   `const e = enemies.all.find((e) => e.active && e.def.id === boss); // the boss's first frame on the board` and `if (!e) return;`
4. Immediately after the existing `gatePulse(...)` line, add: `bossRing(fx, e.x, e.y, PALETTE[e.def.look.color]); // the boss's own ring at its base, in its own color (T0312)`
5. Extend the hook's doc comment: after "a wide ring of muted ink blooms from the entrance gate" add ", and a muted ring in the boss's own color blooms from the boss's base (T0312)".

### Pitfalls
- Do not touch `sfx?.bossHorn()` or `gatePulse(...)` — both stay byte-identical; this ring is silent and additive ("no sound with the ring").
- `e.x`/`e.y` are board units set before `hooks.update()` runs (spawn + `advance()` precede it in `EnemySystem.update`), so the ring is at the boss's spawn spot, not a follow.
- `announcedWave` already blocks a second ring per boss and any pause/unpause; keep it. `bossId` + `e.def.look.color` are generic, so later bosses (incl. T0292's wave-40 Hive) inherit it with no extra code.
- Ring is a one-shot at the arrival spot (the board entrance); it must not track the walking boss.

### Tests
none

## Result (attempt 1, yoga)

The boss's arrival now announces its spot on the board: the moment the run's boss first appears, a muted ring in the boss's own body color blooms from its base out to two cells and fades over 0.6 s, in the working-aura ring's language at boss scale. It's one ring per boss (wave 10, 20, 30 and any later bosses inherit it), silent, and fires at the same once-per-boss moment as the existing horn and gate pulse — so resuming mid-boss shows no ring, and the boss card, death burst and phase windup are untouched. Changes: new file src/systems/fx/bossRing.ts and the two-line change in src/systems/enemyHooks/bossArrival.ts.

- Self-review: APPROVE
- Time: 13.9 min

```
.../chokepoint/game/src/systems/enemyHooks/bossArrival.ts   | 13 +++++++++----
 projects/chokepoint/game/src/systems/fx/bossRing.ts         | 13 +++++++++++++
 2 files changed, 22 insertions(+), 4 deletions(-)
```
