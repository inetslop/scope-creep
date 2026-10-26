import type Phaser from 'phaser';

const MASTER_VOLUME = 0.35;
const MUTE_STORAGE_KEY = 'scope-creep:muted';
const THROTTLE_MS = 40;
const COMBO_WINDOW_MS = 350;
const MAX_COMBO_STEP = 12;

/**
 * Synthesizes all SFX on Phaser's WebAudio context: oscillators, filtered
 * noise and gain envelopes. No audio files. Every method is a silent no-op
 * when the sound manager is not WebAudio, the context is not yet unlocked
 * by a user gesture, or the game is muted.
 */
export class Sfx {
  private readonly ctx: AudioContext | null;
  private readonly master: GainNode | null;
  private readonly noiseBuffer: AudioBuffer | null;
  private muted: boolean;
  private lastHitAt = 0;
  private lastPickupAt = 0;
  private lastPickupCallAt = 0;
  private comboStep = 0;

  constructor(scene: Phaser.Scene) {
    this.muted = Sfx.readMuted();
    // NoAudioSoundManager has no `context` property, so the cast yields undefined.
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context ?? null;
    this.ctx = ctx;
    if (ctx) {
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.master.connect(ctx.destination);
      // One shared 0.5 s white-noise buffer (audio texture, not gameplay RNG).
      const frames = Math.ceil(ctx.sampleRate * 0.5);
      this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    } else {
      this.master = null;
      this.noiseBuffer = null;
    }
  }

  /** Flips mute, persists it to localStorage, returns the new state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    try {
      if (this.muted) localStorage.setItem(MUTE_STORAGE_KEY, '1');
      else localStorage.removeItem(MUTE_STORAGE_KEY);
    } catch {
      // storage blocked (private mode etc.): the toggle still works for this session
    }
    return this.muted;
  }

  /** Disconnects the master gain; call from GameScene shutdown. */
  dispose(): void {
    if (this.master) this.master.disconnect();
  }

  /** Quiet filtered-noise tick; plays several times per second. */
  shoot(): void {
    if (!this.canPlay()) return;
    this.noise(0.04, 0.05, 3000, 'highpass');
  }

  /** Woodblock-like knock. */
  hit(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastHitAt < THROTTLE_MS) return;
    this.lastHitAt = now;
    this.noise(0.07, 0.22, 2400, 'bandpass');
    this.tone('sine', 220, 160, 0.08, 0.18);
  }

  /** Low pluck that drops in pitch with enemy size. */
  enemyDeath(size: number): void {
    if (!this.canPlay()) return;
    const hz = 260 / (1 + size / 24);
    this.tone('sine', hz, hz / 2, 0.18, 0.3);
    this.noise(0.1, 0.18, 900, 'lowpass');
  }

  /** Short pluck; rises a semitone per shard collected in quick succession. */
  pickup(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    // The combo advances on every call, even when the sound is throttled.
    this.comboStep = now - this.lastPickupCallAt < COMBO_WINDOW_MS ? Math.min(this.comboStep + 1, MAX_COMBO_STEP) : 0;
    this.lastPickupCallAt = now;
    if (now - this.lastPickupAt < THROTTLE_MS) return;
    this.lastPickupAt = now;
    this.tone('triangle', 523.25 * 2 ** (this.comboStep / 12), 523.25 * 2 ** (this.comboStep / 12), 0.12, 0.16);
  }

  /** Dull sawtooth thud for taking damage. */
  playerHurt(): void {
    if (!this.canPlay()) return;
    this.tone('sawtooth', 160, 70, 0.22, 0.22);
    this.noise(0.15, 0.15, 500, 'lowpass');
  }

  /** Three-note rising arp. */
  levelUp(): void {
    if (!this.canPlay()) return;
    this.tone('triangle', 523.25, 523.25, 0.1, 0.2, 0);
    this.tone('triangle', 659.25, 659.25, 0.1, 0.2, 0.09);
    this.tone('triangle', 783.99, 783.99, 0.1, 0.2, 0.18);
  }

  /** False until the context exists and is unlocked by the first user gesture. Never resume() ourselves. */
  private canPlay(): boolean {
    return this.ctx !== null && this.master !== null && !this.muted && this.ctx.state === 'running';
  }

  private tone(type: OscillatorType, fromHz: number, toHz: number, durSec: number, vol: number, delaySec = 0): void {
    if (!this.ctx || !this.master || vol <= 0) return;
    const t = this.ctx.currentTime + delaySec;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(fromHz, 1), t);
    if (toHz !== fromHz) osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 1), t + durSec);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durSec);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + durSec + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private noise(durSec: number, vol: number, freq: number, type: BiquadFilterType, delaySec = 0): void {
    if (!this.ctx || !this.master || !this.noiseBuffer || vol <= 0) return;
    const t = this.ctx.currentTime + delaySec;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durSec);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t, Math.random() * 0.25, durSec);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private static readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
