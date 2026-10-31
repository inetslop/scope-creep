---
id: T0014
title: "Leader's gem: knocking out the crown drops a gem worth its level"
size: S
priority: 2
status: todo
depends_on: [T0013]
attempts: 0
created: 2026-10-31T03:34:39Z
epic: E4
---

## Goal
The crown's moment belongs to whoever wins it: when the crowned player is knocked out by another player, they drop a big gem worth their level, so a crown death turns into a scramble everyone can see.

## Details
- Extend the crown director from T0013 with its onKill hook (directors run after each death; gem-rain.ts is the closest example of a director dropping pickups). The pickup is the same gem monsters drop (rules.gem).
- When the crowned player is knocked out by another player (not by a monster), drop one gem at the death spot worth the leader's level in xp: a level-10 crown drops a 10-xp gem. A crowned player who dies to monsters drops nothing.
- The gem is the same green gem pickup monsters drop, drawn at the size of a Puff's gem (the biggest monster gem today) so it reads as worth fighting for. It obeys the normal pickup rules (flies to a player within pickup range; Magnet reaches it); nothing else is special.
- It is on top of the normal knockout rewards (bounty xp and score for the killer) — the gem is extra, for whoever picks it up.
- With 6 players: a player can knock out a crowned bot and take its gem. With 60: after a crown death, players usually race across each other for the gem while the killer stands exposed.

## Acceptance criteria
- [ ] When a crowned player is knocked out by another player, a green gem worth their level in xp drops at the death spot (check with a level-12 crown: a 12-xp gem).
- [ ] When a crowned player dies to monsters, no gem drops.
- [ ] The gem is picked up by the normal gem rules: it flies to a player within pickup range, and Magnet reaches it.
- [ ] A bot that knocks out the crown leaves a gem any player can take.

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/directors/crown.ts` — add the `onKill` hook to T0013's crown director def (the def and its registry line already exist; only the hook is added). No new file, no registry line, no new pickup.

### Interfaces
One property added to the existing def object, matching `DirectorDef.onKill` (engine/api.ts:438):
```ts
onKill(ctx: Ctx, mem: Record<string, number>, killer: Player | undefined, victim: Unit): void
```

### Steps
1. Open `src/content/directors/crown.ts` (T0013 builds first; this task runs after it). Its `tick` keeps the crowned player's id in the def's `mem` (a number; 0/absent = nobody) — that is the only state that knows who wears the crown at the death moment. Verify the exact key name (expected `crown`).
2. Add to the def, right after its `tick`, exactly:
```ts
onKill(ctx, mem, killer, victim) {
  if (!killer || victim.type !== 'player') return;
  if (mem.crown !== victim.id) return;
  ctx.dropPickup(ctx.rules.gem, victim.x, victim.y, victim.level);
},
```
If the key T0013 writes is not `crown`, use that key in the `mem.` check. `ctx.rules.gem` is the id of the standard gem pickup (rules.ts:24, same as monster drops); its `collect` (pickups/gem.ts) gives `value` xp, so `victim.level` = "worth the level in xp". The pickup then obeys all normal rules (fly-to within pickup range, Magnet, 30 s life).

### Pitfalls
- `victim.type !== 'player'` guard is mandatory: the director's `onKill` also fires for monster deaths (match.ts:749); monsters have no `level`.
- `!killer` guard: killer is `undefined` for monster kills and self-kills — those must drop nothing.
- Never recompute "top score" in the hook: by `onKill` the killer already has the kill score and the victim is dead (match.ts:756-768), before the crown's tick re-runs — only the crown def's own `mem` (set by its tick each tick, match.ts:372) says who was crowned.
- Don't touch `src/content/pickups/gem.ts` or its registry: the crown gem is the identical green diamond; only the value differs.
- Bots: `killer` is any credited player (bot or human) and the gem is a pickup, so "a bot that knocks out the crown leaves a gem any player can take" holds with no extra code.

### Tests
none (no pure helpers; the content is covered automatically by engine/tests/).
