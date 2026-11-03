/**
 * Tiny procedural sound effects (WebAudio, no files). Every call is safe when audio is
 * unavailable or still locked by the browser: it just stays silent.
 */
import type { Tier } from '../content/types';

export class Sfx {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private mutedFlag = false;
  /** Muting also stops every held beam hum (they resume only on the next lock). */
  get muted(): boolean { return this.mutedFlag; }
  set muted(on: boolean) { if (on === this.mutedFlag) return; this.mutedFlag = on; if (on) { this.stopBeamHums(); this.skyNoteStop(); this.muteNoteStop(); } }
  /** The quiet held hums under active beams: at most 3, keyed by the humming tower. */
  private readonly beamHums = new Map<unknown, { osc: OscillatorNode; gain: GainNode }>();
  /** The sky's one shared held note: it exists while any regular Flyer is in the air, and only once. */
  private skyNote: { osc: OscillatorNode; gain: GainNode } | undefined;
  /** The Mute's silence: one shared held note while any Mute holds a tower still, and only once. */
  private muteNote: { osc: OscillatorNode; gain: GainNode } | undefined;

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

  /** The unlocked context and its master gain, once audio can run (the wave bed schedules its notes on them). */
  audio(): { ctx: AudioContext; master: GainNode } | undefined {
    return this.ctx && this.master && this.ctx.state === 'running' ? { ctx: this.ctx, master: this.master } : undefined;
  }

  /** One note: `freq` Hz for `durSec` (sliding to `slideTo`), fading out; silent while audio is locked or muted. */
  tone(freq: number, durSec: number, type: OscillatorType, volume: number, slideTo?: number, delaySec = 0): void {
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

  /** A soft low whoosh: an enemy that was not ablaze catches fire (a refresh stays silent). */
  ignite(): void {
    this.tone(150, 0.25, 'sine', 0.3, 60);
  }

  kill(): void {
    this.tone(520, 0.08, 'triangle', 0.18, 260);
  }

  /** The run pays out coins: E5 then G5. */
  chime(): void {
    this.tone(659, 0.08, 'sine', 0.18);
    this.tone(784, 0.08, 'sine', 0.18, undefined, 0.08);
  }

  /** A tech node is bought: the coin chime's two notes at the tier chime's quiet volume. */
  techBuy(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.08);
  }

  /** A leak pays its Toll at the exit: the coin chime's low note (E5) for 60 ms, just under the tier-chime's quiet class. */
  coinBlip(): void {
    this.tone(659, 0.06, 'sine', 0.08);
  }

  /** One soft UI blip, the tier-chime note class. */
  blip(): void {
    this.tone(523, 0.08, 'sine', 0.1);
  }

  /** The tier chime as a draft card lands face-up: one note per tier step, the top note rising. */
  tierChime(tier: Tier): void {
    const notes = tier === 'epic' ? [523, 659, 784] : tier === 'rare' ? [523, 659] : [523];
    notes.forEach((f, n) => window.setTimeout(() => this.tone(f, 0.08, 'sine', 0.1), n * 80));
  }

  /** The last stand turns on: two soft low notes, E3 then G3, the tier-chime's quiet class. */
  sting(): void {
    this.tone(165, 0.08, 'sine', 0.1);
    this.tone(196, 0.08, 'sine', 0.1, undefined, 0.08);
  }

  /** The island's settle at the run's open: one low sine, 90 Hz to 60 Hz over 150 ms, the sting's quiet class, under the leak thud's 0.25. */
  settleThud(): void {
    this.tone(90, 0.15, 'sine', 0.12, 60);
  }

  /** The run ends as the game-over card lands: the boss horn's two low notes falling (123.47 then 98 Hz), 80 ms each, 90 ms apart, the sting's quiet class. */
  runEnd(): void {
    this.tone(123.47, 0.08, 'sine', 0.1);
    this.tone(98, 0.08, 'sine', 0.1, undefined, 0.09);
  }

  /** The boss arrives: a deep two-note horn rising (65 then 82 Hz), 180 ms each, ~90 ms apart, the sting's volume class. */
  bossHorn(): void {
    this.tone(65, 0.18, 'sine', 0.12);
    this.tone(82, 0.18, 'sine', 0.12, undefined, 0.09);
  }

