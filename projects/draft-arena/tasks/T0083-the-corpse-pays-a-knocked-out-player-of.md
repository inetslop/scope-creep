---
id: T0083
title: "The corpse pays: a knocked-out player of level 4 or higher drops a gem worth their level"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T14:05:22Z
claimed_at: 2026-10-31T15:37:56Z
finished_at: 2026-10-31T15:43:49Z
epic: E19
---

## Goal
A corpse is a pickup: a knocked-out player of level 4 or higher drops a gem worth their level in xp where they fell, so every midgame knockout starts a pickup fight anyone can join — and the leader's gem (T0014) folds into it: one in, one out.

## Details
- A new permanent-rule director in src/content/directors/ (one new file, registered in the directors index), in the same class as kill coins — not one of the 6 timed field events, so the event cap is untouched. It gets a `name` and a `description` for planning, e.g. "A knocked-out player of level 4 or higher drops a gem worth their level where they fell."
- On any player knockout (killed by a player or by the crowd): if the victim was level 4 or higher, drop one standard green gem pickup worth the victim's level in xp at the death spot. A level 1-3 corpse drops nothing.
- The gem is the standard `gem` pickup: same look, same lifetime, same pickup range (it flies to whoever is in range). It pays xp only — no coin, because kill coins already pay the killer the victim's level in coins.
- One in, one out: the crown director stops dropping its own leader's gem — a crowned player's death now drops the same level-worth gem as anyone else's, because the corpse rule covers it. The crown keeps everything else: the crown itself, the double bounty on its fall, and the crown fall.
- What the player sees: the existing death burst, plus a green gem popping where the body burst. The dead can't take it (they respawn at level 1), so the killer — or a third party — runs for it.
- At 6: the killer or a nearby bot usually takes it, so the kill simply pays more (a level-12 life: 48 xp bounty + 12 coins, now plus a 12 xp gem). At 60: midgame corpses are a steady stream of contestable gems, and a third party can steal the gem from the killer.

## Acceptance criteria
- [ ] A player knocked out at level 4 or higher drops exactly one green gem worth their level in xp at the death spot; a level 1-3 knockout drops nothing.
- [ ] The gem behaves like the standard gem (same look, lifetime, pickup range) and pays xp only — no coin on pickup.
- [ ] The crown director no longer drops a separate leader's gem: a crowned player's death drops the same level-worth gem as any other's, and the crown's double bounty and the crown fall are unchanged.
- [ ] The director is a new file in src/content/directors/ with a name and description, registered in the directors index; the standard gem, the kill-coins director and the mark are otherwise unchanged.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | both drop gems players fight over | the rain drops a ring of gems around a random player; the corpse pays in one gem where a life ended, worth that life |
| Prestige ring | both react to a life milestone on the field | the ring is a spectacle; the corpse is a pickup anyone can carry off |
| Prestige stars | both mark a player's life | the stars decorate a living player; the corpse pays out a dead one |
| Gem geyser | both create a place worth holding | the geyser is a spot that keeps paying; the corpse is a one-shot prize at a death spot |
| Jackpot | both are a gem worth going for | the jackpot is one big gem in the middle for everyone; the corpse is a gem at a specific death, worth the victim's level |
| Kill coins | both pay on a player knockout | kill coins go straight to the killer in coins; the corpse is an xp pickup anyone — including a third party — can steal |
| The crown | the crown's fall already dropped a gem worth the leader's level | the corpse pays on every level-4+ death, not just the leader's — the crown's own gem folds into it |
| The mark | both revolve around a player knockout | the mark is a target ring and a kill bonus; the corpse is the pickup the knockout leaves behind |
| The wound | both show on a hurt or dead critter | the wound is a collar on the living; the corpse drops only on a knockout |
| Prestige pays | both pay a player after a life event | prestige pays coins to the player who reached 18; the corpse pays xp to whoever collects the dead |
| Prestige point | both grant something after an event | prestige banks a talent point; the corpse drops a field pickup |
| Swarm surge | both put more on the field | the surge adds Dots to dodge; the corpse adds a gem to contest |
| Gem rush | both start a race for gems | the race is for a line of twelve; the corpse is one gem worth a life, dropped by the fight itself |

## Design (architect, desktop)

