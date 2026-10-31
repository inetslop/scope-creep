---
id: T0058
title: "Fang: kills pay extra coins while you are below half hp"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T11:14:52Z
claimed_at: 2026-10-31T11:31:42Z
finished_at: 2026-10-31T11:39:35Z
epic: E15
---

## Goal
The Frenzy tree's first fork under Nerve: a coin branch, so a thin-and-mean life that lives below half hp can feed the shop while it fights.

## Details
- A new on-kill upgrade "Fang" in the Frenzy tree: a new file in src/content/upgrades/ (registered in its index) plus its talent line in src/content/talents/frenzy.ts.
- Talent line: id fang, upgrade fang, max 2, needs [["nerve", 2]]. The tree as the panel will draw it (T0059 adds Mend under Nerve the same way; add only the Fang line):
  ```
  Frenzy (3)
    Nerve (3, needs Frenzy 1)
      Adrenaline (2, needs Nerve 2)
      Fang (2, needs Nerve 2)
      Reckless (1, needs Nerve 3, Frenzy 3)
  ```
- Text: "On a kill while below half your hp: +2 coins. Per rank: +2 more." maxLevel 2. Look: shape circle, color yellow (#ffd43b) — the coin's own look.
- While the player who owns it is below half hp, each kill credits 2 extra coins per rank (rank 2: 4) on top of the normal kill coins (1 per monster, the victim's level per player knockout), landing in the profile the same way a kill coin lands.
- A kill is a kill: it pays on a kill by any weapon — Bolt, Maw's bite, Lob's splash, Goo (including Cling splat, Chew puddle and Scatter mini-Goo kills), Nerve's jab — the same kill that pays the normal coin.
- It stacks with Adrenaline: the same kill below half hp can sprint and pay.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | an on-kill payout for every weapon | Chomp heals flat hp (5, 25 on a player) on every kill; Fang pays coins, and only while you are below half hp |
| Adrenaline | a kill while below half hp | Adrenaline buys a 1.5–2 s speed burst; Fang buys coins that last between visits, and both can fire on the same kill |
| Fuse | a kill reaction | Fuse only fires on a bubble kill and spends the kill on a damage ring; Fang fires on any kill and pays coins |
| Scatter | a kill reaction | Scatter needs a Goo kill and spends it on 4 seekers; Fang pays on any kill and spends nothing |
| Gush | a Goo kill | Gush marks the ground with a slow puddle; Fang pays coins wherever the kill comes from |
| Chew | a Goo kill on the Gush puddle | Chew makes the puddle bite; Fang pays coins and leaves the puddle alone |

## Acceptance criteria
- [ ] The panel's Frenzy tab shows Fang under Nerve with its text, 2 ranks, needing Nerve 2.
- [ ] A player with Fang 1 at or above half hp kills a monster: only the normal kill coin lands.
- [ ] The same player below half hp kills a monster: the normal coin plus 2 extra land, the coin pop and tick playing as for the kill; with Fang 2, 4 extra.
- [ ] A Fang coin lands on a kill by any weapon, including a splash or a puddle kill.
- [ ] The extra coins show in the start card's balance on the next visit.

## Design (architect, yoga)

### Files
- create `src/content/upgrades/fang.ts` — the Fang `UpgradeDef` (on-kill coin payer, copy the shape of `adrenaline.ts`):
  ```ts
  import type { UpgradeDef } from '../../../engine/api.ts';
  import { PALETTE } from '../palette.ts';

  /** Fang: while below half hp, a kill pays 2 extra coins per rank. */
  export const fang: UpgradeDef = {
    id: 'fang',
    name: 'Fang',
    description: 'On a kill while below half your hp: +2 coins. Per rank: +2 more.',
    maxLevel: 2,
    look: { shape: 'circle', color: PALETTE.yellow },
    onKill(ctx, me, level, victim) {
      if (me.hp < me.maxHp * 0.5) {
        ctx.giveCoins(me, 2 * level);
        ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, 2 * level);
      }
    },
  };
  ```
- edit `src/content/upgrades/index.ts` — add `import { fang } from './fang.ts';` (after the `chomp` import, before `frenzy`, keeping alpha order) and one line `fang,` in `UPGRADES` right after `adrenaline,` (line 43).
- edit `src/content/talents/frenzy.ts` — insert one line after the `adrenaline` line: `{ id: 'fang', upgrade: 'fang', max: 2, needs: [['nerve', 2]] },`

### Interfaces
No new types. Uses existing: `UpgradeDef.onKill(ctx, me, level, victim)` (engine calls it after every death credited to the player, from any weapon/source), `ctx.giveCoins(player, amount)`, `ctx.effect(effectId, a, b?, value?)`. `PALETTE.yellow` is `#ffd43b`.

### Steps
1. Create `src/content/upgrades/fang.ts` exactly as above.
2. Register it in `src/content/upgrades/index.ts` (import + one line after `adrenaline`).
3. Add the talent line in `src/content/talents/frenzy.ts` after the `adrenaline` line.
4. `npm run check`.

### Pitfalls
- No `victim.type` branch: Fang must pay on knockouts too (same credited kill that pays the normal coin).
- `giveCoins` and the effect amount are `2 * level` (2 at rank 1, 4 at rank 2) — not `level`.
- Effect is the existing `'coin'` effect (one pop per coin, 0.05 s apart = the tick) at the victim's position, exactly as `directors/kill-coins.ts` plays it.
- Do not touch `directors/kill-coins.ts` — the normal coin and Fang stack from the same kill.
- Bots get no coins (`giveCoins` no-ops on bots); no guard needed, as in `adrenaline.ts`.
- Insertion points in both shared files are next to `adrenaline` (its tree sibling), keeping registry line order.

### Tests
- none (content is tested automatically by engine/tests/: upgrade in a tree, talent needs/ranks, on-kill in a real match).

## Result (attempt 1, yoga)

Added the Fang on-kill upgrade — a coin branch under Nerve in the Frenzy tree. A new file `src/content/upgrades/fang.ts` (registered in `UPGRADES` right after `adrenaline`, import in alpha order) that pays 2 extra coins per rank via `ctx.giveCoins` plus a `coin` effect at the victim's position on any credited kill (monster or knockout, any weapon) while the killer is below half hp; stacks with the normal kill coins and Adrenaline. Its talent line sits after `adrenaline` in `src/content/talents/frenzy.ts` (max 2, needs Nerve 2), so the panel draws it as Nerve's coin fork. `npm run check` (95 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 7.9 min

```
projects/draft-arena/game/src/content/talents/frenzy.ts |  1 +
 projects/draft-arena/game/src/content/upgrades/fang.ts  | 17 +++++++++++++++++
 projects/draft-arena/game/src/content/upgrades/index.ts |  2 ++
 3 files changed, 20 insertions(+)
```
