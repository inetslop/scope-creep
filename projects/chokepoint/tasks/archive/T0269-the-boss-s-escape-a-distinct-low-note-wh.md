---
id: T0269
title: "The boss's escape: a distinct low note when the boss gets through"
assignee: baby-mama
size: M
priority: 2
status: done
depends_on: [T0253]
attempts: 1
created: 2026-10-30T08:43:10Z
claimed_at: 2026-10-30T09:08:57Z
finished_at: 2026-10-30T09:15:28Z
epic: E5
---

## Goal
Letting the peak through is the run's worst moment, and today it is heard exactly the same as a Dot getting through: when a boss leaks, a distinct low note plays, so "that was the boss" is heard, not just seen in the big ghost that walks back (T0250) — E5's "its escape … is the run's worst moment, heard as a distinct low note."

## Details
- **Who triggers it:** a leak whose leaker is the enemy the current boss wave's plan declares as its boss — T0253's `isBossWave` plan (today the Colossus; the second and third boss — T0259's Titan, T0266's Orb — ride the same plan rule with no change to this hook). A normal enemy leaking (Dot, Block, Hauler, a Ward) never triggers it. Data-driven off the plan and the def, never a hard-coded id.
- **The note (a new Sfx method, the sting/coin-blip class):** a low two-note horn, descending — e.g. 82 Hz then 62 Hz, 200 ms each, ~100 ms apart, volume 0.14. It sits below the leak thud's 98 Hz (T0267) and is longer and falling, so it reads as a loss ("it got through"), the mirror of the arrival's rising horn (T0268) — the pair share the 62-82 Hz band, one up, one down. Procedural, no sound file, silent when sound is off (T0035).
- **Coexistence, not replacement:** on a boss leak the leak's existing feedback all lands exactly as today — the size-scaled jolt (T0109), the ghost echo walking back from the exit (T0250), the leak thud (T0267) where it has landed, the first-leak chip (T0107) on a first leak, the Toll's leak gold (T0234) and the last-stand banner (T0060) at 1 life — and the note is added on top. The thud (98 Hz, 120 ms, single) and the escape note (82→62 Hz, 200 ms each, falling) differ in pitch, length and direction, so the two read as one heavy "it got through" moment, not a duplicate; if the thud has not yet landed, the note stands alone.
- **The trigger (a new leak hook, the comboBreak T0207 / leakEcho T0250 pattern):** a new file in the enemy-hooks folder, registered where they register. It fires at the same moment as the jolt and the echo, checks the leaker against the plan's declared boss, and plays the note only when it matches. It is resume-safe (a resumed run replays nothing — the note plays live, like the thud) and plays once per boss that gets through (a boss wave sends one boss, so at most one per wave).
- **No new HUD, readout, board mark, input or key:** the note adds a sound, not a readout — the leaker is already identified by the echo ghost's shape and size, the jolt is already scaled to it, and the screen is unchanged. The pause screen's controls are unchanged.
- **Why it matters now:** the Colossus (wave 10, livesCost 1) already leaks today, so the escape happens in the game as it is; right now the run's costliest leak — losing the peak enemy to the exit — is heard the same as any other, which undersells the moment the rest of E5 is built to make big.

