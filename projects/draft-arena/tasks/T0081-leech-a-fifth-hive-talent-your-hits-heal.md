---
id: T0081
title: "Leech: a fifth Hive talent, your hits heal you while the crowd is on you"
assignee: inet-racing
size: M
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-31T13:48:21Z
claimed_at: 2026-10-31T17:15:47Z
finished_at: 2026-10-31T17:25:41Z
epic: E16
---

## Goal
The sustain fork under Swarm in the Hive tree: Leech — while the crowd is on you, every hit you land heals you — so a Hive life runs into the swarm not only to hit harder but to stay alive in it.

## Details
- New on-hit upgrade "Leech" in src/content/upgrades/ (closest example: swarm.ts — an on-hit that counts nearby enemies — with a heal, closest example: mend.ts).
- Panel text: "While 3+ enemies are within 80 of you, your hits heal 1 hp. Per rank: +1 hp."
- maxLevel 3: while 3 or more other enemies (monsters and players) are within 80 of you, each hit you land heals you 1 hp (rank 1), 2 hp (rank 2) or 3 hp (rank 3). Heals cap at your max hp (as Chomp's do).
- The count is enemies within 80 of you, counted the way Swarm counts, refreshed as they move: walk out of the cluster and your next hit heals nothing.
- Works with every weapon and area: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Horn's dart, Slush's blob and puddle, and your own puddle tick all heal while the crowd is on you.
- Nothing new on screen: the heal reads as your hp coming back and the wound collar shrinking while you chew on the crowd.
- Talent line: id leech, upgrade leech, max 3, needs [["swarm", 1]] — in the Hive tree.
- The tree as the panel will draw it (before T0076's Nest and Sting land):
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
    Leech (3, needs Swarm 1)
  ```
  Leech needs no other talent; T0076's talents hang off Swarm 3, so Leech builds before or after them.
- What it costs: 1 point after Swarm 1; the same point could buy Horn 1. Leech makes the swarm a place to stand in; Horn makes it a place to shoot from — a fork either way.
- The count runs only when a hit lands (no per-tick cost for a player who is not in a crowd).

## Acceptance criteria
- [ ] The Hive tab in the talents panel shows Leech under Swarm, next to Horn, with its text.
- [ ] With 3+ enemies within 80 of you, every hit you land heals 1 hp (rank 1); with 1 or 2 within 80, hits heal nothing.
- [ ] Rank 3: 3 hp per hit, and the heal never takes you above max hp.
- [ ] Walk out of the cluster: your next hit heals nothing, even if the last hit landed inside it.
- [ ] A Hive player standing in a dense swarm of Dots watches its hp climb (the wound collar shrinks) while it keeps the crowd off with Horn or Bolt.
- [ ] The count includes other players, not only monsters.
- [ ] Bots with Leech behave the same in a 60-player match.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit | Ricochet bounces a bolt on to another enemy; Leech heals you on a hit while the crowd is on you |
| Reckless | an on-hit that pays on a state | Reckless pays while you are hurt with double damage; Leech pays while 3+ enemies are around you with heal |
| Chill | an on-hit | Chill slows the target; Leech only affects you |
| Reap | an on-hit that reads a state | Reap reads the target's hp; Leech reads how crowded you are |
| Swarm | an on-hit that counts nearby enemies | Swarm scales your damage by the crowd around the target; Leech scales your heal by the crowd around you, with any weapon |
| Mend | an on-hit that heals you | Mend heals on a Nerve hit per missing hp; Leech heals on any hit while 3+ are within 80 of you |
| Cling | an on-hit tied to a weapon's hits | Cling makes a Goo splat on and ride its target; Leech is your own sustain in a crowd |
| Chomp | a heal on a kill | Chomp heals a fixed 5 hp (25 on a player) per kill; Leech heals per hit while the crowd is on you, with any weapon |

## Design (architect, desktop)

### Files
- create `src/content/upgrades/leech.ts` - the Leech on-hit upgrade (heal while the crowd is on you)
- edit `src/content/upgrades/index.ts` - one import line + one list line
- edit `src/content/talents/hive.ts` - one talent line

### Interfaces
No new types. Reuse, all verified in `engine/api.ts`:
- `onHit(ctx, me, level, hit)` on `UpgradeDef` (line 366); `hit: { target: Unit; damage: number; x; y; projectile?; area? }` (`Hit`, line 243).
- `ctx.unitsNear(x, y, radius): Unit[]` (line 263) — returns every unit, including `me`; each has `.alive`.
- `ctx.heal(target, amount)` (line 270) — already caps at `maxHp` and no-ops on dead targets (`engine/sim/match.ts:1128`), so no manual clamp.
- `Shape` values: `'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'star'`.

### Steps
1. Create `src/content/upgrades/leech.ts` (copy `swarm.ts`'s shape exactly):
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive mod, works with every weapon: while the crowd is on you, every hit you land heals you. */
export const leech: UpgradeDef = {
  id: 'leech',
  name: 'Leech',
  description: 'While 3+ enemies are within 80 of you, your hits heal 1 hp. Per rank: +1 hp.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.purple },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble in flight) are not hits
    let crowd = 0;
    for (const u of ctx.unitsNear(me.x, me.y, 80))
      if (u.alive && u !== me) crowd++;
    if (crowd >= 3) ctx.heal(me, level);
  },
};
```
2. In `src/content/upgrades/index.ts`: add `import { leech } from './leech.ts';` between the `lance` and `lob` imports (alphabetical). In `UPGRADES`, add `leech,` on its own line right after `swarm,` (the Hive on-hits sit together).
3. In `src/content/talents/hive.ts`: add exactly this line after the `horn` line (so the panel draws Leech under Swarm, next to Horn):
```ts
    { id: 'leech', upgrade: 'leech', max: 3, needs: [['swarm', 1]] },
```

### Pitfalls
- `ctx.unitsNear` returns `me` too — the `u !== me` check is required, or you always count one phantom neighbor (Swarm's idiom, centered on `me` instead of `hit.target`).
- Count is recomputed inside `onHit` at each hit — no `mem`, no `slots`, no per-tick work; "walk out, next hit heals nothing" falls out for free. Do not add any state.
- `ctx.heal` caps at maxHp internally; do not add a `me.maxHp` clamp (Chomp doesn't either).
- The `hit.damage <= 0` guard matches Swarm: the Goo bubble's in-flight touch must not heal.
- The task says "before T0076's Nest and Sting land" — they are already in `hive.ts` (lines 13–14). Do not touch or reorder them; just insert the leech line. No dependency on T0076.
- `look.shape` must stay `'diamond'` (Swarm=hexagon, Horn=triangle, Mend=star, Chomp=pentagon are all taken in/near this tree).
- No `ctx.rng`, no `Math.random`, no client code — this is a server-only on-hit; nothing changes on screen (acceptance says the heal just reads as hp returning).

### Tests
- None (no pure helpers; the engine tests run the upgrade in a real match and check the talent line automatically).

## Result (attempt 1, inet-racing)

Added Leech, a third-rank on-hit upgrade in the Hive tree that heals the attacker 1–3 hp per hit (per rank) while 3+ other enemies are within 80 of them, working with every weapon and area; it's a sustain fork off Swarm 1 alongside Horn, so a Hive life can stand in the crowd and chew through it. Files: new `src/content/upgrades/leech.ts`, one import + one list line in `src/content/upgrades/index.ts`, and one talent line in `src/content/talents/hive.ts`.

- Self-review: APPROVE
- Time: 9.9 min

```
projects/draft-arena/game/src/content/talents/hive.ts  |  1 +
 .../draft-arena/game/src/content/upgrades/index.ts     |  2 ++
 .../draft-arena/game/src/content/upgrades/leech.ts     | 18 ++++++++++++++++++
 3 files changed, 21 insertions(+)
```
