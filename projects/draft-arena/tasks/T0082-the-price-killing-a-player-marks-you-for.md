---
id: T0082
title: "The price: killing a player marks you for 15 s"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-31T14:05:22Z
claimed_at: 2026-10-31T15:25:28Z
epic: E19
---

## Goal
A player kill isn't free: the killer wears the mark for 15 s, so every knockout starts a short revenge hunt on the one who did it — the real threat gets a cost, and escaping after a kill is a decision.

## Details
- A new permanent-rule director in src/content/directors/ (one new file, registered in the directors index), in the same class as the crown and kill coins — not one of the 6 timed field events, so the event cap is untouched. It gets a `name` and a `description` for planning (players never read them), e.g. "Whoever knocks out a player wears the mark for 15 s; the mark pays out as usual."
- On a player knockout (a player kills a player): apply the existing `marked` status to the killer for 15 s. If the killer is already marked (the event's mark or an earlier kill's), the kill refreshes the 15 s instead of stacking.
- The mark behaves exactly as it does today for whoever wears it: +35% move speed while marked, the red target ring (the `mark` area) 12 units above the marked player's head, and the mark bonus — 20 xp and 5 coins — for whoever knocks out the marked player. The bonus must pay for any marked player, whether the mark came from the event or from a kill, and one knockout pays it at most once. If the mark director's payout only covers the mark it placed itself, share the payout so marks from both directors pay it once.
- Bots count: a bot that knocks out a player is marked the same way, and knocking out a marked bot pays the bonus.
- What the player sees: no new look — the existing red ring and the speed. The player feels it the moment they land a kill: their critter gets a ring, gets faster, and is worth 20 xp + 5 coins extra to everyone for 15 s. A personal alert sound is a separate task (T0084).
- At 6 players (mostly bots): the mark is mostly the +35% speed, and a risk only when another human is around. At 60: every kill opens a 15 s window in which anyone can trade a plain knockout for the bonus one.

## Acceptance criteria
- [ ] A player who knocks out another player gets the red target ring above their head and +35% move speed, and both end 15 s later.
- [ ] A kill while already marked refreshes the 15 s; the mark never stacks (no second ring, no extra speed).
- [ ] Whoever knocks out a marked player gets the mark bonus (20 xp + 5 coins), whether the mark came from the event or from a kill; one knockout pays the bonus at most once.
- [ ] A bot that knocks out a player is marked the same way, and knocking out a marked bot pays the bonus.
- [ ] The director is a new file in src/content/directors/ with a name and description, registered in the directors index; the mark director still marks a random player every 90 s, unchanged otherwise.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | both put something on the field that players react to | the rain drops gems around a player; the price marks the killer themselves as the target |
| Prestige ring | both are a field spectacle of a moment | the ring shows where a prestige happened; the price makes a player worth hunting for 15 s |
| Prestige stars | both are a mark on a critter | the stars are a passive record of past prestiges; the price is a temporary, payoff-carrying target |
| Gem geyser | both create something worth fighting over | the geyser is a spot to hold; the price is a person to chase |
| Jackpot | both make players converge on one thing | the jackpot is a gem in the middle of the field; the price is the killer, wherever they run |
| Kill coins | both pay on a kill | kill coins pay the killer of the first kill; the price puts a risk on the killer and pays the second kill |
| The crown | both make one player a target that pays more | the crown is a permanent rank marker only the leader can wear; the price is a temporary kill marker anyone can wear |
| The mark | same status, same ring, same bonus | the mark is random and falls on a victim; the price is triggered by a kill and falls on the killer — the one who just gained becomes the one who risks |
| The wound | both are a ring on a critter | the wound shows damage taken; the price shows a kill made |
| Prestige pays | both pay a player after a life event | prestige pays coins for reaching level 18; the price pays for knocking out whoever just killed |
| Prestige point | both grant a player something after an event | prestige banks a talent point; the price grants a target ring and a bounty window |
| Swarm surge | both change where players want to be | the surge sends a line of Dots in; the price sends players after the killer |
| Gem rush | both start a race | the race is for a line of gems; the price's race is for a marked player |

## Design (architect, desktop)

