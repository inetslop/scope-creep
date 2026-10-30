---
id: T0270
title: "The tower's milestone: a ring when a tower crosses a kill count"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T09:22:16Z
---

## Goal
The player feels each tower's contribution grow: a tower that earns its keep marks the milestone on the board, so the gold spent on its slots is seen paying off where the tower stands — not only in the panel's kills line or the end card's by-tower list.

## Details
- When a tower's kill count for the current session first reaches 10, then 25, then 50 — the same per-tower number the tower panel's "kills N" line reads (T0070, by the source-of-kill rule) — the tower blooms one small ring in its own color (the first augment's color) at its base, growing from the plinth's width out to 1 cell over ~300 ms and fading. It is the working-aura ring's look (T0055) — a quiet ring at the base in the tower's own color — but it blooms once per milestone, on the tower itself, so it needs no new HUD and no change to the wave's effects.
- One bloom per milestone per tower. The milestone tracker resets on new and resumed runs exactly like the kills line it reads, so a resumed tower re-blooms a milestone as its (reset) count crosses it again.
- A tower whose kill count is 0 (a pure support: Mint, Toll, Rally, or a lone Anchor) never blooms.
- No sound, no text, no input. The ring is a transient board effect, like the working-aura ring (T0055): it clears on its own and leaves no mark, and it replaces nothing.
- It is a board effect, so it shows identically on desktop and mobile and is not a HUD element.

## Acceptance criteria
- [ ] A tower whose session kill count reaches 10 blooms one small ring in its own color from its plinth (out to 1 cell, ~300 ms, fading); no sound, no text.
- [ ] 25 and 50 each bloom once per tower per session; a milestone never re-blooms within the same session.
- [ ] After a resume (kills line reset to 0), a tower re-blooms 10 as its count crosses it again.
- [ ] A pure-support tower (0 kills) never blooms.
- [ ] The board and HUD are otherwise unchanged: no persistent mark, no new card or line.

## Design (architect, desktop-4070)

### Files
- create `src/systems/fx/milestoneRing.ts` - the bloom ring (copy of `src/systems/fx/auraRing.ts`, but 300 ms and starting at the plinth's edge)
- create `src/systems/enemyHooks/killMilestone.ts` - per-tower milestone tracker; blooms the ring when a tower's kill count crosses 10/25/50
- edit `src/systems/enemyHooks/index.ts` - one import line next to `import { killCoin } from './killCoin';`, and one line `killMilestone,` in `ENEMY_HOOKS` directly after `killCoin,`

### Interfaces
```ts
// src/systems/fx/milestoneRing.ts
export function milestoneRing(fx: FxSystem, x: number, y: number, color: number): void;

// src/systems/enemyHooks/killMilestone.ts
import type { Tower } from '../../entities/Tower';
import { PALETTE } from '../../content/palette';
import { towerColor } from '../../core/augments';
import { milestoneRing } from '../fx/milestoneRing';
import type { MakeEnemyHook } from './hook';

const MILESTONES = [10, 25, 50];
export const killMilestone: MakeEnemyHook; // closure keeps one Map<Tower, number> (last checked count), fresh per run
```
`milestoneRing.ts` body — copy `auraRing.ts` verbatim, then change only: doc comment, `g.setScale(0.4)` instead of `0.5`, and `fx.track(g, 300, ...)` instead of `1000`. Its imports (`CELL, DEPTH` from `'../../config'`, `FxSystem` type, `fillRing` from `'../../ui/ring'`) stay as in `auraRing.ts`.

### Steps
1. Create `src/systems/fx/milestoneRing.ts` exactly per Interfaces (ring radius `CELL`, thickness 3, alpha 0.9, `DEPTH.preview`, ease `'Quad.easeOut'`).
2. Create `src/systems/enemyHooks/killMilestone.ts`:
```ts
export const killMilestone: MakeEnemyHook = ({ fx }) => {
  const seen = new Map<Tower, number>(); // last checked kill count per tower; a new run makes a new hook, so it starts at 0 like the kills line
  return {
    onKill({ source }) {
      if (!source) return;
      const n = source.kills + 1; // EnemySystem counts this kill into source right after the hooks run
      const prev = seen.get(source) ?? 0;
      seen.set(source, n);
      for (const m of MILESTONES) {
        if (prev < m && m <= n) {
          const color = towerColor(source.augments);
          milestoneRing(fx, source.x, source.y, color ? PALETTE[color] : PALETTE.faint);
        }
      }
    },
  };
};
```
3. In `src/systems/enemyHooks/index.ts` add the import next to `killCoin`'s and `killMilestone,` right after `killCoin,`.

### Pitfalls
- `source.kills` is incremented in `EnemySystem.kill()` only AFTER the hooks run (`src/systems/EnemySystem.ts:206-208`), so the crossed count inside the hook is `source.kills + 1` — never `source.kills`, or the first bloom lands one kill late.
- Tracker state must live in the hook's closure, not module level: `RunSave.restore` rebuilds every `Tower` at `kills = 0` on a fresh scene and hooks are re-made per run, so the reset matches the kills line automatically; a module map would not.
- A tower with 0 kills gets no `onKill` with itself as `source`, so pure supports (Mint, Toll, Rally, lone Anchor) never bloom — do not add an `update()`.
- No sound, no text, no new HUD line, no invariant: it is a transient board effect exactly like `auraRing` (`fx.track` destroys the graphics at 300 ms; no listeners to clean up). Don't touch `EnemySystem.ts`, `Tower.ts`, `TowerPanel.ts` or anything in `ui/`.
- Depth is `DEPTH.preview` (under the tower token), not `DEPTH.fx`; return early on `fx.full` before creating the graphics.

### Tests
none (no rule in `src/core/` changes; pattern has no test file, like `mintRing.ts`/`auraRing.ts`).
