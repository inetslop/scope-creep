---
id: T0043
title: Unit tests for the vector math helpers
assignee: yoga
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-27T00:01:14Z
finished_at: 2026-10-27T00:05:23Z
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

## Design (architect, desktop)

### Files
- create `tests/core/vec.test.ts` - unit tests for `src/core/vec.ts` helpers. Do not edit any source file.

### Interfaces
No new types. Import the real exports from `src/core/vec.ts`:
`import { add, distance, length, normalize, scale, vec } from '../../src/core/vec';`
(`vec(x = 0, y = 0): Vec2`, `add(a, b): Vec2`, `scale(a, s): Vec2`, `length(a): number`, `distance(a, b): number`, `normalize(a): Vec2` — for a zero vector it returns `{ x: 0, y: 0 }`.)

### Steps
1. Create `tests/core/vec.test.ts` with exactly this content (copy it; it matches the `tests/core/rng.test.ts` style):

```ts
import { describe, expect, it } from 'vitest';
import { add, distance, length, normalize, scale, vec } from '../../src/core/vec';

describe('vec helpers', () => {
  it('length of (3, 4) is 5', () => {
    expect(length(vec(3, 4))).toBe(5);
  });

  it('normalize of (3, 4) is (0.6, 0.8)', () => {
    expect(normalize(vec(3, 4))).toEqual({ x: 0.6, y: 0.8 });
  });

  it('add (1, 2) + (3, 4) is (4, 6)', () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual({ x: 4, y: 6 });
  });

  it('scale (1, 2) x 3 is (3, 6)', () => {
    expect(scale(vec(1, 2), 3)).toEqual({ x: 3, y: 6 });
  });

  it('distance from (0, 0) to (3, 4) is 5', () => {
    expect(distance(vec(0, 0), vec(3, 4))).toBe(5);
  });

  it('normalize of (0, 0) is (0, 0) and NaN-free', () => {
    const n = normalize(vec(0, 0));
    expect(n).toEqual({ x: 0, y: 0 });
    expect(Number.isNaN(n.x) || Number.isNaN(n.y)).toBe(false);
  });
});
```

2. Run `npm run check` (typecheck + lint + tests) — must pass.
3. Run `npm run smoke` — must pass (no source changed, so this just confirms nothing else broke).

### Pitfalls
- Lint runs with `--max-warnings 0`: keep the import order exactly as above (vitest first, then the relative import), no unused imports, no `Phaser` imports.
- The zero-vector case is locked to the module's actual behavior: `normalize` returns `{ x: 0, y: 0 }` (guard `len > 1e-9` at `src/core/vec.ts:20`) — do not "improve" it to something else.
- `3/5` and `4/5` are exact IEEE doubles equal to the literals `0.6`/`0.8`, and `Math.hypot(3, 4)` is exactly `5`, so `toBe`/`toEqual` are safe — no float tolerance needed.
- Do not touch `src/core/vec.ts` or any other file; this task is tests-only.

### Tests
- `tests/core/vec.test.ts` (created above): length, normalize, add, scale, distance identities plus NaN-free zero-vector normalize.

## Result (attempt 1, yoga)

Added `tests/core/vec.test.ts`, locking the `src/core/vec.ts` helpers with the five required math identities — length of (3,4) is 5, normalize of (3,4) is (0.6,0.8), add (1,2)+(3,4)=(4,6), scale (1,2)×3=(3,6), distance (0,0)→(3,4) is 5 — plus a zero-vector test asserting `normalize(vec(0,0))` returns exactly `{x:0,y:0}` and is NaN-free (matching the module's `len > 1e-9` guard). Modeled on `tests/core/rng.test.ts`; no source files changed. `npm run check` passes (139 tests) and `npm run smoke` passes for both desktop and mobile.

- Self-review: APPROVE
- Time: 4.1 min

```
game/tests/core/vec.test.ts | 30 ++++++++++++++++++++++++++++++
 1 file changed, 30 insertions(+)
```
