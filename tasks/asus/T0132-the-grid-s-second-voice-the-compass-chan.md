---
id: T0132
title: "The Grid's second voice — the compass changes shape at the midpoint"
assignee: asus
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T17:52:12Z
claimed_at: 2026-10-27T20:19:43Z
designer: desktop
---

## Goal
The Grid's second half should play differently from its first: the moment its HP first drops below half, the compass grows a third arm and spins 25% faster — so the fight changes shape at the midpoint instead of just showing a lower bar, and the 50% bar tick (T0118) lands in the same moment as the changed fight.

## Details
- First state: while The Grid's HP is at or above 50% of its (scaled) max HP, the fight is exactly as today — two arms, the current spin speed, the existing telegraphs and damage. Nothing changes.
- The crossing: the moment its HP first drops below 50% of max HP (evaluated after each hit), the second state begins. One small flat ink ring pops at the boss's center (the existing ring FX). No new SFX, no new HUD element, no new key.
- Second state: the Grid grows a **third arm** with the same spec as its existing arms — a 200×12 ink arm, 12 damage, the same 0.5 s red telegraph and the same sweep cadence — phase-locked 90° ahead of the first arm in the boss's own rotation, so the cross becomes a three-spoke asterisk with one quadrant left empty. Its spin becomes 25% faster (the existing rotation speed ×1.25), applied immediately at the crossing, with no ramp.
- The state latches: the second state persists for the rest of this Grid's life even if its HP fraction ever rises back above 50% (nothing heals bosses today, but the rule must not depend on that). A fresh Grid — including a respawn with the existing +50% HP-per-respawn scaling — starts in the first state: two arms, base spin.
- Scope: the Grid's own content def, its pure `gridSweep` timing module (plus its unit tests) and the boss's own update. Do not touch the shared boss system, the boss rotation/schedule, the other bosses (The Frame, The Palette, and The Press — in flight), the boss bar, the boss warning/sting, or the boss-music hold. The small-caps "SECOND STATE" note under the bar is a separate task (see IDEAS) and is not part of this one.

## Acceptance criteria
- [ ] While The Grid's HP is at or above 50% of max, the fight plays exactly as today: two arms, the current spin speed, the existing telegraphs and damage.
- [ ] The first hit that drops it below 50% of max grows the third arm at a right angle to the existing pair (three-spoke asterisk, one empty quadrant) and the spin is 25% faster from that moment; the new arm behaves exactly like the others — 0.5 s red telegraph, 12 damage — and one flat ink ring pops at the crossing.
- [ ] The second state is latched: if the Grid's HP fraction later rises above 50% it keeps three arms and the faster spin; a respawned Grid (with scaled HP) starts in the first state with two arms and base spin.
- [ ] Unit tests in the `gridSweep` pattern pin the rule: 2 arms / 1.0× spin at ≥50% of max HP, 3 arms / 1.25× spin after the first drop below 50%, latched when the fraction rises again, and a fresh boss instance starts in the first state.
- [ ] The Frame, The Palette, and (once The Press lands) The Press are unchanged; the boss bar, warning, sting, nameplate and boss-music hold are untouched; `npm run check` and `npm run smoke` pass on desktop and mobile.
