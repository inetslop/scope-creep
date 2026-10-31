---
id: T0059
title: "Mend: a Nerve hit heals the more hurt you are"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T11:14:52Z
epic: E15
---

## Goal
The Frenzy tree's second fork under Nerve: a sustain branch, so a hurt Frenzy life can fight at half hp instead of running for regen — the endgame Reckless points to.

## Details
- A new on-hit upgrade "Mend" in the Frenzy tree: a new file in src/content/upgrades/ (registered in its index) plus its talent line in src/content/talents/frenzy.ts.
- Talent line: id mend, upgrade mend, max 3, needs [["nerve", 3]]. The tree as the panel will draw it (T0058 adds Fang under Nerve the same way; add only the Mend line):
  ```
  Frenzy (3)
    Nerve (3, needs Frenzy 1)
      Adrenaline (2, needs Nerve 2)
      Mend (3, needs Nerve 3)
      Reckless (1, needs Nerve 3, Frenzy 3)
  ```
- Text: "On a Nerve hit: heal 1 hp per 10 hp missing. Per rank: +1 per 10 hp missing." maxLevel 3. Look: shape star, color green (#51cf66).
- Each Nerve jab hit heals the attacker for its hp missing divided by 10, per rank: rank 1 heals 1 hp per 10 hp missing (a critter at half of 100 max hp heals 5 hp per hit), rank 2 heals 2 per 10 (10 hp), rank 3 heals 3 per 10 (15 hp). Heals up to max hp, never over.
- Nerve's jab only — the tree's own weapon, the way Cling is Goo-only; Bolt, Maw, Lob, Goo and Slush hits do not heal. The heal does not depend on the jab's damage, so Split's extra (12% weaker) jabs each heal the same, and Reckless doubles the jab's damage but not Mend's heal.
- The heal reads without a new effect: it climbs the hp, and once T0057's wound arc is in the build it makes the arc grow back, vanishing at half hp.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | a heal from your own hits and kills | Chomp is a flat heal (5, 25 on a player) on every kill, any weapon, from the Body tree; Mend ticks on Nerve hits only and grows with your own missing hp |
| Reckless | the Frenzy tree, a hit while you are hurt | Reckless doubles the damage you deal below half hp; Mend heals you per Nerve hit, the more hurt you are — one spends the hurt for damage, the other buys back hp |
| Reap | a hit bonus tied to a hurt critter | Reap reads the enemy's hp (+6 on a hit on a hurt target); Mend reads your own missing hp and heals you |
| Chill | an on-hit effect | Chill slows the target; Mend heals the attacker |
| Ricochet | an on-hit effect | Ricochet bounces a bolt to another enemy; Mend heals you |
| Cling | an on-hit effect tied to one weapon | Cling sticks to the target on a Goo hit and ticks damage; Mend heals the attacker on a Nerve hit |

## Acceptance criteria
- [ ] The panel's Frenzy tab shows Mend under Nerve with its text, 3 ranks, needing Nerve 3.
- [ ] A player with Mend 1 at full hp fights: the jab hits heal nothing.
- [ ] The same player at half of 100 max hp: each Nerve jab hit heals 5 hp (Mend 1), 10 (Mend 2), 15 (Mend 3).
- [ ] Split's extra jabs each heal; Reckless does not change the heal.
- [ ] Mend never heals above max hp.
