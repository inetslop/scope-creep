---
id: T0405
title: "The Leech: the wave-80 boss that drinks its escorts"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T05:03:59Z
claimed_at: 2026-11-02T05:24:38Z
designer: desktop
---

## Goal
The boss ladder's next step: the wave-80 boss drinks its escorts' health into itself, so the boss fight has a real focus choice — kill the escorts to keep it dry, or burst it before the drinks run out.

## Details
- The Leech, the wave-80 boss (the boss lane in core/waves.ts, the T0402/T0404 plan pattern): a big pink shape with an open maw — a circle with a wedge cut from the front (a new shape in the set, no theme), boss scale 0.5. hp 720 at wave 1 (the boss base, wave-scaled like every boss), speed 0.9, gold 20, livesCost 1, threat 400 (the boss ladder's next step — 50, 95, 150, 200, 250 → 300 → 350 → 400; if T0402 or T0404 landed at a value that makes 400 a skip, take the next step after the highest existing boss threat), spawnOnly, fromWave 80.
- The wave-80 plan: the Leech + 2 Hauler escorts, all in the boss lane — spawnOnly, the regular cap and the wave mix unchanged (the T0404 Wards pattern).
- The drink: every 5 s while a Hauler escort lives, after a 0.8 s white telegraph (the Colossus outOfReach telegraph's language), the Leech drinks from the nearest living escort: 8% of the Leech's max hp moves from the escort to the Leech (capped at the Leech's max) over ~0.6 s — a thin pink line from the maw to the escort, the escort's hp bar draining across the drink, a small green "+N" pop at the Leech when the drink lands (the streak life-pop's green, T0045). The drink is damage: if it kills the escort, it is a normal death (gold pop, chips, the combo counts).
- 8 drinks, then the maw closes: the wedge fills in and the token reads as a plain circle for the rest of its life — the full readout, no chip. If the player kills both escorts first, the maw closes at once (the dry readout).
- One-time teach: the Leech's first drink in a run shows a one-time white chip near the line: "drinks its escorts" (~1.5 s, the T0307 chip's language, once per run). The name tag (T0085) fires on the first spawn as usual.
- The boss card, the leak, the jolt, the arrival ring, the horn and the death burst all inherit the boss's own paths (the T0292/T0317 pattern) — no new HUD element.

## Compared with what exists
| Existing | What it shares | What the Leech does that it can't (not numbers) |
| --- | --- | --- |
| Dot | walk | never acts on other enemies; the Leech moves hp between living enemies |
| Block | walk | never acts on other enemies |
| Colossus | walk, boss lane | goes out of reach on a clock; it never moves hp between enemies |
| Guard | walk, boss-lane escort | is a shield for the Titan; it never moves hp |
| Titan | walk, boss lane + escort | halves its own damage while its Guard lives; it never heals from allies |
| Orb | walk, boss lane | replaces itself with Shards at half hp; the Leech moves hp while both stay alive |
| Hive | walk, boss lane | adds enemies (pops Dots); the Leech moves hp, not enemies |
| Shard | walk, split product | a piece of an Orb; it never acts on other enemies |
| Sprinter | walk | ramps its own speed when hit; the Leech's change flows between two enemies |
| Splitter | walk | replaces itself on death; the Leech acts while both stay alive |
| Hauler | walk, boss-lane escort | carries a fortune on leak; it never moves hp (the Leech drinks it) |
| Mute | walk | silences towers (tower interaction); the Leech interacts with other enemies |
| Flyer | walk (flies) | crosses the sky in a straight line; it never acts on other enemies |
| Ward | walk, boss-lane escort (T0404) | ignores tower control; the Leech is a source of damage, not control |
| Bulwark | walk | halves damage from the front; it never moves hp |
| Splinter | walk, split product | a piece of a Splitter; it never acts on other enemies |
| Mender | walk, boss lane + escorts (T0404, in the pool) | heals itself and its escorts from nothing on a clock; the Leech's heal is the escorts' hp — killing them dries it out |

## Acceptance criteria
- [ ] Wave 80's plan sends the Leech + 2 Hauler escorts in the boss lane; every other wave's plan is unchanged and the regular-enemy cap stays 10 of 10 (the Leech is spawnOnly).
- [ ] Every 5 s the Leech flashes white for 0.8 s, then drinks 8% of its max hp from the nearest living escort over ~0.6 s — the pink line, the escort's hp bar draining, the green "+N" pop at the Leech.
- [ ] After 8 drinks — or the moment both escorts die — the maw closes (the wedge fills in) and no more drinks happen.
- [ ] An escort killed by a drink dies as a normal death (gold pop, chips, the combo counts).
- [ ] The Leech's first drink in a run shows the one-time "drinks its escorts" chip; the name tag fires on the first spawn.
- [ ] The Leech leaks at 1 life with the boss's jolt scale, and the boss card, the arrival ring, the horn and the death burst read it as the run's boss.
