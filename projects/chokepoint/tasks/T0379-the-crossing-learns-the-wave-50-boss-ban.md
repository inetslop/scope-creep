---
id: T0379
title: "The crossing learns: the wave-50 boss banks into the uncovered ground"
size: L
priority: 2
status: todo
depends_on: [T0317]
attempts: 0
created: 2026-11-01T21:18:04Z
epic: E10
---

## Goal
T0317's Flyer boss banks to a seeded line — the same bank on every board, whatever the player built. When the bank fires, it reads the board instead: the line it banks into is the one the run's towers cover least, so a build concentrated on the first line loses contact exactly where it chose to be strong, and spread cover stays ahead of the crossing.

## Details
- **The beat is unchanged (T0317):** at 50% hp, once, the 0.8 s preview of the two new segments, the quiet falling tone at the turn, a rooted or slowed Flyer still banking on its hp clock. Only where the bank point comes from changes: T0317's seeded point is no longer the choice — it becomes the fallback and a tie-break.
- **The choice (a new pure core function, no rng at bank time):** the moment the hp first drops to 50% (the same frame the preview starts), score a fixed deterministic set of candidate bank points — 8–10 points sampled evenly along the edge T0317's bank point lives on (the edge opposite the spawn side), always including the seeded point. For each candidate, the two-segment line (the Flyer's current position → the candidate → the exit gate) is sampled evenly along its length, and the candidate's score is the fraction of sampled points that lie outside every standing tower's range — each tower's current effective range as the game computes it for shooting (Reach-grown, the ring a placed tower shows). The Flyer banks to the highest score: the least covered line. Ties (within a fixed epsilon) break to the seeded point first, then the candidates' fixed order — the same board and the same towers always bank the same line.
- **The fallback:** with no standing towers, the bank is byte-identical to T0317 (the seeded point).
- **Fairness:** the existing 0.8 s preview shows the already-chosen line before the turn, the boss card's live hp shows the approach to 50%, and the choice is made once at the bank moment (towers cannot change mid-wave) — the line is never re-chosen and the preview never changes once shown.
- **What it punishes and what answers it:** it punishes a build whose rings all sit on the first line — the bank crosses to the part of the island those rings don't reach. The answers are cover spread into the island's interior: the wide rings (Beam 3.5, Reach 4.6), a tower or two off the road whose rings overlap several candidate lines, and still holding the first line hard (the pre-bank crossing is untouched).
- **Nothing else:** the regular Flyer in the mix waves (T0353) never banks and is untouched; the wave's plan, the first line, the 3 s start telegraph, the arrival horn, the boss card and the death beat are unchanged; seeded plans stay byte-identical (the choice happens at bank time, never plan time).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| T0317's seeded bank | the same beat at 50% hp, the same preview and tone | the seeded bank is fixed per board before the build is known; this bank is a read of the run's towers, made at the bank moment |
| Colossus | a boss beat at half health | the Colossus's beat stops the fight (out of reach); this beat keeps it coming, on a line aimed at the build's gap |
| Orb | a boss that changes at half health | the Orb becomes two other enemies once; the Flyer stays one shape and re-aims itself at uncovered ground |

## Acceptance criteria
- [ ] Wave 50: the Flyer banks at 50% hp to the candidate line its standing towers cover least (the highest uncovered fraction of the sampled two segments), with T0317's 0.8 s preview, falling tone and turn — the preview shows the chosen line before the turn.
- [ ] With no standing towers the bank is byte-identical to T0317's seeded point; the seeded point is always among the candidates; the same board and towers bank the same line every time (no rng at bank time, unit-pinned).
- [ ] The regular Flyer in the mix waves never banks; the wave-50 plan, the first line, the 3 s start telegraph, the seeded plans for waves 1–50 and every existing boss beat are unchanged.
- [ ] Unit tests pin the pure choice on a fixture board: no towers → the seeded point; one wide tower near the island's center → the candidate whose line avoids its ring; a board covered on one side and bare on the other → the candidate that crosses the bare side; the same inputs twice → the same point.
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/core/bankChoice.ts` - the pure bank choice: candidates along the edge, uncovered-fraction scoring, seeded-first tie-break. No Phaser, no rng.
- edit `src/systems/enemyHooks/flyLine.ts` - at the bank moment, replace the seeded point with the `chooseBank(...)` result (the file lands with T0317 first).
- create `tests/core/bankChoice.test.ts` - pin the pure choice on a fixture board.

### Interfaces
```ts
// src/core/bankChoice.ts
import type { GameMap } from './map';
import type { Point } from './path';

/** A standing tower as the bank read needs it (board units); range 0 covers nothing. */
export interface BankTower { x: number; y: number; range: number; } // range = spec.range * CELL, the ring a placed tower shows

