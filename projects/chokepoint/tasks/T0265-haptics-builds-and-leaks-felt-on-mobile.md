---
id: T0265
title: "Haptics: builds and leaks felt on mobile"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T06:24:50Z
claimed_at: 2026-10-30T21:02:57Z
---

## Goal
On phones that can vibrate, the two moments the board already celebrates — a tower landing, a leak getting through — are felt as well as seen, so the run's feedback (pillars 5 and 6) reaches the hand.

## Details
- One new small module, `src/input/haptics.ts` (next to BoardGestures in `src/input/`): a single function `haptic(kind)` with `kind: 'place' | 'leak'`, each kind mapped to one `navigator.vibrate` pattern — `place: [20]` ms, `leak: [80]` ms.
- Guarded to be a total no-op where unsupported: call vibrate only if `navigator` exists and `'vibrate' in navigator`; wrap the call so any throw is swallowed. On desktop and on unsupported browsers the module does nothing, prints nothing, and the game is byte-identical.
- Exactly two call sites, one line each: (1) the one place a tower is committed to the board — the same moment T0088's build-commit tier chime plays; successful placements only, a failed placement (gold short, cell occupied) plays nothing (the existing deny sound covers it); (2) the one place a leak happens — the same place the camera jolt (T0109) and the leak's consequences fire.
- No HUD, no toggle, no pause-screen line: haptics are an output, not a control, and there is nothing to discover on screen; the sound toggle (T0035) does not gate it (a run with sound off still feels a leak).
- At 2× fast-forward (T0119/T0019's WaveSpeed) a leak vibrates once per leak, never stretched — the vibrate runs in real time, not the simulation clock.
- A small unit test for the module: the pattern table (`place` → [20], `leak` → [80]) and the guard (no navigator / no vibrate property → no throw, no call).

## Acceptance criteria
- [ ] On a device with the vibration API (e.g. a mobile browser), a successful tower placement vibrates 20 ms and a leak vibrates 80 ms; a failed placement (gold short or cell occupied) vibrates nothing.
- [ ] On desktop (no vibration API) nothing changes: no error, no console output, identical behaviour.
- [ ] At 2× fast-forward, one leak vibrates exactly once.
- [ ] The unit test passes for the pattern table and the unsupported-environment guard.
- [ ] No HUD element, button or pause-screen line was added; the sound toggle does not affect the buzz.

## Design (architect, yoga)

### Files
- create `src/input/haptics.ts` - the haptics module: `haptic(kind)` + the exported pattern table `PATTERNS`. Pure (no Phaser import).
- edit `src/systems/TowerSystem.ts` - import `haptic` and call it once on a successful build.
- edit `src/systems/EnemySystem.ts` - import `haptic` and call it once in the leak funnel.
- create `tests/input/haptics.test.ts` - unit test for the pattern table and the unsupported-env guard.

### Interfaces
Exact new module `src/input/haptics.ts` (copy verbatim):
```ts
/**
 * Haptics (T0265): the two board celebrations, felt as well as seen. On a phone that can
 * vibrate, a tower landing and a leak getting through buzz the hand. A total no-op on desktop
 * and in unsupported browsers: nothing prints, nothing changes. The buzz is a browser call in
 * real time (not the simulation clock), so at 2× fast-forward a leak still vibrates exactly once.
 */

/** Which moment the phone buzzes for: a tower committed to the board, a leak getting through. */
export type HapticKind = 'place' | 'leak';

/** The buzz per moment, in ms: a tower lands, a leak gets through. */
export const PATTERNS: Record<HapticKind, number[]> = {
  place: [20],
  leak: [80],
};

/**
 * Buzzes `kind` where the phone can vibrate; a no-op on desktop and unsupported browsers. Only
 * the two board celebrations call it, at the exact moment they already chime and jolt.
 */
export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* The phone refused the buzz (vibration locked, or the call threw): the run goes on without it */
  }
}
```

### Steps
1. Create `src/input/haptics.ts` with the module above (exact).
2. In `src/systems/TowerSystem.ts`: add `import { haptic } from '../input/haptics';` right after line 13 (`import type { Sfx } from '../audio/Sfx';`). In `build()`, add `haptic('place');` as the new line immediately after `this.place(tower, copy);` (currently line 70, before `return tower;`). Do NOT add it in `place()` — `place()` also runs when an augment goes into an existing tower, which must not buzz.
3. In `src/systems/EnemySystem.ts`: add `import { haptic } from '../input/haptics';` right after line 20 (`import type { Sfx } from '../audio/Sfx';`). In `private leak(e: Enemy)`, add `haptic('leak');` immediately after `this.sfx?.leak();` (currently line 217, before the `// The jolt...` comment).
4. Create `tests/input/haptics.test.ts` (exact):
```ts
import { describe, expect, it } from 'vitest';
import { haptic, PATTERNS } from '../../src/input/haptics';

describe('haptics', () => {
  it('maps the two moments to their buzz, in ms', () => {
    expect(PATTERNS.place).toEqual([20]);
    expect(PATTERNS.leak).toEqual([80]);
  });

  it('is a total no-op where the phone cannot vibrate', () => {
    // The node test env has no `vibrate`: a forgotten guard would throw calling `navigator.vibrate`.
    expect(() => haptic('place')).not.toThrow();
    expect(() => haptic('leak')).not.toThrow();
  });
});
```
5. Run `npm run check` (typecheck + lint + tests) and `npm run smoke`.

### Pitfalls
- The `catch { }` must keep its inline comment (matching `core/saveRun.ts` etc.); a bare empty `catch {}` fails `no-empty`.
- `navigator` is not a restricted global here (the `no-restricted-globals` rule only guards `src/core`/`src/content`), so bare `navigator` is fine — do not use `window`/`document`.
- Keep the guard `typeof navigator === 'undefined' || !('vibrate' in navigator)` exactly; it is what makes the module a no-op on desktop and the node test, and what the guard test relies on.
- `navigator.vibrate` is a real-time browser call, not driven by `dt`, so the 2× fast-forward requirement needs no code — but do NOT scale the pattern by the wave speed; keep `[20]`/`[80]` fixed.
- Do not gate the buzz on the sound toggle (T0035) — it must fire even when sound is off.
- Both `TowerSystem.ts` and `EnemySystem.ts` are also edited by open tasks (T0152, T0242); keep each change to the single import + single call line next to the existing `sfx` line, never at a list end, to stay merge-clean.

### Tests
- `tests/input/haptics.test.ts`: asserts the pattern table (`place`→`[20]`, `leak`→`[80]`) and that `haptic` is a throw-free no-op where `vibrate` is absent (the node env), which is what proves the guard (a missing guard would throw, i.e. prove an attempted call). The real-phone buzz path (vibrate actually firing) is a browser behavior verified by smoke/manual, not unit.
