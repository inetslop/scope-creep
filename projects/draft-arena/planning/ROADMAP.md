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
- T0008 M — Snail: an orange hexagon that leaves sticky patches — design
- T0018 M — Spitter: an orange diamond that spits from a distance — design
- T0020 M — Flee: a red teardrop that runs from the nearest player — design
Next: done once T0008, T0018 and T0020 build: every monster has its own way to move.

## E3 Field events (tasked)
Goal: reasons to go somewhere on the field. Today: Gem rain. More events, built as directors (planning/modules/events.md).
Breakdown:
- T0010 M — Swarm surge: a line of calm Dots that crosses the field — design
- T0011 S — Gem rush: a line of 12 gems, first touch takes all — design
- T0012 S — Gem geyser: a spot that bubbles 8 gems, a position to hold — design
Next: done once T0010-T0012 build: four events, four reasons to move (a windfall, a threat, a race, a position).

## E4 Pressure on the leader (tasked)
Goal: the top player is a target, and knocking them out pays. Built from events and the match's rules (planning/modules/events.md, match.md).
Done when: the leader is readable on the field, and knocking the crown out is the most rewarding moment of a life.
Ready: a director sees every player's score each tick and gets onKill after each player death (planning/modules/events.md); the pvp damage and bounty numbers are frozen in rules.ts — content adds its own drops and xp on top (T0015 proved there is no hook to change pvp damage).
Breakdown:
- T0013 M — The Crown: the top scorer wears a yellow crown, moves only on a strict overtake — design
- T0014 S — Leader's gem: a knocked-out crown drops a gem worth its level — design
- T0015 S — The leader pays: the crown takes 25% more damage from players — failed (the engine's pvp damage is frozen)
Next: done once T0013 and T0014 build: the crown is readable on the field, and the leader's gem makes the knockout pay.

## E5 Your own critter (tasked)
Goal: players make their critter theirs: they pick its color and put on a hat, and everyone in the match sees it.
Done when: before playing, a player can choose a color and a hat (a couple of each to start); the choice is kept for their next visit and shows on their critter for everyone.
Ready: the engine has what players wear (accessories in src/content/accessories/, patterns), the color pick, the profile in the browser, and start-screen panels (src/menu/). Nothing is built on it yet: no accessories, no patterns, no panels (planning/modules/accessories.md, patterns.md, shop.md).
Breakdown:
- T0016 M — Your color: a card of the 10 colors, kept for the next visit — design
- T0017 M — Two starter hats: a Hats card, wear and take off — design
Next: done once T0016 and T0017 build: a color and a hat, picked on the start screen, kept between visits, seen by everyone in the match.

## E6 Shop and coins (active)
Goal: something to play for across matches: players earn coins in the match and spend them in a shop on color patterns and accessories (hats and more).
Done when: coins are earned in play (how many, for what, is yours to design), kept between visits, shown where they are spent; the shop sells patterns and accessories with prices, and what a player buys is theirs to wear (E5).
Ready: coins in the profile, ctx.giveCoins for content, prices and buying, and the start-screen panels. Nothing gives coins yet and there is no shop panel (planning/modules/shop.md).
Breakdown:
- T0019 M — Coins from kills: one coin per monster, the victim's level per knockout, a coin pop, the balance on the start card — design
- T0021 M — First shop stock: two patterns, a face and a back accessory, priced — design
- T0022 M — The shop: a panel over the start screen that sells the stock, with a preview critter — design
Next: the shop panel (T0022), then coins from events.

## E7 Prestige (active)
Goal: nobody stays overpowered forever: a player who reaches level 18 prestiges back to level 1, and prestiging is worth it.
Done when: reaching level 18 sends a player back to level 1 and gives them something for it. What they gain is yours to design: it must make prestiging worth it without making them overpowered again.
Ready: the reset at level 18 works; the reward is content (a director's onPrestige, talents and wearables that need prestiges). Today a prestige gives nothing (planning/modules/prestige.md).
Breakdown:
- T0023 S — Prestige ring: a big yellow ring and confetti where a player prestiges — design
- T0024 M — The prestige pays: the Nth prestige in all pays 25 x N coins, a card shows what you got — design
Next: once the shop is built, the medal (needs 2 prestiges in all) and a prestige-gated talent.
