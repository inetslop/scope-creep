/**
 * Tiny procedural sound effects (WebAudio, no files). Every call is safe when audio is
 * unavailable or still locked by the browser: it just stays silent.
 */
import type { Tier } from '../content/types';

export class Sfx {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  muted = false;

  /** Call from a user gesture (the first click/tap) so the browser lets audio start. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.25;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    } catch {
      this.ctx = undefined;
    }
  }

  private tone(freq: number, durSec: number, type: OscillatorType, volume: number, slideTo?: number, delaySec = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return;
    const t = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + durSec);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + durSec + 0.02);
  }

  build(): void {
    this.tone(330, 0.12, 'triangle', 0.5, 660);
  }

  shoot(): void {
    this.tone(880, 0.05, 'square', 0.08, 660);
  }

  pulse(): void {
    this.tone(160, 0.18, 'sine', 0.35, 90);
  }

  /** A soft whoosh: the gust of a Push tower (quieter than the pulse blip). */
  gust(): void {
    this.tone(300, 0.18, 'sine', 0.15, 160);
  }

  mark(): void {
    this.tone(660, 0.09, 'sine', 0.3, 990);
  }

  kill(): void {
    this.tone(520, 0.08, 'triangle', 0.18, 260);
  }

  /** The run pays out coins: E5 then G5. */
  chime(): void {
    this.tone(659, 0.08, 'sine', 0.18);
    this.tone(784, 0.08, 'sine', 0.18, undefined, 0.08);
  }

  /** The tier chime as a draft card lands face-up: one note per tier step, the top note rising. */
  tierChime(tier: Tier): void {
    const notes = tier === 'epic' ? [523, 659, 784] : tier === 'rare' ? [523, 659] : [523];
    notes.forEach((f, n) => window.setTimeout(() => this.tone(f, 0.08, 'sine', 0.1), n * 80));
  }

  leak(): void {
    this.tone(140, 0.3, 'sawtooth', 0.25, 70);
  }

  leakWarn(): void {
    this.tone(200, 0.08, 'sine', 0.1, 150);
  }

  waveStart(): void {
    this.tone(220, 0.25, 'triangle', 0.35, 440);
  }

  waveClear(): void {
    this.tone(440, 0.12, 'triangle', 0.35, 880);
  }

  deny(): void {
    this.tone(200, 0.1, 'square', 0.15, 150);
  }
}
