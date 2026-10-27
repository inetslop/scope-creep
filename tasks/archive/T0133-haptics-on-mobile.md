---
id: T0133
title: Haptics on mobile
assignee: narcissus
size: S
priority: 2
status: done
depends_on: [T0131]
attempts: 1
created: 2026-10-27T19:10:00Z
claimed_at: 2026-10-27T20:11:20Z
finished_at: 2026-10-27T21:08:04Z
---

## Goal
On a phone, the big moments are felt in the hand: a short buzz when you take a hit, a double tap when you pick a level-up card, a long low buzz when a boss lands. Touch players lose the screen shake under their thumbs; this gives it back.

## Details
- New `src/audio/Haptics.ts`: a small class with `hit()`, `levelUp()` and `boss()`, each one `navigator.vibrate(...)` call. Patterns: hit `30`, level-up `[20, 40, 20]`, boss `120`.
- It follows the existing mute: no vibration while the game is muted. Read the mute the same way `src/audio/Sfx.ts` does, so the M key and the pause-screen mute silence both sound and haptics.
- Guard every call: do nothing when `navigator.vibrate` is missing (desktop Safari, Firefox desktop, the headless smoke browser) and swallow any exception. Throttle `hit()` to at most one buzz every 150 ms so a swarm doesn't buzz continuously.
- Call sites: the player taking damage (where the Platemark from T0094 is printed), a level-up card being picked (where the level-up pulse from T0102 starts), and the boss landing (next to `this.sfx.bossSting()` in `src/systems/BossSystem.ts`).
- No new UI, no new setting.

## Acceptance criteria
- [ ] `src/audio/Haptics.ts` exists with `hit()`, `levelUp()` and `boss()` using exactly the patterns above
- [ ] Muted → no `navigator.vibrate` calls; missing `navigator.vibrate` → no errors
- [ ] `hit()` buzzes at most once per 150 ms
- [ ] A unit test covers the mute gate, the missing-API case and the throttle (stub `navigator.vibrate`)
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, yoga)

### Files
- create `src/audio/Haptics.ts` — module singleton `haptics` + `Haptics` class: `hit()` 30 ms (throttled 1/150 ms), `levelUp()` `[20, 40, 20]`, `boss()` 120 ms; muted read per call (same localStorage key as Sfx); `navigator.vibrate` guard + try/catch
- create `tests/haptics.test.ts` — stubs `navigator.vibrate`: patterns, mute gate, missing API, throttle
- edit `src/systems/FxSystem.ts` — import + one line `haptics.hit();` in `playerHit()` after `this.printPlatemark(x, y);` (line 192)
- edit `src/systems/BossSystem.ts` — import + one line `haptics.boss();` in `startEntering()` directly after line 240 `this.sfx.bossSting();`
- edit `src/scenes/LevelUpScene.ts` — import + one line `haptics.levelUp();` in `choose()` after `getPlayer(this).pulse();`

### Interfaces
```ts
// src/audio/Haptics.ts — no Phaser import, no scene state
export class Haptics { hit(): void; levelUp(): void; boss(): void; }
export const haptics: Haptics; // one per process, like `hook` in debug/testHook.ts
```

