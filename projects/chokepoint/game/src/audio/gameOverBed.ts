import type { Sfx } from './Sfx';

const DECAY_SEC = 0.5, FADE_IN_SEC = 0.6, FADE_OUT_SEC = 0.3, STEP_SEC = 1.8, VOL = 0.02;
const NOTES = [82.41, 123.47, 164.81]; // E2 B2 E3
const PATTERN = [0, 1, 2, -1]; // the claim's shape: E2 B2 E3, then a rest

/**
 * The run's coda under the game-over card: the menu's E2/B2/E3 at 1.8 s steps with the claim's rest — slower than the menu's 1.6, the calmest of the beds. 0.02 pre-master, the beds' shared volume. Fades in over 0.6 s as the card lands, on top of which `Sfx.runEnd()` plays unchanged; fades out over 0.3 s when the card is left, the claim bed's own hand-off (T0408). Silent when muted; no forms, like the claim bed.
 */
export class GameOverBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private acc = 0;
  private step = 0;
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx | undefined) {}

  /** dt = real seconds; playing = the game-over card is shown (call it with true). */
  update(dt: number, playing: boolean): void {
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      this.acc += dt;
      while (this.acc >= STEP_SEC) { this.acc -= STEP_SEC; const n = PATTERN[this.step % PATTERN.length]!; if (n >= 0) this.playNote(NOTES[n]!); this.step += 1; }
      return;
    }
    if (this.started) this.stop();
  }

  /** Fades the bed out over 0.3 s; a no-op when not started; call it from the scene's shutdown too. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    const { ctx, gain } = this; this.ctx = undefined; this.gain = undefined;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + FADE_OUT_SEC);
      window.setTimeout(() => gain.disconnect(), (FADE_OUT_SEC + 0.1) * 1000);
    }
  }

  /** Invariant: a note rings 0.52 s and the step is 1.8 s, so at most one is alive. */
  broken(): string | undefined {
    return this.liveNotes > 2 ? `${this.liveNotes} notes still ringing in the game-over bed` : undefined;
  }

  private start(): void {
    const a = this.sfx?.audio();
    if (!a) return; // not unlocked (or locked again) yet: the next frame starts the bed
    this.started = true; this.acc = 0; this.step = 0;
    const t = a.ctx.currentTime;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + FADE_IN_SEC);
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
