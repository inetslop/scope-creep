---
id: T0113
title: "Glide: a Hive talent, the crowd keeps you moving"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T19:06:11Z
epic: E25
---

## Goal
A Hive life runs into the swarm to fight and still gets out: while the crowd is on you, you move faster — the crowd that feeds the tree's hits now carries the tree's player, so the playstyle's whole commit (running in) stops being a trap.

## Details
- New on-hit upgrade **Glide** (`src/content/upgrades/glide.ts`), Hive tree, maxLevel 2.
- Text (shown on the talent): "While 3+ enemies are within 80 of you, you move 20% faster, refreshed on each of your hits, 1.5 s. Rank 2: 30% for 2 s."
- How it works: on every hit you land, if 3 or more enemies are within 80 of you, apply your own speed status for 1.5 s (rank 2: 2 s), refreshed on each hit while the crowd stays. Reuse the existing speed statuses Wired 1 (rank 1) and Wired 2 (rank 2) — the same +20%/+30% speed and the same yellow tick read that Adrenaline uses; no new status file. When the crowd drops below 3 within 80, the speed runs out after its 1.5 s / 2 s and stays off until a hit lands in a fresh crowd.
- The yellow tick puff plays when the speed starts, not on every hit while it is already up.
- What it does with every weapon: the same with all of them — Bolt, Cover, Maw, Bellow, Lob, Goo, Nerve, Horn, Slush and the strikes of your own areas all refresh the speed while the crowd is on you; it changes your movement, never a weapon's shot or its damage.
- Talent line in `src/content/talents/hive.ts` (after the scavenge line): `id glide, upgrade glide, max 2, needs [["swarm",1]]` — a fourth fork under Swarm, no points requirement, no prestige.
- The tree as the panel will draw it:
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
    Leech (3, needs Swarm 1)
    Scavenge (3, needs Swarm 1)
    Glide (2, needs Swarm 1)
    Nest (3, needs Horn 2)
      Sting (1, needs Horn 3, Nest 2)
  ```
- What a Hive life pays for it: 3 points (Swarm 1 + Glide 2) — the same 3 points could take Horn to its full rank or Leech/Scavenge deeper; Glide trades weapon depth for the in-and-out speed the playstyle depends on.
- Why it matters now: in a monster crowd a Glide 2 Hive sprints through a Zippy's lane or out of a Sleeper's wake while keeping the crowd's damage, heal and xp; against players, a fight that stacks 3 enemies on the other side is an escape hatch — you outrun it, they can't.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit that reacts to your hits | reads the crowd around you, not the hit, and moves you instead of redirecting the shot |
| Reckless | an on-hit that changes how you play while a state holds | the state the crowd makes for you, not one you stay in by choice; it changes your movement, not your damage |
| Chill | an on-hit that puts a status on a critter | the status lands on you, and the crowd — not the hit — decides when it is on |
| Reap | an on-hit that pays on a critter's state | pays on your state (crowded) in speed, with every weapon |
| Swarm | an on-hit scaled by the crowd | the crowd around you, not the target; speed, not damage |
| Leech | the same crowd condition around you | speed that carries you in and out of the crowd, not a heal |
| Mend | an on-hit that pays the more hurt you are | pays the more crowded you are, in speed, on every hit of every weapon |
| Gore | an on-hit that changes a weapon's reach while a state holds | the state is the crowd, the change is your own speed with every weapon |
| Cling | an on-hit that leaves a mark on the critter you hit | leaves nothing on the target; it changes how you move |
| Snare | an on-hit that marks through your zone | marks nothing; your own speed while the zone is crowded |

## Acceptance criteria
- [ ] A Hive life with Glide 1 that has 3+ enemies within 80 moves 20% faster (the yellow tick puff plays when the speed starts); with only 2 enemies within 80, no speed.
- [ ] While the crowd stays on you, each hit you land (any weapon, any area strike) refreshes the speed so it never drops; once the crowd thins below 3, the speed runs out after 1.5 s.
- [ ] Glide 2 moves 30% faster and holds for 2 s.
- [ ] The Hive tab shows Glide under Swarm (needs Swarm 1, 2 ranks) with the crowd, the speed, the refresh and both ranks' numbers in its text.
- [ ] No other tree lists Glide; Adrenaline, the Wired statuses and every other weapon keep their existing numbers; bots are unaffected.