/** The bank point the wave-50 Flyer turns into: the least-covered candidate. Pure; the same board, from, seeded and towers pick the same point. */
export function chooseBank(map: GameMap, cellSize: number, from: Point, seeded: Point, exit: Point, towers: readonly BankTower[]): Point

/** Uncovered fraction (0-1) of the two segments from -> candidate -> exit: quarter-cell samples, the same grid as openFraction. */
export function bankScore(cellSize: number, from: Point, exit: Point, candidate: Point, towers: readonly BankTower[]): number
```
Algorithm (fixed, in the file):
- Edge: `w = cols*cellSize`, `h = rows*cellSize`; the candidate edge is the board side nearest the seeded point (min of `seeded.x`, `w-seeded.x`, `seeded.y`, `h-seeded.y`, ties in that left/right/top/bottom order). 9 candidates evenly on it, corners included: vertical edge `{x: edgeX, y: (i/8)*h}`, horizontal `{x: (i/8)*w, y: edgeY}`, i = 0..8; then append `seeded` as its own last entry even if it coincides with a sample.
- `bankScore`: `L1 = |from-c|`, `L2 = |c-exit|`, `n = max(1, ceil((L1+L2)/(cellSize/4)))`; for j = 0..n, point at distance `(j/n)*(L1+L2)` walking segment 1 then 2. Covered if inside any tower with `range > 0` (`dx²+dy² <= r²`, same convention as `targeting.inRange`). Score = uncovered / (n+1).
- `chooseBank`: `best = max` score; among candidates with `score >= best - 0.02` (module const `TIE`) return `seeded` if it is among them, else the first in list order. No standing towers (or all range 0) → every score 1 → seeded → byte-identical to T0317.

### Steps
1. Create `src/core/bankChoice.ts` exactly as above.
2. In `flyLine.ts` (read it first — it is T0317's): at the moment the hp first drops to 50%, the same frame the preview starts, compute once and store: `const point = chooseBank(this.board.map, CELL, { x: e.x, y: e.y }, <the seeded bank point T0317 uses>, <the exit point it uses>, this.towers().map(t => ({ x: t.x, y: t.y, range: t.spec.range * CELL })));` — `towers` from the hook's `EnemyHookContext`. Build the 0.8 s preview, the tone and the turn from `point`, not the seeded point. The seeded point becomes only the fallback and the tie-break. Everything else in the beat (once-only, rooted/slowed still on its hp clock) is unchanged.
3. Write `tests/core/bankChoice.test.ts` (fixtures: `generateMap(new Rng(7), 14, 8, 0)`, `CELL` from `src/config`, `exitPoint` from `core/flyRoute`).
4. `npm run check`, then `npm run smoke` (desktop 1280×720 and phone 412×915).

### Pitfalls
- No rng at bank time and no sorting by score: ties resolve by the fixed candidate order (seeded first), so keep the list in construction order.
- Choose exactly once at the bank frame and reuse the stored point for preview and turn — the preview never changes once shown; towers cannot change mid-wave anyway.
- Skip `range <= 0` towers in the coverage test: a 0-ring must cover nothing (otherwise a sample exactly on a Frost-only tower's center would count as covered), and the no-towers fallback stays exact.
- Derive the edge from the seeded point's nearest board side — do not hard-code T0317's edge coordinates; its seeded point sits strictly inside the opposite edge, never at a corner.
- Do not touch `pickFlyLine`, `core/waves.ts` or the plan: the regular Flyer never banks, seeded plans for waves 1–50 stay byte-identical. No new UI, sound or content — nothing to lay out at 412×915.

### Tests
`tests/core/bankChoice.test.ts`, 14×8 landscape fixture, `seeded = { x: 14*CELL, y: 4*CELL }` (mid right edge), `from = { x: CELL, y: 4*CELL }`, `exit = exitPoint(map, CELL)`:
- No towers → `chooseBank(..., [], ...)` `toEqual(seeded)`; result is always on the edge (`x === 14*CELL`).
- One wide tower `{ x: 7*CELL, y: 4*CELL, range: 3*CELL }` → chosen ≠ seeded, on the edge, and `bankScore(chosen) > bankScore(seeded)` (the middle line runs through the ring).
- Covered top / bare bottom: towers `{ x: (2+k)*CELL, y: 1.5*CELL, range: 3*CELL }` for k = 0..10 → chosen is the bare side: `chosen.y >= 6*CELL` and `bankScore(chosen) >= bankScore(c)` for every candidate `c`.
- Total coverage (one tower `range: 20*CELL` at center) → every score 0, tie → `toEqual(seeded)` (pins the tie-break).
- Determinism: the same inputs twice → `toEqual`; the towers array in a different order → same point (the score counts, it never depends on tower order).
