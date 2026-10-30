---
id: T0292
title: "The Hive: the wave-40 boss that grows the group"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T17:15:59Z
claimed_at: 2026-10-30T17:20:51Z
designer: inet-racing
---

## Goal
The run's next peak past the Orb: wave 40 sends a boss that answers a single-target build the way the Colossus's phase does — but with pressure instead of a pause. The Hive keeps popping Dots while it walks, so the board never goes quiet.

## Details
- **The every-10 rule's fourth boss:** wave 40 sends exactly one Hive and nothing else — the plan's whole budget in one shape (the Orb's pattern) — declared as the wave's boss, so the arrival horn (T0268), the boss card (T0256), the death burst and name card (T0273) and the escape note (T0269) all fire for it with no new HUD.
- **Numbers:** behavior walk; hp 720 base (the boss base, wave-scaled like the Orb's); speed 0.9 (Block's speed, the boss norm); gold 20; livesCost 1 (a boss leak costs one life, as always); threat: the wave-40 plan's whole budget (the Orb's 150-at-30 pattern); fromWave 40; spawnOnly — never in a wave's mix, and not counted in the 10-regular cap (the Feeder, T0289, fills it).
- **The pop (the new mechanic):** while the Hive is alive, every 6.0 s it pops one small Dot at its spot — the Dot's own wave-scaled numbers, an ordinary enemy in every way (its gold, the combo, Mint and the "stopped" tally all count) — up to 5 pops per Hive, the first at 6.0 s after its own spawn, and the popping stops the instant it dies. Each pop is telegraphed: 0.8 s before it, one thin purple ring blooms once at the Hive's base (the working-aura ring, T0055, in the Hive's own color), then the Dot pops in with the ordinary spawn pop plus a small ring at its spot.
- **A popped Dot is a real spawn:** it takes the run's Tough the same way a plan spawn does (T0285's hp factor), and it is subject to everything (slow, root, push, silence) like any Dot.
- **The count:** the next-wave button's enemies-left count includes the popped Dots (alive or not yet popped), so it never dips below zero and reaches zero only when the board is truly clear.
- **Look:** a purple pentagon at size 0.5 — the boss scale, a new silhouette in the closed warm family (the pentagon is no enemy's shape: the Orb is a hexagon, the Titan a square, the Mute a ring).
- **What it punishes and what answers it:** a pure single-target build — focus the Hive and the Dots leak, focus the Dots and the Hive walks. The area line answers it: Splash, a Trap's blast, Ember (the burn ticks and jumps on death), the beam's Lance corridor, and Spray up close all clear a fresh Dot in one hit, and a Push gust shoves a just-popped Dot back.
- **The reference:** the wave preview shows the Hive's token ×1; the name tag says "Hive" on its first spawn (T0085); the bosses reference grows its row from the def (T0277), teach language: "pops a Dot every 6 s — area kills answer it."

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk`, the basic walker | the Hive pops Dots onto the board while it lives; a Dot only walks |
| Block | `walk`, slow and tough | the Hive acts on the group; a Block only takes damage |
| Colossus | `walk`, the whole wave in one boss shape | the Colossus leaves the fight on a clock (the out-of-reach beat); the Hive never does — it grows the group instead |
| Guard | `walk`, a boss escort | the Guard shields one other shape the wave sends; the Hive makes its own reinforcements |
| Titan | `walk`, a boss whose damage turns on another enemy | the Titan's state follows the Guard's life; the Hive's output follows its own clock and stops only when it dies |
| Orb | `walk`, a boss that makes more enemies | the Orb turns itself into two Shards once, at half hp; the Hive stays whole and pops repeatedly while it lives |
| Shard | `walk`, a piece of a split | a Shard is what a split leaves behind; it never produces |
| Sprinter | `walk`, a shape that changes under fire | the Sprinter speeds itself up when hit; the Hive changes the board, not itself |
| Splitter | `walk`, a death that makes more enemies | the Splitter's split is its death, once, into two of another kind; the Hive's pops are periodic, while it lives, and it keeps walking |
| Hauler | `walk`, big and slow | the Hauler carries a fortune on a leak; it never adds to the group |
| Mute | `walk`, works on towers instead of enemies | the Mute stills towers; the Hive feeds enemies |
| Ward | `walk`, a self-defense | the Ward only defends itself |
| Bulwark | `walk`, a plate that faces the road | the Bulwark halves hits aimed at it; it never adds enemies |
| Splinter | `walk`, a fast piece | a piece, not a producer |

## Acceptance criteria
- [ ] Wave 40's plan is exactly one Hive (the whole budget, the "boss" tag); every other wave plan is unchanged.
- [ ] A live Hive pops one Dot at its spot at 6.0 s, 12.0 s, …, up to five Dots; the pops stop the moment it dies; each pop wears the 0.8 s telegraph ring and the ordinary spawn pop.
- [ ] The popped Dots are ordinary enemies: they pay their own gold, feed the combo and Mint, take Tough like a plan spawn, and the wave ends only when the Hive and every popped Dot are dead or leaked.
- [ ] The next-wave button's enemies-left count includes the popped Dots and never dips below zero.
- [ ] The arrival horn, the boss card, the death burst and name card, and the escape note all fire for the Hive from the existing boss hooks; the bosses reference lists it in wave order.
- [ ] Unit tests pin the pop schedule (6 s apart, first at 6 s, five max) and the wave-40 plan; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
