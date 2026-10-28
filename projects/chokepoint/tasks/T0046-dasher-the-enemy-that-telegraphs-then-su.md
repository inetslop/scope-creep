---
id: T0046
title: "Dasher: the enemy that telegraphs, then surges"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T12:01:28Z
claimed_at: 2026-10-28T13:11:05Z
---

## Goal
A new enemy with a movement no other enemy has — it crawls, pauses with a clear tell, then surges — so a build that only slows can't pin it, and the predictive shot (Lead, T0040) has a real reason to exist.

## Details
- A new enemy, the **Dasher**: a small diamond in purple, clearly distinct from Dot, Dart, Block and Sprinter. Same small size as Dot.
- Behavior (a cycle, on every Dasher): crawl along the road at 50% of Dart's speed for 2.5 s, then stop for 0.5 s to telegraph (its purple shape flashes white twice, 250 ms on / 250 ms off, so the surge is readable coming), then dash 3 cells forward in about 0.3 s, then crawl again. The dash is far faster than any walk (about 10 cells per second).
- hp equal to Dot's hp; kill gold equal to Dot's; leaking one costs 1 life, like everything.
- The telegraph is on the enemy itself (no new HUD element); the surge is a fast slide along the road and it still flashes when struck mid-dash.
- In waves: Dashers start at wave 5 — 1 on wave 5, 2 on wave 6, then +1 every 3 waves after that, capped at 5 in a wave — mixed in with the usual walkers; no wave is made of only Dashers.
- Closest existing enemy: Dart (a fast, constant walker). What is new: the stop-telegraph-dash cycle — burst movement on a timer — which no current enemy does (Sprinter only speeds up when hit and never stops).

## Acceptance criteria
- [ ] A new "Dasher" enemy exists (a small purple diamond, distinct from the other four) and walks the road.
- [ ] From wave 5, a Dasher appears and visibly cycles: a slow crawl, a 0.5 s stop with a white-flash telegraph, then a fast 3-cell surge, repeating.
- [ ] A Dasher has Dot's hp and Dot's kill gold, and leaking it costs exactly 1 life.
- [ ] The surge is faster than Dart's constant walk, and the telegraph always finishes before the surge starts.
- [ ] Waves from wave 5 mix Dashers in (1, then 2, then +1 every 3 waves, cap 5); no wave is all Dashers.
- [ ] A first-time player can read the tell and the surge without any explanation.

## Design (architect, desktop-4070)

New enemy "Dasher" (`behavior: 'dash'`): crawl 2.5s → stop 0.5s (white telegraph its first half) → dash 3 cells in 0.3s (10 cells/s) → repeat. Content data + one movement case; no new system, art, HUD, or input. Texture is painted automatically from `look` (diamond is already a supported shape).

### Files
1. `src/content/types.ts` — extend `EnemyBehavior`; add `dashCycle?` to `EnemyDef` next to `speedRamp?`.
2. `src/content/enemies/dasher.ts` — NEW: the def (copy of dot.ts).
3. `src/content/enemies/index.ts` — one import + one registry entry, both before sprinter (never append at the end).
4. `src/core/waves.ts` — new `dashCount()` export next to `rampCount`; `planWave` excludes dashers from walkers, reserves them after rampers, interleaves with them (Interfaces below).
5. `src/entities/Enemy.ts` — 3 fields + resets in `spawn()`; `wasWhite` capture at top of `advance()`; new `case 'dash'`; end flash-block replaced by the unified tint block. `hit()`/`slow()`/`mark()`/`despawn()` untouched.
6. `tests/core/waves.test.ts` — import `dashCount` + three cases (Tests).
7. `tests/content.test.ts` — dash block in the enemies loop (Tests).

