---
id: T0008
title: "Snail: an orange hexagon that leaves sticky patches behind"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T02:37:00Z
claimed_at: 2026-10-31T03:06:37Z
epic: E2
designer: cachyos-x8664
---

## Goal
A monster that changes the field it walks on: it leaves sticky patches that slow whatever crosses them — player or monster. A crowd turns the floor into a maze: you run clean, or you stand in the muck and farm the Dots that crawl into it.

## Details
- New monster file `src/content/monsters/snail.ts` (closest example for the data shape: `src/content/monsters/puff.ts`; for a `think` run on the server every tick, private state in its `mem`, what the player must see in its synced slots and look, see planning/modules/monsters.md — Zippy, T0005 in the pool, is the other new think).
- Numbers: hp 60, speed 30 (a Dot is 85, a Puff 50, a player 210), radius 18, damage 10 per second while touching (it is the terrain, not the attacker), xp 5, weight 3 (Dot 10, Puff 4, Zippy 6 — the Snail is a minority), fromLevel 5.
- Behavior: crawls toward the nearest player, fanned out, like a Dot. Every 1.5 s of movement it sinks and lays a sticky patch where it is: a new area file `src/content/areas/sticky.ts`, a field of radius 45 lasting 6 s. While inside, anything moves at 60% of its speed — a player (210 → 126) and a Dot (85 → 51) alike; the slow fades 0.5 s after leaving the patch. A crawling Snail leaves a trail: about four overlapping patches in 6 s, a road behind it. If a hit slow (Chill, T0004) and a patch slow are both on the same critter, the stronger one is in effect — they do not multiply.
- It spawns nothing and fires nothing: the patch is a field, not a monster, so the per-player crowd cap of 60 still holds.
- Look: shape hexagon (a Dot is a circle, a Puff a pentagon, a Zippy a triangle), color orange, face: mood calm, 2 eyes, mouth smile — a sleepy crawler. Before it acts it sinks (squashes flat), its mouth closes to o, and a dark orange patch (radius 45, a small snail-print ring) fades in under it over 0.3 s — the floor itself is the warning. On the mint field a patch reads at a glance: an orange stain with an ink outline.
- What counters it: it barely chases (30 u/s) — walk away; kill it before its trail grows (60 hp, a few bolts); walk a clean line. What it punishes: a player who camps a spot (a gem pile, a held position) — the Snails that reach while you stand lay patches under your feet; and in a busy field, trails narrow the routes. The counterplay it invites: stand in your own muck — a mired Dot wave is 40% slower, and a slowed crowd is xp to eat (a Body build with Chill and Chomp turns a Snail's trail into a farm).
- With 6 and with 60: from player level 5 each player's crowd carries a Snail or two (weight 3 of 23); at 60 players the field-wide monster cap still bounds the total, and patches expire 6 s after being laid, so the floor clears itself when the Snails die or move on.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | closes on the nearest player | A Dot is the threat — it bites you; a Snail barely chases, and its threat is the trail it leaves, which slows players and monsters alike and outlives its walk |
| Puff | a warm critter in the crowd | A Puff's threat is what it does on death (pops into three Dots); a Snail's threat is what it does while alive (6-second patches that rewrite the floor it crosses) |
| Zippy (T0005, in the pool) | a monster with its own way to move | A Zippy moves the player — a telegraphed dash intercepts a straight-line kite; a Snail changes the field the player already moves on — patches that slow everything, player or monster, that crosses them |

## Acceptance criteria
- [ ] From player level 5 a small share of the crowd (weight 3 of 23) is a chunky orange hexagon with a smile; below level 5, none.
- [ ] A Snail crawls at 30 u/s; every 1.5 s of movement it sinks, its mouth closes to o, and a dark orange patch (radius 45) fades in under it over 0.3 s; each patch lasts 6 s, then fades.
- [ ] A player inside a patch moves at 60% speed (126 u/s instead of 210) and a Dot inside crawls at 51 u/s instead of 85; the slow fades within 0.5 s of leaving the patch.
- [ ] A Snail's death drops its gem (worth 5 xp) and adds nothing to the crowd; the per-player cap of 60 still holds.
- [ ] A Snail touching a player does 10 per second like any monster; Dot and Puff (and Zippy once T0005 builds) are unchanged; the game starts and plays normally.
