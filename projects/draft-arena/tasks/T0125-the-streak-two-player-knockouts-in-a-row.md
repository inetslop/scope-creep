---
id: T0125
title: "The streak: two player knockouts in a row wear a golden sash that pays +1 coin per kill"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T21:05:07Z
epic: E29
---

## Goal
Momentum pays: a player who knocks out two players within 20 s wears a golden sash, and every kill pays +1 coin for 15 s — winning a duel in a row is a visible badge, a coin engine, and a target the whole field can see.

## Details
- A new permanent-rule director, "The streak" (crown/price class, not one of the 6 field events), watching player knockouts in `onKill`, with per-killer state in its `mem`.
- The chain, per killer: a knockout whose victim is a player (human or bot) counts for the killer. The first counted knockout starts the chain; a second within 20 s of the first puts the killer on the streak; each further knockout within 20 s of the last counted one keeps the chain alive. A knockout of the killer ends their chain and removes the sash at once; a prestige does the same (the life is over).
- The sash: a diagonal golden band about 0.18 r wide from the left shoulder to the right hip, with a small golden five-point star (like the level-up ring's stars) at the middle of the band, ink-outlined, drawn on the body the way the prestige-stars are drawn on the critter — a new critter-riding area, with the tier in `slots[0]` (0 = none, 1 = gold now, 2 = green, used by a later task). It shows on every player, human and bot alike, synced on a 1-second pulse the way the prestige-stars refresh. Not a collar: it is a band across the body, clear of the crown (head), the mark (ring) and the wound (collar arc).
- The pay: while a killer's sash shows, every kill by that killer — monster or player — pays +1 coin on top of Kill coins' own pay, via `ctx.giveCoins`; humans only, bots wear the sash but earn nothing, exactly like Kill coins. The pay is read by the existing coin chip and coin tick; no new HUD, no new sound in this task.
- Timers: a 20 s chain window measured from the last counted knockout; a 15 s sash timer refreshed by each counted knockout. When the sash timer runs out the sash is removed; the chain still lives if the next counted knockout comes within 20 s of the last one.
- With 6 (a human among bots): a solo player who knocks out two bots in a row wears the sash and banks a few bonus coins while farming — a gentle moment in a quiet match. With 60: a real duel chain makes the sash a visible "go after this one" target, and breaking a streaker's chain is a reason of its own to hunt.
- Coin math: a new player +1–5 coins per match; a good player in a full match +10–25 coins across two to four streaks — a bonus on top of Kill coins, never the main source.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a director putting things on the field | drops gems around a player; the streak puts nothing on the ground — its marker rides on the body and its pay is a coin |
| Prestige ring | plays a field effect at a player | plays once per prestige; the streak's moment comes from a chain of kills and then pays coins |
| Prestige stars | a marker on the body, synced by a tick | a record of the life that grows per prestige and never moves; the sash is a live state that appears, refreshes and dies with the chain, and it pays |
| Gem geyser | gives a place to hold | a spot on the ground worth defending; the streak is a state of the wearer (a chain of kills) worth holding, with no spot at all |
| Jackpot | a prize in the field | a prize you go to; the streak is a prize that comes to the one who just earned it and is worn by them |
| Kill coins | pays coins per kill, humans only | pays every kill the same; the streak pays a bonus only while the killer is on a chain and wears a badge while it does |
| The corpse pays | reacts to a player's death | drops a gem at the death spot for anyone to take; the streak ends the dead player's chain and counts the kill toward the killer's |
| The crown | a marker on a player, moved by a tick | marks a position (the top scorer), moves on overtake, and pays the one who takes it; the streak marks an action (your kills in a row), stays on its earner, and pays them |
| The mark | a status on a player for 15 s from onKill | picked by chance, makes the wearer faster, and pays whoever breaks them; the streak is earned by the wearer, changes no body, and pays the wearer |
| The price | onKill, reacts to a player knockout | turns the killer into a target for everyone via the mark; the streak turns a chained killer into a payer for themselves, with the target being whoever breaks the chain |
| Growth | a per-player body change on a tick | passive with level, pays nothing; the streak is reactive to kills and pays a coin |
| Prestige pays | gives coins per player | once per prestige, scaled by the life number; the streak pays per kill, scaled by the chain, mid-life only |
| Prestige point | banks a reward per prestige | banks the draft currency (a talent point); the streak pays the shop's currency (a coin) |
| Prestige feast | lays pickups where a player is | lays a ring of gems on the ground; the streak lays nothing on the ground |
| Swarm surge | a director on a tick | spawns a crowd of monsters; the streak spawns nothing and only changes who pays what |
| Gem rush | lays a line of pickups to race | a race against other players for a pickup; the streak's race is against the wearer's own last-kill clock |

## Acceptance criteria
- [ ] A second player knockout within 20 s of the first puts a golden sash on the killer — a diagonal gold band with a chest star, ink-outlined — and it stays 15 s, refreshed on each further knockout within 20 s of the last.
- [ ] A first knockout alone shows no sash; a knockout after the 20 s window starts a new chain instead of extending one.
- [ ] While the sash shows, every monster kill and player knockout by that player pays +1 coin on top of the normal Kill coins; the coin chip ticks and the coin tick plays on your own kills.
- [ ] Being knocked out (or prestiging) removes the sash and breaks the chain: the next streak needs two fresh player knockouts.
- [ ] A bot on a streak wears the sash visibly and earns nothing; the sash never appears on a monster.

## Design (architect, desktop)

### Files
- create `src/content/statuses/streak-gold.ts` — the golden sash: a status with its own `draw()` (a critter-riding marker must be a status, not an area — areas trail behind the client's interpolated position). One status per tier, the same pattern as `prestige-1/2/3`: this file is the gold tier; T0126 will add `streak-green.ts`.
- create `src/content/directors/streak.ts` — the permanent-rule director "The streak": chain tracking in `mem`, sash kept on in `tick`, bonus coins in `onKill`, chain reset in `onPrestige`.
- edit `src/content/statuses/index.ts` — one import + one array line, next to `marked`.
- edit `src/content/directors/index.ts` — one import + one array line, next to `price`.

### Interfaces
```ts
// src/content/statuses/streak-gold.ts
export const streakGold: StatusDef = {
  id: 'streak-gold',
  name: 'On a streak',
  color: PALETTE.yellow,
  draw(g, v) {
    const r = v.radius;
    g.save();
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.clip();
    g.rotate(-Math.PI / 4); // top of the strip -> top-left (left shoulder), bottom -> bottom-right (right hip)
    const w = r * 0.18;
    g.fillStyle = v.ink;
    g.fillRect(-(w / 2) - 2, -r, w + 4, 2 * r); // 2 px ink rim on each edge
    g.fillStyle = PALETTE.yellow;
    g.fillRect(-w / 2, -r, w, 2 * r);
    g.restore();
    const s = 5 * (1 + 0.06 * Math.sin(v.time * Math.PI * 2)); // chest star, pulsing once a second
    g.beginPath();
    traceShape(g, 'star', s, 0);
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.lineWidth = 2;
    g.lineJoin = 'round';
    g.strokeStyle = v.ink;
    g.stroke();
  },
};
// imports: { traceShape, type StatusDef } from '../../../engine/api.ts'; { PALETTE } from '../palette.ts';

// src/content/directors/streak.ts  — imports: { type DirectorDef } from '../../../engine/api.ts';
const WINDOW = 20; // s between counted knockouts that keep the chain alive
const SASH = 15; // s the sash shows, refreshed by every counted knockout
const BONUS = 1; // coins per kill while the sash shows (humans only, like Kill coins)
export const streak: DirectorDef = {
  id: 'streak',
  name: 'The streak',
  description: 'Two player knockouts within 20 s wear a golden sash for 15 s; every kill while it shows pays +1 coin.',
  tick(ctx, mem) {
    for (const p of ctx.players()) if ((mem[`s${p.id}`] ?? 0) > ctx.time) ctx.addStatus(p, 'streak-gold', 0.2);
  },
  onKill(ctx, mem, killer, victim) {
    const t = ctx.time;
    if (killer && !killer.bot && (mem[`s${killer.id}`] ?? 0) > t) ctx.giveCoins(killer, BONUS);
    if (victim.type !== 'player') return;
    mem[`c${victim.id}`] = 0;
    mem[`w${victim.id}`] = 0;
    mem[`s${victim.id}`] = 0;
    if (!killer) return;
    const chain = mem[`c${killer.id}`] ?? 0;
    const n = chain > 0 && t - (mem[`w${killer.id}`] ?? 0) <= WINDOW ? chain + 1 : 1;
    mem[`c${killer.id}`] = n;
    mem[`w${killer.id}`] = t;
    if (n >= 2) mem[`s${killer.id}`] = t + SASH;
  },
  onPrestige(ctx, mem, player) {
    mem[`c${player.id}`] = 0;
    mem[`w${player.id}`] = 0;
    mem[`s${player.id}`] = 0;
  },
};
```
`mem` keys per player: `c<id>` knockouts in the current chain (this is the tier: 2 = gold now, ≥3 = green for T0126), `w<id>` time of the last counted knockout, `s<id>` sash expiry (0 = no sash).

### Steps
1. Create `src/content/statuses/streak-gold.ts` exactly as above.
2. In `src/content/statuses/index.ts`: add `import { streakGold } from './streak-gold.ts';` directly after the `marked` import (line 12), and `streakGold,` directly after `marked,` in `STATUSES` (line 25). Nothing else.
3. Create `src/content/directors/streak.ts` exactly as above.
4. In `src/content/directors/index.ts`: add `import { streak } from './streak.ts';` directly after the `price` import (line 9), and `streak,` directly after `price,` in `DIRECTORS` (line 30). Nothing else.
5. Run `npm run check`.

### Pitfalls
- **Not an area, and no `slots[0]`.** A marker on a creature must be a status with its own `draw()` (areas are drawn where the server last saw them — they trail). A status `draw(g, v)` receives only `StatusView` (radius, top, color, ink, time, seed) — it cannot read entity slots, so the tier cannot live in `slots[0]`. The tier is the director's chain count, expressed as the status id (`streak-gold` now; T0126 adds `streak-green` and switches the one `addStatus` line in `tick`). Do not write to `p.slots`.
- **Rotate sign is `-Math.PI / 4`.** Canvas y points down: `+Math.PI / 4` would give the other diagonal (bottom-left to top-right). Verify the band runs top-left → bottom-right.
- **Pay before you update the chain** in `onKill`: the second knockout (the one that puts the sash on) must not pay for itself. The bonus check reads `s<killer>` before the chain update.
- **Break the victim's chain before the `if (!killer) return;`** — a player killed by monsters must lose the sash too.
- Bots: `addStatus` in `tick` is for every player (bots wear it); `giveCoins` is gated on `!killer.bot` (bots earn nothing).
- `giveCoins` alone drives the coin chip and the coin tick (both read the player's coin count) — no effect, no HUD, no sound to add.
- `draw` runs on every client every frame: only `v.*` and `PALETTE`, no `Math.random`/`Date`/`performance`; wrap nothing, just don't throw.
- The star's side tip may graze the inner corner of an eye — intentional: the star is a separate sticker drawn over the body with its own 2 px ink outline (one outline per sticker; the band's rim and the star never cross inside one sticker).

### Tests
- none (no pure helpers; engine/tests/ checks registration, one-item-per-file, valid data, draw functions in a real match, and the 60-player budget automatically).
