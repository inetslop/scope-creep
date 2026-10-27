---
id: T0143
title: Rest ripple — the page exhales when your free hit is in hand
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T21:17:36Z
---

## Goal
The Rest (T0134) gives the patient player a free hit, but arming is silent — only the small REST label holds. The moment the 30 s count completes, the page exhales: a single ink ring ripples out from the player, so the free hit is felt in the middle of the fight, not discovered in the HUD.

## Details
- Trigger: the exact moment the existing rest rule (T0134, `src/core/rest.ts`) transitions to covered — the same state that makes the REST label first hold (30 s without any damage, discrete or burn, per the module's existing rules). The ripple rides that existing transition; it must not add a second timer or its own bookkeeping.
- Effect: one faint flat ink ring ripples out from the player's position — the first-light ring idiom (T0138): a flat 2 u ink circle growing from ~8 u to ~24 u, fading over 400 ms, no outline or shadow, as a new FxSystem emitter in the `firstLightRings` pattern (its own emitter because the lifespan is 400 ms, not 300).
- Once per arming: a negated free hit or fresh damage restarts the 30 s count; when that count completes, the ring ripples again. Exactly one ring per false→true covered transition — never per frame, and never at run start (a fresh count only completes after 30 s of peace).
- Pure juice: no damage, stat, spawn, hazard, weapon, clock or music change; no new sound, key, HUD element or scene.

## Acceptance criteria
- [ ] In a fresh run, staying unharmed for 30 s: the moment the REST label first holds, a single flat ink ring (2 u, growing ~8→24 u, fading over ~400 ms) ripples out from the player.
- [ ] After the free hit is negated — or after taking damage — the next completed 30 s count ripples again; exactly one ring per arming, and no repeated or continuous rings while the label simply holds.
- [ ] No ring at run start, and no ring while the 30 s count is still running.
- [ ] No new sound, key, HUD element, scene or gameplay number change; the rest rule's existing unit tests (T0134) still pass, and if the arming transition is exposed from the pure module a test pins that it is reported exactly once per arming cycle.
