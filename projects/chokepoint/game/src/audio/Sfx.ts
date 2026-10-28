/**
 * Tiny procedural sound effects (WebAudio, no files). Every call is safe when audio is
 * unavailable or still locked by the browser: it just stays silent.
 */
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

  private tone(freq: number, durSec: number, type: OscillatorType, volume: number, slideTo?: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return;
    const t = ctx.currentTime;
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

  kill(): void {
    this.tone(520, 0.08, 'triangle', 0.18, 260);
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
