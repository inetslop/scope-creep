---
id: T0043
title: Unit tests for the vector math helpers
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-27T00:00:01Z
designer: desktop
---

## Goal
Lock the core vector math with unit tests so future changes to movement, aiming, and knockback can't silently break the geometry.

## Details
- Create `tests/core/vec.test.ts`, modeled on the structure of `tests/core/rng.test.ts` (plain describe/it, no Phaser imports).
- Test the real exported helpers from `src/core/vec.ts` — use their actual names, signatures, and the real vector type (object with x/y or otherwise, whatever the module uses).
- Cover, with small integer examples:
  - length: the vector (3, 4) has length 5.
  - normalize: normalizing (3, 4) gives (0.6, 0.8).
  - add: (1, 2) + (3, 4) = (4, 6).
  - scale: (1, 2) × 3 = (3, 6).
  - distance: the distance from (0, 0) to (3, 4) is 5.
  - zero-vector safety: normalizing (0, 0) must not produce NaN (it should return (0, 0) or another defined safe value — assert the actual behavior of the module and lock it).
- If an operation is exposed as a method on a vector type rather than a free function, test the method; the math identities above are what must hold.
- Do not change any source file — this task adds tests only.

## Acceptance criteria
- [ ] `tests/core/vec.test.ts` exists and passes
- [ ] The five math identities (length, normalize, add, scale, distance) are asserted with the values above
- [ ] The zero-vector normalize case is asserted to be NaN-free
- [ ] `npm run check` and `npm run smoke` pass
