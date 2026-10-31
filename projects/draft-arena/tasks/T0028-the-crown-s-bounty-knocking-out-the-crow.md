---
id: T0028
title: "The crown's bounty: knocking out the crowned player pays double the bounty xp"
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T05:50:41Z
claimed_at: 2026-10-31T06:00:12Z
epic: E4
designer: yoga
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
