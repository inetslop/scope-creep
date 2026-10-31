---
id: T0133
title: "The set-up: a Body fork, your Bellow ring arms your next Maw bite"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-31T22:29:04Z
claimed_at: 2026-10-31T22:34:52Z
finished_at: 2026-10-31T22:41:02Z
design_attempts: 1
---

## Goal
Body's two weapons — the front bite (Maw) and the all-around ring (Bellow) — currently work apart. This fork makes them feed each other: a Bellow strike arms your next Maw bite, so a second-life Body that commits to both hits harder from the front.

## Details
- A new on-hit upgrade in the Body tree, `src/content/upgrades/set-up.ts`, registered in `src/content/upgrades/index.ts`, plus its talent line in `src/content/talents/body.ts`: `id set-up, upgrade set-up, max 2, needs [["bellow", 1]]` (it sits under Bellow, which already requires Maw 3, 3 tree points and 1 prestige — the cross-weapon commitment).
- Mechanism (a marker status + on-hit, the same shape as Snare):
  - When your Bellow ring strikes at least one critter, it marks you as set up: a short marker status on you (no visible mark, to keep the critter clean) that lasts about 1.0 s — just past one Maw bite (Maw fires every 0.9 s), so while the Bellow is up your next bite is armed.
  - While you are set up, your Maw bite's hits deal +30% damage (rank 2: +60%). The marker simply expires; the next Bellow strike re-arms it.
- Look: shape star, green (the Body tree's color). Text: "After your Bellow ring strikes, your next Maw bite deals +30% damage. Rank 2: +60%."
- What a Body player gets: a reason to keep the all-around Bellow up — it is not just a second attack, it arms the front bite — and a stronger close-in combo against monsters and against the player who walks into the bite. What it costs: the points to reach Bellow (Maw 3, 3 points, a prestige) before the fork opens.
- Works with every Body build that has Bellow; on a player target the bite still deals half damage as usual, and the +30%/+60% applies to that.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit that changes how a hit lands | Ricochet redirects a Bolt onto a new enemy; the set-up moves nothing, it adds damage to a Maw bite after a Bellow strike |
| Reckless | an on-hit that multiplies damage under a condition | Reckless doubles every hit while you are below half hp; the set-up buffs only Maw bites and is armed by your own Bellow strike, not a hurt state |
| Chill | an on-hit that applies a status to the target | Chill slows whatever it hits; the set-up changes your own next bite and applies no status to the target |
| Reap | an on-hit that adds damage from the target's state | Reap adds damage to a half-dead target with any weapon; the set-up adds damage to one weapon (Maw) from your own prior action |
| Swarm | an on-hit that adds damage from the crowd around the target | Swarm scales by enemies near the target; the set-up is crowd-independent and keyed to your Bellow ring |
| Leech | an on-hit that feeds you back in a crowd | Leech heals while 3+ enemies are near you; the set-up deals more damage and heals nothing |
| Mend | an on-hit that heals on a specific weapon's hit | Mend heals on a Nerve hit; the set-up heals nothing, it empowers a Maw bite |
| Lash | an on-hit that changes one weapon's hit | Lash splits a Horn dart into extra darts; the set-up changes a Maw bite's damage from a Bellow strike and splits nothing |
| Gore | an on-hit that changes one weapon's hit under a condition | Gore extends a Nerve jab's pierce while you are hurt; the set-up extends a Maw bite's damage after your own Bellow strike — a cross-weapon arm, not a hurt state |
| Fizz | an on-hit that leaves a zone where a weapon lands | Fizz lingers the bubble splash as a puddle; the set-up leaves no zone, it arms the next bite |
| Cling | an on-hit that adds a sticky effect to one weapon's hit | Cling makes a Goo splat and cling; the set-up sticks nothing, it boosts the next Maw bite |
| Snare | an on-hit that marks a target so your hits do more | Snare marks the target (sapped) so any of your hits do more; the set-up arms yourself, so one specific weapon (Maw) does more, set up by your own Bellow ring |
| Might | a flat damage stat on every weapon | Might raises all weapons always; the set-up is conditional (armed by a Bellow strike) and applies to Maw only |

## Acceptance criteria
- [ ] In the Body tree, a new "The set-up" talent appears under Bellow (needs Bellow 1, 2 ranks); its row shows "After your Bellow ring strikes, your next Maw bite deals +30% damage. Rank 2: +60%."
- [ ] When a Body player's Bellow ring hits a critter, their next Maw bite deals +30% damage (rank 2: +60%) on top of the normal bite (and half damage on a player, as usual); without a prior Bellow strike the bite is unchanged.
- [ ] The set-up re-arms on each Bellow strike that hits, lasts just past one Maw bite, and adds no visible mark to the critter.
- [ ] A Body build without Bellow (or whose Bellow never hits) gets no set-up bonus; the talent cannot be taken before Bellow 1.

## Rejected by architect (desktop)

The "Compared with what exists" table is missing a row for Glide (src/content/upgrades/glide.ts) — an on-hit that arms yourself with a self status under a condition, the closest existing relative of this self-arming on-hit; every on-hit upgrade must have a row.
