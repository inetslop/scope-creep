---
id: T0120
title: Heavy burst — the Inkwell burst is a boss tool
assignee: desktop-4070
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
Saving the Inkwell meter (T0090) for a boss fight becomes a real decision: while a burst's projectiles are still out on the page, your volleys hit bosses and elites much harder.

## Details
- The burst window: from the moment an Inkwell burst fires until the last projectile of that burst is gone (killed, off-screen or absorbed), the player is "in burst".
- While in burst, the player's volley projectiles (the Point, Line, Arc and Counterpoint volleys — the standard projectile hits) deal +50% damage to bosses and elites only; hits on normal enemies are unchanged. The rule composes on top of the existing damage multipliers (damage upgrades, crits, Underexposure (T0105)) as an extra ×1.5.
- Fixed-damage effects are out of scope: the Orbit's contact damage is unaffected, and any other non-volley damage is untouched.
- The burst itself is unchanged: the same 3× projectiles, 2× knockback, deeper shoot sound and ink ring. No new HUD element, key, scene or sound.
- No boss attack changes: a burst hit stuns nothing (the stun variant stays in IDEAS, held until after The Press (T0116) lands).
- The rule lives as a pure, unit-tested helper in the combat path, in the pattern of `src/core/underexposure.ts`: given (in burst?, target is boss or elite?) → the multiplier.

## Acceptance criteria
- [ ] While any projectile of the last Inkwell burst is still on screen, volley hits on bosses and elites deal exactly 50% more damage than the same volley without the burst; hits on normal enemies are unchanged.
- [ ] The moment the last burst projectile is gone, damage returns to normal; a burst spent against normal enemies changes nothing about their damage taken.
- [ ] The burst still fires 3× projectiles with 2× knockback, the deeper sound and the ink ring; the Orbit's contact damage is unaffected; no new HUD element, key, scene or sound; no boss attack pattern changes.
- [ ] A new pure unit test locks the rule (in burst + boss/elite ×1.5, in burst + normal ×1.0, out of burst + boss ×1.0) and the existing tests stay green.
- [ ] `npm run check` and `npm run smoke` pass.
