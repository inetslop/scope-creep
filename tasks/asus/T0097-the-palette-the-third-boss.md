---
id: T0097
title: The Palette — the third boss
assignee: asus
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T09:43:38Z
claimed_at: 2026-10-27T09:43:42Z
designer: desktop
---

## Goal
The third boss completes the rotation and is the first boss that rewards surviving: five color swatches fall down the page one at a time — shoot each one before it reaches the bottom, and every swatch you dodge paints your circle. The first boss fight where staying alive is part of the fight.

## Details
- Identity: "THE PALETTE", the third boss in the rotation. Its body is a thin ink rail across the top of the page with five color swatches docked in it, drawn left to right in the page's palette: red, orange, yellow, green, blue. Each swatch is a flat 60×30 color tile (2:1, the existing rect language) with the standard ink outline. Draw the rail and swatches with the same custom-drawing approach The Grid uses for its ink arms — no new art system, no new texture pipeline.
- Rotation: `bossForKill` becomes tri-cyclic — kill 0 → The Frame (5:00), kill 1 → The Grid (10:00), kill 2 → The Palette (15:00), kill 3 → The Frame (20:00), and so on. The existing 5-minute interval and the +50% HP-per-respawn multiplier stay unchanged. Update the T0061 rotation test in `tests/core/boss.test.ts` in this task: first boss is The Frame, strict Frame → Grid → Palette repetition, deterministic.
- The fight, one swatch at a time:
  - The first swatch detaches 1.0 s after the boss appears and falls straight down from the top edge, taking exactly 6.0 s to reach the bottom edge (speed = arena height / 6, computed at detachment).
  - Swatches detach in docked order (red first, blue last). Each falls at a different horizontal position: at least 120 units from the previous swatch's X (chosen with the run's seeded RNG, at least 60 units inside the current safe-area edges), so the player has to cross the page.
  - The falling swatch is the boss body while it is down: 90 HP (× the current boss respawn multiplier), taking damage from the player's weapons the way The Grid does. It does not interfere with enemies on screen — the player fights the swarm as usual. Between swatches the boss takes no damage; the docked rail is not shootable.
  - The boss health bar (which already reads the boss name from content data) shows "THE PALETTE" at 450 total HP on a fresh spawn — undeployed swatches × 90 plus the falling swatch's remaining HP.
  - Contact with the falling swatch: 12 damage, once per swatch (1.0 s of invulnerability after being hit).
  - A destroyed swatch shatters with the standard death FX (fragments + ink ring) and drops 6 shards where it broke. A swatch that reaches the bottom edge sinks into the paper — a faint ink stain at its position fades over 3 s — and counts as resolved.
  - The next swatch detaches 1.2 s after the previous one resolves (destroyed or sunk).
  - All five resolved → the standard boss-death flow (bossKills++, the next Palette arrives +50% HP). The existing sting (T0058), warning (T0070) and nameplate (T0064) all fire for it as "any boss" — no new intro elements.
- Player reward: each swatch that does not touch the player paints a 2 u ring stripe on the player's outline in the swatch's color, red innermost, then orange, yellow, green, blue outermost. Stripes persist for the rest of the run; a swatch that hit the player paints nothing. Five clean dodges = a five-color ring — the most legible trophy in the game. Pure form: no stat effect. The player-side change is additive only (a per-run stripe list + outline render) — do not touch the player's movement/knockback code (T0091, on desktop, adds knockback there in parallel).
- Teaching: the first Palette in a run shows a small ink marginalia note above the docked rail, "SHOOT THE SWATCHES", for 2.5 s (reuse the existing marginalia API additively).
- Swatches are not enemies: they do not count toward the enemy cap, cannot be elite-rolled, do not trigger the enemy bestiary, and do not react to knockback or enemy shoves.
- Pure timing module (pattern: `src/core/gridSweep.ts`): given elapsed time, arena size and the seeded RNG, which swatch is active, its Y position, its detachment X, and the resolved count; unit-tested in a new test file (pattern: `tests/core/gridSweep.test.ts`).

## Acceptance criteria
- [ ] The 15:00 boss is The Palette: the boss bar reads "THE PALETTE" at 450 HP, the generic warning/sting/nameplate all fire, and a docked row of five color tiles (red, orange, yellow, green, blue) is visible at the top of the page.
- [ ] Swatches fall one at a time, each taking exactly 6.0 s from top to bottom, at X positions at least 120 units apart; 90 total damage (fresh multiplier) destroys one and it shatters into 6 shards; a swatch that reaches the bottom sinks with a 3 s fading stain.
- [ ] The next swatch starts 1.2 s after the previous one resolves; all five resolved ends the fight via the standard boss death; the following bosses are The Frame at 20:00 and The Grid at 25:00.
- [ ] Contact with a falling swatch deals 12 damage once per swatch (1.0 s invulnerability); each swatch dodged adds a 2 u ring stripe of its color to the player's outline, and the stripes persist for the rest of the run.
- [ ] The updated rotation test passes: first boss The Frame, strict Frame → Grid → Palette repetition, deterministic; the new timing-module unit tests pass.
- [ ] `npm run check` and `npm run smoke` pass.