  leak(): void {
    this.tone(140, 0.3, 'sawtooth', 0.25, 70);
  }

  /** A leak breaks a real kill-combo chain (2+ kills): a soft two-note fall, E4 to C4, ~70 ms sine each, 40 ms apart, the coin blip's quiet class — the chain drops, so it falls. */
  comboBreak(): void {
    this.tone(329.63, 0.07, 'sine', 0.08);
    this.tone(261.63, 0.07, 'sine', 0.08, undefined, 0.04);
  }

  /** A boss got through: a low two-note horn, 82 Hz then 62 Hz, 200 ms each, ~100 ms apart, the sting's quiet class. */
  bossEscape(): void {
    this.tone(82, 0.2, 'sine', 0.14);
    this.tone(62, 0.2, 'sine', 0.14, undefined, 0.1);
  }

  /** The boss goes out of reach: a quiet falling note, A3 to G3, 120 ms, the sting's softest class. */
  bossOut(): void {
    this.tone(220, 0.12, 'sine', 0.08, 180);
  }

  /** The boss Flyer banks: the turn lands, one quiet falling note — the Colossus's out-of-reach note's shape (A3 to G3, 120 ms, the sting's softest class). */
  bankNote(): void {
    this.tone(220, 0.12, 'sine', 0.08, 180);
  }

  /** The boss dies: a low rising horn, G2 then B2 then D3 (98, 123, 147 Hz), 120 ms sines 60 ms apart, the sting's volume class up. */
  bossDown(): void {
    this.tone(98, 0.12, 'sine', 0.15);
    this.tone(123, 0.12, 'sine', 0.15, undefined, 0.06);
    this.tone(147, 0.12, 'sine', 0.15, undefined, 0.12);
  }

  leakWarn(): void {
    this.tone(200, 0.08, 'sine', 0.1, 150);
  }

  /** The wave's last kill within 1.5 cells of the exit: one soft sine at A3 — the leak tick's quiet class,
   *  a touch higher and shorter than the leak thud (140→70 Hz, 0.3 s), so it reads as a close call, not the leak. */
  nearMiss(): void {
    this.tone(220, 0.15, 'sine', 0.09);
  }

