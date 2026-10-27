---
id: T0107
title: Orbit hum — the orbiting circles make a sound
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T12:29:53Z
---

## Goal
Orbit is the only weapon with no voice — Point, Line and Arc each sound like themselves (T0093), but the orbiting circles touch silently. Every damaging Orbit contact now plays a soft low hum, so all four weapons are audible and a swarm under your orbit can be heard, not just seen.

## Details
- One new SFX method in `game/src/audio/Sfx.ts`, next to the per-weapon `shoot()` switch that T0093 added (closest example in the same file: `critHit()` — a short synthesized blip with its own `last…At` throttle timestamp so it can never stack into a machine gun).
- The sound: a soft low hum — sine oscillator gliding from 90 Hz down to 60 Hz over 120 ms, fast attack, quick decay, gain about half of the normal `hit()` SFX. No noise component and no pitch rise, so it sits clearly below and softer than the Line's low thud (T0093) — an Orbit touch must be distinguishable from a Line hit by ear.
- Where it plays: the Orbit system that applies the Orbit's per-enemy 0.6 s contact damage (`src/systems/OrbitSystem.ts`) — one hum per damaging contact, at the moment the damage is applied, gated by the same per-enemy 0.6 s cooldown, so a single enemy under the orbit hums at most once every 0.6 s.
- Global throttle: at most one hum per 150 ms, via its own timestamp field like `lastCritHitAt`, so a cluster of enemies under the orbit produces a gentle hum, not a machine gun.
- No gameplay change: Orbit's 12 damage, orbit radius, spin speed, knockback and the per-enemy 0.6 s cooldown are untouched. No new HUD element, no new input, no new key. The hum obeys the existing mute (M) exactly like all other SFX.

## Acceptance criteria
- [ ] An enemy touched by an orbiting circle plays one soft low hum at the moment of contact — audible under the music, clearly quieter than a normal hit and clearly different from the Line's thud.
- [ ] A cluster of three or more enemies under the orbit produces at most one hum per 150 ms — no overlapping or machine-gunning hums.
- [ ] Muting with M silences the hum along with all other SFX.
- [ ] Orbit's damage, radius, spin, knockback and 0.6 s per-enemy cooldown are unchanged, and no HUD element, input or key is added.
- [ ] `npm run check` and `npm run smoke` pass.
