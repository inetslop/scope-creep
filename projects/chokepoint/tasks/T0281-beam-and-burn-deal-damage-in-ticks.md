---
id: T0281
title: Beam and burn deal damage in ticks
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T10:37:56Z
epic: E4
---

## Goal
Beam and burn both deal damage smoothly every frame today. Because of that, nothing can "happen per hit" for them: crits, slows, pushes and damage multipliers all need special-case rules (`core/beamEffects.ts`, `core/beamHold.ts`). Turn both into **ticks**, small discrete hits at a fixed rhythm. Every tick is then an ordinary hit, and every per-hit rule applies to it the same way it applies to a bolt. Burn also gets stronger: its ticks now scale with the burning tower's damage multipliers, so Ember is no longer a fixed, weak number.

## Details
- **One shared tick:** `TICK_SEC = 0.25` (4 ticks per second) in `src/config.ts`, used by both beam and burn.
- **Beam:**
  - A beam line deals its damage as one tick every 0.25 s while it holds its target, each tick worth a quarter of its per-second rate. The total per second is unchanged.
  - The tick clock starts when the line locks on. A line that loses its target mid-tick deals nothing for that partial tick, and the new target starts a fresh clock.
  - Each tick goes through the normal hit path (`EnemySystem`), so it credits kills, gold, Mint, combo and Mark the same as a shot.
  - Bolt rays (T0130) and Lance and Splash beam shapes tick the same way. Rally and Rapid multiply the tick's damage, as they multiply the rate today.
- **Beam effects (replaces the T0132 contact and pulse split):**
  - Each beam tick carries the tower's effects like any hit: Frost's slow, Mark's mark and Ember's burn on every tick.
  - Anchor's root and Push's push land on **every 4th tick**, which is once per second of contact, the same rate as today, so they don't become 4× stronger.
  - Remove the per-frame contact logic and the separate once-a-second pulse clock (`beamHold`), or reduce them to "every Nth tick".
- **Burn:**
  - A burn deals its damage as one tick every 0.25 s for its duration, each tick worth a quarter of its per-second rate. The total over the burn is unchanged at base.
  - Refresh and overtake rules stay as they are: the hotter burn wins and re-ignition refreshes.
- **Burn scales with the burning tower's damage:**
  - Each burn tick is multiplied by that tower's damage multipliers: tier `damageMul`, Rapid's lighter hits (×0.75), the Beam-added boost if that inbox task has landed, and Momentum.
  - Mark already applies to every hit, so it applies to burn ticks for free.
  - Store the multiplier on the burn when it's lit (next to `burnSource`), so a burn keeps its strength after the tower changes.
  - Example: Ember's own 3 per second on a tower with a Common Beam added burns 3.75 per second.
- **Looks:**
  - Each beam tick gives a small hit pulse at the target end of the line: a short brightening of the existing tick mark, not a new effect.
  - Burn ticks keep the current look, with no white flash, as today.
  - No new sounds.
- **Panel:** damage-per-second figures don't change for beams. For burns they include the new multiplier.
- **Tests:**
  - Beam: 4 ticks of rate/4 per second, and kill credit through ticks.
  - Root and push land once per 4 ticks.
  - Burn: total damage over its duration, and the multiplier from Rapid and the Beam boost.
  - Update `beamHold`, `beamEffects`, `beam` and `ember` tests to the tick model.

## Acceptance criteria
- [ ] A Beam deals its damage in ticks every 0.25 s, with the same total per second as before, and each tick credits kills like a shot.
- [ ] Beam ticks apply slow, mark and burn on every tick, and root and push once every 4 ticks.
- [ ] Burns tick every 0.25 s with the same total at base, and are multiplied by the burning tower's damage multipliers (a Rapid-added Ember burns lighter, a Beam-boosted one hotter).
- [ ] A small visible pulse at the beam's target end shows each tick.
- [ ] `npm run check` passes with the reworked tests. Desktop 1280x720 and mobile 412x915 smoke pass.
