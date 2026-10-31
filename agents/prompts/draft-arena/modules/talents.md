---
summary: the talent trees (how a build grows: one tree per playstyle, each with its own shape). Read before writing or editing any task that adds, changes or removes a talent or a tree.
content: talents
---
# The talent trees

Every level gives a talent point. Points bank, and a player spends them when they like (the Talents button, T on a keyboard) on any talent whose needs are met, in any tree. Every rank of a talent gives one level of its upgrade (planning/modules/upgrades.md). Everyone starts as a nomad with a free rank of Bolt and no choice to make; the first point comes at level 2. A knockout starts a player over.

Each tree is one file in src/content/talents/, listed in TREES:
- **The tree:** `name`, `description` (one line under its name in the panel: the playstyle) and `look` (its tab's icon).
- **A talent** is one line: `id`, `upgrade` (what each rank gives a level of; the talent shows its name, look and text), `max` (ranks), `needs` (other talents of the same tree at a rank: `[['haste', 1]]`), `points` (points spent in this tree first), `start` (free ranks everyone has: only Bolt) and `prestige` (prestiges this life before it can be taken: planning/modules/prestige.md).
- **A tree's shape comes only from its talents' needs.** The panel draws each talent under the first talent it needs, joined by a line, and writes what it still needs on it. There are no shared tiers: every tree branches, merges or stays flat its own way, and is balanced on its own.
- **Mods first, weapons deeper.** Talents that need nothing are cheap mods that help any weapon; a tree's weapon and capstone ask for commitment first.

## The bar
- **A tree is a playstyle** the others don't offer: its own weapon or its own way to use weapons, its own shape, and a capstone that changes how it plays. Not a second tree of the same stats.
- **A talent belongs to its tree's playstyle,** and its text says why a player of that tree wants it.
- **Choices inside a tree:** prefer forks (two talents that pull the tree different ways, which a player can't both have early) over another plain rank of the same thing.
- **A capstone** (an upgrade with `maxLevel: 1`) asks for real commitment, most of its tree's points, and changes how the tree plays, not just its numbers.
- **It fits the panel:** 4 to 10 talents in a tree (more is two playstyles: split it), and at most 6 trees. Past that, the same task (or one before it) removes or merges one and says which.
- **The tests enforce:** needs point at talents of the same tree, every talent can be reached, every upgrade is in a tree, and an upgrade's talents add up to no more ranks than its `maxLevel`.

## A task that adds or changes a tree
- The exact talent lines (id, upgrade, max, needs, points) and where each goes in the tree's file: talents that need nothing first, each other one after what it needs.
- The tree as the panel will draw it, one talent per line, indented under the talent it needs:
  ```
  Haste (3)
    Bolt (5, needs Haste 1)
      Split (2, needs Bolt 2)
      Ricochet (1, needs Bolt 4)
  ```
- What a player of that tree gets, and what it costs them: the points to reach it, and what else those points could buy.
- For a new tree: its upgrades (planning/modules/upgrades.md), and a "## Compared with what exists" table with one row per tree: what it shares, and the playstyle it gives that the other can't.

## Not in this game
The owner removed these. Don't propose them again, or anything that works the same way.
- A pick of 3 random upgrades at every level up (the first version): everyone ended up a battleship firing every weapon at once. Trees make a build commit to a playstyle.
- A choice at level 1: everyone starts the same, as a nomad.
- A hex talent map shared by every build: the owner preferred trees that each have their own shape.
- Tiers or groups that every tree shares (a row of mods, then a weapon, then a capstone): each tree has its own structure.
- A tree of plain stats (Body: faster, tougher, stronger, gems from further away): a tree is a playstyle. Stats live inside playstyle trees, where they serve that playstyle.
