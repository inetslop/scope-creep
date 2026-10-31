---
id: T0054
title: "Frenzy tree: a fifth playstyle, thin and mean, that hits harder the more hurt you are"
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T10:47:58Z
epic: E13
---

## Goal
A fifth talent tree and playstyle: Frenzy trades max HP for damage, and everything in the tree pays out while the player is hurt — a life that deliberately runs at half HP instead of playing safe. Replacement for T0053, whose Sprint (speed only below half HP, per rank) the frozen engine cannot express; Adrenaline takes its place as the hurt-fueled sprint, built from pieces the engine already has (an on-kill effect reaching the killer, a status with a speed multiplier).

## Details
A new tree file `src/content/talents/frenzy.ts`: name "Frenzy", description "Thin and mean: the more hurt you are, the harder you hit.", look: shape diamond, color red. Four talents, drawn in the panel as:

```
Frenzy (3)
  Nerve (3, needs Frenzy 1)
    Adrenaline (2, needs Nerve 2)
    Reckless (1, needs Frenzy 3 and Nerve 3)
```

- **Frenzy** (upgrade `frenzy`), max 3, needs nothing. Stats, per rank: −8 max hp, +12% damage. Text: "Trade 8 max hp for 12% damage, per rank." Look: red pentagon.
- **Nerve** (upgrade `nerve`), max 3, needs Frenzy 1. A weapon: every 0.8 s, if an enemy is within 180, a jab — a small pale ice pointed dart, straight, 360 u/s, gone on hit or after 0.5 s (if Split fans more darts, they move by a path like Split bolts). Damage: 5 + 2 per rank above the first + 1 per 10 hp the player is missing (floored). Text: "Every 0.8 s, a jab at the nearest enemy within 180. Hits harder the more hurt you are: +1 damage per 10 hp missing. Each rank: +2 damage." Look: ice diamond.
  - Which mods apply to it: it is a projectile, so damage stats (Might, Frenzy, Split's weakening), Haste (fires sooner), Quick (darts fly faster), Split (one more dart, fanned, all darts 12% weaker per rank), Lance (darts go through 1 more enemy per rank), and every on-hit effect (Chill slows, Reap's bonus below-half-hp target); Cling does nothing with it (Goo only).
- **Adrenaline** (upgrade `adrenaline`), max 2, needs Nerve 2. On-kill: on a kill, if the killer is below half its max hp, the killer gains a "Wired" status: rank 1 +20% move speed for 1.5 s, rank 2 +30% for 2 s, refreshed by each kill. Two status defs, like Chill 1/2/3; the status is applied to the killer the same way Chomp's heal reaches the killer. A small yellow tick puff on the critter when the speed lands (a new effect, as small as the slow-pop). Text: "On a kill while below half your hp: +20% move speed for 1.5 s, refreshed on each kill. Rank 2: +30% for 2 s." Look: red star.
- **Reckless** (upgrade `reckless`), max 1 (capstone), needs Frenzy 3 and Nerve 3. On-hit: while the player is below half its max hp, each of its hits deals its damage twice — an extra copy of the hit's damage, exactly the Reap pattern. Text: "While below half your hp, your hits hit twice as hard." Look: red circle.

What a Frenzy player gets and pays: Reckless costs 6 points (all of Frenzy and Nerve) — six points that could instead buy three ranks of Bolt with Lance, or start a Maw build. The build lives below half hp: Nerve's jabs bite harder there, Reckless doubles every weapon there, and Adrenaline turns each kill there into a speed burst to stay in the fight.

## Acceptance criteria
- [ ] A fifth tab "Frenzy" (a red diamond) appears in the talents panel, with the four talents drawn in the shape above and each showing its text.
- [ ] Buying Frenzy 3 leaves the player 24 max hp shorter and dealing 36% more damage from every weapon.
- [ ] Nerve only jabs when an enemy is within 180, fires a pale ice dart every 0.8 s, and a rank-3 Nerve jab at 20 hp missing deals 11 damage (5 + 4 + 2).
- [ ] Below half hp, a kill with Adrenaline makes the killer visibly run 20% faster for 1.5 s (30% for 2 s at rank 2), with a small yellow tick puff; a kill while above half hp gives nothing.
- [ ] With Reckless, while below half hp every hit from every weapon deals double damage; above half hp nothing changes.
- [ ] Bots take the tree like the others; a knockout resets it like every tree.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

Trees (one row per tree):

| Existing | What it shares | What Frenzy does that it can't (not numbers) |
| --- | --- | --- |
| Gunner | a committed build around a self-aiming weapon | kites at full hp with volleys; Frenzy wants to be hurt — its stats sell hp for damage and its jab and capstone only pay out below half hp |
| Body | stat mods that work with every weapon, and a kill reward (Chomp) | Chomp heals on every kill at any hp while the tree grows thicker; Frenzy grows meaner while hurt and its kill reward is speed, only when the kill is made while hurt |
| Lobber | a self-aiming weapon with commitment behind it | controls space from range and never asks to be hurt; Frenzy is a close-range all-in that asks the player to live below half hp |
| Goober | a self-aiming weapon with kill-triggered payoffs | Gush and Scatter fire on every Goo kill at any hp; Adrenaline and Reckless only work while the player itself is hurt |

Nerve, against every weapon:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a self-aiming straight shot | Bolt kites at long range at any hp; Nerve only fires within 180 and gets harder the more hurt the shooter is |
| Maw | a close-range attack | Maw bites in front of you at any hp; Nerve throws a dart that reaches 180 and its damage is the shooter's own missing hp |
| Lob | a self-aiming thrown shot | Lob splashes from range and marks the ground; Nerve is a close-range jab that never touches the ground |
| Goo | a self-aiming lob that finds the nearest enemy | Goo hits at range for fixed damage; Nerve is a weak close jab that grows with the damage the shooter took |
| Slush | a self-aiming straight shot | Slush zones the ground from 240; Nerve leaves nothing on the ground and is only strong while the shooter is hurt |

Adrenaline, against every on-kill:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a reward on kill | Chomp heals on every kill at any hp; Adrenaline only pays below half hp and pays speed, not hp |
| Fuse | a payoff when your own weapon kills | Fuse pops a damage ring where the bubble kills; Adrenaline changes how the killer moves and puts nothing on the field |
| Scatter | a kill that spawns more of your own | Scatter adds homing shots on a Goo kill; Adrenaline adds nothing to the field, only a timed speed burst on the killer |
| Gush | a kill that marks the spot | Gush leaves a slow puddle where a Goo kills; Adrenaline is a status on the killer that a puddle can't give |

Reckless, against every on-hit:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | a change to what a hit does | Ricochet bounces a bolt on to another enemy; Reckless re-deals the same hit's damage, only while the shooter is hurt |
| Chill | an on-hit effect | Chill slows the target; Reckless changes the damage of the hit itself and never touches the target's state |
| Reap | bonus damage on a hit, under a condition | Reap's condition is the target below half its hp; Reckless's is the shooter below half its hp, and it doubles the whole hit |
| Cling | an on-hit effect from one weapon | Cling splats Goo on its target; Reckless works with every weapon the player has |

Frenzy, against the same-stat upgrades:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Might | raises damage | Might only adds damage; Frenzy sells 8 max hp for it, so a Frenzy build deliberately keeps less cushion |
| Vigor | raises max hp | Vigor buys a bigger cushion and regen; Frenzy sells cushion for damage — the two pull a build in opposite directions |
