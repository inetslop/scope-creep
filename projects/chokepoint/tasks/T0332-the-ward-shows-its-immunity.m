---
id: T0332
title: The Ward shows its immunity: a muted ring when a control does not take
size: S
priority: 3
status: design
depends_on: []
---

## Goal
When a push, a root or a slow lands on a Ward and does nothing, a small muted ring at its base says so — the Ward's "slow, roots and gusts do not touch it" is visible where it happens, not only in the enemies reference.

## Details
- The hook rides the control-apply path T0301's module owns — the one place a Push gust, an Anchor root or a Frost slow is applied and then dropped for the Ward's immunity: the moment that drop happens, one small muted-gray ring at the Ward's base expands over ~0.4 s and fades (the enemy-hooks ring size class; the Mute's silence ring, T0219, is the closest example on screen).
- Display only: no sound, and no number changes — the Ward's hp, T0301's control-fatigue meter, and the control's effect on every other enemy are all untouched.
- One ring per failed application: three controls landing on one Ward in a second show three rings, each fading on its own. A control on any other enemy shows no ring — a normal slow, root or push on a Dot keeps its existing look, byte-identical. A damage hit on the Ward shows no ring (damage is not a control).
- It is a reaction ring, not a status chip: the Ward's own look (a plain red circle) shows nothing about its immunity, which is exactly what the ring says. No HUD element, no codex change — the Ward's reference line already says what the ring confirms.
- A new enemy-hook file draws it (the Dasher streak's file, systems/enemyHooks/dasherStreak.ts, is the closest example); the only touched existing file is the control-apply path.

## Acceptance criteria
- [ ] A Push gust, an Anchor root or a Frost slow applied to a Ward shows one small muted ring at its base for ~0.4 s; no sound plays.
- [ ] The same control on any other enemy shows no ring — the existing slow, root and push looks are byte-identical.
- [ ] The Ward's numbers are unchanged: hp, the control-fatigue meter (T0301), and the control's effect on other enemies.
- [ ] A new enemy-hook file is added; no HUD element, no codex or pause-screen change.
