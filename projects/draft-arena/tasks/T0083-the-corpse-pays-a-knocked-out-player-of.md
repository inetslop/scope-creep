---
id: T0083
title: "The corpse pays: a knocked-out player of level 4 or higher drops a gem worth their level"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T14:05:22Z
claimed_at: 2026-10-31T14:23:11Z
epic: E19
designer: desktop
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
