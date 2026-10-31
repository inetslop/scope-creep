# Roadmap

Epics are the main work: one or two active at a time, each broken into playable slices (task ids once written). Content-only: anything that needs the engine changed goes to IDEAS.md under "Needs the engine".

## E1 New talent trees (done)
Goal: more playstyles. Today: Gunner (your Bolt) and Body (plain stats).
Done when: there are several trees, each a playstyle with its own weapon, its own shape, mods that help any weapon first, and a capstone behind a real commitment.
Breakdown:
- T0001 S — Lance: piercing bolts, a base fork in Gunner — done
- T0003 L — Lobber tree: a bubble that arcs in, a splash that marks the ground — done
- T0004 M — Chill: a hit that slows the target, a mod for any weapon — done
- T0006 S — Chomp: a Body capstone, heal on kill — done
- T0007 L — Maw: a bite that eats everything in front, the weapon for Body — done
- T0009 S — Hide: take less damage, a second fork under Vigor — done
Done: three trees (Gunner, Body, Lobber), each with its own weapon and a capstone.

## E2 Monster behaviors (done)
Goal: crowds that make you move differently. Today: Dot (it chases you) and Puff (it pops into Dots).
Done when: there are several monsters with behaviors of their own, each readable at a glance.
Breakdown:
- T0002 S — Puff: a purple pentagon that pops into three Dots on death — done
- T0005 M — Zippy: a pink triangle that winds up and dashes — done
- T0008 M — Snail: an orange hexagon that leaves sticky patches — done
- T0018 M — Spitter: an orange diamond that spits from a distance — done
- T0020 M — Flee: a red teardrop that runs from the nearest player — done
Done: seven monsters, every one with its own way to move.

## E3 Field events (done)
Goal: reasons to go somewhere on the field. Today: Gem rain. More events, built as directors (planning/modules/events.md).
Breakdown:
- T0010 M — Swarm surge: a line of calm Dots that crosses the field — done
- T0011 S — Gem rush: a line of 12 gems, first touch takes all — done
- T0012 S — Gem geyser: a spot that bubbles 8 gems, a position to hold — done
Done: four events, four reasons to move (a windfall, a threat, a race, a position); the 5th starts E10.

