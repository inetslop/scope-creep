---
id: T0115
title: Tempo change — the score reads your build
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T14:14:52Z
---

## Goal
A run that keeps levelling up gets audibly faster: every upgrade you pick nudges the generative score +2 BPM, so your build is heard in the music, not just seen. This is the first time the score responds to what you do rather than only to the clock.

## Details
- The run tempo (no boss alive) becomes the existing base curve plus a build nudge: `effectiveTempo(t) = min(120, baseCurve(t) + 2 × picks)`.
- `baseCurve(t)` is the tempo curve that already ships (T0011, pinned by T0095): 80 BPM at 0:00, rising to 120 BPM at 10:00, clamped at 120 BPM after. It is unchanged by this task.
- `picks` = the number of upgrade cards the player has picked this run. Each confirmed level-up pick counts one — including re-picking a card you already own for another level, and including weapon cards (Line, Orbit, Arc, Counterpoint). The moment that counts is the same moment the level-up pulse fires (T0102) and the Index updates (T0104).
- The nudge is capped at the 120 BPM clamp (the top of the base curve) — it only lets a fast-building run get ahead of the natural ramp, never past 120. A run that levels quickly reaches 120 BPM well before the 10:00 ramp would, so a busy build feels like the score is rushing.
- The change is a plain retarget: a +2 BPM step is inaudible as a jump, so the next beats simply use the new tempo — no special glide, no hard cut, no new sound.
- Boss composition (T0108): while a boss is alive the 64 BPM dissonant hold still takes priority and the nudge is suspended for the duration; on the boss's death the tempo glides back to the *effective* run tempo at that moment (base curve + the current nudge), not just the bare curve. The boss warning (T0070), sting (T0058) and nameplate (T0064) are untouched.
- Do NOT edit `BossSystem.ts` — asus is on it for the Palette boss (T0097). Keep the pick-count plumbing on the music side (`src/core/music.ts` + `src/audio/Music.ts` + the pick moment), so this task never touches a file asus is editing.
- The existing `bpmForTime` pins (T0011, T0095) and the existing boss-tempo pins (T0108) must keep passing untouched; the build nudge is an additive pure function.
- Music only: no new HUD, no new input, no new SFX, no new scene, no content file. The score obeys the existing mute (M) exactly like everything else in it.

## Acceptance criteria
- [ ] With no boss and 0 picks the tempo equals the base curve exactly — the existing pins still pass (80 BPM at 0:00, 120 at 10:00, 120 at 15:00).
- [ ] A new pure tempo function is locked by unit tests in `tests/core/music.test.ts`: at base 80 (t=0) → 80 / 100 / 120 / 120 for 0 / 10 / 20 / 30 picks; at base 100 (t=300) → 110 / 120 for 5 / 10 picks; at base 120 (t=600) → 120 for any pick count.
- [ ] Picking a card mid-run raises the tempo by 2 BPM with no audible jump or new sound; after several picks the score at the same clock time is clearly faster than a run with no picks.
- [ ] While a boss is alive the tempo holds at 64 BPM regardless of picks (T0108 unchanged); on boss death it glides back to the effective run tempo (base + current nudge), not the bare curve — a pin shows the return target is the nudged value.
- [ ] No edit to `BossSystem.ts`; no HUD, input, SFX, scene or content changes; the existing `bpmForTime` and boss-tempo pins still pass.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- edit `src/core/music.ts` - add `BPM_PER_PICK` + pure `effectiveTempo(timeSec, picks)`; give `BossTempo.bossEnter/bossLeave/bpmFor` an optional `picks` param so the nudge flows through the existing hold/glide state machine
- edit `src/audio/Music.ts` - own the per-run pick counter (`picks`, `notePick()`), feed it to `bossTempo`; public signatures unchanged
- edit `src/scenes/keys.ts` - typed `getMusic(scene)` registry getter, next to `getSfx`
- edit `src/scenes/GameScene.ts` - one line in `create()`: `this.registry.set('music', this.music)`
- edit `src/scenes/LevelUpScene.ts` - call `getMusic(this).notePick()` at the pick moment in `choose()`
- edit `tests/core/music.test.ts` - new pins for `effectiveTempo` and the nudged boss return; existing pins stay byte-identical
- edit `docs/ARCHITECTURE.md` - one clause in the Audio paragraph

### Interfaces
```ts
// src/core/music.ts
export const BPM_PER_PICK = 2;
export function effectiveTempo(timeSec: number, picks: number): number; // Math.min(MUSIC_MAX_BPM, bpmForTime(timeSec) + BPM_PER_PICK * picks)

// BossTempo: the three methods gain an optional param (default 0), e.g.
bpmFor(timeSec: number, picks = 0): number;  // bossEnter / bossLeave the same

// src/audio/Music.ts
notePick(): void; // this.picks += 1
// update(timeSec), bossEnter(timeSec), bossLeave(timeSec) keep their exact signatures

// src/scenes/keys.ts
export function getMusic(scene: Phaser.Scene): Music;
```