### Files
- create `src/content/directors/price.ts` — the "The price" permanent-rule director: a player knockout marks the killer for 15 s with the existing `marked` status and `mark` ring, and pays the mark bonus for marks it placed itself (sharing the payout with `directors/mark.ts` so one knockout pays at most once).
- edit `src/content/directors/index.ts` — one import line + one `DIRECTORS` line (exact spots in Steps).
- edit `src/content/statuses/marked.ts` — add `maxStacks: 32` (one line): the stack count becomes an observable channel so the price director can tell "the event also marked this player" from "my own kills refreshed the mark". The status is still one instance, still 1.35× speed, still one ring — behavior unchanged.

### Interfaces
No new types; the new item is a `DirectorDef` (reuse `DirectorDef` from `engine/api.ts`, exactly like `mark.ts`). Its `mem` (a `Record<string, number>`, starts empty) uses five fields:
- `mem.claim` — id of the player this director marked (0 = none); `mem.until` — its expiry in `ctx.time`; `mem.apps` — how many times this director itself applied `marked` for the current claim.
- `mem.evId` — id of the player the event marked (0 = none); `mem.evUntil` — the event mark's expiry in `ctx.time` (always exactly the mark director's own expiry, see Pitfalls).
Verified engine facts the design relies on: directors' `tick`/`onKill` run in `DIRECTORS` array order (`engine/sim/match.ts:697-717`); `addStatus` refreshes `left = max(left, seconds)` and bumps `stacks` capped at `maxStacks` (`match.ts:1132-1141`); `statusOf(u, id)` returns stacks, 0 = none; simulation is fixed 20 ticks/s (`TICK_DT = 1/20`, so 15 s is exactly 300 ticks and `time = tick * TICK_DT`); `onKill`'s `killer` is `Player | undefined` (a bot is a `Player`; `undefined` = no player credit, e.g. monster kill).

