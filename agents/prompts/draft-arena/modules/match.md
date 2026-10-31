---
summary: the match (its rules and numbers: spawning, xp and levels, knockouts, fighting players, score, bots). Read before writing or editing any task that tunes a number or adds or changes a rule.
content: rules.ts
---
# The match

One match per server that never ends: players join and leave whenever they like, up to 60, and bots fill it to `bots.fillTo` players. A level gives a talent point (planning/modules/talents.md). A player who is knocked out comes back after `respawnSeconds` at level 1, with no talents but the nomad's Bolt and a score of 0: the scoreboard is about one life.

Every number is in src/content/rules.ts (listed below with its real value):
- **world:** the field's size in world units. A screen shows about 1250x700 of it.
- **player:** hp, speed (units per second), radius, pickup range (gems this close fly to you), regen (hp per second).
- **xp:** `first` is the xp from level 1 to 2; every level after needs `growth` times more.
- **spawn:** every `every` seconds, each player wants `base + perLevel x level` monsters within `maxDistance` of them (at most `max`), and gets up to `burst` more, spawned off-screen between `minDistance` and `maxDistance`, mostly ahead of where they move. Monsters left behind further than `relocateDistance` from everyone move ahead again. `maxMonsters` caps the whole field.
- **monsterHpPerLevel:** a monster's hp grows by this much per level of the player it spawned around (0.12: a level 11 player's monsters have 2.2 times the hp).
- **pvp:** players deal `damageMul` of their damage to players; knocking a player out gives `bountyXpPerLevel` xp per level of theirs.
- **score:** points per monster kill and per player knockout.
- **bots:** how many players bots fill the match to, and their names.

## The bar for a rule or a tuning
- **A real choice.** A new rule is not the mirror or the inverse of one that exists, has stakes bigger than a few xp or a few seconds, and is something a player would miss if it were gone.
- **It works with 6 players and with 60.** Most matches are a few people and bots: say what the rule does in both.
- **It keeps the game's game:** monsters in crowds to grow on, and other players as the real threat. Nothing that lets a player skip either.
- **What needs the engine** is not a task: rounds, a winner or a shrinking zone, a field that grows with the player count, a leaderboard that lasts between matches, new inputs. Those go to IDEAS.md under "Needs the engine".

## A task that tunes a number or changes a rule
- The field, its value now and its new value, and what the player will feel (sooner, harder, more often).
- For a rule: when it applies, what the player sees when it does, and what it does with 6 players and with 60.

## Not in this game
The owner removed these. Don't propose them again, or anything that works the same way.
- Two ways to play (online, and practice with bots): there is one Play button and one match; bots fill it to 6.
