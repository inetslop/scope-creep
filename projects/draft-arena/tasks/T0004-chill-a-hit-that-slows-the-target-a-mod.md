---
id: T0004
title: "Chill: a hit that slows the target, a mod for any weapon"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T02:20:47Z
claimed_at: 2026-10-31T03:34:42Z
epic: E1
---

## Goal
The Body tree gets its crowd tool: every hit slows the critter it hits, so a tank can stand in the wave, slow it, and eat it instead of outrunning it. A new on-hit effect (the first besides Ricochet) and the first slow status a player's weapons put on a critter.

## Details
- New upgrade file `src/content/upgrades/chill.ts` (closest example: `src/content/upgrades/ricochet.ts`, an on-hit effect). On hit: apply a slow to the critter hit — its speed × (1 − slow) until the time runs out. The slow never stacks: a fresh hit refreshes the time; the slow % is the current rank's.
- Exact numbers: rank 1: 30% slow for 1.0 s; per rank +10% slow and +0.5 s (rank 2: 40% / 1.5 s, rank 3: 50% / 2.0 s).
- Talent line in the Body tree file (closest example: the `vigor` line in the same file): id `chill`, upgrade `chill`, max 3, needs `[["vigor", 1]]` — the slow is bought into the tank line, not free: a slow with no hp behind it to stand still is a death sentence.
- Text (shown on its talent line, must fit at 412x915): "Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s."
- Look: shape hexagon, color ice.
- What it does with every weapon: Bolt — every bolt hit slows the critter it hits; with Split, every fanned bolt refreshes it; with Lance, every critter in the line is slowed; with Ricochet, the bounce hit refreshes it. General rule for all weapons: it works with anything that hits, and an area refreshes it on every pulse for everything inside (so the Lobber's splash, T0003, slows a whole circle).
- What it does to a player: a hit enemy player is slowed the same way — a fleeing or charging player at 50% speed is a catch; in a player chase the slow is the difference between a catch and a get-away.
- On the field, readable in a crowd: while slowed, the critter's face turns scared (mood change, its mouth closes to o) — an angry red Dot that becomes a scared red Dot reads as "slowed"; the face returns when the slow wears off. When a slow first lands (not on a refresh), a small ice bubble (radius 8, 0.3 s) pops off the critter — new effect file `src/content/effects/slow-pop.ts` (closest example: `src/content/effects/pop.ts`, the confetti pop).
- What it changes in a crowd: a Dot at 85 u/s crawls at 60 with Chill 1 — a player (210 u/s) steps out of a slowed Dot's reach easily; in a 60-strong wave the slowed chunk is room to move, and standing in it stops being a death sentence.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect of the player's weapons | Ricochet redirects the bolt to another enemy (a chain of damage); Chill changes the target itself — it moves slower for a time, so the crowd loses its chase |
| Fuse (T0003, in the pool) | an effect that runs on the player's weapons | Fuse runs on a kill and damages a ring around the corpse; Chill runs on every hit and slows the living target |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a new line "Chill" under Vigor: "Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s.", hexagon icon (ice), 3 ranks, "Needs Vigor 1" until taken — readable at 412x915.
- [ ] With Chill 1, a hit Dot crawls at 70% speed for 1.0 s, then is normal again; a running player (210 u/s) easily gets out of a slowed Dot's reach.
- [ ] A hit enemy player is slowed the same way: 30% slower for 1.0 s at rank 1.
- [ ] While slowed, the critter's face is scared and returns when the slow wears off; a small ice bubble pops off when the slow first lands, and a refresh within the time extends the duration without popping again.
- [ ] At rank 3 the slow is 50% for 2.0 s.
- [ ] Without Chill, hits slow nothing: Dot and Puff are unchanged.

## Design (architect, desktop-4070)

### Files
Create (5): `src/content/statuses/chill-1.ts` (`chill1`), `chill-2.ts` (`chill2`), `chill-3.ts` (`chill3`); `src/content/effects/slow-pop.ts` (`slowPop`); `src/content/upgrades/chill.ts` (`chill`).
Edit (5): `src/content/statuses/index.ts`, `src/content/effects/index.ts`, `src/content/upgrades/index.ts` (T0003 also edits it — add only your two lines), `src/content/talents/body.ts`, `src/content/monsters/dot.ts`.

### Interfaces
- One status per rank: `speedMul` is a def constant and there is no removeStatus, so rank N needs id `chill-N`.
- Statuses: `chillN: StatusDef = { id: 'chill-N', name: 'Chill N', color: PALETTE.ice, speedMul: 0.N }` — 0.7 / 0.6 / 0.5 (30/40/50% slow); `maxStacks` left at default 1 so re-adds refresh, never stack.
- `chill: UpgradeDef = { id: 'chill', name: 'Chill', description: 'Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s.', maxLevel: 3, look: { shape: 'hexagon', color: PALETTE.ice }, onHit(ctx, _me, level, hit) { … } }` — exact description string above; `onHit` fires after every projectile hit AND area pulse automatically (works with every weapon).
- onHit body: `const id = `chill-${level}`; const fresh = [1,2,3].every((n) => !ctx.statusOf(hit.target, `chill-${n}`)); ctx.addStatus(hit.target, id, 0.5 + level * 0.5); if (fresh) ctx.effect('slow-pop', { x: hit.x, y: hit.y });` (durations 1.0/1.5/2.0).
- `slowPop: EffectDef = { id: 'slow-pop', duration: 0.3, draw(g, fx) {…} }` — one ice bubble at `(fx.ax, fx.ay)`: `g.globalAlpha = 1 - fx.t; const r = 8 + 6 * fx.t;` fill circle radius r with `PALETTE.ice`, stroke `lineWidth 3` / `PALETTE.ink`, then a small white shine dot at `(fx.ax - r*0.35, fx.ay - r*0.35)` (`PALETTE.white`, radius ~2).
- Body tree talent: `{ id: 'chill', upgrade: 'chill', max: 3, needs: [['vigor', 1]] }`.

### Steps
1. Create the three status files (copy of one shape above; file name = id, export camelCase) and register them in `statuses/index.ts` (3 imports + `STATUSES = [chill1, chill2, chill3]`).
2. Create `slow-pop.ts`; add its import (after `ring`, alphabetical) and one line in `EFFECTS`.
3. Create `upgrades/chill.ts`; in `upgrades/index.ts` add `import { chill } from './chill.ts';` (after `bolt`) and `chill,` right after the `ricochet,` line (on-hit group).
4. In `talents/body.ts` add the talent line right after `{ id: 'vigor', upgrade: 'vigor', max: 3 },`.
5. In `monsters/dot.ts`: change import to `import { chase, drawCritter, type MonsterDef } from '../../../engine/api.ts';`; replace `look` with `{ shape: 'circle', color: PALETTE.red, draw(g, e) { drawCritter(g, this, e, { ink: PALETTE.ink, face: e.slots[0] === 1 ? { mood: 'scared', mouth: 'o' } : { mood: 'angry' } }); } }` (drop the old `face` field — draw supplies it); add `think(ctx, m, _dt) { m.slots[0] = ctx.statusOf(m, 'chill-1') + ctx.statusOf(m, 'chill-2') + ctx.statusOf(m, 'chill-3') > 0 ? 1 : 0; chase(m); }`.

### Pitfalls
- Defining `think` REPLACES the engine's default chase — `chase(m)` must be the last line of it or Dot stops moving.
- `look.draw` replaces the default body draw entirely: it must start with `drawCritter(g, this, e, {…face})` (pass `this` as the Look) or Dot draws nothing but extras.
- Slow state reaches clients only via slots: scared face reads `e.slots[0]`; no status data exists in `DrawView`.
- "Never stacks" holds per rank (maxStacks 1 → re-add takes max remaining time). A rank-2 hit while `chill-1` still runs briefly multiplies both `speedMul`s (<1 s, self-resolving); no engine fix exists — acceptable.
- Effect is pure client draw: only `fx.*` fields (+ `noise(fx.seed, i)` if varying); never `Math.random`/`Date` (lint), no `ctx`.
- File names must equal ids (`chill-1.ts`→`chill1`) — tests enforce one item per file by id.
- Puff (T0002's file) is slowed by the statuses with zero changes; do NOT edit `puff.ts` — scared-face there is T0002's follow-up, not this task's.
- Unused hook params as `_me` / `_dt`.

### Tests
No pure helpers added → no new unit tests. `npm run check` covers it: every status/upgrade/effect validated, chill and Dot played in a real match, talent reachable (needs vigor 1), sums ≤ maxLevel. Then `npm run smoke`.
