---
id: T0059
title: "Burn on death: the flame that jumps to the nearest"
size: S
priority: 3
status: todo
depends_on: [T0028, T0039, T0027]
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

## Note (by hand, 2026-10-28)

No longer waits on T0070: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design was written before kills moved into `EnemySystem.kill()` (a burning enemy usually dies from its burn tick, which never goes through `strike()`) and before the enemy hooks. Design it as an enemy hook (`systems/enemyHooks/`, `onKill`: the dying enemy is still active there, so leave it out of the candidates) and the spark as an effect file (`systems/fx/`), so it edits no shared file.

## Design (architect, yoga)

### Files
- create `src/systems/fx/spark.ts` - the 150 ms orange spark line (first file in the new `systems/fx/` folder)
- create `src/systems/enemyHooks/burnLeap.ts` - the burn-jump enemy hook (`onKill` only)
- edit `src/systems/enemyHooks/index.ts` - one line `burnLeap,` as the second item, after `split,`

### Interfaces
No new types. Exports: `src/systems/fx/spark.ts` → `export function burnSpark(fx: FxSystem, x0: number, y0: number, x1: number, y1: number): void`; `src/systems/enemyHooks/burnLeap.ts` → `export const burnLeap: MakeEnemyHook` (model on `split.ts`; context fields used: `enemies`, `fx`).

### Steps
1. `src/systems/fx/spark.ts` (imports: `DEPTH` from `../../config`, `PALETTE` from `../../content/palette`, `type { FxSystem }` from `../FxSystem`):
```ts
/** A quick 150 ms orange spark line from the death spot to the enemy it leaps to (burn on death). */
export function burnSpark(fx: FxSystem, x0: number, y0: number, x1: number, y1: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx).setStrokeStyle(3, PALETTE.orange, 0.9).setPosition(x0, y0);
  g.lineBetween(0, 0, x1 - x0, y1 - y0);
  fx.track(g, 150, { alpha: 0 });
}
```
2. `src/systems/enemyHooks/burnLeap.ts` (imports: `CELL` from `../../config`, `type { Enemy }` from `../../entities/Enemy`, `burnSpark` from `../fx/spark`, `type { MakeEnemyHook }` from `./hook`):
```ts
/** Burn on death: the burn leaps to the nearest living enemy within 2 cells; a leaped burn only leaps once. */
export const burnLeap: MakeEnemyHook = ({ enemies, fx }) => {
  // Mark is on the host, keyed by its spawn serial: pooled Enemy objects are reused, so a bare
  // Set<Enemy> would later suppress the leap of an enemy that never leaped.
  const jumped = new WeakMap<Enemy, number>();
  return {
    onKill({ enemy }) {
      if (enemy.burn.left <= 0) return; // unburned death: unchanged
      if (jumped.get(enemy) === enemy.serial) return; // a leaped burn never leaps again
      const r2 = (2 * CELL) ** 2; // the same 2-cell circle as the Mint and Rally auras
      let best: Enemy | undefined;
      let bestD = r2;
      for (const e of enemies.all) {
        if (!e.active || e === enemy) continue; // dead/returned hosts, and the dying enemy
        const dx = e.x - enemy.x;
        const dy = e.y - enemy.y;
        const d = dx * dx + dy * dy;
        if (d <= bestD) { bestD = d; best = e; }
      }
      if (!best) return;
      jumped.set(best, best.serial);
      best.ignite(enemy.burn.dps, 3); // fresh 3 s at the dying burn's rate (re-ignition keeps the higher)
      burnSpark(fx, enemy.x, enemy.y, best.x, best.y);
    },
  };
};
```
3. In `src/systems/enemyHooks/index.ts`: import `burnLeap` and list it after `split,` (one item per line, nothing else).

### Pitfalls
- Mark `best` (the host), never `enemy`; and key the mark by `serial` — a bare `Set`/flag survives pool reuse and wrongly suppresses the leap of a recycled object.
- No `sfx` call (no new sound), no change to `burnSource`, gold, mints or stats; the host's ablaze dash appears on its own via the existing enemyMarks mark, since `left > 0`.
- Don't edit `Enemy.ts` or `EnemySystem.ts`; the hook never despawns anything — `kill()` returns the enemy to the pool after the hooks run, and the spark is created on `fx.scene` (the game scene) in board units, 3 px stroke (not a `fillRing`), early return on `fx.full`.
- Keep the registry order (after `split`): a splitter's children spawn at the death spot, so a splinter can be the leaped-to enemy — that is by design, don't reorder to "fix" it.
- One-frame edge: a burn whose final tick (left exactly 0) kills leaves no leap — there is no signal in `onKill` that the burn was the killer; acceptable.

### Tests
none
