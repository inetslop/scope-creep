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
let lastFanfare = 0; // performance.now() of the last prestige fanfare
let lastBonk = 0; // performance.now() of the last bonk
let lastWhump = 0; // performance.now() of the last whump
const tootTicks = new Map<number, number>(); // crown-fall seed -> until when its toot tick has played

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

function blip(f0: number, peak: number, life: number, end = f0 * 0.55): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(end, t0 + life);
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

/**
 * One deep bonk when a player is knocked out: 130 Hz falling to 60 Hz, under 0.2 s and a touch
 * quieter than a pop, so a player falling reads as "someone fell", not "something popped".
 * Called from the burst effect's draw() on every client: at most once per effect (its seed),
 * at most one bonk every 0.5 s, and under the same 6-voice cap as the pops.
 */
export function bonk(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return;
  const now = performance.now();
  if (now - lastHud > 1000) return;
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastBonk < 500) return;
  lastBonk = now;
  if (active >= 6) return;
  active += 1;
  blip(130, 0.1, 0.18, 60);
}

/**
 * One soft low whump under the normal pop when a crowded corpse bursts (a sting ring blooms):
 * a 200 Hz sine falling to 130 Hz over 0.1 s, peak 0.05 - clearly softer and lower than the pop's
 * bright blip, and higher and shorter than the bonk's deep thud. Called from the sting-burst
 * effect's draw() on every client: at most once per effect (its seed) and at most one whump
 * every 0.2 s, under the same 6-voice cap as the pops, so a field full of Hive capstone kills
 * doesn't stack them.
 */
export function whump(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastWhump < 200) return; // one whump per 200 ms
  lastWhump = now;
  if (active >= 6) return;
  active += 1;
  blip(200, 0.05, 0.1, 130); // 200 -> 130 Hz over 0.1 s, peak 0.05: the dull low squeeze
}

export function toot(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(500, 0.15, 0.25, 300); // 500->300 Hz over 0.25 s, peak 0.15: the party-horn toot
}

export function tootTick(seed: number, age: number): void {
  if (!ctx) return;
  if (age < 0.9 || age > 1.05) return; // only as the crown pops (0.9 s into the effect)
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = tootTicks.get(seed);
  if (until !== undefined && until > now) return;
  tootTicks.set(seed, now + 700);
  if (tootTicks.size > 96) for (const [s, u] of tootTicks) if (u <= now) tootTicks.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(1500, 0.08, 0.05); // 1500 Hz over 0.05 s, peak 0.08: the small soft tick
}

/**
 * One short, high plink the moment your critter collects a gem: a 1500 Hz sine over 0.1 s, peak
 * 0.06 — higher and shorter than the coin clink, sitting under it and under the monster pop.
 * The jackpot plays it an octave down (750 Hz) and twice as long (0.2 s), so the big gem reads
 * deeper by ear. Called from the plink HUD part: only your own collections.
 */
export function plink(big: boolean): void {
  if (!ctx || !master) return;
  const life = big ? 0.2 : 0.1;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = big ? 750 : 1500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + life + 0.02);
}

/**
 * One coin clink: the coin's own pitch, a dry triangle blip over in 0.08 s — above the low
 * monster pop, shorter and thinner than the level-up chime. Not gated on a match frame: the
 * shop plays it on the start screen, where the buy tap is the user gesture that starts the context.
 */
export function coinTick(): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = 3000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + 0.1);
}

/** Level-up: a bright two-note candy-bell "ding-ding", E6 then G6, under 0.2 s. */
export function playChime(): void {
  if (!ctx || !master) return;
  if (performance.now() - lastHud > 1000) return; // no match on screen
  const t0 = ctx.currentTime;
  for (const [f, delay] of [[1318.5, 0], [1568, 0.07]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t0 + delay);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.08);
    o.connect(g);
    g.connect(master);
    o.start(t0 + delay);
    o.stop(t0 + delay + 0.09);
  }
}

/**
 * Prestige: a bright rising arpeggio C5→E5→G5 ("da-da-DA"), lower and longer than the
 * level-up chime so a prestige reads bigger. Called from the prestige-ring effect's
 * draw() on every client: the frames the ring blooms (its seed) and at most one
 * fanfare every 2 s, so a player and a bot prestiging at once sound as one.
 */
export function fanfare(seed: number, age: number): void {
  if (!ctx || !master) return; // not unlocked by a gesture yet
  if (age < 0.2 || age > 0.35) return; // only as the ring blooms
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastFanfare < 2000) return; // one fanfare per 2 s
  lastFanfare = now;
  const t0 = ctx.currentTime;
  for (const [f, d] of [[523.25, 0], [659.25, 0.1], [784, 0.2]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, t0 + d);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d + 0.12);
    o.connect(g);
    g.connect(master);
    o.start(t0 + d);
    o.stop(t0 + d + 0.14);
  }
}
