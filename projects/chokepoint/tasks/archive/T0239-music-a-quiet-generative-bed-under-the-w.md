---
id: T0239
title: "Music: a quiet generative bed under the wave phase"
assignee: asus
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T23:53:23Z
claimed_at: 2026-10-30T11:27:13Z
finished_at: 2026-10-30T12:00:11Z
---

## Goal
The wave phase gets a heartbeat: a quiet generative music bed plays while enemies walk and quickens while a leak is imminent, so a wave's danger is heard as well as seen — the last missing piece of the game's "heard as well as seen" language (the tier chime T0032, the beam hum T0112, the last-stand sting T0091).

## Details
- A new system in a new file, `src/audio/music.ts` — the game's own procedural approach (oscillators, no samples; same ground as `src/audio/Sfx.ts`). One bed at a time; exactly two voices, never more.
- **When it plays:** only the wave phase of a real run. It fades in over ~0.5 s as the wave starts (the same moment the "Wave N" banner lands, T0067) and fades out over ~0.5 s when the wave ends. Silent in the build phase, the draft, the menu (including the menu's live demo, T0049 — the menu stays quiet), the pause and the game over. Silent while paused, like every SFX, and off with the sound toggle (T0035).
- **The bed:** an 8-step loop, 0.4 s per step (a 2 s loop), one note at a time, sine, each note decaying over 0.3 s, volume 0.04. The notes in order: E3, E3, G3, E3, C3, E3, G3, A3 — the run's own E–G–A shape (the coin chime's interval, an octave down) with the tier chime's C.
- **The danger voice:** while any living enemy is within 3 s of the exit — the ExitWarning's own state (T0014), not a new measurement — the loop's step halves to 0.2 s and a second voice plays the same 8-note pattern an octave up (E4…A4) at volume 0.03. Both revert the moment the warning clears, so the run's closest leak has a sound under the red pulse.
- **Speed:** the bed is driven by the wave's simulation clock, so the 2× fast-forward (T0019) runs it 2× too — everything in the wave phase runs twice as fast at once.
- **Volumes:** the bed never exceeds 0.04 per voice (0.07 at most, danger voice on); the hit blip (0.18) and the coin chime (0.18) stay clearly above it. No new HUD element, no new input, no change to any existing sound.

## Acceptance criteria
- [ ] In a wave, a quiet 8-note loop plays (E3, E3, G3, E3, C3, E3, G3, A3; sine; 0.4 s steps; 0.3 s decay; volume 0.04), fading in ~0.5 s at wave start and out ~0.5 s at wave end; it is silent in the build phase, the draft, the menu and its live demo, the pause and the game over.
- [ ] While the exit warning is live (an enemy within 3 s of the exit), the step halves to 0.2 s and an octave-up second voice (volume 0.03) joins; both revert when the warning clears.
- [ ] At 2× speed the loop runs 2×; with the sound off or while paused it is silent; the coin chime, tier chime, hit blip and beam hum are byte-identical to before.
- [ ] No new HUD element, no new input; check and smoke pass on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/audio/music.ts` - the wave bed: `MusicBed`, an 8-step generative loop on Sfx's WebAudio context
- edit `src/audio/Sfx.ts` - one new accessor `audio()` exposing the unlocked context + master gain (no other change)
- edit `src/systems/ExitWarning.ts` - one new getter `live` exposing its existing `active` state
- edit `src/scenes/GameScene.ts` - wiring only: import, field, one line in `create()`, one line in `update()`, one line in the `shutdown` handler
- edit `src/debug/runChecks.ts` - one invariant line next to `exitWarn.valid`

### Interfaces
```ts
// src/audio/music.ts
export class MusicBed {
  constructor(sfx: Sfx);
  /** dt = the wave's sim seconds (2× fast-forward runs the loop 2×). playing = run.phase === 'wave'; danger = exitWarn.live. */
  update(dt: number, playing: boolean, danger: boolean): void;
  /** Fades the bed out over 0.5 s; a no-op when not playing; call it from the scene's shutdown too. */
  stop(): void;
  /** Invariant: no more than two steps' worth of notes (two voices at 2×) still ringing. */
  broken(): string | undefined;
}

// src/audio/Sfx.ts (add, e.g. after unlock())
audio(): { ctx: AudioContext; master: GainNode } | undefined  // undefined while locked/suspended or no WebAudio

// src/systems/ExitWarning.ts (add, before update())
get live(): boolean  // its existing private `active` state, read as-is
```
Note frequencies (Hz): E3 164.81, C3 130.81, G3 196, A3 220 — loop `[164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]`; the danger voice plays `f * 2`. Constants: `STEP_SEC 0.4` (0.2 in danger), `DECAY_SEC 0.3`, `FADE_SEC 0.5`, base volume 0.04, danger volume 0.03 (pre-master, same scale as `Sfx.tone`).

### Steps
1. Create `src/audio/music.ts` with exactly this logic (write it as one class; comments optional):
```ts
import type { Sfx } from './Sfx';

const NOTES = [164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]; // E3 E3 G3 E3 C3 E3 G3 A3
const STEP_SEC = 0.4, DECAY_SEC = 0.3, FADE_SEC = 0.5, VOL = 0.04, DANGER_VOL = 0.03;

