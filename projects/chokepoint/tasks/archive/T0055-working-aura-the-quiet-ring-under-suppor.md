---
id: T0055
title: "Working aura: the quiet ring under support towers when their aura works"
assignee: desktop
size: S
priority: 3
status: done
depends_on: [T0039, T0027]
attempts: 1
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T19:56:34Z
finished_at: 2026-10-28T20:02:04Z
epic: E4
---

## Goal
A tower that never fires gives no sign of life until something happens: a quiet ring at the base of a pure Anchor or pure Mint tower, each time its aura does its job, makes a tower that never fires visibly working.

## Details
- **The ring:** a thin rounded ring on the ground around the tower's base, in the tower's own color (a tower takes its first augment's color), growing from the plinth out to about a 1-cell radius and fading over ~1 s. Quiet: no sound, no glow, no screen effect.
- **When it plays:**
  - A tower whose first augment is Anchor: with each root pulse, the moment the pulse lands.
  - A tower whose first augment is Mint: each time its aura pays a kill's +1 gold — the same beat as the gold's pop (T0039), at the tower's base. One ring per paying kill, even when the tower pays several +1 at once.
- **When it does not:** Rally towers show no ring — their effect (faster attacks) is visible on the rallied towers firing. A tower with an attacking first augment (e.g. Bolt + Anchor) shows no ring — its added aura works on every hit, which is visible on the enemy.
- No change to aura values, gold, sounds, the HUD, the waves, the draft or the profile. No new HUD element.

## Acceptance criteria
- [ ] A pure Anchor tower plays a fading ring at its base on every root pulse; a pure Mint tower plays one ring at its base each time its aura pays a kill's +1 gold.
- [ ] Rally towers and towers whose first augment has an attack show no ring at all.
- [ ] The ring is in the tower's own color, ~1-cell radius, ~1 s fade, and silent.
- [ ] Aura values, gold, sounds and the layout are otherwise unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0066: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. The Mint ring is an enemy hook (`onKill`, with `core/mint.ts`'s payers) and the ring itself an effect file in `systems/fx/`; only the Anchor ring still needs `TowerSystem` (when its pulse lands). No `EnemySystem` or `FxSystem` edit.

## Design (architect, yoga)

### Files
- create `src/systems/fx/auraRing.ts` - the quiet ring effect (recipe: fx file taking `FxSystem`, early-returns when `fx.full`, objects to `fx.track`)
- create `src/systems/enemyHooks/mintRing.ts` - `onKill` hook: one ring per paying Mint-first tower
- edit `src/systems/enemyHooks/index.ts` - add import + one `mintRing,` line to `ENEMY_HOOKS` (after `split`)
- edit `src/systems/TowerSystem.ts` - import `auraRing` + 3 lines in `private attack()`

### Interfaces
No new types. Exact code:

`src/systems/fx/auraRing.ts`:
```ts
import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The quiet ring at a support tower's base each time its aura works (T0055). */
export function auraRing(fx: FxSystem, x: number, y: number, color: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, CELL, 3, 0, Math.PI * 2, color, 0.9);
  g.setScale(0.5);
  fx.track(g, 1000, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
```

`src/systems/enemyHooks/mintRing.ts`:
```ts
import { PALETTE } from '../../content/palette';
import { towerColor } from '../../core/augments';
import { inMintReach } from '../../core/mint';
import { auraRing } from '../fx/auraRing';
import type { MakeEnemyHook } from './hook';

/**
 * The quiet ring at a Mint tower's base, at the same beat as the +1 gold's pop: one ring each
 * time its aura pays a kill (core/mint.ts), even when the tower pays several +1 at once (T0055).
 */
export const mintRing: MakeEnemyHook = ({ fx, towers }) => ({
  onKill({ enemy, source }) {
    const at = { x: enemy.x, y: enemy.y };
    for (const t of towers()) {
      if (t.spec.firstId !== 'mint' || t.spec.goldPerKill <= 0) continue;
      if (!(t === source || inMintReach(t.cell, at, t.spec.goldRadius))) continue;
      const color = towerColor(t.augments);
      auraRing(fx, t.x, t.y, color ? PALETTE[color] : PALETTE.faint);
    }
  },
});
```

`TowerSystem.attack()`, replace `if (attacked) hook.stats.shotsFired += 1;`:
```ts
    if (attacked) {
      hook.stats.shotsFired += 1;
      // The quiet aura ring: a tower whose first augment is Anchor shows its root pulse working (systems/fx/auraRing.ts).
      if (t.spec.firstId === 'anchor') auraRing(this.fx, t.x, t.y, color ? PALETTE[color] : PALETTE.faint);
    }
```
plus `import { auraRing } from './fx/auraRing';`

### Steps
1. Create `src/systems/fx/auraRing.ts` exactly as above.
2. Create `src/systems/enemyHooks/mintRing.ts` exactly as above.
3. `enemyHooks/index.ts`: add `import { mintRing } from './mintRing';` and `mintRing,` after `split,` in `ENEMY_HOOKS`.
4. `TowerSystem.ts`: add the import, change the `if (attacked)` line in `attack()` as above.

### Pitfalls
- Gate the Anchor ring on `attacked` (pulse.ts returns false with no enemy in range) — no ring when the pulse roots nothing.
- The gate is `firstId === 'anchor'` / `firstId === 'mint'`, not damage/root fields: Bolt+Anchor (firstId 'bolt') and Rally show no ring; a Mint+Bolt tower still rings (first is Mint).
- Loop over towers, not gold copies: one ring per paying tower per kill even with `goldPerKill > 1`.
- No sound, shake or screen effect on the ring; depth `DEPTH.preview` (ground, under the tower); radius `CELL`, 1000 ms, silent.
- `fx.track` destroys the graphics on completion — no manual cleanup; no module state in the hook (fresh each run via `MakeEnemyHook`).

### Tests
none

## Result (attempt 1, desktop)

Support towers that never fire now show a quiet sign of life: a thin ring in the tower's own color grows from the plinth out to one cell and fades over 1 s at ground level, each time a pure Anchor tower's root pulse lands (systems/TowerSystem.ts, gated on the pulse having hit) or a pure Mint tower's aura pays a kill's +1 gold (new enemy hook systems/enemyHooks/mintRing.ts, one ring per paying tower per kill). The ring itself is a new effect file systems/fx/auraRing.ts; the only other edit is the one-line registration in systems/enemyHooks/index.ts. Rally and attacking-first towers show no ring, and aura values, gold, sounds and the HUD are unchanged.

- Self-review: APPROVE
- Time: 5.5 min

```
projects/chokepoint/game/src/systems/TowerSystem.ts |  7 ++++++-
 .../chokepoint/game/src/systems/enemyHooks/index.ts |  2 ++
 .../game/src/systems/enemyHooks/mintRing.ts         | 21 +++++++++++++++++++++
 projects/chokepoint/game/src/systems/fx/auraRing.ts | 12 ++++++++++++
 4 files changed, 41 insertions(+), 1 deletion(-)
```
