---
id: T0019
title: "Crit sting: sound and ring on crits"
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:02:09Z
designer: desktop
---

## Goal
Make crits from the Contrast upgrade land as events, not just red numbers: a distinct higher-pitched hit sound plus a small ink ring at the impact point.

## Details
- Add one new sound to `src/audio/Sfx.ts`, in the style of the existing `hit` sound: a short (~80–120 ms) higher-pitched variant at roughly 2× the base hit pitch, same envelope family and same gain as a normal hit. It must follow the SFX mute and master volume exactly like every other SFX.
- Play it from the two existing crit branches (the ones that already pass the `crit` flag to `DamageNumbers.show`): the projectile-hit path in `CombatSystem.onProjectileHit` and the orbit-contact path in `OrbitSystem.update`.
- At the same moment and position, spawn a small ink ring ripple reusing the existing ring effect in `Fx`: small scale (~20 world units radius), fading over ~300 ms.
- Non-crit hits are untouched: same sound, no ring.
- No rate limiting beyond what the normal hit sound already has; a crit and a normal hit on the same frame both sound.

## Acceptance criteria
- [ ] With Contrast owned, a crit (red double-damage number) plays a clearly higher-pitched sound and a small ink ring at the impact point; a normal hit sounds exactly as before with no ring
- [ ] Both crit paths trigger the sting and ring: projectile hits and Orbit weapon contact
- [ ] Muting SFX silences the crit sound; its volume tracks the SFX master
- [ ] A run without Contrast produces no new audio or FX (paths unchanged)
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile
