---
id: T0011
title: Generative background music
assignee: desktop
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T17:58:28Z
claimed_at: 2026-10-26T19:45:52Z
---

## Goal
A quiet generative score under the action. Right now the only audio is SFX; a slow pulse that speeds up as the run goes on gives the game a heartbeat and a sense of escalation without any audio assets.

## Details
- New music system alongside `src/audio/Sfx.ts`, built the same way: pure WebAudio synthesis on the shared audio context (oscillators + filtered noise), no audio file assets.
- Style: Bauhaus minimal — a low ink pulse on the beat, sparse notes from a small 5-note set, an occasional soft noise swell. Texture and rhythm, not a hummable tune.
- Loudness: music mixed at roughly 25% of SFX volume; SFX must stay clearly on top.
- Escalation: 80 BPM at 0:00, +4 BPM per minute, capped at 120 BPM (reached at 20:00). At 100 BPM a second voice (higher notes on the off-beat) joins in.
- Lifecycle: starts after the first user input (same audio-unlock path as Sfx), plays during the Game scene, stops while paused and on game over, resumes when unpaused.
- No UI and no settings for this yet (the settings page is a later milestone).

## Acceptance criteria
- [ ] A quiet generative loop plays during a run, starting after the first input
- [ ] Music is synthesized (oscillators/noise); no audio file assets added
- [ ] Music is clearly quieter than SFX
- [ ] The loop is audibly faster at 10:00 than at 0:00, and a new layer is audible by ~5:00
- [ ] Music stops when paused and on game over; resumes when unpaused
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile

## Design (architect, desktop)

### Files
- create `src/core/music.ts` - pure tempo curve + constants (no Phaser; unit-testable)
- create `src/audio/Music.ts` - generative score: lookahead beat scheduler + WebAudio synthesis, built exactly like `Sfx`
- edit `src/audio/Sfx.ts` - export `MASTER_VOLUME`; add `get isMuted()`
- edit `src/scenes/GameScene.ts` - construct/update/dispose Music; register one invariant
- create `tests/core/music.test.ts` - tempo-curve tests
- edit `docs/ARCHITECTURE.md` - one sentence about Music in the Audio section

### Interfaces
```ts
// src/core/music.ts (implementations are one-liners)
export const MUSIC_BASE_BPM = 80;
export const MUSIC_BPM_PER_MIN = 4;
export const MUSIC_MAX_BPM = 120;
export const MUSIC_SECOND_VOICE_BPM = 100;
export function bpmForTime(timeSec: number): number;              // Math.min(80 + 4 * (t/60), 120)
export function secondVoiceActive(timeSec: number): boolean;      // bpmForTime(t) >= 100

// src/audio/Music.ts
export class Music {
  constructor(scene: Phaser.Scene, sfx: Sfx);
  update(timeSec: number): void;  // call once per frame from GameScene.update
  dispose(): void;                // disconnect master gain; call on GameScene shutdown
  get nextBeatTime(): number;
}
```

