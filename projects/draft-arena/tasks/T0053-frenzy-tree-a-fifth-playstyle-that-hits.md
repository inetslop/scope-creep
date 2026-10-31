---
id: T0053
title: "Frenzy tree: a fifth playstyle that hits harder the more hurt you are"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T10:32:35Z
claimed_at: 2026-10-31T10:32:39Z
epic: E13
designer: desktop
---

## Goal
A fifth talent tree with its own playstyle: Frenzy is thin and mean — it trades max HP for damage, and a player who is hurt hits harder, so a Frenzy life wants to stay at half HP instead of playing safe.

## Details
- A new tree "Frenzy" (id frenzy), one file in the talents registry like the other four. Description: "Thin and mean: less life, harder hits, and a meaner jab while you're hurt." Look: a triangle, color #ff6b6b.
- The talents (exact lines), the tree as the panel will draw it:
  ```
  Frenzy (3)
    Nerve (4, needs Frenzy 1)
      Sprint (2, needs Nerve 1)
    Reckless (1, needs Frenzy 3, Nerve 3)
  ```
  - id frenzy, upgrade frenzy, max 3
  - id nerve, upgrade nerve, max 4, needs [["frenzy", 1]]
  - id sprint, upgrade sprint, max 2, needs [["nerve", 1]]
  - id reckless, upgrade reckless, max 1, needs [["frenzy", 3], ["nerve", 3]]
- The upgrades:
  - Frenzy (maxLevel 3): "Take 8 less max HP, deal 12% more damage, per rank." A stats upgrade (maxHp -8, damage +0.12 per level). A mod for every weapon: the damage % applies to whatever you fire (Bolt, Maw, Lob, Goo, Slush); the HP cost is on you.
  - Nerve (maxLevel 4): the tree's weapon. "Every 0.8 s, a quick jab at the nearest enemy within 180: 5 damage, plus 1 damage for every 10 HP below max. Each rank: +2 base damage." A thin ice dart projectile, 420 u/s, straight by path (no homing, no step), gone on hit or after 0.45 s. It does not fire while no enemy is within 180.
    - Mods that apply to Nerve: Haste (fires sooner), Might (+12% damage on top of the hurt bonus), Quick (the dart flies 15% faster per rank), Split (one more fanned jab per rank, shots 12% weaker), Lance (goes through 1 more enemy per rank), Reap and Chill (their on-hit effects run on its hits). The Bolt-only and Goo-kill things (Ricochet, Gush, Scatter, Cling, Chew) do not apply.
  - Sprint (maxLevel 2): "While below half your max HP, +15 move speed, per rank." A stats upgrade (speed 15) that only counts while the player is below half max HP; it switches off when they heal back above it.
  - Reckless (maxLevel 1): the capstone. "While below half your max HP, your damage is doubled." Applies to every weapon; it switches off when the player heals back above half.
- What a Frenzy player gets and what it costs: 10 points to full the tree (levels 2 to 11). A full tree is 24 less max HP (100 to 76), +36% damage from the mod, the hurt-scaled jab, and doubled damage below half HP — the most dangerous moment of a Frenzy life is its most fragile one. The same 10 points buy a full Goober tree (a safe homing finisher) instead.
- Files: the tree file, four upgrade files, one projectile file (the dart), and a one-line registry entry in each of the talents, upgrades and projectiles registries — the closest example is the Goober tree (one tree file plus its upgrades, projectile and status registries).
- ## Compared with what exists
  | Existing | What it shares | What the new one does that it can't (not numbers) |
  | --- | --- | --- |
  | Gunner | a tree of mods and a weapon | kites at range with bolts that grow with rank; Frenzy trades life for damage and gets meaner while hurt |
  | Body | stat talents and a weapon | flat positive stats and a forward bite; Frenzy's stats cost max HP and its weapon scales with missing HP |
  | Lobber | a zone weapon and kill effects | splashes the ground into slow zones; Frenzy lays nothing down — its danger is the player itself |
  | Goober | a self-aiming weapon and on-kill effects | kills chain into puddles, seekers and a rider; Frenzy pays while the fight is going and you are hurt, not on the kill |
  | Bolt | a self-aiming weapon at the nearest enemy | flat +4 damage per rank and multi-bolts; Nerve's damage grows with the player's missing HP |
  | Maw | a close-range weapon | a forward crescent that eats everything in front; Nerve is a single-target jab gated to 180 |
  | Lob | a self-aiming weapon | an arcing bubble that splashes where it lands; Nerve is a fast straight hit that marks nothing |
  | Goo | a self-aiming weapon with a range gate | a big drop that turns in flight to catch you; Nerve's dart flies straight and gives up at 180 |
  | Slush | a self-aiming area weapon | a lobe that leaves a slow puddle; Nerve leaves no zone at all |
  | Might | raises damage | +12% damage for free; Frenzy's +12% costs 8 max HP per rank |
  | Vigor | raises max HP | +25 max HP for free; Frenzy takes max HP away in exchange for damage |
  | Swift | raises speed | +20 speed at all times; Sprint's +15 only works below half max HP |
  | Reap | a conditional damage bonus | the bonus is gated by the enemy being below half its HP; Reckless is gated by the player being below half theirs |

## Acceptance criteria
- [ ] The talents panel shows a fifth tab, Frenzy, with the four talents in the shape above; every talent is reachable and the panel writes what each still needs.
- [ ] Taking a rank of Frenzy lowers max HP by 8 and raises all weapon damage by 12%, per rank, and the change is visible in play.
- [ ] Nerve fires every 0.8 s at the nearest enemy within 180 while one is in range, and a jab lands for base (5 + 2 per extra rank) plus 1 per full 10 HP below max.
- [ ] Sprint's speed and Reckless's doubled damage are only on while the player is below half max HP, and switch off the moment they heal back above it.
- [ ] The tree's own tests pass: needs point at talents of the same tree, every talent is reachable, and every upgrade is in a tree.
