---
summary: enemies (what walks the road; waves are built from them). Read before writing or editing any task that adds, changes, removes or merges an enemy.
content: enemies
group_by: [behavior]
---
# Enemies

Enemies walk the road from the entrance to the exit. Each is data:
- **behavior:** how it moves: `walk` (steady along the road) or `dash` (crawl, stop with a white telegraph, then surge; tuned by `dashCycle`). A new way of moving is a new behavior.
- **Extra mechanics** are fields on top of the behavior: `speedRamp` (faster each time it is hit, Sprinter), `splitsInto` (splits into two of another enemy on death, Splitter), `spawnOnly` (never in a wave's mix: only appears from a split). Reactions to kills, leaks or every frame of a wave (the Hauler, the Mute) are enemy hooks: their names and descriptions say what they do.
- **Numbers:** `hp` at wave 1 (waves scale it), `speed` in cells per second, `gold` for the kill, `livesCost` when it leaks, `threat` (what it costs a wave's budget), `fromWave` (the first wave it can appear in).
- **Look:** shape, color (warm: red, orange, purple, pink) and size.

## The bar for a new enemy
- **A behavior or mechanic no existing enemy has:** a new way to move, survive, or interact with towers or other enemies. New hp, speed, size, shape or color on an existing behavior is not a new enemy. Use the descriptions under "What exists now": they say what each one does beyond its numbers.
- **It reads at a glance:** its look tells the player what it does (a plate on the front, a ring, a telegraph) before it does it.
- **At most 10 regular enemy types** (`spawnOnly` ones don't count). Past that, remove or merge one in the same task or one before it.

## A task that adds or changes an enemy
Next to the usual sections, it has:
- Its exact numbers (hp, speed, gold, livesCost, threat, fromWave, and how often it comes), and its look.
- What counters it, and what it punishes (a build, a placement, a habit).
- **## Compared with what exists:** a table with one row for every enemy with the same behavior, and every enemy it names as similar:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Block | `walk`, slow and tough | ... |

A missing row, or a row whose difference is only numbers, gets the task rejected by the architect.
