---
id: T0108
title: Boss music — the score drops low while a boss is alive
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T13:58:56Z
finished_at: 2026-10-27T14:08:59Z
---

## Goal
While a boss is alive, the generative score drops from the run tempo into a slow 64 BPM low pulse with a dissonant second voice — you hear the fight begin and end without looking up. The boss's tempo becomes the page's heartbeat.

## Details
- Applies to any boss — The Frame, The Grid, and The Palette (T0097, on asus) alike — keyed to the same boss-alive state the boss bar and the boss sting (T0058) already use.
- While a boss is alive: the score's tempo holds at 64 BPM regardless of the run tempo curve (80→120 BPM). The existing low pulse continues, and a second voice plays a tone one semitone (half step) above the pulse on alternating beats — a dissonant pair built from the existing voices/oscillators; no new instrument, no new sound file.
- At the moment the boss spawn event fires (the same moment the T0058 sting plays), the tempo glides from the run's current tempo down to 64 BPM over 1.5 s, and the dissonant second voice enters once the 64 BPM hold begins.
- At the moment the boss dies (the same death moment the heavy-death screen shake, T0040, already uses), the dissonant second voice stops and the tempo glides from 64 BPM back to the run tempo curve's value at that moment over 1.5 s.
- If a new boss spawn event fires while a return glide is in progress, the glide re-targets to 64 BPM (rare — bosses are 5 minutes apart).
- The boss warning (T0070), the boss sting (T0058) and its music swell are unchanged. The score obeys the existing mute (M) exactly like everything else in it.
- Keep the boss-tempo logic (64 BPM hold, 1.5 s glide on both edges, return to the curve value) in the pure music module (`src/core/music.ts`) and unit-test it in the existing `tests/core/music.test.ts` in the same style as the `bpmForTime` pins: 64 while a boss is alive, glide values mid-transition, and the run curve value on return.
- Music only: no SFX changes, no HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] While any boss is alive (after the 1.5 s spawn glide), the music plays at 64 BPM — clearly slower than the run tempo at that point in the run — with a dissonant second tone a semitone above the pulse on alternating beats.
- [ ] At the boss spawn event the tempo glides down over 1.5 s (the T0058 sting and its swell still play as before); at the boss's death the second voice stops and the tempo glides back to the run tempo curve value over 1.5 s.
- [ ] With no boss alive, the score plays the run tempo curve exactly as today — no 64 BPM residue after the return glide.
- [ ] The boss tempo logic is locked by unit tests in `tests/core/music.test.ts` (64 BPM hold, 1.5 s glides on both edges, return to the curve value).
- [ ] Mute (M) silences the boss score like all other audio; no SFX, HUD, input or scene changes.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/core/music.ts` — append `BOSS_BPM`, `BOSS_GLIDE_SEC`, and a `BossTempo` class (pure, mutable state owned by writes; queries are pure functions of `(state, timeSec)`)
- edit `src/audio/Music.ts` — own a `BossTempo`, expose `bossEnter(timeSec)`/`bossLeave(timeSec)`, schedule beats at `bossTempo.bpmFor(timeSec)`, add the dissonant hold branch in `scheduleBeat`
- edit `src/systems/BossSystem.ts` — two one-line calls at the existing spawn/death moments (it already holds `this.music`)
- edit `tests/core/music.test.ts` — new `describe('boss tempo hold')` block
- edit `docs/ARCHITECTURE.md` — one sentence in the Audio paragraph

### Interfaces
Append to `src/core/music.ts` (exact):
```ts
export const BOSS_BPM = 64;
export const BOSS_GLIDE_SEC = 1.5;

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp01(t: number): number { return t < 0 ? 0 : t > 1 ? 1 : t; }

/**
 * Boss tempo hold for the score: while a boss is alive the tempo holds at
 * BOSS_BPM, gliding down over BOSS_GLIDE_SEC on spawn and gliding back to the
 * run curve over BOSS_GLIDE_SEC on death. BossSystem owns the writes,
 * mirroring how it owns BossTimer.
 */
export class BossTempo {
  private phase: 'off' | 'entering' | 'leaving' = 'off';
  private enteredAtSec = 0;
  private enterFromBpm = MUSIC_BASE_BPM;
  private leftAtSec = 0;
  private leaveToBpm = MUSIC_BASE_BPM;

  /** Boss spawn: glide from the current tempo down to BOSS_BPM. A call during a
   *  return glide re-targets it from the tempo at that moment. */
  bossEnter(timeSec: number): void {
    this.enterFromBpm = this.bpmFor(timeSec);
    this.enteredAtSec = timeSec;
    this.phase = 'entering';
  }

  /** Boss death: glide back to the run curve's value at that moment. */
  bossLeave(timeSec: number): void {
    if (this.phase === 'off') return;
    this.leaveToBpm = bpmForTime(timeSec);
    this.leftAtSec = timeSec;
    this.phase = 'leaving';
  }

  /** True once the 64 BPM hold is in effect: after the spawn glide, until bossLeave. */
  holding(timeSec: number): boolean {
    if (this.phase === 'off' || this.phase === 'leaving') return false;
    return timeSec >= this.enteredAtSec + BOSS_GLIDE_SEC;
  }

