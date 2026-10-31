---
id: T0002
title: "Puff: a purple pentagon that pops into three Dots"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T01:44:04Z
claimed_at: 2026-10-31T02:13:20Z
finished_at: 2026-10-31T02:24:27Z
epic: E2
---

## Goal
A slow, tanky monster that pops into three Dots when it dies: killing it becomes a decision — take it down at range, or eat a burst of extra threats — so players learn to manage the space around a kill. A new way to survive (splitting on death) that no monster has.

## Details
- New monster file `src/content/monsters/puff.ts` (closest example: `src/content/monsters/dot.ts`, same data shape; the Puff adds one `onDeath`).
- Numbers: hp 45, speed 50 (players move at 210), radius 22 (a Dot's is 14), damage 14 per second while touching a player, xp 4, weight 4 (a Dot's is 10), fromLevel 3. Its hp grows with the level of the player it spawned around, like every monster.
- Behavior: moves like a Dot — straight for the nearest player, fanned out a little. On death it pops into three Dots that spawn at its spot, in a small burst, each facing a different way. Its gem drops as usual, worth its xp (4).
- Crowd count: three Dots per Puff death; with weight 4 against the Dot's 10 the Puff is a minority of the crowd, so splits add at most a handful of monsters per second around a player.
- Look: shape pentagon, color purple, face: mood calm, 1 eye, mouth o. It looks the same at all times — the shape itself is the warning (players learn: purple pentagon pops into three Dots). On death: a purple confetti burst (the pop effect), and the three Dots (the existing red circle, angry face) burst out.
- What counters it: take it down at range — kite it (speed 50 is far below a player's 210) or kill it in open space. What it punishes: a player who kites one into a monster crowd, or who camps one spot while a Puff drifts over.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | A Dot never spawns anything; the Puff pops into three Dots on death, so killing it is a decision about the space around the kill |

## Acceptance criteria
- [ ] From player level 3, roughly 1 in 3 spawned monsters is a big purple pentagon (weight 4 vs the Dot's 10); below level 3, none.
- [ ] The Puff chases a player like a Dot but slowly (50 u/s) and does 14 damage per second while touching.
- [ ] When the Puff dies, a purple confetti burst pops, three Dots burst out of its spot, and its gem (worth 4 xp) drops.
- [ ] A player who runs (210 u/s) always escapes the three Dots; a player who stands still is caught by them.
- [ ] A Puff death adds three to the per-player crowd; the cap of 60 monsters around a player still holds.

## Design (architect, yoga)

### Files
- create `src/content/monsters/puff.ts` - the Puff `MonsterDef` (same data shape as `src/content/monsters/dot.ts`), with one `onDeath`
- edit `src/content/monsters/index.ts` - one import line + one line in `MONSTERS`

### Interfaces
None - no new or changed types.

### Steps
1. Create `src/content/monsters/puff.ts` with exactly:
```ts
import type { MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Slow and tanky; pops into three Dots when it dies. */
export const puff: MonsterDef = {
  id: 'puff',
  name: 'Puff',
  description: 'Pops into three Dots when it dies.',
  hp: 45,
  speed: 50,
  radius: 22,
  damage: 14,
  xp: 4,
  weight: 4,
  fromLevel: 3,
  look: { shape: 'pentagon', color: PALETTE.purple, face: { mood: 'calm', eyes: 1, mouth: 'o' } },
  onDeath(ctx, m) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.spawnMonster('dot', m.x + Math.cos(a) * 18, m.y + Math.sin(a) * 18);
    }
  },
};
```
2. In `src/content/monsters/index.ts`: add `import { puff } from './puff.ts';` after the dot import, and `puff,` after `dot,` in `MONSTERS`.

### Pitfalls
- No `think` hook: the engine's default `chase()` is exactly "straight for the nearest player, fanned out a little" (stable per-monster angular spread); a `think` would duplicate it.
- No effect or pickup code in `onDeath`: the engine itself plays the `pop` confetti effect and drops the xp-worth gem on every monster death (engine/sim/match.ts:750-751) - adding `ctx.effect`/`dropPickup` would double them. The burst reads purple because the Puff's own body is `PALETTE.purple`; do not create a purple effect.
- The three Dots spawn at base hp (12): `ctx.spawnMonster` takes no level argument - there is no API to scale them; do not invent one.
- The 18 u offsets at 0/120/240 degrees keep the three Dots (radius 14) from overlapping at spawn; "each facing a different way" is the offset plus each Dot's own chase spread. No `ctx.rng` needed.
- The three Dots count into the per-player crowd on the next spawn tick, and the engine's spawn loop (cap 60 around a player) stops topping up while they are alive - the cap holds by itself.
- `xp: 4` makes the gem worth 4 xp automatically; the engine clamps the spawn spots inside the world.

### Tests
none (content is tested automatically by engine/tests/).

## Result (attempt 1, yoga)

Added the Puff monster (src/content/monsters/puff.ts): a slow (50 u/s), tanky (hp 45) purple pentagon with a calm one-eyed face that spawns from player level 3 (weight 4 vs the Dot's 10) and pops into three Dots on death via one onDeath; registered it in src/content/monsters/index.ts. No effect or pickup code was added — the engine already plays the pop confetti (which reads purple from the Puff's own color) and drops the xp-worth gem on every monster death. Typecheck, lint, all 53 tests, and the desktop + mobile smoke pass.

- Self-review: APPROVE
- Time: 11.1 min

```
.../draft-arena/game/src/content/monsters/index.ts |  2 ++
 .../draft-arena/game/src/content/monsters/puff.ts  | 23 ++++++++++++++++++++++
 2 files changed, 25 insertions(+)
```
