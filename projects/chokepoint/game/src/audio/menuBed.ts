import type { Sfx } from './Sfx';

const DECAY_SEC = 0.5, FADE_SEC = 0.6, STEP_SEC = 1.6, VOL = 0.02;
const NOTES = [82.41, 123.47, 164.81]; // E2 B2 E3

/**
 * The quiet 3-note loop under the menu (the planning before the first build): 1.6 s steps, 0.5 s
 * decays, 0.02 pre-master on Sfx's WebAudio context — the calmest of the four beds (the draft's is
 * 0.025, the build's 0.03), and distinct from all of them, so the beds never blur into one. It fades
 * in over 0.6 s when the menu scene opens and fades out over 0.6 s when a run starts (the scene's
 * stop); an overlay card (Tech, How, the codex, the boards) pauses the scene, so its notes simply
 * stop until the card closes; silent when muted. No forms: the menu has no run state to form from.
 */
export class MenuBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private acc = 0;
  private step = 0;
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx | undefined) {}

  /** dt = real seconds; playing = the menu is open (call it with true). */
  update(dt: number, playing: boolean): void {
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      this.acc += dt;
      while (this.acc >= STEP_SEC) { this.acc -= STEP_SEC; this.playNote(NOTES[this.step % 3]!); this.step += 1; }
      return;
    }
    if (this.started) this.stop();
  }

  /** Fades the bed out over 0.6 s; a no-op when not started; call it from the scene's shutdown too. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    const { ctx, gain } = this; this.ctx = undefined; this.gain = undefined;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + FADE_SEC);
      window.setTimeout(() => gain.disconnect(), (FADE_SEC + 0.1) * 1000);
    }
  }

  /** Invariant: a note rings 0.52 s and the step is 1.6 s, so at most one is alive. */
  broken(): string | undefined {
    return this.liveNotes > 2 ? `${this.liveNotes} notes still ringing in the menu bed` : undefined;
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