  /** A held 110 Hz sine under an active beam (pre-master 0.05, the tier-chime sines held): fade-in over 200 ms. */
  beamHumStart(key: unknown): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return;
    if (this.beamHums.has(key) || this.beamHums.size >= 3) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 110;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    this.beamHums.set(key, { osc, gain });
  }

  /** Fades a held beam hum out over 200 ms; an exact no-op for a key that is not held. */
  beamHumStop(key: unknown): void {
    const hum = this.beamHums.get(key);
    const ctx = this.ctx;
    if (!hum || !ctx) return;
    this.beamHums.delete(key);
    const t = ctx.currentTime;
    hum.gain.gain.cancelScheduledValues(t);
    hum.gain.gain.setValueAtTime(hum.gain.gain.value, t);
    hum.gain.gain.linearRampToValueAtTime(0.0001, t + 0.2);
    hum.osc.stop(t + 0.22);
  }

  /** Every held beam hum fades out: the scene goes away, but the Sfx singleton outlives the run. */
  stopBeamHums(): void {
    for (const k of [...this.beamHums.keys()]) this.beamHumStop(k);
  }

  /** The sky's quiet note: one shared held 660 Hz sine while any regular Flyer is in the air (pre-master 0.03, the beam hum's quiet class), fading in over 200 ms. A no-op while it is already held. */
  skyNoteStart(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running' || this.skyNote) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    this.skyNote = { osc, gain };
  }

  /** The sky's note fades out over 200 ms; an exact no-op when it is not held. */
  skyNoteStop(): void {
    const note = this.skyNote;
    const ctx = this.ctx;
    if (!note || !ctx) return;
    this.skyNote = undefined;
    const t = ctx.currentTime;
    note.gain.gain.cancelScheduledValues(t);
    note.gain.gain.setValueAtTime(note.gain.gain.value, t);
    note.gain.gain.linearRampToValueAtTime(0.0001, t + 0.2);
    note.osc.stop(t + 0.22);
  }

  /** The Mute's held note: one shared sine at C3 (130.81 Hz) while any Mute silences a tower (pre-master 0.05, the beam hum's quiet class, a step above its A2): fades in over 250 ms. A no-op while it is already held. */
  muteNoteStart(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running' || this.muteNote) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 130.81;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.25);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    this.muteNote = { osc, gain };
  }

  /** The Mute's note fades out over 250 ms; an exact no-op when it is not held. */
  muteNoteStop(): void {
    const note = this.muteNote;
    const ctx = this.ctx;
    if (!note || !ctx) return;
    this.muteNote = undefined;
    const t = ctx.currentTime;
    note.gain.gain.cancelScheduledValues(t);
    note.gain.gain.setValueAtTime(note.gain.gain.value, t);
    note.gain.gain.linearRampToValueAtTime(0.0001, t + 0.25);
    note.osc.stop(t + 0.27);
  }

  /** The Leech's drink: one short falling sip at each drink's white flash — two 70 ms sines a step below A4,
   *  G4 then E4 (392→330 Hz), ~40 ms apart, 0.05 pre-master, the Mute note's volume class, never above a kill blip. */
  leechDrink(): void {
    this.tone(392, 0.07, 'sine', 0.05);
    this.tone(330, 0.07, 'sine', 0.05, undefined, 0.04);
  }

  /** A tower's own milestone heard at its base: one quiet two-note rise, E4 then G4 (330 then 392 Hz), 60 ms sines ~30 ms apart, 0.06 pre-master, the Leech sip's soft class. */
  towerMilestone(): void {
    this.tone(330, 0.06, 'sine', 0.06);
    this.tone(392, 0.06, 'sine', 0.06, undefined, 0.03);
  }

  waveStart(): void {
    this.tone(220, 0.25, 'triangle', 0.35, 440);
  }

  waveClear(): void {
    this.tone(440, 0.12, 'triangle', 0.35, 880);
  }

  /** A wave ends clean: one soft two-note rise, C5 then E5, 80 ms each, the tier-chime's quiet volume. */
  cleanClear(): void {
    this.tone(523, 0.08, 'sine', 0.1);
    this.tone(659, 0.08, 'sine', 0.1, undefined, 0.08);
  }

  /** A wave clears and the draft opens: a soft two-note rise, E5 then G5, 90 ms apart, the tier-chime's quiet volume. */
  waveSweep(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
  }

  /** The run's wave number becomes its saved best: the streak note's rise, E5 then G5, 80 ms sine each, 90 ms apart, volume 0.08. */
  recordNote(): void {
    this.tone(659, 0.08, 'sine', 0.08);
    this.tone(784, 0.08, 'sine', 0.08, undefined, 0.09);
  }

  /** The streak pays its one life back: the wave sweep's rise, E5 then G5, 80 ms sine each, 90 ms apart, the sting's volume. */
  streakPay(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
  }

  /** The wave-speed toggle: G5 to 2x, E5 back to 1x, 60 ms sines, the tier-chime's quiet volume. */
  speedBlip(fast: boolean): void {
    this.tone(fast ? 784 : 659, 0.06, 'sine', 0.1);
  }

  /** The move commits: one D5 (587 Hz), 60 ms, the speed-blip's quiet class. */
  moveBlip(): void {
    this.tone(587, 0.06, 'sine', 0.1);
  }

  /** The ×10 kill-chain milestone: a soft two-note rise, E5 then G5, 90 ms apart, the tier-chime's quiet volume. */
  comboChime(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
  }

  /** A march wave's banner lands: a quiet two-note fall, A4 then G4 (440 then 392 Hz), 70 ms sines 70 ms apart, the near-miss note's quiet class. */
  tagNote(): void {
    this.tone(440, 0.07, 'sine', 0.09);
    this.tone(392, 0.07, 'sine', 0.09, undefined, 0.07);
  }

  deny(): void {
    this.tone(200, 0.1, 'square', 0.15, 150);
  }
}
