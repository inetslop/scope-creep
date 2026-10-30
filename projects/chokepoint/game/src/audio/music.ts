import type { Sfx } from './Sfx';

const NOTES = [164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]; // E3 E3 G3 E3 C3 E3 G3 A3
const STEP_SEC = 0.4, DECAY_SEC = 0.3, FADE_SEC = 0.5, VOL = 0.04, DANGER_VOL = 0.03;

/**
 * The quiet generative bed under the wave phase: an 8-step loop on Sfx's WebAudio context
 * (one sine note at a time, 0.4 s steps, 0.3 s decays, 0.04 pre-master). While the exit
 * warning is live the step halves and a second voice plays the same pattern an octave up.
 * Driven by the wave's sim seconds (2× fast-forward runs it 2×); the fades live on the bed's
 * own gain node, so note volumes stay exact.
 */
export class MusicBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private danger = false;
  private acc = 0;   // sim seconds since the last step
  private step = 0;  // next note's index in the loop
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx | undefined) {}

  /** dt = the wave's sim seconds (2× fast-forward runs the loop 2×). playing = run.phase === 'wave'; danger = exitWarn.live. */
  update(dt: number, playing: boolean, danger: boolean): void {
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      if (this.danger !== danger) { this.danger = danger; this.acc = 0; } // new rate's first note comes a full step away
      const stepSec = this.danger ? STEP_SEC / 2 : STEP_SEC;
      this.acc += dt;
      while (this.acc >= stepSec) { this.acc -= stepSec; this.note(); }
      return;
    }
    if (this.started) this.stop();
  }

  /** Fades the bed out over 0.5 s; a no-op when not playing; call it from the scene's shutdown too. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.danger = false;
    const { ctx, gain } = this; this.ctx = undefined; this.gain = undefined;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + FADE_SEC);
      window.setTimeout(() => gain.disconnect(), (FADE_SEC + 0.1) * 1000);
    }
  }

  /** Invariant: no more than four 2×-danger steps' worth of notes still ringing (two voices every 0.1 s, each ringing 0.32 s). */
  broken(): string | undefined {
    return this.liveNotes > 8 ? `${this.liveNotes} notes still ringing in the bed` : undefined;
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

  private note(): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || ctx.state !== 'running' || this.sfx?.muted) return;
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
