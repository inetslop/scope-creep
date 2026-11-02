---
id: T0393
title: "The tower shows its reach: the selected tower's range ring"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T00:29:33Z
---

## Goal
While a tower's panel is open, the selected tower wears its range ring on the board — the same ring the player sees while placing — so "does this tower cover that stretch of road, that crossing?" is an answer you see, not a number you estimate. With the sky crossing in the game (E10), reach is a question the player asks every build.

## Details
- The moment a tower's panel opens, a thin ring appears at the tower's base with radius exactly the tower's current range — the same number the panel's stats line already says. It uses the placement ring's own painter and look (the what-if ghost, T0096, already reuses that ring), so it reads as the same object the player knows from placing.
- Support towers wear their aura's reach the same way: a Rally's ring shows which towers it speeds, a Mint's which kills it pays. A Beam wears its beam's reach.
- The ring is a readout, not an event: no pulse, no sound, it never blocks input, enemies and shots pass through it. It stays for as long as the panel is open, and fades out over ~150 ms the moment the panel closes (tap elsewhere or deselect).
- While the panel is open, if the tower commits a slot that changes its range (a Reach), the ring matches the panel's new number.
- If E15's move state (T0382) is in when this lands: the reach ring keeps showing the tower's current reach at its current cell while the move's own ring shows the tapped destination — two rings, two questions.
- Why the screen has room: the panel already says the range as a number, but nothing shows the reach as space on the board while inspecting (the placement ring does it only while placing; the "On screen" and "Systems" lists have no selected-tower ring). The ring is conditional — with no tower selected the board is byte-identical to today — and it teaches with a ring the player already knows, so no new mark, text or key.
- Shape: a new small board-FX system for the ring's state and fade (closest examples: systems/towerGhost.ts and systems/PushWindup.ts), hooked where the tower panel opens and closes (Building owns the selection); it reuses the placement ring's painter, no new art.

## Acceptance criteria
- [ ] Tapping any tower opens its panel and, with it, a thin ring at its base with radius exactly the tower's range stat, in the placement ring's look.
- [ ] The ring stays for the whole time the panel is open — through a wave and 2x speed, with enemies crossing it — and fades out over ~150 ms the moment the panel closes; with no tower selected the board is identical to before this task.
- [ ] A support tower (a Rally, a Mint) shows its aura's reach and a Beam its beam's reach; after committing a slot that changes the range, the ring matches the panel's new number.
- [ ] No new button, key or HUD element; the pause screen's controls list is unchanged; the ring is readable at the default zoom on 412x915 and 1280x720.
