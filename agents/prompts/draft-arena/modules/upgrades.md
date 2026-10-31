---
summary: upgrades (what talents give: weapons, mods for every weapon, on-hit and on-kill effects, stats, capstones). Read before writing or editing any task that adds, changes, removes or merges an upgrade.
content: upgrades
group_by: [stats]
---
# Upgrades

An upgrade is what a talent gives: every rank of a talent is one level of its upgrade, up to its `maxLevel`. Players get upgrades no other way, so every upgrade is in a tree (planning/modules/talents.md). Each is one file in src/content/upgrades/: a `name`, a `description` (shown on its talent in the panel), `maxLevel`, a `look` (its icon), and what it does:
- **A weapon** (`cooldown` and `fire`): fires by itself every `cooldown` seconds (shorter with the `cooldown` stat), aimed by its own code. It fires projectiles (each kind a file in src/content/projectiles/, with any motion and any look) or lays areas (fields on the ground, or around you, that act on what is inside every `interval`). Everyone has Bolt.
- **On-hit and on-kill** (`onHit`, `onKill`): run after every hit or kill by the player's projectiles and areas (Ricochet).
- **Stats** (`stats`, added per level): maxHp, speed, regen, damage, cooldown, area, projectileSpeed, pickup, armor, pierce and shots. The engine adds pierce and shots to every projectile of every weapon, so those two are mods for any weapon that fires projectiles.
- **Capstones** (`maxLevel: 1`) come after real commitment in their tree and change how it plays (Ricochet is Gunner's).

Weapons hit other players too, at half damage (planning/modules/match.md). Under "What exists now", code shows as "(code)": `fire` makes a weapon, `onHit` and `onKill` react to hits and kills, and the description says what each does.

## The bar for a new upgrade
- **It changes how you play or combines in a new way.** Another weapon that only differs in numbers, or a stat an existing upgrade already raises, is not a new upgrade. Upgrades in one row of the `stats` index raise the same stats.
- **A mod says what it does with every weapon.** A stat, on-hit or on-kill effect works on all weapons, not just Bolt: say what it does with each weapon under "What exists now" (one line per weapon where it differs), or that it does nothing there and why that's fine.
- **A weapon says what every mod does to it.** pierce and shots apply to projectiles only; on-hit effects run on its hits. A weapon that ignores most mods leaves its player's points dead: say which apply and which don't.
- **It matters in play now,** in a crowd of monsters and against other players, not only under conditions the game doesn't have. A status or effect that lands on monsters lands on players too: say what it does to a player.
- **Its text says what it does and what each rank adds,** in one or two short sentences with the numbers. It shows on the talent's row in the panel at 412x915.
- **Many shots move by a path.** A projectile fired in numbers moves by `path()`, computed on every client from its launch (cheap). Homing or bouncing ones use `step()` and are sent every tick: say how many can be alive at once per player.
- **It reads in a crowd:** shots are candy things (stars, bubbles, drops) in cool colors (teal, blue, ice; yellow for Bolt), with a shape that tells them apart from the others and from monsters.

## A task that adds or changes an upgrade
Next to the usual sections, it has:
- Its name, text, maxLevel and exact numbers per rank (damage, cooldown, radius, count, speed), and its talent line: the tree, max ranks, needs, points.
- For a weapon: how it aims, how its shots move and look, and which mods apply to it.
- For a mod, on-hit or on-kill: what it does with every weapon.
- **## Compared with what exists:** a table with one row for every upgrade of the same kind (every weapon for a weapon, every on-hit or on-kill for one, every upgrade that raises the same stat), and every upgrade it names as similar:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Split | more shots for every weapon | ... |

A missing row, or a row whose difference is only numbers, gets the task rejected by the architect.

## Not in this game
(nothing removed yet)
