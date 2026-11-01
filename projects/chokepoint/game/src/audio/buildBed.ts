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
