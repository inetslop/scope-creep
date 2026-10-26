import type Phaser from 'phaser';
import { bpmForTime, secondVoiceActive } from '../core/music';
import { MASTER_VOLUME, type Sfx } from './Sfx';

const MUSIC_VOLUME = MASTER_VOLUME * 0.25;
const LOOKAHEAD_SEC = 0.12;
// A-minor pentatonic, and the same set one octave up for the second voice.
const NOTES = [220, 261.63, 293.66, 329.63, 392];
const NOTES_HIGH = [440, 523.25, 587.33, 659.25, 783.99];

/**
 * A quiet generative score on the same WebAudio context as Sfx: a low ink
 * pulse on every beat, sparse notes from a 5-note set, and an occasional soft
 * noise swell. Tempo climbs 80 -> 120 BPM over the first 10 minutes and a
 * higher off-beat voice joins at 100 BPM. Beats are scheduled a short
 * lookahead ahead; note choice uses Math.random() on purpose so the gameplay
 * RNG stream is untouched. Every call is a silent no-op until the context is
 * unlocked by the first user gesture, and it follows the SFX mute.
 */
export class Music {
  private readonly ctx: AudioContext | null;
  private readonly master: GainNode | null;
  private readonly noiseBuffer: AudioBuffer | null;
  private readonly sfx: Sfx;
  private playing = false;
  private nextBeat = 0;
  private beatIndex = 0;

  constructor(scene: Phaser.Scene, sfx: Sfx) {
    this.sfx = sfx;
    // NoAudioSoundManager has no `context` property, so the cast yields undefined.
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context ?? null;
    this.ctx = ctx;
    if (ctx) {
      this.master = ctx.createGain();
      this.master.gain.value = MUSIC_VOLUME;
      this.master.connect(ctx.destination);
      // One shared 2.5 s white-noise buffer for swells (audio texture, not gameplay RNG).
      const frames = Math.ceil(ctx.sampleRate * 2.5);
      this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    } else {
      this.master = null;
      this.noiseBuffer = null;
    }
  }

  /** Scheduled time of the next beat (stale while the scene is paused). */
  get nextBeatTime(): number {
    return this.nextBeat;
  }

  /** Call once per frame from GameScene.update; no-op while paused or muted. */
  update(timeSec: number): void {
    if (this.ctx === null || this.master === null || this.sfx.isMuted || this.ctx.state !== 'running') {
      this.playing = false;
      return;
    }
    if (!this.playing) {
      this.playing = true;
      this.nextBeat = this.ctx.currentTime + 0.1;
    }
    // The scene pauses under overlays while ctx.currentTime keeps advancing;
    // without this catch-up, resume would schedule hundreds of beats at once.
    if (this.nextBeat < this.ctx.currentTime - 0.1) this.nextBeat = this.ctx.currentTime + 0.1;
    while (this.nextBeat < this.ctx.currentTime + LOOKAHEAD_SEC) {
      this.scheduleBeat(this.nextBeat, this.beatIndex, timeSec);
      this.nextBeat += 60 / bpmForTime(timeSec);
      this.beatIndex += 1;
    }
  }

  private scheduleBeat(t: number, beat: number, timeSec: number): void {
    const barBeat = beat % 4;
    // Low ink pulse on every beat.
    this.tone('sine', 110, 55, 0.3, 0.5, t);
    // One sparse note, mostly on the "and" of beats 2 and 4.
    if (barBeat === 1 || (barBeat === 3 && Math.random() < 0.5)) {
      const hz = NOTES[Math.floor(Math.random() * NOTES.length)];
      this.tone('triangle', hz, hz, 0.4, 0.22, t);
    }
    // Higher voice on the off-beat (half a beat later), once the pulse is fast enough.
    if (secondVoiceActive(timeSec) && (barBeat === 1 || barBeat === 3) && Math.random() < 0.7) {
      const hz2 = NOTES_HIGH[Math.floor(Math.random() * NOTES_HIGH.length)];
      this.tone('sine', hz2, hz2, 0.25, 0.14, t + 30 / bpmForTime(timeSec));
    }
    if (barBeat === 0 && Math.random() < 0.3) this.swell(t);
  }

  /** Oscillator with a pitch glide and exponential decay, started at absolute time t. */
  private tone(type: OscillatorType, fromHz: number, toHz: number, durSec: number, vol: number, t: number): void {
    if (!this.ctx || !this.master || vol <= 0) return;
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

  /** Soft filtered-noise swell: linear rise over 0.5 s, long exponential fall. */
  private swell(t: number): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t, Math.random() * 0.5, 1.6);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /** Disconnects the master gain; call from GameScene shutdown. */
  dispose(): void {
    if (this.master) this.master.disconnect();
  }
}
