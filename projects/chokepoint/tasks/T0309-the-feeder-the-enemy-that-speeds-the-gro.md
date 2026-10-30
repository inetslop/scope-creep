---
id: T0309
title: "The Feeder: the enemy that speeds the group around it"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T21:36:17Z
claimed_at: 2026-10-30T21:36:20Z
designer: desktop
---

## Goal
The enemy queue's next: from wave 13, a slow orange shape that makes every enemy within two cells of it walk 25% faster while it lives — the first enemy that changes the pace of other enemies, so slows and stops start to get outrun and the focus decision lands on it.

## Details
- **The enemy:** id `feeder`; behavior `walk`; hp 120; speed 0.9 (the slow norm); gold 10; livesCost 1; threat 1 (the reserved-special norm: the Hauler's, the Mute's, the Bulwark's, the Ward's); fromWave 13; a regular type — it brings the 10-regular cap to 10 of 10. Description: "Feeds the group: everything within two cells walks 25% faster while it lives."
- **How often:** one on waves 13, 17, 21, 25, … (every 4th from 13), added to the wave's plan by the reserved pattern the Hauler (9+), Mute (11+) and Bulwark (12+) use. The sequence never lands on a quiet wave (multiple of 4) or a boss wave (multiple of 10), so no re-add or boss interplay is needed.
- **The feed (the new mechanic):** while a Feeder is alive, every other enemy whose center is within 2 cells of the Feeder's center walks 1.25× the speed it would walk without the feed. It multiplies with everything that already changes speed: a Frost slow (×0.6) inside the feed walks at ×0.75 of base; a Sprinter's ramp and a Haste buff apply first and the feed sits on top of them. Per-frame: the moment an enemy leaves the radius its speed is back. The Feeder is never fed by its own feed. Two overlapping feeds can't happen (one per wave) — and the feed applies once, never twice, if ever they did.
- **A hook, not a field:** the feed runs on the per-frame enemy-hook pattern the Mute's silence uses — the def carries only its numbers and look, no new field on the enemy type (the Mute has none).
- **The tell:** while at least one other enemy is being fed, a thin ring in the Feeder's own color blooms from its token out to the 2-cell radius and fades over 1 s, once per second (the working-aura language, T0055 and the Mute's T0219). Nothing in range, no ring.
- **Look:** a new `ripple` silhouette — a filled circle with one thin concentric ring at ~1.35× its radius (the only enemy wearing a ring on its token; the Mute is a hollow ring, nothing inside) — orange (the family color of speed, the Sprinter's), size 0.26.
- **What it punishes and what answers it:** slows and stops — a group inside the feed outruns a 40% slow (0.6 × 1.25 = 0.75), and the waves from 13 on are the bigger, tighter ones. The answers: kill it early (120 hp, mid-pack); control it (unlike the Ward it is fully controllable — slow, root and push all hold it, and the feed multiplies with those slows); or clear it out of the pack (Splash, Spray up close, the beam).
- **The reference (no new screen):** the wave preview shows its token ×1 on its waves; the name tag says "Feeder" on its first spawn (T0085); the enemies reference grows its row from the def (T0252), in fromWave order between the Bulwark (12) and the Ward (15).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk`, the basic walker | the Feeder changes the pace of the group around it; a Dot only walks |
| Block | `walk`, slow and tough | the Feeder's slow walk feeds the enemies beside it; a Block only takes damage |
| Colossus | `walk`, the whole wave in one boss shape | the Colossus leaves the fight on a clock; the Feeder stays in it and feeds the wave around it |
| Guard | `walk`, a boss escort | the Guard shields one other shape; the Feeder quickens every enemy within 2 cells |
| Titan | `walk`, a boss whose state follows another enemy | the Titan's damage turns on the Guard; the Feeder's feed is its own, on while it lives |
| Orb | `walk`, a boss that makes more enemies | the Orb turns itself into two Shards once, at half hp; the Feeder stays whole and feeds instead of splitting |
| Shard | `walk`, a piece of a split | a piece: it takes the feed, never gives it |
| Sprinter | `walk`, a shape that changes under fire | the Sprinter speeds itself up when it is hit; the Feeder is never faster itself — it speeds the enemies around it |
| Splitter | `walk`, a death that makes more enemies | the Splitter's split is its death, once; the Feeder's feed is on while it lives, and it keeps walking |
| Hauler | `walk`, big and slow | the Hauler's fortune rides on its own leak; it never changes the group's pace |
| Mute | `walk`, a 2-cell aura that works on something else | the Mute's aura stills towers; the Feeder's aura quickens enemies — the other direction, the other side of the board |
| Ward | `walk`, ignores all control | the Ward shrugs off slow, root and push; the Feeder is fully controllable, and its feed multiplies with tower slows |
| Bulwark | `walk`, a plate that faces the road | the Bulwark halves the hits it faces; the Feeder changes no hit, only the pace of the group |
| Splinter | `walk`, a fast piece | a piece that only takes the feed; it never feeds |

## Acceptance criteria
- [ ] Wave plans 13, 17, 21, 25, … each carry exactly one Feeder (the reserved pattern); every other wave plan is unchanged; no Feeder on a boss wave or a quiet wave.
- [ ] An enemy within 2 cells of a live Feeder walks 1.25× the speed it would walk without it; a Frost slow and a Sprinter ramp multiply into it (a ×0.6 slow inside the feed walks at ×0.75 of base); the moment it leaves the radius its speed is back; the Feeder is never faster itself; the feed never applies twice to one enemy.
- [ ] The ring blooms from the token out to the 2-cell radius and fades over 1 s, once per second, only while at least one other enemy is being fed.
- [ ] The Feeder is a regular enemy in every way: it takes Tough's hp factor (T0285), slow, root, push and silence; a kill pays 10 gold (combo, Mint and "stopped" count); a leak costs 1 life; the next-wave button's count includes it.
- [ ] Its first spawn of a run wears the name tag "Feeder"; the enemies reference lists it between the Bulwark and the Ward.
- [ ] New unit tests pin the feed (the radius cut-in and cut-out, the 1.25×, the slow and ramp composition, the no-stack) and the wave-mix waves; npm run check and the 1280×720 / 412×915 smoke pass.
