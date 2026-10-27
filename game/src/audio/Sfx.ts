import type Phaser from 'phaser';

export const MASTER_VOLUME = 0.35;
const MUTE_STORAGE_KEY = 'scope-creep:muted';
const THROTTLE_MS = 40;
const CARD_FLIP_THROTTLE_MS = 120;
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
  private lastCritHitAt = 0;
  private lastOrbitHumAt = 0;
  private lastStreakBreakAt = 0;
  private lastPickupAt = 0;
  private lastPickupCallAt = 0;
  private lastCardFlipAt = 0;
  private lastBossStingAt = 0;
  private lastBossApproachAt = 0;
  private lastSlamAt = 0;
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

  get isMuted(): boolean {
    return this.muted;
  }

  /** Disconnects the master gain; call from GameScene shutdown. */
  dispose(): void {
    if (this.master) this.master.disconnect();
  }

  /**
   * Per-weapon fire timbre, routed by weapon id at the firing call site:
   * Point a short high tick, Line a low thud, Arc a sharp snap. The fallback
   * is today's shared tick, so a fire weapon without its own case still sounds.
   */
  shoot(id: string): void {
    if (!this.canPlay()) return;
    switch (id) {
      case 'point':
        this.tone('triangle', 3400, 2600, 0.05, 0.12); // short high tick
        break;
      case 'line':
        this.tone('sine', 150, 80, 0.1, 0.18); // low thud
        this.noise(0.08, 0.14, 600, 'lowpass'); // dull knock
        break;
      case 'arc':
        this.noise(0.03, 0.25, 4500, 'highpass'); // bright snap
        this.tone('triangle', 1800, 400, 0.05, 0.12); // quick pitch drop: distinct from Point
        break;
      default:
        this.noise(0.04, 0.05, 3000, 'highpass'); // shared fallback
    }
  }

  /** Orbit's contact voice: a soft low hum — 90→60 Hz sine over 120 ms, half of hit()'s tone gain, no noise. One per 150 ms. */
  orbitHum(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastOrbitHumAt < 150) return;
    this.lastOrbitHumAt = now;
    this.tone('sine', 90, 60, 0.12, 0.09);
  }

  /** One short high blip: the Inkwell meter just reached full. */
  inkwellFull(): void {
    if (!this.canPlay()) return;
    this.tone('sine', 1046.5, 1046.5, 0.12, 0.16);
  }

  /** Deep variant of the shoot sound for a full-ink burst volley. */
  inkBurst(): void {
    if (!this.canPlay()) return;
    this.noise(0.08, 0.12, 700, 'lowpass');
    this.tone('sine', 130, 65, 0.14, 0.2);
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

  /** Higher-pitched knock for crits: same envelope and gain as hit(), pitch doubled. */
  critHit(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastCritHitAt < THROTTLE_MS) return;
    this.lastCritHitAt = now;
    this.noise(0.07, 0.22, 2400, 'bandpass');
    this.tone('sine', 440, 320, 0.08, 0.18);
  }

  /** Low blip when the kill streak shatters: flat ~150 Hz, 80 ms, under the crit sting's gain. */
  streakBreak(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastStreakBreakAt < THROTTLE_MS) return;
    this.lastStreakBreakAt = now;
    this.tone('sine', 150, 150, 0.08, 0.12); // flat ~150 Hz, 80 ms, gain < crit's 0.18, no noise
  }

  /** Low pluck that drops in pitch with enemy size. */
  enemyDeath(size: number): void {
    if (!this.canPlay()) return;
    const hz = 260 / (1 + size / 24);
    this.tone('sine', hz, hz / 2, 0.18, 0.3);
    this.noise(0.1, 0.18, 900, 'lowpass');
  }

  /** Short pluck; rises a semitone per shard collected in quick succession. A gilt shard lands one more semitone higher; the run's first shard (first light) lands one octave higher, replacing the gilt lift. */
  pickup(gilt = false, firstLight = false): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    // The combo advances on every call, even when the sound is throttled.
    this.comboStep = now - this.lastPickupCallAt < COMBO_WINDOW_MS ? Math.min(this.comboStep + 1, MAX_COMBO_STEP) : 0;
    this.lastPickupCallAt = now;
    if (now - this.lastPickupAt < THROTTLE_MS) return;
    this.lastPickupAt = now;
    const lift = firstLight ? 12 : gilt ? 1 : 0;
    const hz = 523.25 * 2 ** ((this.comboStep + lift) / 12);
    this.tone('triangle', hz, hz, 0.12, 0.16);
  }

  /** Dull sawtooth thud for taking damage. */
  playerHurt(): void {
    if (!this.canPlay()) return;
    this.tone('sawtooth', 160, 70, 0.22, 0.22);
    this.noise(0.15, 0.15, 500, 'lowpass');
  }

  /** Heavy Platen slam: a deep dull thud. No damage tone — it only shoves. */
  slam(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastSlamAt < 300) return;
    this.lastSlamAt = now;
    this.tone('sine', 120, 50, 0.28, 0.3);
    this.noise(0.15, 0.18, 600, 'lowpass');
  }

  /** Soft paper slap as the gutter band sweeps into the page: ~80 ms low-passed noise at half a hit's gain, no tone. */
  gutterSlap(): void {
    if (!this.canPlay()) return;
    this.noise(0.08, 0.11, 800, 'lowpass');
  }

  /** Filtered paper-swipe as the Redactor's Redact cleans the page: ~120 ms low-passed noise at half a hit's gain. */
  redact(): void {
    if (!this.canPlay()) return;
    this.noise(0.12, 0.11, 900, 'lowpass');
  }

  /** Three-note rising arp. */
  levelUp(): void {
    if (!this.canPlay()) return;
    this.tone('triangle', 523.25, 523.25, 0.1, 0.2, 0);
    this.tone('triangle', 659.25, 659.25, 0.1, 0.2, 0.09);
    this.tone('triangle', 783.99, 783.99, 0.1, 0.2, 0.18);
  }

  /** Snappy tick plus a soft thump as an upgrade card flips over: ~120 ms, never overlaps itself. */
  cardFlip(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastCardFlipAt < CARD_FLIP_THROTTLE_MS) return;
    this.lastCardFlipAt = now;
    this.noise(0.05, 0.25, 3500, 'highpass');          // tick
    this.tone('sine', 180, 80, 0.12, 0.22, 0.03);      // thump
  }

  /** Two low sawtooth notes for the boss warning. */
  bossWarn(): void {
    if (!this.canPlay()) return;
    this.tone('sawtooth', 98, 98, 0.3, 0.28, 0);
    this.tone('sawtooth', 73.42, 73.42, 0.45, 0.28, 0.32);
  }

  /** One soft low thud of the boss approach count-in: 60 Hz sine decaying over 200 ms. One per second, never overlaps itself. */
  bossApproach(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastBossApproachAt < 1000) return;
    this.lastBossApproachAt = now;
    this.tone('sine', 60, 60, 0.2, 0.3);
  }

  /** Deep sub-bass thump when a boss appears: 55 Hz with a 30 ms attack decaying over 450 ms,
   *  plus a darker 82 Hz tone at a quarter of the gain. One per second, never overlaps itself. */
  bossSting(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastBossStingAt < 1000) return;
    this.lastBossStingAt = now;
    this.stingTone(55, 0.6);
    this.stingTone(82, 0.15);
  }

  /** Sine tone with a 30 ms linear attack and an exponential decay to silence over 450 ms. */
  private stingTone(hz: number, vol: number): void {
    if (!this.ctx || !this.master || vol <= 0) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.47);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
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
