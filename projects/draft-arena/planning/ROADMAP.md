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

## E2 Monster behaviors (tasked)
Goal: crowds that make you move differently. Today: Dot (it chases you) and Puff (it pops into Dots).
Done when: there are several monsters with behaviors of their own, each readable at a glance.
Breakdown:
- T0002 S — Puff: a purple pentagon that pops into three Dots on death — done
- T0005 M — Zippy: a pink triangle that winds up and dashes — done
- T0008 M — Snail: an orange hexagon that leaves sticky patches — done
- T0018 M — Spitter: an orange diamond that spits from a distance — done
- T0020 M — Flee: a red teardrop that runs from the nearest player — design
Next: done once T0020 builds: every monster has its own way to move.

## E3 Field events (done)
Goal: reasons to go somewhere on the field. Today: Gem rain. More events, built as directors (planning/modules/events.md).
Breakdown:
- T0010 M — Swarm surge: a line of calm Dots that crosses the field — done
- T0011 S — Gem rush: a line of 12 gems, first touch takes all — done
- T0012 S — Gem geyser: a spot that bubbles 8 gems, a position to hold — done
Done: four events, four reasons to move (a windfall, a threat, a race, a position); the 5th starts E10.

## E4 Pressure on the leader (active)
Goal: the top player is a target, and knocking them out pays. Built from events and the match's rules (planning/modules/events.md, match.md).
Done when: the leader is readable on the field, and knocking the crown out is the most rewarding moment of a life.
Ready: a director sees every player's score each tick and gets onKill after each player death (planning/modules/events.md); the pvp damage and bounty numbers are frozen in rules.ts — content adds its own drops and xp on top (T0015 proved there is no hook to change pvp damage).
Breakdown:
- T0013 M — The Crown: the top scorer wears a yellow crown, moves only on a strict overtake — done
- T0014 S — Leader's gem: a knocked-out crown drops a gem worth its level — todo
- T0015 S — The leader pays: the crown takes 25% more damage from players — failed (the engine's pvp damage is frozen)
- T0028 S — The crown's bounty: the killer of the crown gets double the bounty xp — todo
- T0036 S — Crown fall: the crown flies off and pops where the leader is knocked out — todo
Next: done once T0014, T0028 and T0036 build: the leader's gem makes the knockout a race, the bounty makes it pay, and the crown falling is a moment everyone sees.

## E5 Your own critter (tasked)
Goal: players make their critter theirs: they pick its color and put on a hat, and everyone in the match sees it.
Done when: before playing, a player can choose a color and a hat (a couple of each to start); the choice is kept for their next visit and shows on their critter for everyone.
Ready: the engine has what players wear (accessories in src/content/accessories/, patterns), the color pick, the profile in the browser, and start-screen panels (src/menu/). Nothing is built on it yet: no accessories, no patterns, no panels (planning/modules/accessories.md, patterns.md, shop.md).
Breakdown:
- T0016 M — Your color: a card of the 10 colors, kept for the next visit — done
- T0017 M — Two starter hats: a Hats card, wear and take off — building
Next: done once T0016 and T0017 build: a color and a hat, picked on the start screen, kept between visits, seen by everyone in the match.

## E6 Shop and coins (active)
Goal: something to play for across matches: players earn coins in the match and spend them in a shop on color patterns and accessories (hats and more).
Done when: coins are earned in play (how many, for what, is yours to design), kept between visits, shown where they are spent; the shop sells patterns and accessories with prices, and what a player buys is theirs to wear (E5).
Ready: coins in the profile, ctx.giveCoins for content, prices and buying, and the start-screen panels. Nothing gives coins yet and there is no shop panel (planning/modules/shop.md).
Breakdown:
- T0019 M — Coins from kills: one coin per monster, the victim's level per knockout, a coin pop, the balance on the start card — building
- T0021 M — First shop stock: two patterns, a face and a back accessory, priced — done
- T0022 M — The shop: a panel over the start screen that sells the stock, with a preview critter — todo (waits on T0019)
- T0027 S — Coins from events: every gem an event drops pays 1 coin — designing (waits on T0019)
- T0031 M — The shop's second stock: two patterns, a face and a back accessory, priced — design
- T0035 S — Chef Hat: a 300-coin head accessory, the shop's long goal — todo
Next: done once all five build: kills and events pay coins, the shop sells the stock, and the Chef Hat is the goal to save for.

## E7 Prestige (tasked)
Goal: nobody stays overpowered forever: a player who reaches level 18 prestiges back to level 1, and prestiging is worth it.
Done when: reaching level 18 sends a player back to level 1 and gives them something for it. What they gain is yours to design: it must make prestiging worth it without making them overpowered again.
Ready: the reset at level 18 works; the reward is content (a director's onPrestige, talents and wearables that need prestiges). Today a prestige gives nothing (planning/modules/prestige.md).
Breakdown:
- T0023 S — Prestige ring: a big yellow ring and confetti where a player prestiges — todo
- T0024 M — The prestige pays (in all): the Nth prestige in all pays 25 x N coins — failed (the in-all count is client-only; see IDEAS)
- T0029 M — The prestige pays: the Nth prestige this life pays 25 x N coins, a 2 s card under the xp bar — design
- T0025 M — Slush: a Lobber talent that only opens after a prestige this life — designing
- T0026 S — Medal: a back accessory, buyable only after 2 prestiges in all — todo (waits on T0022)
Next: done once all four build: the ring shows it, the coin pays, Slush opens a second-life build, and the Medal marks 2 prestiges in all.

## E8 The Goober tree (tasked)
Goal: a fourth playstyle for the draft: a build whose weapon aims for you — your Goo turns in flight and catches the nearest enemy, while Gunner kites with straight Bolts, Lobber zones with bubbles and Body bites in front.
Done when: the Goober tree is in the panel with its finisher mod, its weapon, a fork and its capstone, each readable in a crowd.
Breakdown:
- T0030 L — Goober tree: Reap, a homing Goo, a Gush puddle, a Scatter capstone — design
Next: a 5th and 6th talent in a later cycle; the tree is playable end to end once T0030 builds.

## E9 A bigger menagerie (active)
Goal: the crowd grows a 6th, then a 7th, way to move; each new monster readable at a glance.
Done when: the 6th monster is in the field with a behavior no other has.
Breakdown:
- T0032 M — Sleeper: a deep pink cushion that sleeps until you get close — design
- T0034 M — Bulwark: a deep red octagon whose bubble shield eats the first 15 hits — todo
Next: done once T0032 and T0034 build: the crowd gains two ways to survive (it sleeps, it shields).

## E10 More reasons to move (active)
Goal: a 5th, then a 6th, field event, so the field always has a new place to be (the cap is 6 events).
Done when: the 5th event runs on the field.
Breakdown:
- T0033 S — Jackpot: one big gem in the middle of the field, worth 25 xp — design
Next: a 6th event in a later cycle.
