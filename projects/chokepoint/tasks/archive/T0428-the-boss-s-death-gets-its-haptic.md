---
id: T0428
title: "The boss's death gets its haptic"
assignee: yoga
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-11-02T14:32:01Z
claimed_at: 2026-11-02T14:43:41Z
finished_at: 2026-11-02T14:52:57Z
---

## Goal
The run's loudest kill gets the run's heaviest buzz on mobile: the moment a boss dies, the phone shakes harder than a leak does.

## Details
- On a mobile browser, the moment a boss dies (the death burst's and horn's own moment, the bossDeath hook), one vibration of 200 ms — the leak's 80 ms (T0265) is the lighter end of the run's haptics, the boss death is the heavier end. Once per boss, per run: a run that stops three bosses buzzes three times.
- Guarded exactly like T0265: no navigator.vibrate (desktop, and most mobile browsers) is a no-op. No new key, button, HUD element or toggle; the pause screen lists nothing (T0265's precedent: the haptics are felt, not shown), and the sound toggle stays out of it.

## Acceptance criteria
- [ ] A 200 ms vibration at each boss death on a mobile browser that supports it; a desktop run is byte-identical (the call is guarded).
- [ ] Exactly once per boss, per run; a run that stops two bosses buzzes twice.
- [ ] The existing place (20 ms) and leak (80 ms) patterns are untouched; no new HUD, key or toggle; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, yoga)

### Files
- edit `src/input/haptics.ts` - add the `'boss'` haptic: kind in `HapticKind`, `boss: [200]` in `PATTERNS`, doc lines stay true
- edit `src/systems/enemyHooks/bossDeath.ts` - `haptic('boss')` beside each of the hook's two `sfx?.bossDown()` moments

### Interfaces
No new types or functions. `HapticKind` gains one literal; `PATTERNS` gains one entry:
```ts
export type HapticKind = 'place' | 'leak' | 'boss';
export const PATTERNS: Record<HapticKind, number[]> = { place: [20], leak: [80], boss: [200] };
```

### Steps
1. In `src/input/haptics.ts` (29 lines, read it all): (a) line 2: `the two board celebrations,` → `the board's loud moments,`; (b) line 3: `a tower landing and a leak getting through buzz` → `a tower landing, a leak getting through and a boss dying buzz`; (c) `HapticKind = 'place' | 'leak'` → `HapticKind = 'place' | 'leak' | 'boss'` and its doc line ends `a boss dying.`; (d) `leak: [80],` → `leak: [80],\n  boss: [200],` (doc line ends `a boss dies.`); (e) `Only the two board celebrations call it` → `Only the board's celebrations call it`.
2. In `src/systems/enemyHooks/bossDeath.ts`: add `import { haptic } from '../../input/haptics';` after line 1 (`import { bossId } ...`).
3. In that file's `onKill({ enemy })`: after `sfx?.bossDown();` add `haptic('boss');`.
4. In that file's `update()`: change `if (!alive && lastAlive && lastAtLine && !leaked) sfx?.bossDown();` to `if (!alive && lastAlive && lastAtLine && !leaked) { sfx?.bossDown(); haptic('boss'); }` (keep the statement on one line or split it — both pass lint).
5. In that file's header comment, after the line ending `not once per window frame.`, add: ` * Its haptic (input/haptics.ts, T0428) buzzes the same two moments: 200 ms, once per boss.`

### Pitfalls
- Both horn sites need the haptic: a killed boss (Colossus/Titan) buzzes in `onKill`; the Orb is never killed (its split window: `Enemy.hit` returns no-kill while `splitClock >= 0`), so the Orb's death buzzes in `update()` — one buzz per boss falls out of standing exactly where the horn stands.
- Do NOT add `haptic(...)` to the hook's `onLeak`: a boss leak already buzzes `haptic('leak')` (80 ms) from `EnemySystem.leak`; the task is the death only.
- Do not touch `place`/`leak` entries, the `haptic()` guard (it is the desktop no-op — desktop stays byte-identical), or `EnemySystem.ts`.
- No invariant: this is a call next to an existing one, not a new system.

### Tests
none

## Result (attempt 1, yoga)

The boss death now buzzes the phone: a 200 ms `boss` haptic (heavier end of the run's haptics, above the leak's 80 ms) fires beside each of the bossDeath hook's two `Sfx.bossDown` moments — a killed Colossus/Titan buzzes in `onKill`, the Orb's death in `update()` — so each stopped boss buzzes exactly once per run, and three bosses buzz three times. The call goes through the existing `haptic()` guard, so desktop and unsupported browsers stay byte-identical no-ops; the existing place (20 ms) and leak (80 ms) patterns are untouched and no HUD, key or toggle was added. `src/input/haptics.ts` gains the `'boss'` kind and its pattern; `src/systems/enemyHooks/bossDeath.ts` gains the import and the two calls with their doc lines. `npm run check` and the desktop + mobile smoke both pass.

- Self-review: APPROVE
- Time: 9.3 min

```
projects/chokepoint/game/src/input/haptics.ts               | 13 +++++++------
 .../chokepoint/game/src/systems/enemyHooks/bossDeath.ts     |  8 +++++++-
 2 files changed, 14 insertions(+), 7 deletions(-)
```