### Steps
1. `core/music.ts`: add `BPM_PER_PICK` and `effectiveTempo` after `secondVoiceActive`. In `BossTempo`: `bossEnter` → `this.enterFromBpm = this.bpmFor(timeSec, picks)`; `bossLeave` → `this.leaveToBpm = effectiveTempo(timeSec, picks)`; in `bpmFor` replace both bare `bpmForTime(timeSec)` returns (the `'off'` branch and the `t > 1` branch) with `effectiveTempo(timeSec, picks)`; the two lerp glides stay untouched. Update doc comments: the nudge is suspended while the hold is in effect; the death glide returns to the nudged tempo.
2. `tests/core/music.test.ts`: add `BPM_PER_PICK, effectiveTempo` to the import; add the tests below. Do not modify any existing test.
3. `audio/Music.ts`: add `private picks = 0;` after the `bossTempo` field; add `notePick()` after `bossLeave()` (doc: state only, like the boss hold — no mute check); in `update()` change line 79 to `this.nextBeat += 60 / this.bossTempo.bpmFor(timeSec, this.picks);`; in `bossEnter`/`bossLeave` pass `this.picks` into `bossTempo`; update the class doc (…plus +2 BPM per upgrade picked this run, capped at 120) and the `bossLeave` doc (…glides back to the effective run tempo). Leave `secondVoiceActive(timeSec)` and the off-beat `t + 30 / bpmForTime(timeSec)` on the bare curve — pinned and out of scope.
4. `scenes/keys.ts`: add `import type { Music } from '../audio/Music';` after the Sfx import; add the `getMusic` getter directly after `getSfx`.
5. `scenes/GameScene.ts`: in `create()`, directly after `this.music = new Music(this, this.sfx);` add `this.registry.set('music', this.music);`. Touch no other line — other open tasks edit this file.
6. `scenes/LevelUpScene.ts`: add `getMusic` to the `./keys` import; in `choose()`, directly after `getRun(this).applyUpgrade(def);` add `getMusic(this).notePick(); // the score's tempo gains +2 BPM, same moment the pulse fires and the Index updates`.
7. `docs/ARCHITECTURE.md`, Audio paragraph: "tempo 80→120 BPM over the first 10 minutes" → "tempo 80→120 BPM over the first 10 minutes (+2 BPM per upgrade picked, capped at 120)".
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT edit `src/systems/BossSystem.ts` (asus owns it): `Music.bossEnter/bossLeave` keep their signatures — picks come from Music's own counter, so BossSystem compiles untouched.
- The warm-start upgrade (GameScene.create line 104) must NOT count: the only increment is `LevelUpScene.choose()`. Do not derive the count from `run.upgradeHistory` (it includes the warm start and reads a file two open tasks are editing).
- Existing pins keep passing because `effectiveTempo(t, 0)` is bit-identical to `bpmForTime(t)` (`Math.min(a + 0, 120) === a`) — do not "tidy" them.
- No new invariant: no new system is added; the counter can't go negative and the tempo is capped by construction.
- `notePick()` is state, not sound: no mute check, no listener, nothing to remove on shutdown; `Music` is re-created per run so `picks` resets. The +2 step lands on the next scheduled beat — plain retarget, no glide, no new SFX, so mute (M) behavior is unchanged.
- `keys.ts` is also touched by T0121 (a SCENES key) — keep your edit to the import line plus the getter next to `getSfx`.

### Tests
In `tests/core/music.test.ts`, a new `describe('build nudge (effective tempo)')` pinning exactly the acceptance numbers: 0 picks → 80 / 100 / 120 / 120 at t = 0 / 300 / 600 / 900; base 80 → 80 / 100 / 120 / 120 for 0 / 10 / 20 / 30 picks; base 100 (t=300) → 110 / 120 for 5 / 10 picks; base 120 (t=600) → 120 for any pick count; and `effectiveTempo(0, 1)` = `80 + BPM_PER_PICK`. Plus two tests in the existing `describe('boss tempo hold')`:
```ts
it('suspends the build nudge while a boss is alive', () => {
  const t = new BossTempo();
  t.bossEnter(300, 20); // effective tempo would be 120 without the boss
  expect(t.bpmFor(300, 20)).toBe(120);
  expect(t.bpmFor(301.5, 20)).toBe(BOSS_BPM);
  expect(t.bpmFor(900, 20)).toBe(BOSS_BPM);
});
it('glides back to the nudged tempo on boss death, capped at 120', () => {
  const t = new BossTempo();
  t.bossEnter(300, 5);
  t.bossLeave(360, 5); // base curve is 104 at 6:00, nudged to 114
  expect(t.bpmFor(360, 5)).toBe(BOSS_BPM);
  expect(t.bpmFor(361.5, 5)).toBe(114);
  expect(t.bpmFor(361.51, 5)).toBe(effectiveTempo(361.51, 5)); // moving nudged curve, not the bare one
  const capped = new BossTempo();
  capped.bossEnter(300, 20);
  capped.bossLeave(360, 20); // 104 + 40 would be 144
  expect(capped.bpmFor(361.5, 20)).toBe(120);
});
```
