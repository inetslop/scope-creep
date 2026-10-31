---
id: T0132
title: "The double knot: a second feud between the same pair wears a second knot and pays double"
size: M
priority: 2
status: todo
depends_on: [T0130]
attempts: 0
created: 2026-10-31T22:29:04Z
epic: E30
---

## Goal
A feud that restarts between the same two players this match is a bigger deal — they wear a second, smaller knot, and whoever ends that repeat feud is paid double, so a rivalry that keeps coming back becomes the most valuable target on the field.

## Details
- In `src/content/directors/grudge.ts`, count how many times each pair has formed a feud this match: a new `mem` entry `count:<a>:<b>` (a < b), incremented in the same branch that forms a feud (next to `setGrudge`). Once a pair's count reaches 2 they are a double feud for the rest of the match (the count never resets within a match; a new match starts fresh).
- The double knot: a new status `src/content/statuses/grudge-knot-2.ts`, registered in `src/content/statuses/index.ts`, modeled on `grudge-knot.ts` (T0130) — a second, smaller candy-red ribbon knot (about 0.6x the first) pinned just outside and below the first knot at the top-left, still clear of the eyes, the crown, the prestige stars and the name. The grudge director's `tick` adds `grudge-knot-2` (same 0.2 s refresh) to each player whose feud partner is a double feud, alongside the usual `grudge-knot`; both knots come off together when the feud pays.
- The double pay: in the payoff branch of `onKill`, if the pair's `count` is 2 or more, pay double — +30 xp and +10 coins instead of +15 xp and +5 (a bot killer still gets no coins).
- What a player sees: when the same pair feuds a second time, a second smaller knot appears beside the first on both critters — the field tells a double feud (two knots) from a single one (one knot) at a glance. Ending a double feud pays double and both knots come off.
- With 6 players: a human and a bot can become a double feud; a human ending it gets +30 xp and no coins land in the bot's profile. With 60: many double feuds at once; the state is still one count per pair and one extra small knot per feuding player.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| The grudge (T0130) | the red knot on both feuding players, paid on the ending knockout | the single grudge is one feud with one knot and a flat pay; the double knot is the same pair's repeat feud — a second knot and a doubled pay |
| The crown | a mark on the critter that moves and pays on a pvp knockout | the crown follows the top score of everyone; the double knot marks one pair's repeated duel and pays whichever of the two ends it |
| The mark | a timed target whose knockout pays a bonus | the mark is a random 15 s; the double knot is earned by two players feuding twice and lasts until it pays |

## Acceptance criteria
- [ ] When a pair forms a feud a second time this match, a second, smaller red knot appears beside the first on both critters; a first-time feud shows only the single knot.
- [ ] The next knockout between a double-feuding pair pays the killer +30 xp and +10 coins (a bot killer gets the xp, no coins), and both knots come off.
- [ ] A pair that has feuded twice stays a double feud for the rest of the match; a new match starts with no counts.
- [ ] The double knot never covers the eyes, the crown, the prestige stars or the name, and reads at a glance in a crowd as "two knots" versus "one knot".
- [ ] A monster knockout still clears nothing: a double-feuding player knocked out by a monster comes back still wearing both knots.

## Design (architect, desktop)

### Files
- create `src/content/statuses/grudge-knot-2.ts` - `StatusDef` `grudgeKnot2` (id `grudge-knot-2`): a second, smaller candy-red ribbon knot, 0.6x the first, pinned just outside and below the first knot at the top-left of the head
- edit `src/content/statuses/index.ts` - one import line for `grudgeKnot2` and one line in `STATUSES`, both next to T0130's `grudgeKnot` line
- edit `src/content/directors/grudge.ts` - three local insertions: per-pair feud count on formation, `grudge-knot-2` refresh in `tick`, doubled payoff in `onKill`

### Interfaces
No engine or shared types change. The new item:

```ts
// src/content/statuses/grudge-knot-2.ts  (copy the file's structure of statuses/crowned.ts)
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const grudgeKnot2: StatusDef = {
  id: 'grudge-knot-2',
  name: 'Double knot',
  color: /* the exact same color expression grudge-knot.ts uses in its def */,
  draw(g, v) { /* see Steps 2-3 */ },
};
```

