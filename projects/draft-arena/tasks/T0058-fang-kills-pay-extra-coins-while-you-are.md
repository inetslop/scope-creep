---
id: T0058
title: "Fang: kills pay extra coins while you are below half hp"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T11:14:52Z
epic: E15
---

## Goal
The Frenzy tree's first fork under Nerve: a coin branch, so a thin-and-mean life that lives below half hp can feed the shop while it fights.

## Details
- A new on-kill upgrade "Fang" in the Frenzy tree: a new file in src/content/upgrades/ (registered in its index) plus its talent line in src/content/talents/frenzy.ts.
- Talent line: id fang, upgrade fang, max 2, needs [["nerve", 2]]. The tree as the panel will draw it (T0059 adds Mend under Nerve the same way; add only the Fang line):
  ```
  Frenzy (3)
    Nerve (3, needs Frenzy 1)
      Adrenaline (2, needs Nerve 2)
      Fang (2, needs Nerve 2)
      Reckless (1, needs Nerve 3, Frenzy 3)
  ```
- Text: "On a kill while below half your hp: +2 coins. Per rank: +2 more." maxLevel 2. Look: shape circle, color yellow (#ffd43b) — the coin's own look.
- While the player who owns it is below half hp, each kill credits 2 extra coins per rank (rank 2: 4) on top of the normal kill coins (1 per monster, the victim's level per player knockout), landing in the profile the same way a kill coin lands.
- A kill is a kill: it pays on a kill by any weapon — Bolt, Maw's bite, Lob's splash, Goo (including Cling splat, Chew puddle and Scatter mini-Goo kills), Nerve's jab — the same kill that pays the normal coin.
- It stacks with Adrenaline: the same kill below half hp can sprint and pay.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | an on-kill payout for every weapon | Chomp heals flat hp (5, 25 on a player) on every kill; Fang pays coins, and only while you are below half hp |
| Adrenaline | a kill while below half hp | Adrenaline buys a 1.5–2 s speed burst; Fang buys coins that last between visits, and both can fire on the same kill |
| Fuse | a kill reaction | Fuse only fires on a bubble kill and spends the kill on a damage ring; Fang fires on any kill and pays coins |
| Scatter | a kill reaction | Scatter needs a Goo kill and spends it on 4 seekers; Fang pays on any kill and spends nothing |
| Gush | a Goo kill | Gush marks the ground with a slow puddle; Fang pays coins wherever the kill comes from |
| Chew | a Goo kill on the Gush puddle | Chew makes the puddle bite; Fang pays coins and leaves the puddle alone |

## Acceptance criteria
- [ ] The panel's Frenzy tab shows Fang under Nerve with its text, 2 ranks, needing Nerve 2.
- [ ] A player with Fang 1 at or above half hp kills a monster: only the normal kill coin lands.
- [ ] The same player below half hp kills a monster: the normal coin plus 2 extra land, the coin pop and tick playing as for the kill; with Fang 2, 4 extra.
- [ ] A Fang coin lands on a kill by any weapon, including a splash or a puddle kill.
- [ ] The extra coins show in the start card's balance on the next visit.