### Steps
1. Create `src/core/music.ts` exactly as above.
2. Create `src/audio/Music.ts`. Imports: `import { MASTER_VOLUME, type Sfx } from './Sfx';` and `import { bpmForTime, secondVoiceActive } from '../core/music';`. Constants: `MUSIC_VOLUME = MASTER_VOLUME * 0.25`, `LOOKAHEAD_SEC = 0.12`, `NOTES = [220, 261.63, 293.66, 329.63, 392]`, `NOTES_HIGH = [440, 523.25, 587.33, 659.25, 783.99]` (A-minor pentatonic, +1 octave).
   - Constructor: copy `Sfx`'s constructor (same ctx cast, own `GainNode` at `MUSIC_VOLUME` to `ctx.destination`, own 2.5 s noise buffer) and store `private readonly sfx: Sfx`.
   - `update(timeSec)`: if `ctx === null || master === null || sfx.isMuted || ctx.state !== 'running'` → `playing = false; return`. If `!playing` → `playing = true; nextBeatTime = ctx.currentTime + 0.1`. If `nextBeatTime < ctx.currentTime - 0.1` → resync `nextBeatTime = ctx.currentTime + 0.1` (catch-up guard, required). Then `while (nextBeatTime < ctx.currentTime + LOOKAHEAD_SEC) { scheduleBeat(nextBeatTime, beatIndex, timeSec); nextBeatTime += 60 / bpmForTime(timeSec); beatIndex += 1; }`.
   - `scheduleBeat(t, beat, timeSec)`: every beat → low ink pulse `tone('sine', 110, 55, 0.3, 0.5, t)`. `barBeat = beat % 4`: if `barBeat === 1 || (barBeat === 3 && Math.random() < 0.5)` → one sparse note `tone('triangle', hz, hz, 0.4, 0.22, t)` (`hz` picked once from NOTES). If `secondVoiceActive(timeSec) && (barBeat === 1 || barBeat === 3) && Math.random() < 0.7` → `tone('sine', hz2, hz2, 0.25, 0.14, t + 30 / bpmForTime(timeSec))` (higher note on the off-beat, half a beat later). If `barBeat === 0 && Math.random() < 0.3` → `swell(t)`.
   - `tone(type, fromHz, toHz, durSec, vol, t)`: copy `Sfx.tone` (Sfx.ts:119) but take absolute start time `t` instead of `delaySec`.
   - `swell(t)`: noise buffer → lowpass 400 Hz → gain `0.0001 → 0.08` (linear, 0.5 s) `→ 0.0001` (exponential, 1.6 s), `src.start(t, Math.random() * 0.5, 1.6)`, disconnect nodes in `onended` (copy `Sfx.noise` wiring).
   - `dispose()`: `if (this.master) this.master.disconnect();`
3. `Sfx.ts`: line 3 → `export const MASTER_VOLUME = 0.35;`; add `get isMuted(): boolean { return this.muted; }` after `toggleMute()`.
4. `GameScene.ts`: import `Music`; field `private music!: Music;`; in `create()` right after `this.sfx = new Sfx(this);` add `this.music = new Music(this, this.sfx);`; in `update()` right after `run.timeSec += dt;` add `this.music.update(run.timeSec);`; in the SHUTDOWN handler next to `this.sfx.dispose();` add `this.music.dispose();`; in `registerInvariants()` add `hook.addInvariant('music-scheduler', () => (Number.isFinite(this.music.nextBeatTime) && this.music.nextBeatTime >= 0 ? null : `music nextBeatTime ${this.music.nextBeatTime}`));` and append `'music-scheduler'` to the `INVARIANTS` array.
5. `tests/core/music.test.ts`: `bpmForTime(0) === 80`, `bpmForTime(300) === 100`, `bpmForTime(600) === 120`, `bpmForTime(3600) === 120`, monotonic over 0..3600; `secondVoiceActive(299) === false`, `secondVoiceActive(300) === true`.
6. `docs/ARCHITECTURE.md` Audio section: add one sentence — Music plays a quiet generative score on the same context at ~25% of the SFX master, tempo 80→120 BPM over the first 10 minutes, second voice at 100 BPM, driven from `GameScene.update` so it stops while paused/on game over, follows the SFX mute.

### Pitfalls
- Task text says the 120 BPM cap is "reached at 20:00", but 80 + 4/min reaches 120 at 10:00. The acceptance criteria (faster at 10:00, layer by ~5:00) match +4/min — implement +4/min; do NOT "fix" it to +2/min.
- Beat burst after pause: GameScene pauses under the LevelUp/Pause overlays, so `nextBeatTime` goes stale while `ctx.currentTime` keeps advancing. The resync guard in step 2 is mandatory; without it, resume schedules hundreds of beats at once.
- Never call `ctx.resume()` (Sfx never does; Phaser's sound manager unlocks on the first gesture). Just check `ctx.state === 'running'` — before first input the music is a silent no-op, which is the required "starts after first input" behavior.
- Do not use `run.rng` for note choice (would desync the gameplay RNG stream); `Math.random()` is the established pattern for non-gameplay audio texture.
- The invariant must check finiteness only: `nextBeatTime` is legitimately stale while the scene is paused, so a "not behind now" check would false-positive during LevelUp/Pause.
- No npm deps, no audio files, no UI; the smoke contract is unchanged (music is a no-op if the context never unlocks).

### Tests
- `tests/core/music.test.ts` as in step 5.