  /** The score's tempo at run time `timeSec`, honoring the hold and both glides. */
  bpmFor(timeSec: number): number {
    if (this.phase === 'entering') {
      return lerp(this.enterFromBpm, BOSS_BPM, clamp01((timeSec - this.enteredAtSec) / BOSS_GLIDE_SEC));
    }
    if (this.phase === 'leaving') {
      const t = (timeSec - this.leftAtSec) / BOSS_GLIDE_SEC;
      if (t >= 1) return bpmForTime(timeSec); // glide done: back on the moving curve, no 64 residue
      return lerp(BOSS_BPM, this.leaveToBpm, clamp01(t));
    }
    return bpmForTime(timeSec);
  }
}
```
`Music` gains: `private readonly bossTempo = new BossTempo();`, `bossEnter(timeSec: number): void` / `bossLeave(timeSec: number): void` (each one line delegating; no mute check — the hold state must survive mute toggles).

### Steps
1. Append the block above to `src/core/music.ts`.
2. `src/audio/Music.ts`: import `BossTempo`; add `const PULSE_HZ = 110;` and `const PULSE_SEMITONE_HZ = PULSE_HZ * 2 ** (1 / 12);` near `NOTES`. In `update`, change the loop line to `this.nextBeat += 60 / this.bossTempo.bpmFor(timeSec);`. In `scheduleBeat`, change the pulse line to `this.tone('sine', PULSE_HZ, PULSE_HZ / 2, 0.3, 0.5, t);` and, immediately after it, insert:
```ts
    // Boss hold: pulse plus, on alternating beats, a tone a semitone above it —
    // the dissonant pair. No other voices while a boss is alive.
    if (this.bossTempo.holding(timeSec)) {
      if (barBeat % 2 === 0) this.tone('sine', PULSE_SEMITONE_HZ, PULSE_SEMITONE_HZ / 2, 0.3, 0.5, t);
      return;
    }
```
(early return suppresses the sparse notes, the high off-beat voice and the noise swell — at 5:00+ the run is past 100 BPM and the high voice would otherwise fight the "score drops low" hold). Add the two delegating methods next to `bossSwell()`, and one sentence about the 64 BPM boss hold in the class doc comment.
3. `src/systems/BossSystem.ts`: in `startEntering()`, after `this.music.bossSwell();` add `this.music.bossEnter(this.run.timeSec);`; in `killBoss()`, after `this.sfx.enemyDeath(80);` add `this.music.bossLeave(this.run.timeSec);`.
4. Add the tests (below). 5. `docs/ARCHITECTURE.md` Audio paragraph: add "and drops to a slow 64 BPM dissonant hold while a boss is alive (core/music.ts `BossTempo`)". 6. `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT mutate `BossTempo.phase` inside `bpmFor` — queries stay pure; the `t >= 1` branch is what returns to the curve, so a stale `'leaving'` phase is harmless and `bossEnter` fully re-arms all fields.
- No 64 residue: after the return glide `bpmFor` must return `bpmForTime(timeSec)`, not the frozen death-time value (curve keeps moving at 4 BPM/min).
- Mute: `bossEnter`/`bossLeave` must run even while muted (state is time-based; `update` is already the mute gate).
- Pause/level-up overlay: everything keys to `run.timeSec`, which freezes with the scene — no `ctx.currentTime` coupling; the existing catch-up in `Music.update` handles beats.
- A `60 / 0` or NaN tempo would poison `nextBeat`; the existing `music-scheduler` invariant in GameScene already fails on that — keep `BOSS_BPM` nonzero and never divide by `bpmFor` without it.
- T0097 (asus) will also edit `BossSystem.ts` and `core/boss.ts` for the Palette boss: keep your two insertions anchored to the `bossSwell()`/`enemyDeath(80)` lines so rebases are trivial; no functional dependency.

### Tests
Append to `tests/core/music.test.ts` (import `BossTempo, BOSS_BPM, BOSS_GLIDE_SEC`): in `describe('boss tempo hold')`, pin:
- no boss: `bpmFor(300) === 100`, `holding(300) === false`
- `bossEnter(300)`: `bpmFor(300)===100`, `bpmFor(300+0.75)===82`, `bpmFor(301.5)===64`, `bpmFor(900)===64`, `holding(301.4)===false`, `holding(301.5)===true`
- `bossLeave(360)` (curve 104): `bpmFor(360)===64`, `bpmFor(360.75)===84`, `bpmFor(361.5)===104`, `holding(360)===false`, `bpmFor(361.51)===bpmForTime(361.51)` (curve, not frozen 104)
- re-target: `bossEnter(300)`, `bossLeave(600)` (curve 120), `bpmFor(600.75)===92`, `bossEnter(600.75)`, then `bpmFor(601.5)===78`, `bpmFor(602.25)===64`
All test times are exactly representable in binary; use `toBe`, matching the existing pins.

## Result (attempt 1, desktop)

Added the boss tempo hold: a pure `BossTempo` class in `src/core/music.ts` (BOSS_BPM 64, BOSS_GLIDE_SEC 1.5, glide on spawn/death, re-target on mid-glide spawn) that `Music` now schedules against, with a dissonant semitone-above second voice on alternating beats while a boss is alive; `BossSystem` calls `bossEnter`/`bossLeave` at the existing sting/death moments, and the logic is locked by four new tests in `tests/core/music.test.ts` (one-char `t > 1` boundary fix vs the design snippet, noted above). `npm run check` (224 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 10.1 min

```
game/docs/ARCHITECTURE.md      |  2 +-
 game/src/audio/Music.ts        | 31 +++++++++++++++++++++---
 game/src/core/music.ts         | 55 ++++++++++++++++++++++++++++++++++++++++++
 game/src/systems/BossSystem.ts |  2 ++
 game/tests/core/music.test.ts  | 42 +++++++++++++++++++++++++++++++-
 5 files changed, 126 insertions(+), 6 deletions(-)
```
