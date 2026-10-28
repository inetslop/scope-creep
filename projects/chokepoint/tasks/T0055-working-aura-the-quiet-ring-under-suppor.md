---
id: T0055
title: "Working aura: the quiet ring under support towers when their aura works"
size: S
priority: 3
status: design
depends_on: [T0039, T0027]
attempts: 0
created: 2026-10-28T13:04:03Z
epic: E4
---

## Goal
A tower that never fires gives no sign of life until something happens: a quiet ring at the base of a pure Anchor or pure Mint tower, each time its aura does its job, makes a tower that never fires visibly working.

## Details
- **The ring:** a thin rounded ring on the ground around the tower's base, in the tower's own color (a tower takes its first augment's color), growing from the plinth out to about a 1-cell radius and fading over ~1 s. Quiet: no sound, no glow, no screen effect.
- **When it plays:**
  - A tower whose first augment is Anchor: with each root pulse, the moment the pulse lands.
  - A tower whose first augment is Mint: each time its aura pays a kill's +1 gold — the same beat as the gold's pop (T0039), at the tower's base. One ring per paying kill, even when the tower pays several +1 at once.
- **When it does not:** Rally towers show no ring — their effect (faster attacks) is visible on the rallied towers firing. A tower with an attacking first augment (e.g. Bolt + Anchor) shows no ring — its added aura works on every hit, which is visible on the enemy.
- No change to aura values, gold, sounds, the HUD, the waves, the draft or the profile. No new HUD element.

## Acceptance criteria
- [ ] A pure Anchor tower plays a fading ring at its base on every root pulse; a pure Mint tower plays one ring at its base each time its aura pays a kill's +1 gold.
- [ ] Rally towers and towers whose first augment has an attack show no ring at all.
- [ ] The ring is in the tower's own color, ~1-cell radius, ~1 s fade, and silent.
- [ ] Aura values, gold, sounds and the layout are otherwise unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0066: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. The Mint ring is an enemy hook (`onKill`, with `core/mint.ts`'s payers) and the ring itself an effect file in `systems/fx/`; only the Anchor ring still needs `TowerSystem` (when its pulse lands). No `EnemySystem` or `FxSystem` edit.
