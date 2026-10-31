---
id: T0110
title: "Scavenge: a Hive talent, a monster kill is worth xp per enemy around the corpse"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T18:10:25Z
claimed_at: 2026-10-31T18:30:58Z
epic: E23
---

## Goal
The Hive's crowd pays in the draft: a monster killed while the swarm is around the corpse is worth extra xp, so a Hive life that runs into the swarm banks talent points from the very kills it makes in the middle of it. This is the rebuilt Hive fork of E23 — the shield (Thicket, T0108) is not buildable, the crowd fork becomes the pay.

## Details
- A new on-kill upgrade `scavenge` in the Hive tree, a sibling fork with Leech under Swarm.
- Text (shown on the talent's row): "A monster kill is worth +1 xp per other living critter within 80 of the corpse (up to 3). Per rank: +1 more per neighbor."
- Talent line: id scavenge, upgrade scavenge, max 3, needs `[["swarm", 1]]`. No points commitment, no prestige gate — a fork picked at the 2nd point in the tree.
- The count is taken the moment the monster dies: other living critters (monsters and players alike) within 80 units of the corpse, up to 3. Rank 1 pays 1 xp per neighbor, rank 2 pays 2, rank 3 pays 3 (so a kill with 3 neighbors pays 3, 6 or 9 xp).
- The xp lands like any xp, with a small yellow star at the corpse (like the level-up ring's stars) so the pay is visible.
- Works with every weapon the Hive player has — the Horn's darts, a borrowed Maw bite, a bubble splash, any field: the kill counts once, no matter how many of your things hit the corpse.
- Player knockouts pay nothing: their bounty xp is theirs (the mark, the crown's bounty, the corpse gem are all unchanged).
- Works with 6 players (bots fill the field, the swarm is the neighbor) and with 60 (more crowded fields, more neighbors to count).
- look: shape star, color #ffd43b — the level's yellow, the talent that pays in levels.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a kill pays the killer | Chomp heals hp from any kill, always; Scavenge pays xp only while the corpse is crowded, so a kill alone is worth nothing extra |
| Adrenaline | a kill that pays under a condition | Adrenaline sprints while you are hurt; Scavenge pays while the crowd is around the corpse, at any hp |
| Fang | a kill that pays a currency under a condition | Fang pays coins while you are hurt; Scavenge pays xp while the corpse is crowded, and xp buys the draft Fang never touches |
| Fuse | a specific weapon's kill triggers a thing | Fuse pops a damage ring around a bubble kill; Scavenge works with every weapon and pays xp instead of damage |
| Scatter | a kill pops something at the corpse | Scatter turns a Goo kill into chasing mini-Goo; Scavenge pays the killer xp that scales with the neighbors |
| Gush | a Goo kill marks the corpse | Gush leaves a slow puddle to stand in; Scavenge is paid once at the kill and works with any weapon |
| Chew | the corpse's mark bites what stands in it | Chew damages what stands in the Gush puddle over time; Scavenge pays xp once at the kill and does not linger |
| Nest | a kill that pays more the more crowded the corpse is | Nest heals the killer from the crowd; Scavenge pays the same crowd in xp, so the swarm that feeds hp feeds the draft too, and both can stack on one kill |
| Sting | a kill in a crowded spot triggers | Sting bursts the corpse to damage its neighbors; Scavenge pays the killer xp instead — the burst stays the capstone, the pay is the fork |

The tree as the panel will draw it (Hive after this task):
```
Swarm (3)
  Horn (3, needs Swarm 1)
    Nest (3, needs Horn 2)
      Sting (1, needs Horn 3, Nest 2)
  Leech (3, needs Swarm 1)
  Scavenge (3, needs Swarm 1)
```
What a Hive player gets, and what it costs: 1–3 points under Swarm 1 (Swarm 1 is the tree's first point), where those points could buy Leech (the swarm feeds hp) or start the Horn (the swarm is your weapon). Scavenge is the third pull: the swarm pays the draft — a dense-swarm kill at rank 3 is worth 9 xp (about two thirds of a level), so a swarm fight banks a point or two in the life, and a Hive build chooses between healing, weapons and levels from the same crowd.

## Acceptance criteria
- [ ] The Talents panel's Hive tab shows Scavenge under Swarm, beside Leech, with its text and 3 ranks; it takes a point once Swarm 1 is bought.
- [ ] Killing a monster with 0, 2 and 4 other critters within 80 of the corpse pays 0, 2 and 3 xp at rank 1, and 0, 6 and 9 at rank 3.
- [ ] The kill counts once per death with any weapon (Horn darts included), the pay shows as a small yellow star at the corpse, and a player knockout pays no Scavenge xp.
- [ ] The rest of the tree, the mark, the crown and the corpse gem behave as before, and the game is working and playable.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/scavenge.ts` - the on-kill upgrade `scavenge` (xp per living critter near the corpse)
- create `src/content/effects/xp-star.ts` - the one-shot `xp-star` visual: small yellow stars rising off the corpse, one per xp paid
- edit `src/content/upgrades/index.ts` - one import line + one array line
- edit `src/content/effects/index.ts` - one import line + one array line
- edit `src/content/talents/hive.ts` - one talent line

### Interfaces
No new types. `scavenge` is an `UpgradeDef`, `xpStar` is an `EffectDef` (both from `engine/api.ts`, shapes `star` and helpers `traceShape`/`noise` exist).

`src/content/upgrades/scavenge.ts` (whole file):
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Scavenge: a monster kill pays xp per other living critter within 80 of the corpse (up to 3). */
export const scavenge: UpgradeDef = {
  id: 'scavenge',
  name: 'Scavenge',
  description: 'A monster kill is worth +1 xp per other living critter within 80 of the corpse (up to 3). Per rank: +1 more per neighbor.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.yellow },
  onKill(ctx, me, level, victim) {
    if (victim.type !== 'monster') return;
    const n = Math.min(3, ctx.unitsNear(victim.x, victim.y, 80).length);
    if (n > 0) {
      ctx.giveXp(me, level * n);
      ctx.effect('xp-star', { x: victim.x, y: victim.y }, undefined, level * n);
    }
  },
};
```
`src/content/effects/xp-star.ts` (whole file; copy of the coin effect's rhythm):
```ts
import { noise, traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const LIFE = 0.6;

/** Scavenge: one small yellow star rises off the corpse for every xp the kill paid. value: xp paid. */
export const xpStar: EffectDef = {
  id: 'xp-star',
  duration: 1,
  draw(g, fx) {
    const n = Math.max(1, Math.min(9, Math.round(fx.value) || 1));
    for (let i = 0; i < n; i++) {
      const a = fx.age - i * 0.04;
      if (a <= 0 || a >= LIFE) continue;
      const t = a / LIFE;
      const x = fx.ax + (noise(fx.seed, i) - 0.5) * 24;
      const y = fx.ay - 28 * t;
      g.globalAlpha = 1 - t;
      g.save();
      g.translate(x, y);
      g.beginPath();
      traceShape(g, 'star', 6, t * 3);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
  },
};
```

### Steps
1. Create `src/content/upgrades/scavenge.ts` exactly as above.
2. Create `src/content/effects/xp-star.ts` exactly as above.
3. `src/content/upgrades/index.ts`: add `import { scavenge } from './scavenge.ts';` after the `scatter` import (line 32, keeps the list alphabetical); add `scavenge,` as a new array line after `sting,` (line 69, with the other Hive upgrades).
4. `src/content/effects/index.ts`: add `import { xpStar } from './xp-star.ts';` after the `stingBurst` import (line 13); add `xpStar,` as a new array line after `stingBurst,` (line 25).
5. `src/content/talents/hive.ts`: add `{ id: 'scavenge', upgrade: 'scavenge', max: 3, needs: [['swarm', 1]] },` as a new line right after the `leech` line (line 13). No `points`, no `prestige`. Do not touch any other line.
6. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The `victim.type !== 'monster'` guard is required: `onKill` fires on player knockouts too, and those must pay nothing (the mark, crown and corpse gem stay as they are).
- Cap the neighbors first, then multiply: `level * Math.min(3, count)` — rank 3 with 4 neighbors pays 9, not 12.
- `ctx.unitsNear` counts living critters (monsters and players) like `nest.ts` does; do not filter it further and do not use `Math.random`/`Date` anywhere (lint).
- Effect `duration` must cover the last staggered star: 9 stars × 0.04 s stagger + 0.6 s life = 0.92 s < 1 s — don't shorten it.
- Keep each registry edit to exactly the two lines named; other machines are adding items to the same registries — lines added next to related entries merge by themselves.
- The talent panel shows the upgrade's `description` verbatim; keep it exactly as given (same length class as Nest's, fits both layouts).

### Tests
- none (no pure helpers; content is tested automatically by engine/tests/).
