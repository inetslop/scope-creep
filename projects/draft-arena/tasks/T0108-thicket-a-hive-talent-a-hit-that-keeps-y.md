---
id: T0108
title: "Thicket: a Hive talent, a hit that keeps you shielded while the crowd is on you"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-31T17:49:52Z
claimed_at: 2026-10-31T17:50:46Z
finished_at: 2026-10-31T17:54:06Z
epic: E23
design_attempts: 1
---

## Goal
The Hive's third fork under Swarm: a shield that only works while the swarm is on you, so the build that runs into the crowd can stand in the middle of it instead of running around it.

## Details
- Name "Thicket", an on-hit upgrade in the Hive tree. New file `src/content/upgrades/thicket.ts`, registered in `src/content/upgrades/index.ts`.
- Talent line in `src/content/talents/hive.ts`: id `thicket`, upgrade `thicket`, max 3, needs `[["swarm", 1]]`, no points requirement (the same price as Leech). The tree as the panel draws it:
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
      Nest (3, needs Horn 2)
        Sting (1, needs Horn 3, Nest 2)
    Leech (3, needs Swarm 1)
    Thicket (3, needs Swarm 1)
  ```
- Text on the panel (one or two short sentences with the numbers): "While 3+ enemies are within 80 of you, your hits keep you shielded: take 12% less damage for 1.5 s, refreshed on each hit. Per rank: +4% less damage."
- Exact numbers: the condition is the same at every rank — 3 or more other enemies (monsters and players alike) within 80 of you, the same reading Leech uses. On each of your hits that lands while the condition is true, you are Hived for 1.5 s, refreshed on each such hit. The shield is 12% less damage at rank 1, 16% at rank 2, 20% at rank 3.
- The status: one "Hived" status, one file with per-rank values the way Sapped is one file (see `src/content/statuses/` and the Snare task in the changelog), 1.5 s, refreshed, rank-scaled damage reduction. Its look: a small purple hex riding on the critter's upper back, drawn like the Sapped drop (`src/content/areas/sapped-drop.ts` is the closest example), purple in the palette with an ink outline, no glow.
- A mod for every weapon: it works with Bolt, Cover, Maw, Bellow, Lob, Goo, Nerve, Horn and whatever areas you lay — the condition is read on each of your hits. With a weapon that hits nothing it does nothing, and that is fine: the shield comes from fighting, not from standing still.
- What a player of Hive gets: a third direction under Swarm — Leech makes the crowd heal you, Thicket makes the crowd armor you, Horn makes the crowd feed your darts; a full Hive life can stand in the middle of the swarm and chew through it. Cost: 3 points on Swarm 1, the same as Leech, so an early Hive life must pick a direction.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Hide | less damage taken | always on, flat armor for any build; Thicket is a Hive shield that only works while the swarm is on you and is kept alive by your own hits |
| Leech | the same 3+ enemies within 80 condition, an on-hit while crowded | Leech heals on hits; Thicket reduces damage taken — a different resource (hp back vs hp lost), so a Hive life forks either way or buys both late |
| Swarm | a hit effect that reads the crowd | Swarm makes your hits harder per enemy near the target; Thicket protects you per enemy near you |
| Reckless | a conditional change to damage | Reckless doubles the damage you deal while you are hurt (on your hp); Thicket reduces the damage you take while crowded (on the field) |
| Chill | applies a status on a hit | Chill slows the target; Thicket shields the attacker |
| Reap | a bonus on a hit | Reap adds damage on a half-dead target; Thicket changes nothing about the hit itself |
| Mend | a heal on a hit | Mend heals on a Nerve hit scaled by your missing hp; Thicket is damage reduction, not a heal |
| Gore | a Nerve-specific hit effect while hurt | Gore extends a jab's pierce; Thicket works with every weapon while crowded |
| Cling | a Goo-specific hit effect | Cling splats a damage-over-time on the target; Thicket is a self shield |
| Snare | a Goober zone hit effect | Snare saps whatever stands in your puddle; Thicket has no zone and no target |
| Ricochet | a hit effect on a projectile | Ricochet bounces the bolt on; Thicket does nothing to the shot |

## Acceptance criteria
- [ ] Thicket shows in the Hive tab under Swarm with the text above, 3 ranks, needing Swarm 1; the panel draws it beside Leech.
- [ ] At rank 1, while 3+ enemies are within 80, a hit that lands makes the player take 12% less damage for 1.5 s, refreshed on each such hit: in a Dot swarm the shielded player loses hp visibly slower than without it, and when the crowd thins below 3 the shield wears off after 1.5 s.
- [ ] Ranks 2 and 3 take 16% and 20% less damage.
- [ ] The small purple hex shows on the player's upper back while the shield is up and is gone when it wears off.
- [ ] It works with every weapon the player owns (test with Bolt alone, and with Horn in a Hive build).
- [ ] A player without Thicket is completely unaffected, and the game stays playable with a fresh nomad build.

## Rejected by architect (desktop)

needs an engine change: a content-gated damage-reduction for players (e.g. a damage-reduction field on StatusDef or a dynamic armor stat) — the frozen engine's only mitigation is the static always-on flat armor stat, and monster contact damage (the Dot-swarm test case) has no content hook, so "take 12% less damage while Hived" cannot be built.