### Interfaces
```ts
// content/types.ts
export type EnemyBehavior = 'walk' | 'dash';
// on EnemyDef, after speedRamp?:
dashCycle?: { crawlSec: number; pauseSec: number; dashCells: number; dashSec: number }; // seconds; dashCells in board cells

// content/enemies/dasher.ts (NEW) — threat 2 is a design value (faster than Dot, cheaper than Sprinter's 3)
import type { EnemyDef } from '../types';
export const dasher: EnemyDef = {
  id: 'dasher', name: 'Dasher', description: 'Crawls, stops to wind up, then dashes: catch it mid-stop.',
  behavior: 'dash', hp: 30, speed: 1.4, gold: 4, livesCost: 1, threat: 2, fromWave: 5, // crawl = half of Dart's 2.8
  look: { shape: 'diamond', color: 'purple', size: 0.22 }, // small like Dot; diamond unused by enemies
  dashCycle: { crawlSec: 2.5, pauseSec: 0.5, dashCells: 3, dashSec: 0.3 },
};

// core/waves.ts — next to rampCount:
export function dashCount(wave: number): number { // one on 5, two on 6, +1 every three waves after, cap five
  if (wave < 5) return 0;
  const n = wave === 5 ? 1 : 2 + Math.floor((wave - 6) / 3);
  return Math.min(5, n);
}

// entities/Enemy.ts — fields after markAge:
dashLeg: 'crawl' | 'pause' | 'dash' = 'crawl';
dashLeft = 0; // seconds left of the current leg
pauseAge = 0; // seconds into 'pause'
// in spawn(), with the other resets:
this.dashLeg = 'crawl'; this.dashLeft = this.def.dashCycle?.crawlSec ?? 0; this.pauseAge = 0;
// at the top of advance(), before any update: const cycle = this.def.dashCycle; then
const wasWhite = this.flash > 0 || (cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2);
case 'dash': { // `speed` is the slowed crawl speed already computed in advance(); slow never touches pause/dash
  const c = this.def.dashCycle!;
  if (this.dashLeg === 'crawl') {
    this.distance += speed * dt; this.dashLeft -= dt;
    if (this.dashLeft <= 0) { this.dashLeg = 'pause'; this.dashLeft = c.pauseSec; this.pauseAge = 0; }
  } else if (this.dashLeg === 'pause') {
    this.dashLeft -= dt; this.pauseAge += dt;
    if (this.dashLeft <= 0) { this.dashLeg = 'dash'; this.dashLeft = c.dashSec; }
  } else {
    this.distance += (c.dashCells / c.dashSec) * CELL * dt; this.dashLeft -= dt;
    if (this.dashLeft <= 0) { this.dashLeg = 'crawl'; this.dashLeft = c.crawlSec; }
  }
  break;
}
// replace the end `if (this.flash > 0) { ... clearTint }` block with:
const tele = cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2;
if (this.flash > 0) this.flash -= dt;
const white = tele || this.flash > 0;
if (white !== wasWhite) { if (white) this.setTintFill(0xffffff); else this.clearTint(); }
// core/waves.ts planWave: walkers filter → `e.speedRamp === undefined && e.dashCycle === undefined`; after the ramper loop:
const dashSpawns: string[] = [];
for (const e of unlocked) if (e.dashCycle !== undefined) { const n = Math.min(dashCount(wave), Math.floor(budget / e.threat)); for (let i = 0; i < n; i++) dashSpawns.push(e.id); budget -= n * e.threat; }
// early return → `rampSpawns.length + dashSpawns.length === 0`; interleave via `const reserved = [...rampSpawns, ...dashSpawns]` in the two places `rampSpawns` appears.
```

### Steps
1. types.ts: union member + field exactly as above — `Enemy.advance()` is the only behavior switch site.
2. Create dasher.ts; in index.ts add the import between block and dart, the entry between block and sprinter (fromWave order).
3. waves.ts: `dashCount`, then in planWave the walkers filter, reservation loop, early-return condition, `reserved` interleave — no `rng` anywhere near dashers.
4. Enemy.ts: fields → spawn resets → `cycle`/`wasWhite` at top of advance() → case after `'walk'` → replace the end flash block.
5. Tests per below; no invariant needed (this is content, not a system — `brokenEnemy()` already covers NaN).

### Pitfalls
- Telegraph = exactly one white phase: first half of the 0.5s stop (250ms on / 250ms off). Don't flash twice.
- Slow applies to the crawl leg only — if it also slows the pause or dash, Frost-only builds pin it and the enemy has no purpose; hit-flash and telegraph share one tint owner via `wasWhite`, set/clear on transition only (never per-frame for pooled enemies), and `hit()`'s own `setTintFill` keeps working mid-dash.
- Reserve dashers without rng, after rampers, merged as `[...rampSpawns, ...dashSpawns]` — rampers keep identical t-slots so existing seeded waves/tests stay bit-identical; the interleave formula uses `reserved.length`.
- `speed: 1.4` is the crawl in board cells/s; the surge lives only in `dashCycle`. Never append at the end of ENEMIES/imports. No wave is dasher-only by construction: after reserving, dot/dart (threat 1) are always affordable from wave 5, so the walker loop always draws ≥1.

### Tests
tests/core/waves.test.ts (add `dashCount` to the import):
- `dashCount: none before 5, one on 5, two on 6, +1 every three waves after, capped at five`: `[4,5,6,9,12,15,20] → [0,1,2,3,4,5,5]`.
- `mixes in the dashing enemies exactly as dashCount says`: for each `[w,n]` in `[[4,0],[5,1],[6,2],[9,3],[12,4],[15,5],[20,5]]`, `planWave(w, new Rng(w), ENEMIES).spawns.filter(s => s.enemy === 'dasher').length === n`.
- `never builds a wave of only dashers`: for waves 5..30, `some(s => s.enemy !== 'dasher')`.
tests/content.test.ts: in the enemies loop add `if (e.behavior === 'dash') { const c = e.dashCycle!; expect([c.crawlSec, c.pauseSec, c.dashCells, c.dashSec]).toEqual(expect.arrayContaining([expect.any(Number)])); expect(c.crawlSec).toBeGreaterThan(0); expect(c.pauseSec).toBeGreaterThan(0); expect(c.dashCells).toBeGreaterThan(0); expect(c.dashSec).toBeGreaterThan(0); expect(c.dashCells / c.dashSec).toBeGreaterThan(e.speed); }`. All existing tests stay green; gates: `npm run check`, `npm run smoke`.
