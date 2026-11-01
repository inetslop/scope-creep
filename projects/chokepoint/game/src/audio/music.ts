import { bedForm, type BedForm } from '../core/bedForm';
import type { Sfx } from './Sfx';

const DECAY_SEC = 0.3, FADE_SEC = 0.5, FORM_FADE_SEC = 1.0;

/**
 * The quiet generative bed under the wave phase: an 8-step loop on Sfx's WebAudio context
 * (one sine note at a time, 0.4 s steps, 0.3 s decays, 0.04 pre-master). While the exit
 * warning is live the step halves and a second voice plays the same pattern an octave up.
 * While the run's last stand is on the loop drops an octave and a quiet held root drone sits
 * under it, the form crossfading in and out over 1 s; that form keeps its step in real audio
 * seconds, so 2× fast-forward leaves it unchanged. The normal form is driven by the wave's sim
 * seconds. The fades live on the bed's own gain node, so note volumes stay exact.
 */
export class MusicBed {
  private ctx: AudioContext | undefined;
  private gain: GainNode | undefined; // the bed's own gain: the fades live here, notes hang under it
  private started = false;
  private danger = false;
  private lastStand = false;
  private droneOsc: OscillatorNode | undefined;
  private droneGain: GainNode | undefined;
  private acc = 0;   // seconds since the last step, on the form's own clock
  private step = 0;  // next note's index in the loop
  private liveNotes = 0;
  constructor(private readonly sfx: Sfx | undefined) {}

  /** dt = real audio seconds (the last-stand form's clock); simDt = the wave's sim seconds (the
   * normal form's, 2× fast-forward runs it 2×); playing = run.phase === 'wave'; lastStand = the
   * run's last stand; danger = exitWarn.live. */
  update(dt: number, simDt: number, playing: boolean, lastStand: boolean, danger: boolean): void {
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      const form = bedForm(lastStand, danger);
      if (this.danger !== danger || this.lastStand !== lastStand) {
        this.danger = danger; this.lastStand = lastStand; this.acc = 0; // new form's first note comes a full step away
      }
      if (lastStand) this.startDrone(form); else this.endDrone(FORM_FADE_SEC); // level-based: a fresh wave re-enters the form
      this.acc += form.realTime ? dt : simDt; // the last-stand form keeps its 0.4 s step at 2× fast-forward
      while (this.acc >= form.stepSec) { this.acc -= form.stepSec; this.note(form); }
      return;
    }
    if (this.started) this.stop();
  }

  /** Fades the bed out over 0.5 s; a no-op when not playing; call it from the scene's shutdown too. */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.danger = false;
    this.lastStand = false;
    this.endDrone(FADE_SEC);
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

  private note(form: BedForm): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || ctx.state !== 'running' || this.sfx?.muted) return;
    const f = form.notes[this.step % 8]!;
    this.playNote(f, form.vol);
    if (form.echoVol > 0) this.playNote(f * 2, form.echoVol);
    this.step += 1;
  }

  /** The held root under the last-stand form: one constant sine, faded in/out over FORM_FADE_SEC, hung under the bed's own gain. */
  private startDrone(form: BedForm): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || this.droneOsc || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = form.drone;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(form.droneVol, t + FORM_FADE_SEC);
    osc.connect(g).connect(gain);
    osc.start(t);
    this.droneOsc = osc; this.droneGain = g;
  }

  /** Fades the drone out over `fade` and clears it at once, so a fast 1↔2 toggle never stacks drones. */
  private endDrone(fade: number): void {
    const { ctx, droneOsc, droneGain } = this;
    this.droneOsc = undefined; this.droneGain = undefined;
    if (!ctx || !droneOsc || !droneGain) return;
    const t = ctx.currentTime;
    droneGain.gain.cancelScheduledValues(t);
    droneGain.gain.setValueAtTime(droneGain.gain.value, t);
    droneGain.gain.linearRampToValueAtTime(0.0001, t + fade);
    droneOsc.stop(t + fade + 0.05);
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
