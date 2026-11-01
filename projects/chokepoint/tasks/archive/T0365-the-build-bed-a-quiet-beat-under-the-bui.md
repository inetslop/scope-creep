---
id: T0365
title: "The build bed: a quiet beat under the build phase"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T16:18:26Z
claimed_at: 2026-11-01T17:03:47Z
finished_at: 2026-11-01T17:09:29Z
---

## Goal
The run's loop stops having a dead silence during the build phase: a quiet, calm bed plays under the build phase only, so planning feels continuous and the wave's start lands as a real shift — calm build, the wave's heartbeat, the draft's pick.

## Details
- A new quiet generative bed plays during the BUILD phase only (the planning between a draft and the wave). It never plays during the wave phase (the wave's own heartbeat bed, T0239, owns that), in the menu, on the draft, or over any overlay.
- Character: calmer and lower than the wave bed. A slow 4-note loop (E2, B2, E3, G3) on sine, 0.8 s per step (half the wave bed's tempo), volume 0.03 (just under the wave bed's 0.04), on the same WebAudio context the wave bed uses and respecting the same sound on/off toggle.
- It fades in over 0.6 s the moment the build phase opens (the countdown starts) and fades out over 0.6 s the moment the wave starts. For pause and run-end it behaves exactly like the wave bed does today (same silence / resume rules).
- Last stand: while the run is at exactly one life the build bed plays one octave lower (E1, B1, E2, G2) — the same last-stand form the wave bed wears (T0342) — so the planning still carries the danger.
- Nothing on screen changes: no HUD element, no button, no text, no mark, no toggle. The pause's existing Sound row is the only control that touches it.

## Acceptance criteria
- [ ] During the build phase (countdown running, before the wave) the build bed is audible; during the wave phase, the draft, the menu and the pause it is silent.
- [ ] The build bed is slower and lower than the wave bed (4 notes E2–B2–E3–G3, 0.8 s steps, volume 0.03) and fades in/out over 0.6 s at the build↔wave boundary.
- [ ] Turning sound off (pause) silences the build bed; turning it back on resumes it during a build phase.
- [ ] At exactly one life the build bed plays its one-octave-lower form; the wave bed's form and the exit quicken are unchanged.
- [ ] The screen is byte-identical to before: no new HUD element, button, text or mark; only the sound differs.

## Design (architect, desktop)

### Files
- create `src/audio/buildBed.ts` — the `BuildBed` class: a quiet 4-note sine loop under the build phase only, on Sfx's WebAudio context, with 0.6 s fades and the one-octave-lower last-stand register
- edit `src/scenes/GameScene.ts` — five single-line additions, each directly next to the existing `MusicBed` lines (import, field, construct, shutdown stop, update call)
- edit `src/debug/runChecks.ts` — one invariant line next to `['music.bed', ...]`

### Interfaces
No new types. `BuildBed` mirrors `MusicBed`'s shape (see Steps for the full code):
- `constructor(sfx: Sfx | undefined)`
- `update(dt: number, playing: boolean, lastStand: boolean): void` — `dt` = real seconds (the build countdown never fast-forwards), `playing` = `run.phase === 'build'`
- `stop(): void` — 0.6 s fade out, no-op when not started
- `broken(): string | undefined` — invariant

### Steps
1. Create `src/audio/buildBed.ts` with exactly this content (modeled line-for-line on `src/audio/music.ts`):
```ts
import type { Sfx } from './Sfx';

const DECAY_SEC = 0.5, FADE_SEC = 0.6, STEP_SEC = 0.8, VOL = 0.03;
const NOTES = [82.41, 123.47, 164.81, 196]; // E2 B2 E3 G3
const LOW_NOTES = NOTES.map(f => f / 2); // E1 B1 E2 G2: the last-stand form, one octave lower

/**
 * The quiet generative bed under the build phase (the planning between a draft and the wave):
 * a 4-note loop on Sfx's WebAudio context (one sine at a time, 0.8 s steps, 0.5 s decays, 0.03
 * pre-master) — calmer and lower than the wave bed, which keeps the wave phase alone (T0239).
 * It fades in over 0.6 s when the build phase opens and fades out over 0.6 s when the wave
 * starts; pause and run-end follow the wave bed's rules (the scene stops calling update, and
 * calls stop on shutdown). While the run's last stand is on the loop plays an octave lower,
 * the form switching on a whole step so it never doubles a note.
 */
export class BuildBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private lastStand = false;
  private acc = 0;
  private step = 0;
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx | undefined) {}

  /** dt = real seconds; playing = run.phase === 'build'; lastStand = the run's last stand. */
  update(dt: number, playing: boolean, lastStand: boolean): void {
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      if (this.lastStand !== lastStand) {
        this.lastStand = lastStand; this.acc = 0; // the new form's first note comes a full step away
      }
      const notes = lastStand ? LOW_NOTES : NOTES;
      this.acc += dt;
      while (this.acc >= STEP_SEC) { this.acc -= STEP_SEC; this.playNote(notes[this.step % 4]!); this.step += 1; }
      return;
    }
    if (this.started) this.stop();
  }

  /** Fades the bed out over 0.6 s; a no-op when not started; call it from the scene's shutdown too. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.lastStand = false;
    const { ctx, gain } = this; this.ctx = undefined; this.gain = undefined;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + FADE_SEC);
      window.setTimeout(() => gain.disconnect(), (FADE_SEC + 0.1) * 1000);
    }
  }

  /** Invariant: a note rings 0.52 s and the step is 0.8 s, so at most one is alive. */
  broken(): string | undefined {
    return this.liveNotes > 2 ? `${this.liveNotes} notes still ringing in the build bed` : undefined;
  }

  private start(): void {
    const a = this.sfx?.audio();
    if (!a) return; // not unlocked (or locked again) yet: the next frame starts the bed
    this.started = true; this.acc = 0; this.step = 0;
    const t = a.ctx.currentTime;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + FADE_SEC);
    g.connect(a.master);
    this.ctx = a.ctx; this.gain = g;
  }

  private playNote(freq: number): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || ctx.state !== 'running' || this.sfx?.muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(VOL, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + DECAY_SEC);
    osc.connect(g).connect(gain);
    osc.start(t);
    osc.stop(t + DECAY_SEC + 0.02);
    this.liveNotes += 1;
    osc.onended = () => { this.liveNotes -= 1; };
  }
}
```
2. Edit `src/scenes/GameScene.ts`, one line each, directly after the named line (never reflow anything):
   - after `import { MusicBed } from '../audio/music';` (line 2): `import { BuildBed } from '../audio/buildBed';`
   - after `music!: MusicBed;` (line 75): `buildBed!: BuildBed;`
   - after `this.music = new MusicBed(sfx);` (line 134): `this.buildBed = new BuildBed(sfx);`
   - after `this.music.stop(); // the bed's fade and ringing notes must not outlive the run (the Sfx singleton does)` (line 187): `this.buildBed.stop(); // the build bed's fade and ringing notes must not outlive the run`
   - after `this.music.update(dt, simDt, this.run.phase === 'wave', isLastStand(this.run), this.exitWarn.live); // after, so `live` is this frame's` (line 233): `this.buildBed.update(dt, this.run.phase === 'build', isLastStand(this.run)); // real seconds: the build countdown never fast-forwards`
3. Edit `src/debug/runChecks.ts`: after `['music.bed', (g) => g.music.broken()],` (line 79) add `['buildBed.valid', (g) => g.buildBed.broken()],`
4. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The two beds must never both be "playing": the wave bed's `playing` is `phase === 'wave'`, the build bed's is `phase === 'build'` — the 0.6 s fade-out overlaps the wave bed's fade-in by design (the shift), but both hang under `a.master` and never schedule notes in the same phase.
- Do not copy the wave bed's drone or echo voice into the build bed: the spec's last-stand form is the transposed four notes only (`LOW_NOTES`); there is no `danger`/quicken here.
- Do not reset `liveNotes` in `start()`; in-flight notes from the stopped bed still fire `onended` and decrement it (same as `MusicBed`).
- Audio-lock: `start()` must return before setting `started = true` when `sfx.audio()` is undefined (mobile, no gesture yet), and `playNote` must check `ctx.state === 'running'` — both are in the code above; dropping either reintroduces notes on a locked context.
- Use `dt`, not a 60 fps assumption, and the `while` loop keeps steps exact under frame drops; `dt` is already clamped to 0.05 s in `GameScene.update`.
- Iron mode never drops the register: `isLastStand` is false in iron, exactly as the wave bed behaves.
- Screen must stay byte-identical: touch no HUD, scene, art or UI file.

### Tests
- none (audio task; no core rule added)

## Result (attempt 1, desktop)

Added a quiet generative build bed (`src/audio/buildBed.ts`) — a 4-note sine loop (E2, B2, E3, G3) at 0.8 s steps, 0.03 volume, with 0.6 s fades and a one-octave-lower last-stand form — that plays only during the build phase so planning feels continuous and the wave start lands as a shift. Wired it into `GameScene.ts` with five single-line additions next to the existing `MusicBed` lines (import, field, construct, shutdown stop, update with real seconds), and added a `buildBed.valid` invariant next to `music.bed` in `debug/runChecks.ts`. No screen changes: check and smoke (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 5.7 min

```
projects/chokepoint/game/src/audio/buildBed.ts   | 89 ++++++++++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts  |  1 +
 projects/chokepoint/game/src/scenes/GameScene.ts |  5 ++
 3 files changed, 95 insertions(+)
```
