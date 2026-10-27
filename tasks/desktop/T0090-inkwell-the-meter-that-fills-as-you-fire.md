---
id: T0090
title: Inkwell — the meter that fills as you fire
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T08:45:39Z
---

## Goal
Every run gets a payoff rhythm: firing fills a thin "Inkwell" meter in the HUD, and a full meter makes your next volley a heavy ink burst — 3× the projectiles at 2× the knockback. It rewards sustained fire, gives every build a visible meter to watch, and is the first new core-loop system since the crop marks.

## Details
- The meter: a thin rule under the kill-streak tally in the HUD. Desktop (1280×720): 120×6 units, ink outline, filled left to right in red. Mobile (412×915): 88×5 in the same relative position. A small all-caps ink label "INK" sits to its left, same type as the other HUD labels.
- The empty rule is visible from the start of the run so players know it is there. The meter is a passive system (like Balance's regen or the Crescendo streak bonus) — no key, no button, no new input.
- Filling: each fired volley of Point, Line or Arc fills the meter by 10% — a volley is one trigger pull, not one projectile (a Repetition volley of 3 points fills it 10% once). No drain. Per-run: it resets to 0 on every new run.
- Orbit is a contact weapon: it neither fills the meter nor consumes it.
- At 100%: the rule turns solid red and a single short high blip plays (one new Sfx in the existing synthesized style of `Sfx.ts`, once per fill). The first time the meter reaches full in a run, a small all-caps ink note — "A FULL WELL BURSTS" — fades in and out over 2 s under the rule, in the same style as the first-encounter marginalia (T0027).
- The burst: the next fired volley of Point, Line or Arc fires 3× that weapon's normal projectile count (Point: 3× its points; Line: 3× its lines; Arc: 3 bolts, each still chaining as usual) at 2× the normal per-projectile knockback, with the same damage per projectile. It uses a deeper variant of that weapon's shoot sound and a small ink ring at your position (same class as the crit ring, T0019).
- The meter returns to 0 immediately after the burst volley and refills at the same rate. If the player stops firing, or only fires Orbit, the meter simply stays full until the next firing weapon's volley.
- Implement the burst as a multiplier on the normal volley path (no per-weapon special cases), so a future firing weapon — the Counterpoint wall-bounce is queued on desktop-4070 (T0055) — gets the burst for free.
- No new scene, no new input, no new content card.

## Acceptance criteria
- [ ] A thin rule labeled "INK" is visible under the streak tally from the start of a run on both the desktop and mobile layouts, and it is empty (0%) at the start of every new run.
- [ ] With only Point, 10 normal volleys fill the rule to solid red; the fill that completes it plays the single high blip, and the first fill of a run also shows the 2 s "A FULL WELL BURSTS" note under the rule.
- [ ] The next Point volley after a full meter fires 3× the normal number of points at 2× the normal knockback, with the deeper shoot sound and a small ink ring at your position; after that volley the rule is empty and refills at the same rate.
- [ ] The burst works for Line (3× lines) and Arc (3 bolts, each still chaining); a multi-projectile Repetition volley still fills only 10%; Orbit never fills or consumes the meter.
- [ ] The meter never overlaps the streak tally, the boss health bar, or the score readout T0054 adds (re-read the HUD scene when that lands) and does not block input.
