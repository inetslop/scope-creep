/**
 * The game's sound: short WebAudio blips, no files, all in this one layer.
 * Audio may only start on a user gesture (tapping Play), and only plays while a match is on
 * screen (the audio HUD part feeds hudNow() every match frame). Sounds sit under the action.
 */

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let armed = false;
let lastHud = 0; // performance.now() of the last match frame
let active = 0; // pops still sounding
const heard = new Map<number, number>(); // effect seed -> until when its pop has played

function wake(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** Attach the gesture listeners that may start audio. Idempotent; called from the audio HUD part. */
export function arm(): void {
  if (armed) return;
  armed = true;
  for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(ev, wake, { passive: true });
}

/** A match frame just ran: pops may play for about a second (keeps the start screen silent). */
export function hudNow(): void {
  lastHud = performance.now();
}

/** The pop's starting pitch: small radii pop high, big radii low. */
export function pitchFor(radius: number): number {
  return Math.min(900, Math.max(180, 900 - (radius - 8) * 40));
}

function blip(f0: number, peak: number, life: number): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.55, t0 + life);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
  osc.connect(gain);
  gain.connect(master);
  osc.onended = () => {
    active -= 1;
  };
  osc.start(t0);
  osc.stop(t0 + life + 0.02);
}

/**
 * One candy pop for a monster that died, pitched by its radius (the 'pop' effect's value).
 * Called from the pop effect's draw() on every client: at most once per effect (its seed) and
 * at most 6 pops at once, so a whole crowd dying stays a clean mix.
 */
export function pop(seed: number, radius: number, age: number): void {
  if (!ctx) return; // not unlocked by a gesture yet
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(pitchFor(radius), 0.12, 0.12);
}