export class MusicBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private danger = false;
  private acc = 0;   // sim seconds since the last step
  private step = 0;  // next note's index in the loop
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx) {}

  update(dt: number, playing: boolean, danger: boolean): void {
    if (playing && !this.sfx.muted) {
      if (!this.started) this.start();
      if (this.danger !== danger) { this.danger = danger; this.acc = 0; } // new rate's first note comes a full step away
      const stepSec = this.danger ? STEP_SEC / 2 : STEP_SEC;
      this.acc += dt;
      while (this.acc >= stepSec) { this.acc -= stepSec; this.note(); }
      return;
    }
    if (this.started) this.stop();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.danger = false;
    const { ctx, gain } = this; this.ctx = undefined; this.gain = undefined;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + FADE_SEC);
      window.setTimeout(() => gain.disconnect(), (FADE_SEC + 0.1) * 1000);
    }
  }

  broken(): string | undefined {
    return this.liveNotes > 4 ? `${this.liveNotes} notes still ringing in the bed` : undefined;
  }

  private start(): void {
    const a = this.sfx.audio();
    if (!a) return; // not unlocked (or locked again) yet: the next frame starts the bed
    this.started = true; this.acc = 0; this.step = 0;
    const t = a.ctx.currentTime;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + FADE_SEC);
    g.connect(a.master);
    this.ctx = a.ctx; this.gain = g;
  }

  private note(): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || ctx.state !== 'running' || this.sfx.muted) return;
    const f = NOTES[this.step % 8]!;
    this.playNote(f, VOL);
    if (this.danger) this.playNote(f * 2, DANGER_VOL);
    this.step += 1;
  }

  private playNote(freq: number, vol: number): void {
    const { ctx, gain } = this;
    if (!ctx || !gain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + DECAY_SEC);
    osc.connect(g).connect(gain);
    osc.start(t);
    osc.stop(t + DECAY_SEC + 0.02);
    this.liveNotes += 1;
    osc.onended = () => { this.liveNotes -= 1; };
  }
}
```
2. Edit `src/audio/Sfx.ts` — add after `unlock()`:
```ts
  /** The unlocked context and its master gain, once audio can run (the wave bed schedules its notes on them). */
  audio(): { ctx: AudioContext; master: GainNode } | undefined {
    return this.ctx && this.master && this.ctx.state === 'running' ? { ctx: this.ctx, master: this.master } : undefined;
  }
```
3. Edit `src/systems/ExitWarning.ts` — add before `update()`:
```ts
  /** The warning's own state: any living enemy within 3 s of the exit (the wave bed reads it). */
  get live(): boolean { return this.active; }
```
4. Edit `src/scenes/GameScene.ts` (five small additions): import `import { MusicBed } from '../audio/music';` before the `'../config'` import; field `music!: MusicBed;` after `exitWarn!: ExitWarning;`; in `create()` after `this.exitWarn = new ExitWarning(...)` add `this.music = new MusicBed(sfx);`; in `update()` after `this.exitWarn.update(simDt);` add `this.music.update(simDt, this.run.phase === 'wave', this.exitWarn.live);` (after, so `live` is this frame's); in the `shutdown` handler after `sfx?.stopBeamHums();` add `this.music.stop(); // the bed's fade and ringing notes must not outlive the run (the Sfx singleton does)`.
5. Edit `src/debug/runChecks.ts` — after the `['exitWarn.valid', ...]` line add `['music.bed', (g) => g.music.broken()],`.

### Pitfalls
- The step clock is the `acc` accumulator fed with `simDt` (that is what makes 2× work and pause work); notes are always scheduled at `ctx.currentTime` (real time) with a fixed 0.3 s decay. Never `setInterval`, never time the steps off the audio clock.
- The fades live on the bed's own `GainNode` ramps — note volumes stay exactly 0.04/0.03. Do not scale note volumes for the fade.
- Stop must fire on the same frame the phase leaves `wave`: in the draft and pause `GameScene` is paused and `update()` never runs again, so a "stop on next update" would play through the draft.
- The fade-out tail and ringing notes keep playing after the last `update` (WebAudio is independent) — that is intended; `shutdown`'s `stop()` is the cleanup, and the Sfx singleton outlives the run, so a second run gets a fresh `MusicBed` (state is all instance fields, none at module level).
- `start()` failing (audio not unlocked yet) must not leave `started` true — it must retry next frame. `step`/`acc` reset in `start()` so every wave opens on E3 and no tempo drift carries over.
- Mute toggle mid-wave needs no special case: the next `update` stops the bed (muted) or starts it fresh with a fade-in (unmuted).

### Tests
- none (audio task; `npm run check` and `npm run smoke` gate it)

## Result (attempt 1, asus)

The wave phase now has a quiet generative heartbeat: a new `MusicBed` (`src/audio/music.ts`) plays an 8-note E–G–A loop (sine, 0.4 s steps, 0.04) on Sfx's WebAudio context, fading in/out 0.5 s at wave start/end, and while the ExitWarning is live it doubles the tempo and adds an octave-up second voice (0.03). Wired into GameScene (one import, field, create/update/shutdown line each), exposed via a one-line `Sfx.audio()` accessor and `ExitWarning.live` getter, plus a `music.bed` invariant in `runChecks.ts`; existing sounds are untouched. Two tiny deviations from the architect's sketch: the constructor takes `Sfx | undefined` (GameScene's sfx is nullable — `sfx?.stopBeamHums()` proves it) and their `gain.gain.gain.value` typo became `gain.gain.value`. Check and smoke pass on desktop and mobile.

- Self-review: APPROVE
- Time: 33.0 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/audio/Sfx.ts          |  5 ++
 projects/chokepoint/game/src/audio/music.ts        | 93 ++++++++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts    |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts   |  5 ++
 .../chokepoint/game/src/systems/ExitWarning.ts     |  3 +
 5 files changed, 107 insertions(+)
```