### Steps
1. Create `src/content/directors/price.ts` with exactly this content (copy `mark.ts`'s structure; the coordination logic in comments is load-bearing, keep it):

```ts
import type { DirectorDef, Player } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

const DURATION = 15; // same as the event's mark: a full 15 s window, refreshed by every kill
const RING = 26; // the ring's radius, and the pop/burst size (areas/mark.ts)
const BONUS_XP = 20;
const BONUS_COINS = 5;

/**
 * The price: a player knockout marks the killer for 15 s - the same 'marked' status and the
 * same 'mark' ring as the event (directors/mark.ts), so it pays the same bonus. A kill while
 * marked refreshes the 15 s instead of stacking it (addStatus never stacks past one instance).
 * The two directors never pay the same knockout: a mark the event placed and a kill refreshed
 * stays the event's until its own 15 s run out (my tick runs right after the mark director's
 * in the same frame, so evUntil is its exact expiry), and if the event picks over a mark I
 * placed, the status's stacks rise past my own applications and I hand the mark to the mark
 * director, which then owns the ring and the payout.
 */
export const price: DirectorDef = {
  id: 'price',
  name: 'The price',
  description: 'Whoever knocks out a player wears the mark for 15 s; the mark pays out as usual.',
  tick(ctx, mem) {
    // My mark ran out: pop the ring where it was.
    if (mem.until && ctx.time >= mem.until) {
      const gone = ctx.playerById(mem.claim);
      mem.claim = 0;
      mem.until = 0;
      mem.apps = 0;
      if (gone) ctx.effect('pop', spot(gone), undefined, RING);
    }
    // The event's mark: a marked player who is not mine; remember it the tick it lands.
    let ev: Player | undefined;
    for (const p of ctx.players()) {
      if (p.id !== mem.claim && ctx.statusOf(p, 'marked') > 0) {
        ev = p;
        break;
      }
    }
    if (ev) {
      if (mem.evId !== ev.id) {
        mem.evId = ev.id;
        mem.evUntil = ctx.time + DURATION;
      }
    } else if (mem.evId && mem.evId !== mem.claim) {
      mem.evId = 0;
      mem.evUntil = 0;
    }
    // The event picked over my marked player: the mark director now keeps the ring and pays
    // until its own expiry (its refresh is the latest), so hand the mark to it.
    if (mem.claim) {
      const claimed = ctx.playerById(mem.claim);
      if (claimed && ctx.statusOf(claimed, 'marked') > (mem.apps ?? 0) + (mem.evId === mem.claim ? 1 : 0)) {
        mem.evId = mem.claim;
        mem.evUntil = ctx.time + DURATION;
        mem.claim = 0;
        mem.until = 0;
        mem.apps = 0;
      }
    }
    // Keep the ring over my marked player (the area is short-lived; re-fire it every tick).
    if (mem.until && ctx.time < mem.until) {
      const target = ctx.playerById(mem.claim);
      if (target) ctx.area(target, 'mark');
    }
  },
  onKill(ctx, mem, killer, victim) {
    // My marked player is knocked out: end my mark on them, and pay the bonus unless the
    // event's mark is the one on them (the mark director pays that one, ring burst included).
    if (victim.type === 'player' && mem.claim && mem.claim === victim.id) {
      const shared = mem.evId === victim.id && ctx.time <= mem.evUntil;
      mem.claim = 0;
      mem.until = 0;
      mem.apps = 0;
      if (!shared) {
        if (killer) {
          ctx.giveXp(killer, BONUS_XP);
          ctx.giveCoins(killer, BONUS_COINS);
          ctx.effect('burst', spot(victim), undefined, RING);
        } else {
          ctx.effect('pop', spot(victim), undefined, RING);
        }
      }
    }
    // A player knockout marks the killer (bots included); a kill while marked refreshes it.
    if (victim.type === 'player' && killer) {
      ctx.addStatus(killer, 'marked', DURATION);
      if (mem.claim === killer.id) mem.apps = (mem.apps ?? 0) + 1;
      else {
        mem.claim = killer.id;
        mem.apps = 1;
      }
      mem.until = ctx.time + DURATION;
    }
  },
};

/** The ring's spot: 12 units above the head (the top of the body is at y = -radius). */
function spot(u: { x: number; y: number }) {
  return { x: u.x, y: u.y - (RULES.player.radius + 12) };
}
```

2. Edit `src/content/directors/index.ts`: add `import { price } from './price.ts';` on the line after `import { mark } from './mark.ts';` (line 8), and add `  price,` on the line after `  mark,` in `DIRECTORS` (line 25). The array position matters (Pitfall 1).
3. Edit `src/content/statuses/marked.ts`: replace its two lines with
`/** The mark: +35% move speed for 15 s, nothing else. The red target ring around the marked player. maxStacks counts how often the mark was applied (read by the price director, directors/price.ts); it is one instance, never stacked. */`
`export const marked: StatusDef = { id: 'marked', name: 'Marked', color: PALETTE.red, speedMul: 1.35, maxStacks: 32 };`
4. Do not touch `src/content/directors/mark.ts` or anything else. Run `npm run check` and `npm run smoke`.

### Pitfalls
- `price` must stay AFTER `mark` in `DIRECTORS`: its tick must run right after the mark director's in the same frame — that is what makes `evUntil` (observation + 15) equal the mark director's expiry exactly, and with 20 ticks/s and 15 s on the tick grid, `ctx.time <= mem.evUntil` splits the payout with no overlap and no gap. Moving the line breaks "pays at most once".
- The `p.id !== mem.claim` exclusion in the observation loop is required: without it, a pure kill-mark would be misfiled as an event mark and its bonus would be lost.
- `mem` starts empty: keep the truthy guards (`mem.until &&`, `mem.claim &&`) and `?? 0` (same idiom as `mark.ts`'s `mem.next ?? FIRST`). A hook that throws disables the director and fails the tests.
- `ctx.playerById` returns undefined for dead players — keep the guards before `ctx.effect`/`ctx.area`.
- Re-fire the `mark` area every tick (life 0.15 s). While both directors mark the same player two identical rings overlap exactly — that is fine; add no new look, effect, HUD or sound (the alert sound is T0084).
- No randomness anywhere in this director; no `Math.random`/`Date` (lint-enforced).
- Known negligible edge, do not chase: if the event re-picks a player >90 s after its last pick while that player still wears a repeatedly-refreshed kill-mark (needs a 6+ kill spree while hunted), the hand-off can miss and one bonus may double or drop.

### Tests
- none (no pure helpers in `src/`; `engine/tests/` already checks the file/registry layout, valid data, and runs every director in a 3-minute match).

## Attempt 1 failed (asus)

Runner error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at d0cd6eca8b09d23c58353266a37aa51da4dee392 but expected c0160ab61636f96c5bb556e51d365741aeee9552


```
Error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at d0cd6eca8b09d23c58353266a37aa51da4dee392 but expected c0160ab61636f96c5bb556e51d365741aeee9552

    at Git.fetch (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/git.ts:134:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async integrate (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:260:5)
    at async runDevTask (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:144:21)
    at async main (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/runner.ts:154:9)
```