### Steps
1. Write `src/audio/Haptics.ts` exactly:
```ts
const MUTE_STORAGE_KEY = 'scope-creep:muted'; // must stay equal to Sfx's key
const HIT_THROTTLE_MS = 150;

export class Haptics {
  private lastHitAt = 0;
  hit(): void {
    if (Haptics.readMuted()) return;
    const now = performance.now();
    if (now - this.lastHitAt < HIT_THROTTLE_MS) return;
    this.lastHitAt = now;
    this.buzz(30);
  }
  levelUp(): void { if (Haptics.readMuted()) return; this.buzz([20, 40, 20]); }
  boss(): void { if (Haptics.readMuted()) return; this.buzz(120); }
  private buzz(pattern: VibratePattern): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try { navigator.vibrate(pattern); } catch { // a locked device can throw: juice, never fatal
  }
  private static readMuted(): boolean {
    try { return localStorage.getItem(MUTE_STORAGE_KEY) === '1'; } catch { return false; }
  }
}
export const haptics = new Haptics();
```
2. Add the one lines + `import { haptics } from '../audio/Haptics';` in the three files (alphabetical: before `../audio/Music|Sfx` and before `../art/...`).
3. Write `tests/haptics.test.ts`: `beforeEach` stubs `vi.stubGlobal('navigator', { vibrate } as Navigator)` (vibrate = `vi.fn()`) and `vi.stubGlobal('localStorage', { getItem } as Storage)`; `afterEach` `vi.unstubAllGlobals(); vi.restoreAllMocks();`. Cases: (a) patterns — `haptics.hit()` → `30`, `levelUp()` → `[20, 40, 20]`, `boss()` → `120`; (b) muted — `getItem.mockReturnValue('1')`, all three, `not.toHaveBeenCalled()`; (c) missing API — `vi.unstubAllGlobals()` (node's own navigator has no vibrate), `expect(() => {...}).not.toThrow()`, no calls; (d) throttle — `let now = 1000; vi.spyOn(performance, 'now').mockImplementation(() => now); const fresh = new Haptics();` → hit: 1 call, immediate second hit: still 1, `now += 151`, hit: 2.
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- Sfx's `MUTE_STORAGE_KEY` is private: duplicate the string `'scope-creep:muted'` with a comment; do NOT import from Sfx.ts (other machines edit it).
- Read mute per call, not in a constructor: Sfx is recreated every run; the key persists.
- `hit()` order: `readMuted()` before stamping `lastHitAt` (Sfx gates before throttling), so an un-muted hit still buzzes.
- Do NOT add GameScene/keys.ts/registry/dispose/invariant lines: it's a `hook`-style singleton, no scene state — nothing to remove on shutdown, no invariant to register.
- Do NOT add `hit()` to the four `takeDamage` sites (CombatSystem ×2, BossSystem ×2): they all call `fx.playerHit`, so the single line there covers every path, and CombatSystem is T0120's file.
- Patterns exactly `30` / `[20, 40, 20]` / `120` — the test asserts them.
- Throttle is wall-clock `performance.now()`, never `dt`/60 fps.
- Smoke headless browser + desktop browsers have no usable vibrate: the guard makes it silent; smoke auto-picks a card so `levelUp()` runs there and must not throw.
- Concurrent edits (T0131 in LevelUpScene; several boss tasks in BossSystem's import block): our lines are single-line inserts at the named spots, never list tails — rebase if a conflict lands.

### Tests
- `tests/haptics.test.ts` (required by the acceptance criteria, which override the audio-task default): stub `navigator.vibrate`; cover the mute gate, the missing-API case, and the 150 ms throttle, plus the exact patterns.

## Result (attempt 1, narcissus)

Added `src/audio/Haptics.ts`, a hook-style singleton with `hit()` (30 ms buzz), `levelUp()` ([20, 40, 20] double tap) and `boss()` (120 ms buzz); every call is a silent no-op when the game is muted (reads Sfx's `'scope-creep:muted'` localStorage key per call) or `navigator.vibrate` is missing, and `hit()` is throttled to at most one buzz per 150 ms of wall-clock time. Wired in three single-line calls: `haptics.hit()` in `FxSystem.playerHit()` (covers every takeDamage path), `haptics.boss()` right after the boss sting in `BossSystem.startEntering()`, and `haptics.levelUp()` in `LevelUpScene.choose()` when a card is picked — so on phones the big shake moments are felt under the thumbs. New unit test `tests/haptics.test.ts` covers the exact patterns, the mute gate, the missing-API case, and the throttle (plus that a muted hit doesn't consume the throttle window). Two minimal deviations from the design snippet: its `buzz()` catch clause had no block body, so I wrote it as a proper empty catch; and I pinned `performance.now()` in the pattern test for determinism across vitest's fresh worker processes. `npm run check` (typecheck, lint, 288 tests) and `npm run smoke` (desktop + mobile browser playthrough) both pass.

- Self-review: APPROVE
- Time: 56.7 min

```
game/src/audio/Haptics.ts       | 54 +++++++++++++++++++++++++++++
 game/src/scenes/LevelUpScene.ts |  2 ++
 game/src/systems/BossSystem.ts  |  2 ++
 game/src/systems/FxSystem.ts    |  2 ++
 game/tests/haptics.test.ts      | 75 +++++++++++++++++++++++++++++++++++++++++
 5 files changed, 135 insertions(+)
```
