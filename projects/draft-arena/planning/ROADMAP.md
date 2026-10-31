# Roadmap

Epics are the main work: one or two active at a time, each broken into playable slices (task ids once written). Content-only: anything that needs the engine changed goes to IDEAS.md under "Needs the engine".

## E1 New talent trees (active)
Goal: more playstyles. Today: Gunner (your Bolt) and Body (plain stats).
Done when: there are several trees, each a playstyle with its own weapon, its own shape, mods that help any weapon first, and a capstone behind a real commitment.
Breakdown:
- T0001 S — Lance: piercing bolts, a base fork in Gunner — done
- T0003 L — Lobber tree: a bubble that arcs in, a splash that marks the ground — in progress
- T0004 M — Chill: a hit that slows the target, a mod for any weapon — designing
- T0006 S — Chomp: a Body capstone, heal on kill — designing
- T0007 L — Maw: a bite that eats everything in front, the weapon for Body — design
- T0009 S — Hide: take less damage, a second fork under Vigor — design
Next: done once T0003-T0009 build: three trees, each with its own weapon and a capstone.

## E2 Monster behaviors (active)
Goal: crowds that make you move differently. Today: Dot (it chases you) and Puff (it pops into Dots).
Done when: there are several monsters with behaviors of their own, each readable at a glance.
Breakdown:
- T0002 S — Puff: a purple pentagon that pops into three Dots on death — done
- T0005 M — Zippy: a pink triangle that winds up and dashes — design
- T0008 M — Snail: an orange hexagon that leaves sticky patches — design
Next: done once T0005 and T0008 build: every monster has its own way to move.

## E3 Field events
Goal: reasons to go somewhere on the field. Today: Gem rain. More events, built as directors (planning/modules/events.md).

## E4 Pressure on the leader
Goal: the top player is a target, and knocking them out pays. Built from events and the match's rules (planning/modules/events.md, match.md).

## E5 Your own critter
Goal: players make their critter theirs: they pick its color and put on a hat, and everyone in the match sees it.
Done when: before playing, a player can choose a color and a hat (a couple of each to start); the choice is kept for their next visit and shows on their critter for everyone.
Ready: the engine has what players wear (accessories in src/content/accessories/, patterns), the color pick, the profile in the browser, and start-screen panels (src/menu/). Nothing is built on it yet: no accessories, no patterns, no panels (planning/modules/accessories.md, patterns.md, shop.md).

## E6 Shop and coins
Goal: something to play for across matches: players earn coins in the match and spend them in a shop on color patterns and accessories (hats and more).
Done when: coins are earned in play (how many, for what, is yours to design), kept between visits, shown where they are spent; the shop sells patterns and accessories with prices, and what a player buys is theirs to wear (E5).
Ready: coins in the profile, ctx.giveCoins for content, prices and buying, and the start-screen panels. Nothing gives coins yet and there is no shop panel (planning/modules/shop.md).

## E7 Prestige
Goal: nobody stays overpowered forever: a player who reaches level 18 prestiges back to level 1, and prestiging is worth it.
Done when: reaching level 18 sends a player back to level 1 and gives them something for it. What they gain is yours to design: it must make prestiging worth it without making them overpowered again.
Ready: the reset at level 18 works; the reward is content (a director's onPrestige, talents and wearables that need prestiges). Today a prestige gives nothing (planning/modules/prestige.md).
