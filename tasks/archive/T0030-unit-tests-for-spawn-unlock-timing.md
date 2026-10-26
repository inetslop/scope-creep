---
id: T0030
title: Unit tests for spawn unlock timing
assignee: yoga
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-26T20:55:07Z
claimed_at: 2026-10-26T21:21:18Z
finished_at: 2026-10-26T21:28:36Z
---

## Goal
Lock down the promise that every enemy is absent just before its unlock time and present at/after it, for the whole roster.

## Details
- New test file `game/tests/content/spawn.test.ts` (or next to `tests/content.test.ts` if the architect prefers the flat layout). No changes to game behavior.
- For every enemy in `ENEMIES`, assert that the spawn logic excludes it at `unlockAtSec - 1` seconds and includes it at `unlockAtSec` seconds (and at a time well past it, e.g. 600 s).
- Test the pure function the spawn system uses to decide which enemies are available at a given time. If that logic is currently inline in the spawn system, the design may extract a small pure helper (a few lines, e.g. `availableEnemies(elapsedSec)`) and have the spawn system call it — behavior unchanged.
- If the extraction would touch more than a few lines, fall back to asserting on the data instead: every `unlockAtSec` is a positive finite number, and the set of enemies with `unlockAtSec <= t` is non-decreasing as `t` grows from 0 to 600 s in 5 s steps.

## Acceptance criteria
- [ ] The new test file covers every entry in `ENEMIES`, including enemies added by other tasks
- [ ] Each enemy is asserted absent at `unlockAtSec - 1` s and present at `unlockAtSec` s (or the data fallback above is used)
- [ ] If a helper is extracted, in-play unlock times are unchanged
- [ ] `npm run check` (including the new test) and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `tests/content/spawn.test.ts` - unit test for spawn unlock timing. No other files change (the pure function already exists; do NOT touch `src/`).

### Interfaces
Nothing new. The test uses the existing public API:
```ts
new SpawnDirector(ENEMIES)               // src/core/director.ts, config defaults
director.unlocked(timeSec: number): EnemyDef[]  // pure: unlockAtSec <= timeSec && spawnWeight > 0
```

### Steps
1. Create `tests/content/spawn.test.ts` with exactly this content:
```ts
/**
 * Locks down spawn unlock timing: every director-spawnable enemy is absent just
 * before its `unlockAtSec` and present at/after it. Enemies with spawnWeight 0
 * (split children) must never appear in the director pool at any time.
 */
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { SpawnDirector } from '../../src/core/director';

const director = new SpawnDirector(ENEMIES);
const idsAt = (t: number): Set<string> => new Set(director.unlocked(t).map((e) => e.id));

describe('spawn unlock timing', () => {
  it.each(ENEMIES.map((e) => [e.id, e] as const))('%s unlocks exactly at unlockAtSec', (_id, e) => {
    if (e.spawnWeight === 0) {
      expect(idsAt(0).has(e.id), 'never in the director pool').toBe(false);
      expect(idsAt(600).has(e.id), 'never in the director pool').toBe(false);
      return;
    }
    expect(idsAt(e.unlockAtSec - 1).has(e.id), 'absent just before unlock').toBe(false);
    expect(idsAt(e.unlockAtSec).has(e.id), 'present at unlock').toBe(true);
    expect(idsAt(600).has(e.id), 'present well past unlock').toBe(true);
  });

  it('the available set never shrinks as time grows', () => {
    let prev = idsAt(0);
    for (let t = 5; t <= 600; t += 5) {
      const cur = idsAt(t);
      for (const id of prev) expect(cur.has(id), `"${id}" disappears at ${t}s`).toBe(true);
      prev = cur;
    }
  });
});
```
2. Run `npm run check` (typecheck + lint + vitest picks up the new file via `tests/**/*.test.ts`), then `npm run smoke`.

Note for the product owner: the per-enemy "present at unlockAtSec" assertion applies to director-spawnable enemies (`spawnWeight > 0`). `splinter` has `spawnWeight: 0` by design (it only appears via splits), so for that class the test asserts absence at 0 s and 600 s — the actual contract per `types.ts`. This also covers enemies added later (e.g. T0028's Spike) automatically, since `it.each` iterates `ENEMIES` at run time.

### Pitfalls
- Do not "fix" the test to make splinter pass at its unlock time — `unlocked()` intentionally filters `spawnWeight > 0`; changing that would alter spawn behavior.
- Do not extract or modify `SpawnDirector` — it is already pure and already the function the spawn system uses; any `src/` edit risks in-play behavior changes.
- Import paths are `../../src/...` (two levels up from `tests/content/`); the flat `tests/content.test.ts` uses `../src/...` — don't copy that.
- `unlockAtSec - 1` is -1 for `wedge` (unlocks at 0); `unlocked(-1)` correctly excludes it, so no special-casing needed.

### Tests
- `tests/content/spawn.test.ts` (the file itself, as above). No other tests.

## Result (attempt 1, yoga)

Added `tests/content/spawn.test.ts`, which locks down spawn unlock timing for the whole roster via the existing pure `SpawnDirector.unlocked()` API: every director-spawnable enemy is asserted absent at `unlockAtSec - 1` s and present at/after its unlock (and at 600 s), split children (`splinter`, `spawnWeight: 0`) are asserted absent from the director pool at all times, and the available set is asserted monotone over 0–600 s. No game code changed — the pure function already existed in `src/core/director.ts`, so in-play unlock times are unchanged. `npm run check` (102 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 7.3 min

```
game/tests/content/spawn.test.ts | 33 +++++++++++++++++++++++++++++++++
 1 file changed, 33 insertions(+)
```
