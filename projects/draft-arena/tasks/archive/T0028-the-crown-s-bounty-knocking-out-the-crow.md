---
id: T0028
title: "The crown's bounty: knocking out the crowned player pays double the bounty xp"
assignee: yoga
size: S
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-31T05:50:41Z
claimed_at: 2026-10-31T07:17:57Z
finished_at: 2026-10-31T07:25:25Z
epic: E4
---

## Goal
The crown becomes worth hunting: the player who knocks out the top scorer gets double the usual bounty, so going after the crown is the match's biggest payoff.

## Details
- The crown director (src/content/directors/crown.ts — the closest example: its onKill already fires when the wearer dies) gains the bounty: when a crowned player is knocked out and the killer is a player (a bot counts as a player), the killer gets 4 xp per level of the victim on top of the normal bounty (rules.pvp.bountyXpPerLevel is 4 per level) — knocking the crown out pays 8 per level.
- A level-15 crown pays the killer 120 xp at once, on top of the level-15 gem (T0014) that anyone can race to where it falls.
- A monster killing the crowned player pays nothing extra; knocking out a non-crowned player pays the normal bounty, unchanged.
- Nothing new on screen: the crown already shows itself (the yellow crown), the knockout burst plays, and the killer sees the bounty in the xp bar. (An announcement or kill feed needs the engine.)
- With 6 players the crown is often one hot player or a bot, and the bounty makes switching from farming to hunting pay; with 60 it puts a price on the biggest whale in the match and is what sends a group at them.
- It does not change how the crown moves (strict overtake) or the leader's gem.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops a prize a player has to grab | pays the killer of one specific player, with no pickup to race for |
| The crown | is about the top scorer and their death | pays the person who takes the crown down; the crown only marks and moves |
| Swarm surge | runs the whole match on a schedule | reacts to a knockout instead of a timer, and changes whom players go after |
| Gem rush | a first-act grab pays | pays only the killer, instantly, on a player death |

## Acceptance criteria
- [ ] A player knocks out the crowned player: the killer's xp jumps by 8 per victim level (the normal 4 plus 4 more), visible in the xp bar and any level-up ring.
- [ ] A player knocks out a non-crowned player: the xp is exactly the normal bounty, unchanged.
- [ ] A monster kills the crowned player: no extra xp to anyone.
- [ ] A bot that knocks out the crowned player also gets the bounty xp.
- [ ] The crown still moves on a strict overtake; this task only adds xp to the killer.

## Design (architect, yoga)

### Files
- edit `src/content/directors/crown.ts` — `onKill` pays the crowned player's killer a bounty on top of the engine's normal pvp bounty; nothing else changes.

### Interfaces
No new types. Uses, all existing: `DirectorDef.onKill(ctx, mem, killer: Player | undefined, victim: Unit)`; `ctx.giveXp(player: Player, amount: number)` (engine/api.ts:282); `RULES.pvp.bountyXpPerLevel` (rules.ts:28, = 4); `mem.crown` = the wearer's player id (crown.ts:30-33); `victim.level` (Player, engine/api.ts:119).

### Steps
1. In `crown.ts`'s `onKill` (line 16-18), rename `_killer` to `killer` and make it exactly:

```ts
onKill(ctx, mem, killer, victim) {
  if (victim.type !== 'player') return;
  if (killer && mem.crown === victim.id) ctx.giveXp(killer, RULES.pvp.bountyXpPerLevel * victim.level);
  check(ctx, mem);
},
```

2. Stop. `RULES` is already imported (crown.ts:2). No registry, rules.ts, or other file changes; no screen text.
3. If T0014's gem-drop line has already landed in this same `onKill`, leave it untouched and keep the two new lines above the existing `check(ctx, mem);` call.

Why it meets the criteria: the engine still applies the normal pvp bounty (4/level) to a player killer; the new `giveXp` adds the same amount again, so a crowned victim at level L pays the killer 4L + 4L = 8L (level 15 → 120), through the engine's xp path so the xp bar and level-up ring show it. `killer` is undefined for a monster kill (DirectorDef: "killer is the player credited, if any") → no extra xp. A bot killer is a `Player`, so `giveXp` works on it. Non-crowned victims fail `mem.crown === victim.id` → normal bounty only. The guard runs before `check`, so it reads the pre-death wearer; `check` itself is untouched, so the crown still moves on strict overtake.

### Pitfalls
- Pay after the crown moved: `mem.crown === victim.id` must be tested before `check(ctx, mem)` (the snippet does).
- Do not touch the engine's normal bounty or `RULES.pvp.bountyXpPerLevel` — the extra is a separate `giveXp`.
- `victim` is `Unit`; narrow with `victim.type === 'player'` before using `victim.level`.
- Do not add an announcement/feed — none is required, and it needs the engine.

### Tests
none (the engine tests run every director's `onKill` in a real match and the smoke test plays it).

## Result (attempt 1, yoga)

T0028 done — the crown director's `onKill` (src/content/directors/crown.ts) now pays the killer of the crowned player an extra bounty of `RULES.pvp.bountyXpPerLevel * victim.level` via `ctx.giveXp`, on top of the engine's normal pvp bounty: knocking out the crown pays double (8 xp per victim level, 120 for a level-15 crown). The guard runs before `check`, so monster kills (no killer) and non-crowned victims get nothing extra, and the crown still moves on a strict overtake. No other files, registries, or screen changes.

- Self-review: APPROVE
- Time: 7.5 min

```
projects/draft-arena/game/src/content/directors/crown.ts | 6 ++++--
 1 file changed, 4 insertions(+), 2 deletions(-)
```
