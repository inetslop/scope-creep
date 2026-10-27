---
id: T0107
title: Orbit hum — the orbiting circles make a sound
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0090, T0098, T0105]
attempts: 1
created: 2026-10-27T12:29:53Z
claimed_at: 2026-10-27T16:02:47Z
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

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — new public `orbitHum()` method + `lastOrbitHumAt` throttle field: the Orbit weapon's contact voice.
- edit `src/systems/OrbitSystem.ts` — Orbit's contact sound becomes the hum: replace the `sfx.critHit()`/`sfx.hit()` if/else with one `sfx.orbitHum()` call (crit ring visual kept).

### Interfaces
```ts
// Sfx.ts — field after `private lastCritHitAt = 0;`, method after shoot() (before hit())
private lastOrbitHumAt = 0;
/** Orbit's contact voice: a soft low hum — 90→60 Hz sine over 120 ms, half of hit()'s tone gain, no noise. One per 150 ms. */
orbitHum(): void {
  if (!this.canPlay()) return;
  const now = performance.now();
  if (now - this.lastOrbitHumAt < 150) return;
  this.lastOrbitHumAt = now;
  this.tone('sine', 90, 60, 0.12, 0.09);
}
```

### Steps
1. `Sfx.ts`: add the field right after `lastCritHitAt`; add the method right after the `shoot()` switch (closest examples: `critHit()` throttle pattern, `tone()` helper).
2. `OrbitSystem.ts` `update()`: in the contact block that applies `e.hit(dmg, ...)` (after `this.lastHit.set(e.serial, now)`), replace the block `if (crit) { this.sfx.critHit(); this.fx.critRing(cx, cy); } else { this.sfx.hit(); }` with:
```ts
        this.sfx.orbitHum();
        if (crit) this.fx.critRing(cx, cy);
```
The call stays inside the existing per-enemy `lastHit` branch — one hum per damaging contact, at most once per enemy per 0.6 s; the 150 ms cluster cap lives in Sfx.

### Pitfalls
- The hum REPLACES the contact knocks — do not keep `sfx.hit()`/`sfx.critHit()`, not even for crits: acceptance is "clearly quieter than a normal hit, clearly different from a Line hit", and a knock under the hum fails both and a swarm still machine-guns knocks.
- Plain `tone()` (instant attack, 120 ms decay) — do not copy `stingTone`'s 30 ms attack/450 ms decay; 0.09 is half of hit()'s tone gain 0.18 (not its 0.22 noise gain); no noise call, no pitch rise.
- Mute: `canPlay()` is the only gate (covers M, localStorage mute, NoAudioSoundManager) — add no scene/music checks.
- Don't touch `def.orbit` (damage 12, radius 70, speed 2.5, circleRadius 8, hitCooldownSec 0.6), knockback 90, or the `lastHit` map; don't add a second gate around the Sfx call.
- No pooling, listeners, HUD, input or key changes; nothing to remove on shutdown; line numbers above drift if T0090/T0098/T0105 land first — anchor by the quoted code.

### Tests
none