### Files
- create `src/content/directors/corpse.ts` — permanent-rule director "The corpse pays": on any player knockout at level 4+, drop one standard `gem` worth the victim's level in xp at the death spot
- edit `src/content/directors/index.ts` — import `corpse` and add it to `DIRECTORS`, both next to `killCoins`
- edit `src/content/directors/crown.ts` — delete the one line `ctx.dropPickup('event-gem', victim.x, victim.y, victim.level);` (line 21) so the corpse rule covers the leader's gem too

### Interfaces
No new types. The new file exports:

```ts
import type { DirectorDef } from '../../../engine/api.ts';

const MIN_LEVEL = 4;

/**
 * The corpse pays: a knocked-out player of level 4 or higher (human or bot) drops the standard
 * gem (pickups/gem.ts) worth their level in xp where they fell - a pickup fight anyone can join;
 * a level 1-3 corpse drops nothing. Pays xp only: kill coins already pay the killer the
 * victim's level in coins.
 */
export const corpse: DirectorDef = {
  id: 'corpse',
  name: 'The corpse pays',
  description: 'A knocked-out player of level 4 or higher drops a gem worth their level where they fell.',
  onKill(ctx, _mem, _killer, victim) {
    if (victim.type !== 'player' || victim.level < MIN_LEVEL) return;
    ctx.dropPickup('gem', victim.x, victim.y, victim.level);
  },
};
```

That is the complete file, exactly as written.

### Steps
1. Create `src/content/directors/corpse.ts` with exactly the code above.
2. In `src/content/directors/index.ts`: add `import { corpse } from './corpse.ts';` directly after the `import { killCoins } ...` line, and add `corpse,` directly after `killCoins,` in the `DIRECTORS` array.
3. In `src/content/directors/crown.ts`: delete only the `ctx.dropPickup('event-gem', victim.x, victim.y, victim.level);` line inside `onKill`. Keep the `crown-fall` effect, the `RULES.pvp.bountyXpPerLevel * victim.level` bounty, and the `check(ctx, mem)` call. Do not change the doc comment, `name` or `description`.
4. Run `npm run check`.

### Pitfalls
- Do NOT add a `victim.bot` check. kill-coins skips bot victims only because coins land in a profile and "bots get none"; this gem is xp for whoever collects it, and the task says "any player knockout (killed by a player or by the crowd)" — bots included (the task even expects "the killer or a nearby bot" to take it).
- Use the pickup id `'gem'`, never `'event-gem'`: event-gem is the yellow star that also pays 1 coin; the task requires the standard green xp-only gem (same look, lifetime, pickup range come for free from `pickups/gem.ts`).
- Keep the `victim.type !== 'player'` guard — `onKill` also fires for monster deaths (`Unit` victim); `victim.level` only exists on `Player` (narrowing works, as in crown.ts).
- Unused parameters take the `_` prefix (`_mem`, `_killer`) exactly like kill-coins; import only `DirectorDef` (not `Ctx`) or lint flags the unused import.
- In crown.ts, remove exactly one line — the double bounty and crown-fall must remain unchanged; `victim.level` is still used by the bounty so no import goes unused.
- No new effect, HUD or menu: the dropped pickup is the visible gem; the death burst already plays from `rules.effects.playerDeath`.

### Tests
- none (no pure helpers; engine/tests/ validates the director and exercises it in matches)

## Result (attempt 1, cachyos-x8664)

Added a new `corpse` director in `src/content/directors/corpse.ts` ("The corpse pays") that, on any player knockout at level 4+, drops one standard green `gem` pickup worth the victim's level in xp at the death spot (level 1–3 drops nothing); the gem is xp-only via the existing `pickups/gem.ts`. Registered it in `src/content/directors/index.ts` (import and `DIRECTORS` entry, both next to `killCoins`), and removed the crown's separate leader-gem line in `crown.ts` so a crowned player's death now drops the same level-worth gem through the corpse rule (the crown keeps its fall effect and double bounty). `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 5.9 min

```
.../draft-arena/game/src/content/directors/corpse.ts  | 19 +++++++++++++++++++
 .../draft-arena/game/src/content/directors/crown.ts   |  1 -
 .../draft-arena/game/src/content/directors/index.ts   |  2 ++
 3 files changed, 21 insertions(+), 1 deletion(-)
```