## E4 Pressure on the leader (done)
Goal: the top player is a target, and knocking them out pays. Built from events and the match's rules (planning/modules/events.md, match.md).
Done when: the leader is readable on the field, and knocking the crown out is the most rewarding moment of a life.
Ready: a director sees every player's score each tick and gets onKill after each player death (planning/modules/events.md); the pvp damage and bounty numbers are frozen in rules.ts — content adds its own drops and xp on top (T0015 proved there is no hook to change pvp damage).
Breakdown:
- T0013 M — The Crown: the top scorer wears a yellow crown, moves only on a strict overtake — done
- T0014 S — Leader's gem: a knocked-out crown drops a gem worth its level — done
- T0015 S — The leader pays: the crown takes 25% more damage from players — failed (the engine's pvp damage is frozen)
- T0028 S — The crown's bounty: the killer of the crown gets double the bounty xp — done
- T0036 S — Crown fall: the crown flies off and pops where the leader is knocked out — done
Done: the crown marks the leader, its fall is a moment the whole field sees, and knocking it out pays the most of any life.

## E5 Your own critter (done)
Goal: players make their critter theirs: they pick its color and put on a hat, and everyone in the match sees it.
Done when: before playing, a player can choose a color and a hat (a couple of each to start); the choice is kept for their next visit and shows on their critter for everyone.
Ready: the engine has what players wear (accessories, patterns), the color pick, the profile in the browser, and start-screen panels (src/menu/).
Breakdown:
- T0016 M — Your color: a card of the 10 colors, kept for the next visit — done
- T0017 M — Two starter hats: a Hats card, wear and take off — done
Done: a color and a hat, picked on the start screen, kept between visits, seen by everyone in the match.

## E6 Shop and coins (done)
Goal: something to play for across matches: players earn coins in the match and spend them in a shop on color patterns and accessories (hats and more).
Done when: coins are earned in play (how many, for what, is yours to design), kept between visits, shown where they are spent; the shop sells patterns and accessories with prices, and what a player buys is theirs to wear (E5).
Ready: coins in the profile, ctx.giveCoins for content, prices and buying, and the start-screen panels. Nothing gives coins yet and there is no shop panel (planning/modules/shop.md).
Breakdown:
- T0019 M — Coins from kills: one coin per monster, the victim's level per knockout, a coin pop, the balance on the start card — done
- T0021 M — First shop stock: two patterns, a face and a back accessory, priced — done
- T0022 M — The shop: a panel over the start screen that sells the stock, with a preview critter — done
- T0027 S — Coins from events: every gem an event drops pays 1 coin — done
- T0044 S — Halves: a two-tone pattern, 50 coins, the third pattern price step — done
- T0031 M — The shop's second stock: two patterns, a face and a back accessory, priced — done
- T0035 S — Chef Hat: a 300-coin head accessory, the shop's long goal — done
- T0046 S — Bloom: a 150-coin head accessory, a pink flower with a yellow center — done
Done: kills and events pay coins, the shop sells its stock, and the Chef Hat is the goal to save for.

## E7 Prestige (done)
Goal: nobody stays overpowered forever: a player who reaches level 18 prestiges back to level 1, and prestiging is worth it.
Done when: reaching level 18 sends a player back to level 1 and gives them something for it. What they gain is yours to design: it must make prestiging worth it without making them overpowered again.
Ready: the reset at level 18 works; the reward is content (a director's onPrestige, talents and wearables that need prestiges). Today a prestige gives nothing (planning/modules/prestige.md).
Breakdown:
- T0023 S — Prestige ring: a big yellow ring and confetti where a player prestiges — done
- T0024 M — The prestige pays (in all): the Nth prestige in all pays 25 x N coins — failed (the in-all count is client-only; see IDEAS)
- T0029 M — The prestige pays: the Nth prestige this life pays 25 x N coins, a 2 s card under the xp bar — done
- T0025 M — Slush: a Lobber talent that only opens after a prestige this life — done
- T0026 S — Medal: a back accessory, buyable only after 2 prestiges in all — done
- T0047 M — Prestige stars: a gold star on the critter per prestige this life, up to 3 — done
Done: the coin pays, Slush opens a second-life build, the stars mark the life, and the Medal is the long goal.

## E8 The Goober tree (done)
Goal: a fourth playstyle for the draft: a build whose weapon aims for you — your Goo turns in flight and catches the nearest enemy, while Gunner kites with straight Bolts, Lobber zones with bubbles and Body bites in front.
Done when: the Goober tree is in the panel with its finisher mod, its weapon, a fork and its capstone, each readable in a crowd.
Breakdown:
- T0030 L — Goober tree: Reap, a homing Goo, a Gush puddle, a Scatter capstone — done
Done: the tree is playable end to end; the 5th and 6th talents wait in IDEAS for a later cycle.

## E9 A bigger menagerie (done)
Goal: the crowd grows a 6th, then a 7th, way to move; each new monster readable at a glance.
Done when: the 7th monster is in the field with a behavior no other has (the 6th, the Sleeper, is already in).
Breakdown:
- T0032 M — Sleeper: a deep pink cushion that sleeps until you get close — done
- T0034 M — Bulwark: a deep red octagon whose bubble shield eats the first 15 hits — failed (monsters have no target-side hit hook)
- T0037 M — Boing: a deep red heart that crouches and leaps at where you are going — failed (the comparison table omitted the Sleeper; rebuilt as T0045)
- T0045 M — Boing: a deep red heart that crouches, then leaps to where you're going — failed
- T0048 M — Boing: a deep red heart that crouches, then leaps to where you're going — done
Done: eight monsters, every one with its own way to move (Boing crouches and leaps to where you're going).

## E10 More reasons to move (done)
Goal: a 5th, then a 6th, field event, so the field always has a new place to be (the cap is 6 events).
Done when: the 5th event runs on the field.
Breakdown:
- T0033 S — Jackpot: one big gem in the middle of the field, worth 25 xp — done
- T0038 M — The mark: a random player wears a red target for 15 s, the kill pays 20 xp and 5 coins — done
Done: six events, the cap — a windfall, a threat, a race, a position, a prize in the middle, and a marked hunt.

## E11 Sound (done)
Goal: the field is silent; every big moment gets a short candy sound, so a fight is readable by ear and the pops sound like the things that pop.
Done when: a monster pop, a level-up and a coin each have a sound, on desktop and mobile, quiet enough to sit under the action.
Breakdown:
- T0039 M — Pop: the first sound, the game's audio, a pop when a monster dies, pitched by its size — done
- T0040 S — Chime: a level-up chime — done
- T0041 S — Coin: a coin tick when a coin is picked up or spent — done
- T0049 S — Bonk: a deep thud when a player is knocked out — done
- T0050 S — Fanfare: a rising three-note fanfare when a player prestiges — done
- T0051 S — Toot: a party-horn toot when the crown flies off — done
Done: a pop, a level-up, a coin, a knockout, a prestige and a crown fall each have a sound.

## E12 The Goober grows (done)
Goal: the fourth tree deepens: under Goo it forks three ways — a Goo that sticks to its target, a Gush puddle that bites, and the scatter that exists — so a Goober life picks a direction instead of buying the same four talents.
Done when: the tree has six talents with a real fork under Goo, each readable in a crowd.
Breakdown:
- T0042 M — Cling: a Goo that splats on its target and rides it, damage every 0.5 s — done
- T0043 M — Chew: your Gush puddle deals damage to whatever stands in it — done
Done: the Goober fork is real — sticky, zone or scatter.

## E13 The Frenzy tree (done)
Goal: a fifth playstyle, thin and mean: Frenzy trades max HP for damage, and the more hurt a player is, the harder they hit — a life that wants to stay at half HP instead of playing safe.
Done when: the Frenzy tree is in the panel with its trade-off mod, its hurt-scaled jab, its low-HP sprint and its low-HP capstone, each readable in a crowd.
Breakdown:
- T0053 L — Frenzy tree: Frenzy, Nerve, Sprint, Reckless — failed (the engine can't express Sprint's below-half-hp per-rank speed; Adrenaline replaces it)
- T0054 L — Frenzy tree: Frenzy, Nerve, Adrenaline, Reckless — done
Done: the tree is in the panel — trade hp for damage, a hurt-scaled jab, a kill-sprint while hurt, a double-hit capstone.

## E14 A meaner menagerie (done)
Goal: the crowd gains a 9th, then a 10th, way to threaten you — monsters that make the kill itself a choice, each readable at a glance (the cap is 10 types).
Done when: the 9th monster is in the field with a behavior no other has.
Breakdown:
- T0055 M — Popper: a fat grinning red blob that pops a damaging puff when it dies — done
Done: nine monsters; the last slot waits in IDEAS for a behavior the nine don't have.

## E15 The Frenzy grows (done)
Goal: the fifth tree deepens: the hurt state the whole tree pays out on becomes visible on the field, and Nerve forks two ways — a coin branch and a sustain branch — so a Frenzy life picks a direction instead of buying the same four talents.
Done when: a hurt critter shows its wound on the field, and the tree has six talents with a real fork under Nerve.
Breakdown:
- T0057 M — The wound: a red collar arc around any critter below half hp — done
- T0058 S — Fang: kills pay extra coins while below half hp — done
- T0059 S — Mend: a Nerve hit heals the more hurt you are — done
Done: the wound reads the hurt state in a crowd, and Nerve forks — a coin branch, a heal branch, and the die-with-it capstone.

## E16 The Hive tree (active)
Goal: a sixth playstyle (the cap): a build that hits harder the more crowded the fight is — a hit scales with the enemies around its target, so a Hive life runs into the swarm instead of kiting it, where Gunner kites, Goober zones and Frenzy bleeds.
Done when: the Hive tree is in the panel with its crowd mod, its dart weapon, its crowd kill heal and its kill-burst capstone, each readable in a crowd.
Breakdown:
- T0060 L — Hive tree: Swarm, Horn, Nest, the Sting capstone — failed (the on-kill tables missed the Fang row)
- T0063 M — Hive, first slice: Swarm (hits grow with the crowd) and Horn (a fast teal dart) — failed (the on-hit table missed the Mend row)
- T0064 M — Hive, second slice: Nest (a kill-buff from crowd kills) and the Sting capstone — failed (a timed damage buff needs an engine change; Nest becomes a crowd-scaled kill heal)
- T0075 L — Hive, first slice: the tree, Swarm (hits grow with the crowd) and Horn (a fast teal dart) — todo
- T0076 M — Hive, second slice: Nest (a kill heal that grows with the crowd) and the Sting capstone — design (waits on T0075)
Next: a fifth talent that forks the tree (a Hive sustain or a Hive defense) once it proves out.

## E17 A deeper second life (active)
Goal: prestiging pays in the draft, not just in coins: each prestige this life banks a talent point, and a prestige-gated talent later opens in a second tree, the Slush way (planning/modules/prestige.md).
Done when: a prestige banks a point the player sees and spends, and a second tree has its own prestige-gated talent.
Breakdown:
- T0061 M — Prestige banks a point: +1 talent point per prestige this life, on the prestige card — in progress
- T0067 M — Cover: a fan of bolts behind you, a Gunner talent open after a prestige this life — design (waits on T0061)
Next: a second gated talent in another tree once Cover and the bank prove out.

## E18 The last slot (active)
Goal: the menagerie's 10th and final monster type — a way to threaten no other monster has, so the crowd's ceiling is full.
Done when: the 10th monster is in the field with a behavior no other has, readable at a glance.
Breakdown:
- T0066 L — Brood: a purple sac that keeps birthing Dots while it lives — in progress
Next: the menagerie is full at 10 types; the crowd deepens through the trees that learn to fight it.
