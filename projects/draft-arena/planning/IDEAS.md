# Ideas

The backlog: add freely, turn the best into epics and tasks.

## Content
- Gem rush field event (E3): a line of 12 gems crosses the field over 6 s; whoever touches one collects the rest, so players chase the line across each other. — T0011
- Leader pressure (E4): the top score wears a crown mark on its critter; knocking the leader out drops a gem worth the leader's level. — T0013, T0014, T0015
- Leader bounty x2 (E4): knocking out the crowned player gives double the bounty xp (8 per their level instead of 4) — the pressure on the leader, since the crown's own damage can't change. — T0028
- Crown fall (E4): when the crowned player is knocked out, the crown flies off their head and pops into confetti where the leader fell — the knockout is a moment the whole field sees, and the ring marks where the gem landed. — T0036
- Snail (E2): a slow orange blob that leaves sticky patches behind (small fields that slow what walks over them for 2 s); a crowd turns the floor into a maze.
- Prestige medal (E7): a small medal accessory, buyable only after 2 prestiges in all — the wearable that marks the long goal. — T0026
- Slush (E7): after your first prestige this life, the Lobber tree opens a new talent, Slush: a blob that lands and leaves a slow puddle — a zone weapon only a player who has prestiged can build, so the second life grows into a control build. — T0025
- Swarm surge (E3): every 90 s, a ring of 12 Dots marches in from the field's edge toward its centre over 8 s — stand still in the middle and it closes on you, stay on the edge and it walks past. A reason to keep moving on a quiet field. — T0010 (built as a single-file line crossing to the centre instead, so it stays dodgable)
- Prestige coin (E7): the Nth prestige this life pays 25 x N coins (the engine knows only prestiges this life; a knockout resets the count) — a coin engine for a life that resets often, pairs with the shop (E6). — T0029
- Prestige ring (E7): when a player prestiges, a yellow ring three times a level-up and confetti where they are — the players around them see it happen. — T0023
- Coins from events (E6): gems that field events drop (gem rain, gem rush, gem geyser) pay 1 coin each — the positions and races the events make pay in the long game too. — T0027
- Gem geyser (E3): every 120 s a spot marks itself with a 2 s bubble-up, then drops a Puff-worth gem (4 xp) every 1 s for 8 s — the only event that gives a place to hold and defend, not a prize to grab. — T0012
- Knockout coins (E6): a player knockout gives coins equal to the victim's level — coins come from the real threat, so the shop is paid for in fights, not just in monsters. — T0019
- Shop card (E6): the start card's coin line opens the shop: patterns on top, accessories in rows by slot, the preview critter wears what you point at, Buy spends coins, and an out-of-reach item is stamped with its price.
- Flee (E2): a small fast critter that runs from the nearest player; catch it for its gem — a crowd you chase, and it punishes a build that cannot close in. — T0020
- Goober tree (E8): a fourth playstyle — your Goo, a big blue drop that fires at the nearest enemy and turns in flight to catch it; with it, Reap (extra damage on a half-dead target, any weapon), Gush (a slow puddle where your Goo kills) and the Scatter capstone (a Goo kill pops into four seekers). — T0030
- Sleeper (E9): a deep pink rounded square that sleeps where it spawned; a player within 350 wakes it (eyes open 0.5 s first), it chases at 100 u/s, and it dozes off again after 10 s alone — a field of them is safe to cross, and camping a gem spot in one is a trap. — T0032
- Jackpot (E10): every 150 s one big yellow gem, worth 25 xp, drops in the middle of the field and stays 20 s — a prize you go to, and a fight over it that shakes the scoreboard. — T0033
- Bulwark (E9): a big slow tank with a bubble shield that eats the first 15 hits, then takes damage and its face turns scared — a front for a crowd, a target you have to crack first. — T0034
- The shop's long goal (E6): a 300-coin Chef Hat — the first thing that takes many matches, the top of the shop. — T0035
- Halves pattern (E6): a two-tone pattern — the top half of the body painted lighter than the player's own color, 50 coins — the third price step in the shop's patterns. — T0044
- Sound layer: a pop when a monster dies, a chime on a level-up, a coin tick in the shop — the game is quiet; sounds are the next juice. — E11
- Boing (E9): a deep red heart that crouches, then leaps to where you are going (a prediction of your run) — a straight-line kite no longer escapes it, and a hard direction change makes it leap past you. — T0037
- The mark (E10): every 90 s, one random player wears a red target ring for 15 s and runs 35% faster; knocking them out pays 20 bonus xp and 5 coins — the field turns from a farm into a hunt. — T0038
- Goober depth (E8): the 5th and 6th talent for the tree once it is proven (a Goo that sticks to its target, a Gush puddle that bites). — E12: T0042 (Cling), T0043 (Chew)

## Needs the engine (for the owner, not tasks)
- Timed rounds with a shrinking zone at the end (farm early, fight late), a round winner.
- An active ability on a button (dash, shield) with a touch control on phones.
- A leaderboard that lasts between matches (the server can submit scores itself, so they can be trusted).
- A world that grows and shrinks with the number of players.
- A kill feed and announcements on the HUD.
- A knockout card on the HUD (after you knock out a player: their name and the xp and score you got): the HUD cannot know who you knocked out or what you got — it knows only your own counters and the scoreboard (planning/modules/screen.md).
- A prestige coin based on prestiges in all: the profile's count is client-only; the server would need the profile's prestige count sent at join.
