---
summary: augments (the draft's cards; what towers are made of). Read before writing or editing any task that adds, changes, removes or merges an augment.
content: augments
group_by: [first.kind, added]
---
# Augments

Towers have no types: a tower is the augments in its slots. Every augment has two forms:
- **First form** (`first`): what the tower does when this augment goes into its first slot. Its `kind` is the tower's attack: `shot` (projectiles at one enemy each), `spray` (a shot that splits into homing needles), `pulse` (hits everything in range at once, around the tower), `beam` (a continuous line, never fires), `burn` (sets ablaze), `mark` (marked enemies take more damage), `rally` (support: nearby towers attack faster). Plus its damage, range (cells), rate (attacks per second) and any effect fields.
- **Added form** (`added`): the change it makes when put into any later slot of any tower. The field names say what it changes: `extraShots`, `pierce`, `splash`, `rateMul`/`damageMul`, `rangeMul`, `slow`, `root`, `burn`, `push`, `mark`, `beam`, `spray`, `rally`, `goldPerKill`.
- **Tiers:** every card rolls Common, Rare or Epic; `tiers` lists what Rare and Epic change. `tier: epic` means the augment only ever comes as an Epic. `opening: true` lets a support augment be offered in the first draft.
- **Look:** `look` is its icon (shape, color, size); the tower shows it too (a barrel, a ring, ticks...). Two augments never share the same shape and color.

## The bar for a new augment
- **Both forms are new.** Use the index under "What exists now": if the new first form has the same `kind` as an existing augment, say exactly what it does that they don't (not "more range", "slower but harder", "no cap": those are numbers). If the new added form changes the same fields as an existing one, it is a copy of that one: `rangeMul` is Reach, `extraShots` is Bolt.
- **The added form says what it does on every attack kind.** "Hits do X" means nothing on a `beam` (no hits), `rally` or a 0-damage support tower. Write one line per kind where it differs, or say it does nothing there and why that is acceptable. (Beam shipped ignoring almost every added augment because of this.)
- **It matters in play now**, not only under conditions the game doesn't have.
- **Rarity matters in both forms.** Rare beats Common and Epic beats Rare as a first augment and when added, and each tier's card line states its own numbers (Lance adds +1, +2, +3 pierce).
- **At most 16 augments.** Past that, the same task (or one before it) removes or merges one and says which.

## A task that adds or changes an augment
Next to the usual sections, it has:
- **Card lines:** `asTower` and `asAdded`, exact, with numbers per tier.
- **## Compared with what exists:** a table with one row for every augment that shares its first form's `kind`, every augment whose added form changes the same fields, and every augment it names as similar:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Splash | `kind pulse`, hits around the tower | ... |

A missing row, or a row whose difference is only numbers, gets the task rejected by the architect.

## Not in this game
The owner removed these. Don't propose them again, or anything that works the same way.
- Lead: shots that aim ahead of the enemy. Shots home in and never miss, so it only added a way to miss.
- Pulse (T0089): Splash without its cap, plus Reach's added form.
- Ricochet (T0038): shots bouncing off the board's rocks. Hard to read, and Chain already leaps between enemies.
