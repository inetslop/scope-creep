---
id: T0364
title: "The Blinker: the wave-60 boss that skips the road"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T15:28:41Z
---

## Goal
The boss queue's next peak: wave 60 sends the Blinker — the first boss that skips the road, blinking forward along it on a telegraphed clock, so a build concentrated on one choke does not hold the wave.

## Details
- **The every-10 rule's sixth boss:** wave 60 sends exactly one Blinker and nothing else — the plan's whole budget in one shape (the Orb's and Hive's pattern) — declared as the wave's boss, so the arrival horn (T0268), the boss card (T0256), the death burst and name card (T0273) and the escape note (T0269) all fire for it with no new HUD.
- **Numbers:** behavior walk; hp 720 base (the boss base, wave-scaled like the Hive's); speed 0.9 (the boss norm); gold 20; livesCost 1 (a boss leak costs one life, as always); threat the wave-60 plan's whole budget (the 50/100/150/200/250 pattern → 300); fromWave 60; spawnOnly — never in a wave's mix, not counted in the 10-regular cap.
- **The blink (the new mechanic):** every 4.0 s, after 3.0 s of walking, the Blinker telegraphs for 1.0 s — its inner disc slides forward inside the almond (a small live overlay, the crackDeep's live-draw pattern, T0344) and one thin pink ring blooms once at the destination, 2.5 cells further along the road (the working-aura ring's look, T0055's language, in its own color) — then it blinks: it vanishes and reappears 2.5 cells further along the road over ~0.15 s, with a quiet skip note (the sting's softest class, the bossOut note's shape and volume, T0284). A blink is movement along the road — the same road position a Push gust moves enemies on, in the forward direction — so a slow, a root, a push and every tower still work on it between blinks.
- **A blink is committed:** once the telegraph starts, the blink lands on its clock even if the Blinker is rooted or slowed — control buys the walking time between blinks, not the blink (the Flyer's bank rule, T0317: control buys time, not the beat). If fewer than 2.5 cells of road remain to the exit, it does not telegraph or blink — it walks the rest like any boss. A blink never moves it off the road or past the exit.
- **Look:** a pink almond — an eye (a new shape in the art; no enemy has it — the warm family color on a new silhouette, the Mute's lesson) — at size 0.5, the boss scale; its inner disc faces the road's direction of travel like the Bulwark's plate faces the road.
- **What it punishes and what answers it:** it punishes the guaranteed choke (T0217) — a build concentrated on one double-cover cell watches the Blinker skip past it. The answers are spread cover along the road (towers must reach where it lands, not where it stands) and sustained lines (a Beam holds it through the skip; a Lance corridor along the road keeps contact).
- **The reference:** the wave preview shows the Blinker's token ×1; the name tag says "Blinker" on its first spawn (T0085); the bosses reference grows its row from the def (T0277), teach language: "blinks 2.5 cells ahead every 4 s — cover the road, not the choke."

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk`, the basic walker | the Dot only walks; the Blinker skips itself forward along the road on its own clock |
| Block | `walk`, slow and tough | a Block just takes damage; the Blinker keeps advancing past your coverage |
| Colossus | `walk`, the whole wave in one boss shape | the Colossus stops the fight on a clock (out of reach); the Blinker never stops advancing — it skips past choke coverage |
| Guard | `walk`, a boss escort | the Guard shields one other shape the wave sends; the Blinker is alone and moves the fight itself |
| Titan | `walk`, a boss that punishes a damage pattern | the Titan halves hits behind its Guard; the Blinker answers placement (choke-only cover), not damage |
| Orb | `walk`, a boss that changes at half health | the Orb turns itself into two Shards once; the Blinker stays one shape and moves instead |
| Hive | `walk`, a boss with a timed cycle | the Hive holds its spot and pops Dots; the Blinker changes its own position on the road |
| Shard | `walk`, a piece of a split | a Shard is what a split leaves behind; it never moves except by walking |
| Sprinter | `walk`, a shape that changes under fire | the Sprinter's speed is earned, hit by hit; the Blinker's skips are unearned, on its own clock and telegraphed |
| Splitter | `walk`, a death that makes more enemies | the Splitter's split is its death; the Blinker's blinks happen while it lives and it keeps walking |
| Hauler | `walk`, big and slow | the Hauler hauls a fortune on a leak; the Blinker skips the road itself |
| Mute | `walk`, works on towers instead of enemies | the Mute stills towers in a ring; the Blinker moves the fight along the road |
| Feeder | `walk`, works on neighbours instead of itself | the Feeder speeds the pack around it; the Blinker moves only itself — 2.5 cells at a time |
| Ward | `walk`, a self-defense | the Ward only defends the spot it walks; the Blinker changes where it is |
| Bulwark | `walk`, a plate that faces the road | the Bulwark turns hits aimed at it; the Blinker answers your tower placement |
| Splinter | `walk`, a fast piece | a piece, never a skip |
| Dasher | a burst of movement on a cycle | the Dasher dashes 3 cells in one flash with a pause tell, as a small regular; the Blinker walks the whole time and blinks 2.5 cells ahead on a longer cycle, telegraphed a full second ahead at a marked spot on the road |

## Acceptance criteria
- [ ] Wave 60's plan is exactly one Blinker (the whole budget, the "boss" tag); every other wave plan is unchanged and the seeded plans for the earlier boss waves (10, 20, 30, 40 and 50) stay identical.
- [ ] A live Blinker blinks 2.5 cells forward along the road every 4.0 s, each preceded by the 1.0 s telegraph (the inner disc slides, one thin pink ring blooms once at the destination); with fewer than 2.5 cells left to the exit it walks the rest without blinking.
- [ ] A blink is committed: a rooted or slowed Blinker still blinks on its clock (unit test); between blinks Frost's slow, Anchor's root and a Push gust all work on it as on any road enemy, and a blink never moves it off the road or past the exit.
- [ ] The next-wave button's enemies-left count, the exit warning and the wave-end check treat the Blinker as an ordinary road enemy: its progress is its road distance, and a blink advances it, never undoes it.
- [ ] The arrival horn, the boss card, the death burst and name card and the escape note all fire from the existing boss hooks; the name tag says "Blinker"; the wave preview shows its token ×1; the bosses reference lists it in wave order with the teach line.
- [ ] The look is a pink almond at 0.5 — a shape no enemy has; unit tests pin the wave-60 plan, the blink schedule (4.0 s apart, 1.0 s telegraph, 2.5 cells, the no-blink tail) and the committed-while-rooted rule; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
