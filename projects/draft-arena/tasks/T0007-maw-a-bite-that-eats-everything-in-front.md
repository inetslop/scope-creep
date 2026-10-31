---
id: T0007
title: "Maw: a bite that eats everything in front of you"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T02:37:00Z
claimed_at: 2026-10-31T02:37:03Z
epic: E1
designer: desktop
---

## Goal
The Body tree gets its own weapon: a close-range bite that hits the whole crowd in front of you at once. Body stops being "stats for the Bolt" and becomes a playstyle: rush in (Swift), stand there (Vigor, Chill), eat the wave (Maw, Chomp).

## Details
- New weapon upgrade `src/content/upgrades/maw.ts` (closest example: `src/content/upgrades/bolt.ts`, a weapon). Text (shown on its talent row, must fit at 412x915): "Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage." `maxLevel: 5`. Look: shape hexagon, color ice.
- The bite is not a projectile — it is a ground area, new file `src/content/areas/bite.ts` (closest example: the splash area T0003 is building, `src/content/areas/splash.ts`; if it is not built yet, read T0003's Design section). The zone: a circle of radius 75 centred 55 units in front of the player, aimed at the nearest enemy within 130 — if no enemy is within 130, Maw waits and never bites at air. Single strike: the zone lives 0.2 s and strikes once. 25 damage at rank 1, +6 per rank (49 at rank 5). It hits everything in the zone, monsters and players (players half damage, as usual).
- Look: a wide ice crescent — an open mouth in cool ice with an ink outline, told apart from the splash's full circle at a glance — flashes in the zone for 0.2 s.
- Talent line in the Body tree file (closest example: the `magnet` line in `src/content/talents/body.ts`): id `maw`, upgrade `maw`, max 5, needs `[["might", 2]]`.
- The tree as the panel will draw it (with the Chill and Chomp lines that T0004 and T0006 add):
  ```
  Swift (5)
  Vigor (3)
    Chill (3, needs Vigor 1)
    Chomp (1, needs Vigor 3, Swift 3)
  Might (5)
    Maw (5, needs Might 2)
  Magnet (3)
  ```
- What it gets and what it costs: Maw 5 costs 7 points of the Might line (Might 2 first). Those 7 points could instead buy full Might (+60% damage to the Bolt, the single-target line) or the stand-still line of Swift and Vigor. Maw is only close: its zone reaches 130 in front, so the Bolt's range is never threatened, and a kiting player or a far Puff is out of its reach — the body has to be in the crowd, which is exactly what Swift and Vigor pay for.
- With every mod: Haste (fires sooner) and Might (+12% bite damage per rank) apply; Wide (+20% area per rank) applies — the bite zone is a ground area, so Wide makes it visibly bigger per rank; Chill (slow on hit) applies — as with any area, the bite refreshes the slow on everything inside. Split does not apply: the bite is a ground area, not a projectile, so there is nothing to fan — and that is fine, Maw already hits a group. Lance (pierce), Quick (projectile speed) and Ricochet (bounce) do not apply: there is no projectile to fly, pierce or bounce.
- In a crowd: a Maw 2 Body player standing in a Dot wave bites every 0.9 s — a 31-damage bite (25 at rank 1, +24% from Might 2) lands on every Dot (12 hp) inside at once, so the wave dies faster than it bites back; with Chill 3 the wave is at 50% speed in the zone, and with Chomp each kill feeds back 5 hp. Against a player: the bite hits close for half damage, but the player's Bolt keeps its range — Maw makes the Body the one who closes, and closing is the Body's job.
- It lays one area every 0.9 s and nothing else: no projectiles to add to a crowd of 60.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires by itself | The Bolt aims one spinning star at one far enemy and stops there; the Maw bites a zone in front of you and everything inside at once — it trades range for a group, and it can only hit what you stand next to |
| Lob (T0003, in the pool) | a weapon that hits a group | The Lob throws a bubble that lands where the enemy was, at mid range, with no commitment — you can stand still and lob; the Maw is a ground bite in front of you: you have to be in the crowd you want to eat, and the crowd is in you |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a line "Maw": "Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage.", hexagon icon (ice), 5 ranks, "Needs Might 2" until taken — readable at 412x915.
- [ ] A player with Maw 1 and no enemy within 130 bites nothing; with a Dot within 130, an ice crescent flashes in front of them every 0.9 s, and a level-1 Dot (12 hp) dies to one bite (25 damage).
- [ ] The bite hits every monster in the zone at once: five Dots standing in the crescent all take the bite; a player in the zone takes half (12.5 at rank 1).
- [ ] With Might 2 the rank-1 bite is 31; at Maw 5 it is 49; with Haste the bites come visibly sooner per rank; with Wide the crescent is visibly bigger per rank.
- [ ] With full Split, Lance and Ricochet the bite is still one zone of the same size (Haste still makes it fire sooner, as with every weapon).
- [ ] The Gunner and Lobber trees are unchanged; the game starts and plays normally.