No `speedMul`, no `tick`, no `above` (the second knot sits *below* the first, so it adds no height for the name — the first knot's `above` already lifts the name).

### Steps
1. **Read first (T0130 has landed by then):** `src/content/statuses/grudge-knot.ts` in full, and `src/content/directors/grudge.ts` in full. From the knot's `draw` note three things: (a) the knot's centre `(cx, cy)` in terms of `v` (a `g.translate(cx, cy)` or the coordinates' centre), (b) `K` = half the knot's drawn width (its size expression, e.g. `7` or `0.3 * v.radius`), (c) the exact color/stroke/fill code for the ribbon.
2. **Create `src/content/statuses/grudge-knot-2.ts`** as the template above. Its `draw` is the first knot's ribbon path with exactly this frame around it:
   ```ts
   draw(g, v) {
     const K = /* (b) from step 1 */;
     g.save();
     g.translate(/* (a) cx */ - 0.4 * K, /* (a) cy */ + 1.5 * K); // just outside and below the first knot
     g.scale(0.6, 0.6);
     /* the ribbon path copied verbatim from grudge-knot.ts, written around (0, 0):
        if the original translated to (cx, cy) first, drop that translate — the centre is now the origin. */
     g.restore();
   }
   ```
   If the original path never translates and uses absolute coordinates, rewrite each coordinate as `original - (cx, cy)` so the path is centred, then the frame above. Same ink (`v.ink`), same one-outline ribbon construction as the first knot; the 0.6 scale shrinks the lineWidth with it.
3. **Register:** in `src/content/statuses/index.ts` add `import { grudgeKnot2 } from './grudge-knot-2.ts';` beside T0130's `grudgeKnot` import, and `grudgeKnot2,` beside `grudgeKnot,` in `STATUSES`.
4. **Edit `src/content/directors/grudge.ts`, formation only:** in `setGrudge` (the function that records a pair when a feud forms), right after the pair is recorded in `mem`, add (rename `a`/`b` to the function's actual player parameters):
   ```ts
   const lo = a.id < b.id ? a.id : b.id;
   const hi = a.id < b.id ? b.id : a.id;
   mem[`count:${lo}:${hi}`] = (mem[`count:${lo}:${hi}`] ?? 0) + 1;
   ```
5. **Edit `tick`:** where each feuding player `p` gets `ctx.addStatus(p, 'grudge-knot', 0.2)`, add immediately after (both players of the pair are in scope in that loop):
   ```ts
   const lo = p.id < q.id ? p.id : q.id;   // q = the partner in the loop
   const hi = p.id < q.id ? q.id : p.id;
   if ((mem[`count:${lo}:${hi}`] ?? 0) >= 2) ctx.addStatus(p, 'grudge-knot-2', 0.2);
   ```
   (Reuse the loop's existing pair variables/keys if it already computes them.)
6. **Edit the `onKill` payoff branch:** where the feud-ending kill pays +15 xp and +5 coins, add before those two calls:
   ```ts
   const double = (mem[`count:${lo}:${hi}`] ?? 0) >= 2;
   ```
   and make the two calls `ctx.giveXp(killer, double ? 30 : 15);` and `ctx.giveCoins(killer, double ? 10 : 5);` — if the numbers are named constants there (e.g. `PAY_XP`, `PAY_COINS`), use `double ? PAY_XP * 2 : PAY_XP` / `double ? PAY_COINS * 2 : PAY_COINS` instead. Do not touch any other payoff or effect lines.
7. Run `npm run check` then `npm run smoke`.

### Pitfalls
- **Key order:** always store/read the count with `lo < hi`; a swapped key means the second formation is counted under a new key and the pair never becomes double.
- **Never reset the count:** no deletion of `count:<a>:<b>` anywhere — not on payoff, not on death, not on respawn. Once ≥ 2 it stays double for the whole match; `mem` is fresh per match, so new matches start clean automatically.
- **Both knots come off by expiry:** when the feud pays, `tick` stops re-adding *both* statuses and the 0.2 s refreshes lapse — do not add any removal code, and do not make a monster kill clear the pair (a monster kill leaves `killer` undefined; the feuding player must come back still wearing both knots).
- **Eyes clearance:** the second knot's bottom edge (`cy + 1.5K + 0.6K`) must stay above the eye band (roughly `y ≥ -0.4 * v.radius`, i.e. more negative). If it dips into the eyes at the smallest player size, reduce the vertical offset to `+1.3 * K`. It must also stay left of the crown (top-centre, |x| ≤ 13) and clear of the prestige stars (top-right) and the name (above).
- **Draw hygiene:** `g.save()`/`g.restore()` around the whole draw; only `v.*` values; no `Math.random`, no `Date`, no state; the transform is scaled so the outline stays one ink stroke per knot.
- **Minimal edits to `grudge.ts`:** T0130 just landed and T0131 may touch it next — insert only the lines above, no reformatting, no renames.
- `ctx.giveCoins` already pays bots nothing — do not add a bot check.

### Tests
none — no pure helpers in `src/`; engine/tests covers the status draw, the director in a real match and the 60-player budget.