## Acceptance criteria
- [ ] When the boss (the plan's declared boss) reaches the exit and leaks, one descending two-note horn plays (~82→62 Hz, 200 ms each, ~100 ms apart, volume 0.14), at the same moment as the leak's jolt and echo ghost.
- [ ] A non-boss enemy leaking (a Dot, a Block, a Hauler, a Ward) never plays the note — its leak feedback is byte-identical to today.
- [ ] On a boss leak the existing feedback is unchanged and all still plays — the size-scaled jolt (T0109), the ghost echo (T0250), the thud (T0267) where present, the first-leak chip (T0107), the Toll gold (T0234) and the last-stand banner (T0060); the note is added on top, distinct in pitch/length/direction from the thud.
- [ ] At most one note per boss wave (the boss wave sends one boss); at 2× fast-forward (T019) it plays once and unstretched; with sound off it is silent and the leak's visual feedback is byte-identical.
- [ ] No gameplay change: the boss's livesCost, gold, the Toll's leak gold, the last-stand and resume are byte-identical with the note on; no new HUD element, readout, board mark or key is added.
- [ ] The note's two falling notes share the arrival horn's (T0268) 62-82 Hz band but descend, so the arrival (rising) and escape (falling) are a heard pair.

## Design (architect, baby-mama)

### Files
- create `src/systems/enemyHooks/bossEscape.ts` — the leak hook: on an `onLeak`, play the escape note iff the leaker's id is the boss the current wave's plan declares
- edit `src/core/waves.ts` — add exported `bossId(wave)`; `planWave`'s boss branch reads it (single source for "which enemy is the boss of wave N")
- edit `src/audio/Sfx.ts` — add one method `bossEscape()` next to the other leak sounds (after `leak()`)
- edit `src/systems/enemyHooks/index.ts` — one import line (after the `leakEcho` import) and one line `bossEscape,` in `ENEMY_HOOKS` after `leakEcho,`
- edit `tests/core/waves.test.ts` — a test for `bossId`

### Interfaces
```ts
// src/core/waves.ts, after isBossWave
/** The enemy the plan declares as the boss of wave `wave`; undefined on non-boss waves. */
export function bossId(wave: number): string | undefined {
  if (!isBossWave(wave)) return undefined;
  return wave === 30 ? 'orb' : 'colossus';
}
// in planWave, the boss branch becomes:
//   return { number: wave, spawns: [{ enemy: bossId(wave)!, delaySec: 0 }], hpMul: waveHpMul(wave), tags: ['boss'] };

// src/audio/Sfx.ts, after the leak() method
/** A boss got through: a low two-note horn, 82 Hz then 62 Hz, 200 ms each, ~100 ms apart, the sting's quiet class. */
bossEscape(): void {
  this.tone(82, 0.2, 'sine', 0.14);
  this.tone(62, 0.2, 'sine', 0.14, undefined, 0.1);
}

// src/systems/enemyHooks/bossEscape.ts (whole file)
import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's escape: when the leaker is the enemy the current wave's plan declares as its boss,
 * one low descending horn plays, on top of the leak's other feedback (the jolt, the echo ghost,
 * the thud, the Toll gold and the last-stand banner all still land). A non-boss leaker is
 * byte-identical to today; a boss wave sends at most one boss, so at most one note per wave.
 * Live-run only: the note plays at the leak's moment, like the thud; a resumed run replays nothing.
 */
export const bossEscape: MakeEnemyHook = ({ run, sfx }) => ({
  onLeak(enemy) {
    const boss = bossId(run.wave);
    if (boss !== undefined && enemy.def.id === boss) sfx?.bossEscape();
  },
});
```

### Steps
1. `src/core/waves.ts`: add `bossId` right after `isBossWave`; in `planWave` replace `enemy: wave === 30 ? 'orb' : 'colossus'` with `enemy: bossId(wave)!` (the branch is only reached on boss waves, so it is defined).
2. `src/audio/Sfx.ts`: add the `bossEscape()` method after `leak()` (before `leakWarn()`).
3. Create `src/systems/enemyHooks/bossEscape.ts` exactly as above (destructure only `{ run, sfx }`).
4. `src/systems/enemyHooks/index.ts`: add the import after the `leakEcho` import and `bossEscape,` after the `leakEcho,` list line — never at the list's end.
5. `tests/core/waves.test.ts`: add `bossId` to the import and one test (below).
6. `npm run check` and `npm run smoke` must pass.

### Pitfalls
- Never call `planWave`/`planNormalWave` from the hook to read the plan: they draw from `run.rng` and would corrupt the seeded stream of a resumed run — `bossId` is pure and must stay that way.
- No hard-coded enemy id in the hook: when T0259/T0266 add the Titan and the Orb they update `bossId` (the plan's single source) and the note rides along with no change to the hook; a Guard leaking on such a wave is a non-boss leaker and stays silent.
- Add, never replace: do not touch `EnemySystem.leak()`, the jolt, `leakEcho`, the thud, `tollLeak`, the last-stand or first-leak feedback — the hook only plays sound.
- The two notes are scheduled on the AudioContext clock (`tone`'s `delaySec`), not game `dt`: at 2× fast-forward the note plays once and unstretched.
- `tone` already returns silent when muted, before unlock, or without a context — the sound-off path needs no code.
- `sfx` is `Sfx | undefined` in the hook context: keep the `sfx?.` call.

### Tests
In `tests/core/waves.test.ts`, alongside the existing `isBossWave` test:
```ts
it('bossId: the boss the plan declares, undefined off the boss waves', () => {
  expect(bossId(10)).toBe('colossus');
  expect(bossId(30)).toBe('orb');
  expect(bossId(1)).toBeUndefined();
  expect(bossId(9)).toBeUndefined();
  for (const wave of [10, 20, 30, 40]) {
    expect(bossId(wave)).toBe(planWave(wave, new Rng(wave), ENEMIES).spawns[0]!.enemy); // the rule and the plan agree
  }
});
```
The last line is what stops a later boss change from drifting the rule and the plan apart.

## Result (attempt 1, baby-mama)

A boss leaking now plays a distinct low descending two-note horn (82→62 Hz, 200 ms each, ~100 ms apart, vol 0.14) on top of all the existing leak feedback. New leak hook `bossEscape` in `src/systems/enemyHooks/` fires when the leaker is the enemy the current wave's plan declares as boss, read via a new pure `bossId(wave)` in `src/core/waves.ts` (which `planWave` now uses as the single source of the boss id); the sound is one new `Sfx.bossEscape()` method in `src/audio/Sfx.ts`, silent when muted and unstretched at 2×. Non-boss leaks are byte-identical to before; no HUD, input, resume or gameplay value changed.

- Self-review: APPROVE
- Time: 6.5 min

```
projects/chokepoint/game/src/audio/Sfx.ts                |  6 ++++++
 projects/chokepoint/game/src/core/waves.ts               |  8 +++++++-
 .../chokepoint/game/src/systems/enemyHooks/bossEscape.ts | 16 ++++++++++++++++
 projects/chokepoint/game/src/systems/enemyHooks/index.ts |  2 ++
 projects/chokepoint/game/tests/core/waves.test.ts        | 11 ++++++++++-
 5 files changed, 41 insertions(+), 2 deletions(-)
```
