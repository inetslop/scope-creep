---
id: T0059
title: "Burn on death: the flame that jumps to the nearest"
size: S
priority: 3
status: todo
depends_on: [T0028, T0039, T0027, T0054]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E4
---

## Goal
Ember's burn spreads one step: when a burning enemy dies, its flame jumps to the nearest enemy within 2 cells, so a burn can carry through a cluster — the first burn that moves between enemies.

## Details
- When an enemy with an active burn (T0028) dies — by any cause — and a living enemy is within 2 cells of the death spot (the same 2-cell measure Mint's and Rally's auras use), the burn jumps to the nearest one: the new host gets a fresh 3 s burn at the same damage-per-second rate the dying enemy's burn had.
- One jump only: the jumped burn is marked, and when that host later dies, its burn does not jump — a chain is at most one hop per burn, so a swarm can never ping-pong a burn forever.
- Re-ignition is unchanged (T0028: refresh duration, keep the higher rate); a jumped burn that re-ignites on its host keeps the usual rules.
- Visual: a quick 150 ms orange spark line from the death spot to the new host (the burn's own orange), then the host shows the burn exactly as today. No new sound.
- Closest existing: Ember's re-ignition (T0028) — same burn, same rate language; new is that the burn moves to a new enemy on death.

## Acceptance criteria
- [ ] A burning enemy that dies with another enemy within 2 cells leaves its burn on the nearest one: the new host burns for a fresh 3 s at the same damage/s, with a 150 ms orange spark from death spot to host.
- [ ] The jumped burn never jumps again: the new host's later death (even while burning) leaves no further jump.
- [ ] A burning enemy that dies with no enemy within 2 cells leaves no jump; an enemy that dies unburned is unchanged in every way.
- [ ] Burn numbers, re-ignition, gold, stats and sounds are otherwise unchanged; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/core/burnJump.ts` - pure jump rule: `BURN_JUMP_RANGE`, `BURN_JUMP_SEC`, `burnJumpTarget()` (model: `src/core/targeting.ts`)
- create `tests/core/burnJump.test.ts` - unit tests
- edit `src/entities/Enemy.ts` - 2 lines: `burnJumped` field + reset in `spawn()`
- edit `src/systems/EnemySystem.ts` - jump call in `strike()`'s kill block, `burnJump()` method, `brokenBurn()` check
- edit `src/systems/FxSystem.ts` - `spark()` method (150 ms orange line)
- edit `src/debug/runChecks.ts` - one line, `enemies.burn` invariant next to `enemies.mark`

### Interfaces
```ts
// src/core/burnJump.ts (whole new file; core never imports entities/)
import { CELL } from '../config';
/** 2 cells: the same reach as Mint's and Rally's auras. */
export const BURN_JUMP_RANGE = 2 * CELL;
/** A jump gives the host a fresh burn of this many seconds, at the dying enemy's rate. */
export const BURN_JUMP_SEC = 3;
export interface BurnJumpCandidate { x: number; y: number; active: boolean; }
/** Index of the closest active enemy within BURN_JUMP_RANGE of (x, y); -1 when none; ties go to the lower index. */
export function burnJumpTarget(x: number, y: number, enemies: readonly BurnJumpCandidate[]): number {
  let best = -1; let bestD2 = Infinity; const maxD2 = BURN_JUMP_RANGE * BURN_JUMP_RANGE;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active) continue;
    const dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy;
    if (d2 > maxD2) continue;
    if (d2 < bestD2) { best = i; bestD2 = d2; }
  }
  return best;
}
```
```ts
// src/systems/FxSystem.ts, new method after burst():
spark(x1: number, y1: number, x2: number, y2: number): void {
  if (this.live >= FxSystem.MAX) return;
  const g = this.scene.add.graphics().setDepth(DEPTH.fx);
  g.lineStyle(3, PALETTE.orange, 1);
  g.lineBetween(x1, y1, x2, y2);
  this.track(g, 150, { alpha: 0, ease: 'Quad.easeOut' });
}
```

### Steps
1. Verify T0028 first: open `src/entities/Enemy.ts` and find T0028's burn state — fields following the `slowPct`/`slowLeft`, `rootLeft`, `markPct` idiom (expected: `burnDps`, `burnLeft`) and its apply method (expected: `burn(dps, sec)` doing refresh-duration/keep-higher-rate). If the burn state is NOT on `Enemy`, STOP and flag the task. Everywhere below, use T0028's actual names.
2. Create `src/core/burnJump.ts` exactly as above.
3. `src/entities/Enemy.ts`: after T0028's burn fields, `burnJumped = false;` (doc: "Set when its burn is a jumped one (T0059): it will not jump again."); in `spawn()`, after T0028's burn reset, `this.burnJumped = false;`.
4. `src/systems/EnemySystem.ts`: add `import { BURN_JUMP_SEC, burnJumpTarget } from '../core/burnJump';` above the `core/mint` import. In `strike()`, after `e.despawn();` and before `return true;`, call `this.burnJump(e);`. New private method directly after `strike()`:
```ts
/** A burning death sends its burn to the nearest living enemy within 2 cells - one jump per burn. */
private burnJump(dead: Enemy): void {
  if (dead.burnLeft <= 0 || dead.burnJumped) return;
  const i = burnJumpTarget(dead.x, dead.y, this.pool);
  if (i < 0) return;
  const host = this.pool[i]!;
  host.burn(dead.burnDps, BURN_JUMP_SEC);
  host.burnJumped = true;
  this.fx.spark(dead.x, dead.y, host.x, host.y);
}
```
Plus after `brokenMark()`:
```ts
brokenBurn(): string | undefined {
  const bad = this.pool.find((e) => e.active && (!Number.isFinite(e.burnDps) || !Number.isFinite(e.burnLeft) || e.burnDps < 0 || e.burnLeft < 0));
  return bad ? `${bad.def.id} burning at ${bad.burnDps} for ${bad.burnLeft}` : undefined;
}
```
5. `src/systems/FxSystem.ts`: add `spark()` after `burst()` (code above).
6. `src/debug/runChecks.ts`: one line after the `['enemies.mark', ...]` line: `['enemies.burn', (g) => g.enemies.brokenBurn()],` (skip if T0028 already added an `enemies.burn` line — don't duplicate).
7. Create `tests/core/burnJump.test.ts` (model `tests/core/targeting.test.ts`): closest of two in range wins; an enemy exactly at `BURN_JUMP_RANGE` is included, `BURN_JUMP_RANGE + 1` is not; a dead enemy at the death spot (distance 0) is skipped; `-1` when nothing in range; equal distances go to the lower index.
8. Run `npm run check`.

### Pitfalls
- The jump MUST run after `e.despawn()`: before it the dead enemy is still `active` and would pick itself (distance 0).
- `burnJumped` is only cleared in `spawn()`. It must survive the burn expiring and re-ignition (a re-ignited jump is the same burn, so it still never jumps) — do not add expiry logic.
- Splash can kill the jumped-to host in the same strike; its mark is already set, so no second jump — a swarm cannot ping-pong.
- `leak()` is not a death: a leaked burning enemy does not jump. Unburned deaths hit the first `if` and change nothing (gold, stats, sfx untouched — the call is after all of them).
- The spark is a plain 3-unit line in board space (zooms with the camera, fine at 412x915 and 1280x720); `track()` destroys it at 150 ms and `FxSystem.MAX` caps it — no cleanup or dt work. No sound, no input, no HUD.

### Tests
- `tests/core/burnJump.test.ts` per step 7 (pure core rule; later tuning of the range could silently break it).
