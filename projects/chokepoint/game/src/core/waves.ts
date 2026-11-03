import type { EnemyDef } from '../content/types';
import type { Rng } from './rng';

export interface WaveSpawn {
  enemy: string;
  /** Seconds after the previous spawn. */
  delaySec: number;
}

export interface WavePlan {
  number: number;
  spawns: WaveSpawn[];
  /** Enemy hp multiplier for this wave. */
  hpMul: number;
  /** The wave's tags (the banner and the preview wear them): e.g. 'quiet'. */
  tags: string[];
}

/**
 * Threat points a wave spends on enemies: wave 1 is five Dots, one well-placed tower's worth, and
 * every wave adds five more. Each wave also brings a new augment, and augments in one tower
 * multiply each other, so the waves have to grow fast to keep up.
 */
export function waveBudget(wave: number): number {
  return 5 * wave;
}

/** Seconds between enemies of a group: roomy at first, tighter every wave. */
export function waveSpacing(wave: number): number {
  return Math.max(0.6, 1.7 - 0.12 * (wave - 1));
}

/** Enemy hp grows 20% per wave, plus a little extra later on so towers alone never keep up. */
export function waveHpMul(wave: number): number {
  const n = Math.max(0, wave - 1);
  return 1 + 0.2 * n + 0.006 * n * n;
}

/** What wave the menu demo plays: the player's saved best wave, clamped to at least 1. */
export function demoWave(bestWave: number): number {
  return Math.max(1, bestWave);
}

/** How many ramping enemies (faster when hit) a wave sends: two from wave 8, +1 every four waves, at most six. */
export function rampCount(wave: number): number {
  return wave < 8 ? 0 : Math.min(6, 2 + Math.floor((wave - 8) / 4));
}

/** How many dashing enemies (crawl, stop-and-flash, surge) a wave sends: one on 5, two on 6, +1 every three waves after, at most five. */
export function dashCount(wave: number): number {
  if (wave < 5) return 0;
  const n = wave === 5 ? 1 : 2 + Math.floor((wave - 6) / 3);
  return Math.min(5, n);
}

/** How many splitting enemies a wave sends: one per seven of its other enemies (none until it is unlocked). */
export function splitterCount(total: number): number {
  return Math.floor(total / 7);
}

/** Every 4th wave is a quiet breather wave (wave 0 is not; wave 20 is the boss's slot, not a breather). */
export function isQuietWave(wave: number): boolean {
  return wave > 0 && wave !== 20 && wave % 4 === 0;
}

/** Every 8th wave from wave 6 is a tight bunched wave (6, 14, 22, 30, ...; never a quiet wave: none is a multiple of 4). */
export function isTightWave(wave: number): boolean {
  return wave >= 6 && (wave - 6) % 8 === 0;
}

/** A quiet wave's enemy count: half the usual, rounded up, minimum 3. */
export function quietCount(total: number): number {
  return Math.max(3, Math.ceil(total / 2));
}

/** The multiplier a kill's base gold takes on wave `wave` (quiet waves pay double). */
export function quietGoldMul(wave: number): number {
  return isQuietWave(wave) ? 2 : 1;
}

/**
 * A quiet wave keeps every other enemy: same types and proportions, half the count.
 * A kept spawn takes on the gaps of the spawn(s) that left, so the kept enemies still
 * arrive on schedule; the first kept one stays at delay 0.
 */
export function quietHalve(spawns: WaveSpawn[]): WaveSpawn[] {
  const want = quietCount(spawns.length);
  if (Math.ceil(spawns.length / 2) < 3) return spawns.slice(0, want); // the min-3 floor wins
  const kept: WaveSpawn[] = [];
  for (let i = 0; i < spawns.length; i += 2)
    kept.push({ enemy: spawns[i]!.enemy, delaySec: i === 0 ? 0 : spawns[i]!.delaySec + spawns[i - 1]!.delaySec });
  return kept;
}

/**
 * A tight wave bunched: the same enemies in the same order, but every gap between consecutive
 * enemies is halved (the wave's total spawn time halves; the first spawn comes at once).
 */
export function tightHalve(spawns: WaveSpawn[]): WaveSpawn[] {
  return spawns.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.delaySec / 2 }));
}

/** Every 7th wave from wave 11 is a rush wave (11, 18, 25, ...); it yields to a quiet, tight or boss wave, which keeps its own tag. */
export function isRushWave(wave: number): boolean {
  return wave >= 11 && (wave - 11) % 7 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isBossWave(wave);
}

/** The wave's speed factor: 1.5 on a rush wave, 1 otherwise. It multiplies the level's Swift (1.15 × 1.5 = 1.725). */
export function waveSpeedMul(wave: number): number {
  return isRushWave(wave) ? 1.5 : 1;
}

/** Every 10th wave is the boss wave: one Colossus (the Guard and the Titan on wave 20, the Orb on wave 30, the Hive on wave 40, the Flyer on wave 50, the Blinker on wave 60, the Wards and the Mender on wave 70, the Haulers and the Leech on wave 80, the Splinters and the Gorge on wave 90), nothing else. */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}

/** The enemy the plan declares as the boss of wave `wave`; undefined on non-boss waves. */
export function bossId(wave: number): string | undefined {
  if (!isBossWave(wave)) return undefined;
  return wave === 90 ? 'gorge' : wave === 80 ? 'leech' : wave === 70 ? 'mender' : wave === 60 ? 'blinker' : wave === 50 ? 'crosser' : wave === 40 ? 'hive' : wave === 30 ? 'orb' : wave === 20 ? 'titan' : 'colossus';
}

/**
 * Every 9th wave from wave 16 is the short cut (34, 43, 61, 79, ... — wave 16 is the quiet
 * wave's slot, 25 the rush wave's, 52 a quiet wave and 70 the boss wave's): the wave's road
 * walkers come in mid-road, so the front stretch idles and the fight lives in the back half.
 * It yields to a quiet, tight, rush or boss wave, which keeps its own tag.
 */
export function isShortCutWave(wave: number): boolean {
  return wave >= 16 && (wave - 16) % 9 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isBossWave(wave);
}

/**
 * The spawn distance for a wave's spawn: always its entrance (the far gate's distance, 0 at the
 * main gate), plus — on a short cut wave — 40% of the line left of the entrance, so the road
 * walkers come in mid-road, 40% down the path they walk (from the entrance they walk in from).
 */
export function shortCutSpawnDistance(wave: number, lineLength: number, entranceDistance: number): number {
  return entranceDistance + (isShortCutWave(wave) ? 0.4 * (lineLength - entranceDistance) : 0);
}

/**
 * Every 8th wave from wave 21 is the double (21, 29, 37, 45, ... — wave 53 is the rush wave's
 * slot and 61 the short cut's): the wave comes in two fronts, a first pulse, a lull, and a faster
 * second front. It yields to a quiet, tight, rush, short cut or boss wave, which keeps its own tag.
 */
export function isDoubleWave(wave: number): boolean {
  return wave >= 21 && (wave - 21) % 8 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isBossWave(wave);
}

/** The lull between a double wave's two fronts: exactly this much simulation time with no enemy on the road. */
export const DOUBLE_LULL_SEC = 6;

/** The double wave's second front walks this fast (its walkers; a Flyer crosses as it always does). */
export const DOUBLE_SPEED_MUL = 1.2;

/** The second front's first spawn index: the first pulse is the first half of the plan, rounded up. */
export function doubleSplitAt(count: number): number {
  return Math.ceil(count / 2);
}

/**
 * A double wave's plan: the same plan in the same order, with exactly `DOUBLE_LULL_SEC` of
 * simulation time between the two fronts — the split spawn's gap is replaced by the lull, not
 * added to it, so 2× fast-forward scales it like everything else.
 */
export function doubleLull(plan: WavePlan): WavePlan {
  const at = doubleSplitAt(plan.spawns.length);
  return { ...plan, spawns: plan.spawns.map((s, i) => (i === at ? { ...s, delaySec: DOUBLE_LULL_SEC } : s)) };
}

/**
 * Every 11th wave from wave 26 is clumps (26, 59, 103, ... — 37 is the double wave's slot, 48 and 92 quiet
 * waves, 70 the boss wave's and 81 a rush wave): the wave's enemies walk in clumps of 2 and 3, the gap
 * between the clumps breaking the kill chain. It yields to a quiet, tight, rush, short cut, double or
 * boss wave, which keeps its own tag.
 */
export function isClumpsWave(wave: number): boolean {
  return wave >= 26 && (wave - 26) % 11 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isBossWave(wave);
}

/** The gap between a clumps wave's clumps: exactly this much simulation time with no enemy on the road. */
export const CLUMPS_GAP_SEC = 4;

/** A clumps wave's clump-boundary indices, where the 2, 3, 2, 3, ... clumps end (clumpBoundaries(10) is [2, 5, 7]). */
export function clumpBoundaries(count: number): number[] {
  const at: number[] = [];
  for (let i = 0, k = 0; i < count; k += 1) {
    i += Math.min(k % 2 === 0 ? 2 : 3, count - i);
    if (i < count) at.push(i);
  }
  return at;
}

/**
 * A clumps wave's plan: the same enemies in the same order, grouped 2, 3, 2, 3, ... (the last clump takes
 * whatever is left, 1–3). Every gap where a clump ends is replaced by CLUMPS_GAP_SEC (not added to), the
 * wave's normal interval holding inside a clump; the gap is simulation time, so 2× fast-forward scales it.
 * The 4 s gap always breaks the chain: the chain's window is 1.5 s + 0.4 s per Feast (core/feast.ts).
 */
export function clumpsGap(plan: WavePlan): WavePlan {
  const at = new Set(clumpBoundaries(plan.spawns.length));
  return { ...plan, spawns: plan.spawns.map((s, i) => (at.has(i) ? { ...s, delaySec: CLUMPS_GAP_SEC } : s)) };
}

/**
 * Every 11th wave from wave 18 is the screen (51, 73, 139, ... — 18 is the rush wave's slot, 29 the
 * double wave's and 40 the boss wave's, 62 tight, 84 quiet, 95 the rush wave's, 106 the short
 * cut's and 117 the double's): the whole wave walks in as one front, every spawn within the
 * wave's first 1.5 s. It yields to a quiet, tight, rush, short cut, double, clumps or boss wave,
 * which keeps its own tag.
 */
export function isScreenWave(wave: number): boolean {
  return wave >= 18 && (wave - 18) % 11 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isClumpsWave(wave) && !isBossWave(wave);
}

/** The window a screen wave's whole spawn span collapses into: every spawn lands within the wave's first this many seconds. */
export const SCREEN_WINDOW_SEC = 1.5;

/**
 * A screen wave's plan: the same enemies in the same order, but the wave's whole spawn span rescaled
 * so its last spawn lands at SCREEN_WINDOW_SEC — the wave walks the road as one thick front and only
 * stretches into a stream as its walkers' own speeds differ. Off (a one-spawn plan, span 0) it
 * returns the plan unchanged.
 */
export function screenFront(plan: WavePlan): WavePlan {
  let t = 0;
  for (const s of plan.spawns) t += s.delaySec;
  if (t <= 0) return plan;
  const k = SCREEN_WINDOW_SEC / t;
  return { ...plan, spawns: plan.spawns.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.delaySec * k })) };
}

/**
 * Every 9th wave from wave 19 is the scatter (19, 55, 82, 91, ... — 28 is the quiet wave's slot,
 * 37 the double wave's, 46 a tight wave, 64 a quiet wave, 73 the screen wave's, 100 the boss
 * wave's and 109 the rush wave's): the wave's road walkers pop in at their own points across the
 * front half of the road, so the wave has no front and no order and the answer is spread
 * coverage. It yields to a quiet, tight, rush, short cut, double, clumps, screen or boss wave,
 * which keeps its own tag.
 */
export function isScatterWave(wave: number): boolean {
  return wave >= 19 && (wave - 19) % 9 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isClumpsWave(wave) && !isScreenWave(wave) && !isBossWave(wave);
}

/**
 * The spawn distance for a scatter wave's spawn: its entrance, plus a uniform roll 15–55% down the
 * line left of the entrance, so each road walker pops in at its own point on the road it walks
 * from its own gate. One roll per walker on the run's rng, so two runs of the same wave scatter
 * to different points; a wave that is not a scatter wave rolls nothing and spawns at its entrance.
 */
export function scatterSpawnDistance(wave: number, rng: Rng, lineLength: number, entranceDistance: number): number {
  return entranceDistance + (isScatterWave(wave) ? rng.range(0.15, 0.55) : 0) * (lineLength - entranceDistance);
}

/**
 * Which enemies a wave sends, in order, and when. A boss wave is exactly one boss — the Colossus,
 * the Guard and the Titan on wave 20, the Orb on wave 30, the Hive on wave 40, the Flyer on wave 50,
 * the Blinker on wave 60, the Wards and the Mender on wave 70, the Haulers and the Leech on wave 80,
 * the Splinters and the Gorge on wave 90 — and nothing else; every other wave
 * spends the wave's budget on enemies
 * that are unlocked (fromWave) and
 * affordable, groups of the same type come in quick succession, and ramping enemies are reserved
 * up front (a fixed count per wave), then interleaved evenly through it.
 */
export function planWave(wave: number, rng: Rng, enemies: readonly EnemyDef[]): WavePlan {
  if (isBossWave(wave)) {
    // Still draws its share of the run's rng, so the waves after it keep today's seeded plans.
    planNormalWave(wave, rng, enemies);
    // Wave 20 is the Titan's wave: the Guard walks in ahead of it, carrying the Titan's shield (core/shield.ts).
    if (wave === 20) return { number: wave, spawns: [{ enemy: 'guard', delaySec: 0 }, { enemy: 'titan', delaySec: 1.2 }], hpMul: waveHpMul(wave), tags: ['boss'] };
    // Wave 90 is the Gorge's wave: its two Splinter escorts walk in ahead of it, its feed's line (systems/enemyHooks/gorgeFeeds.ts).
    if (wave === 90) return { number: wave, spawns: [{ enemy: 'splinter', delaySec: 0 }, { enemy: 'splinter', delaySec: 1.2 }, { enemy: 'gorge', delaySec: 2.4 }], hpMul: waveHpMul(wave), tags: ['boss'] };
    // Wave 80 is the Leech's wave: its two Hauler escorts walk in ahead of it, its drinks (core/drink.ts).
    if (wave === 80) return { number: wave, spawns: [{ enemy: 'hauler', delaySec: 0 }, { enemy: 'hauler', delaySec: 1.2 }, { enemy: 'leech', delaySec: 2.4 }], hpMul: waveHpMul(wave), tags: ['boss'] };
    // Wave 70 is the Mender's wave: its two Ward escorts walk in ahead of it, its heal targets (core/mendClock.ts).
    if (wave === 70) return { number: wave, spawns: [{ enemy: 'ward', delaySec: 0 }, { enemy: 'ward', delaySec: 0.4 }, { enemy: 'mender', delaySec: 1.2 }], hpMul: waveHpMul(wave), tags: ['boss'] };
    // Wave 30 is the Orb's wave and wave 40 the Hive's: the boss wave's shape is its own (the Colossus on every other boss wave).
    return { number: wave, spawns: [{ enemy: bossId(wave)!, delaySec: 0 }], hpMul: waveHpMul(wave), tags: ['boss'] };
  }
  return planNormalWave(wave, rng, enemies);
}

function planNormalWave(wave: number, rng: Rng, enemies: readonly EnemyDef[]): WavePlan {
  const unlocked = enemies.filter((e) => !e.spawnOnly && e.fromWave <= wave && e.threat > 0);
  const rampers = unlocked.filter((e) => e.speedRamp !== undefined);
  const walkers = unlocked.filter((e) => e.speedRamp === undefined && e.dashCycle === undefined && e.splitsInto === undefined && e.id !== 'hauler' && e.id !== 'mute' && e.id !== 'bulwark' && e.id !== 'ward' && e.id !== 'flyer');
  let budget = waveBudget(wave);
  // Reserve the rampers first; no rng here, so the seeded picks of the walkers don't shift.
  const rampSpawns: string[] = [];
  for (const e of rampers) {
    const n = Math.min(rampCount(wave), Math.floor(budget / e.threat));
    for (let i = 0; i < n; i++) rampSpawns.push(e.id);
    budget -= n * e.threat;
  }
  // The dashing ones are reserved the same way, after the rampers.
  const dashSpawns: string[] = [];
  for (const e of unlocked) if (e.dashCycle !== undefined) { const n = Math.min(dashCount(wave), Math.floor(budget / e.threat)); for (let i = 0; i < n; i++) dashSpawns.push(e.id); budget -= n * e.threat; }
  // The Flyer: one on 13, 17, 21, ... (≡ 1 mod 4, so never a quiet wave and never a boss wave).
  // Unlike the Hauler and the Mute it comes out of the budget: its real threat is reserved up front.
  if (wave >= 13 && (wave - 13) % 4 === 0) budget -= unlocked.find((e) => e.id === 'flyer')!.threat;
  const spawns: WaveSpawn[] = [];
  while (walkers.length > 0) {
    const affordable = walkers.filter((e) => e.threat <= budget);
    const pick = rng.weighted(affordable, (e) => 1 / e.threat);
    if (!pick) break;
    const group = Math.max(1, Math.min(rng.int(2, 4), Math.floor(budget / pick.threat)));
    const spacing = waveSpacing(wave);
    for (let i = 0; i < group; i++) {
      // Faster enemies come closer together, so they arrive as a pack.
      const gap = i === 0 ? (spawns.length === 0 ? 0 : spacing * 1.5) : spacing / Math.max(0.5, pick.speed / 1.6);
      spawns.push({ enemy: pick.id, delaySec: gap });
      budget -= pick.threat;
    }
  }
  const reserved = [...rampSpawns, ...dashSpawns];
  // Splitters: one per seven of the wave's other enemies, once its fromWave (9) is reached (no rng: seeded waves stay stable).
  const splitter = unlocked.find((e) => e.splitsInto !== undefined);
  if (splitter) {
    const n = splitterCount(spawns.length + reserved.length);
    for (let i = 0; i < n; i++) reserved.push(splitter.id);
  }
  // The Hauler: one on 9, 13, 17, ... (it never comes from the budget; its threat is a placeholder).
  if (wave >= 9 && (wave - 9) % 4 === 0) reserved.push('hauler');
  // The Mute: one on 11, 14, 17, ... (it never comes from the budget; its threat is a placeholder).
  if (wave >= 11 && (wave - 11) % 3 === 0) reserved.push('mute');
  // The Bulwark: one on 12, 16, 20, ... (it never comes from the budget; its threat is a placeholder).
  if (wave >= 12 && (wave - 12) % 4 === 0) reserved.push('bulwark');
  // The Ward: one on 15, 25, 30, ... — wave 20 is the boss's slot (E5); it never comes from the budget (its threat is a placeholder).
  if (wave >= 15 && wave % 5 === 0 && wave !== 20) reserved.push('ward');
  // The Flyer flies in with the wave (its threat already came out of the budget above; after the splitters, like the Hauler).
  if (wave >= 13 && (wave - 13) % 4 === 0) reserved.push('flyer');
  let finalSpawns: WaveSpawn[];
  if (reserved.length === 0) {
    finalSpawns = spawns;
  } else {
    // Interleave the rampers and dashing ones evenly through the wave (no rng: seeded waves stay stable).
    let t = 0;
    const at: { enemy: string; t: number }[] = spawns.map((s) => {
      t += s.delaySec;
      return { enemy: s.enemy, t };
    });
    const span = t + waveSpacing(wave) * 1.5;
    reserved.forEach((enemy, i) => at.push({ enemy, t: ((i + 0.5) / reserved.length) * span }));
    at.sort((a, b) => a.t - b.t);
    finalSpawns = at.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.t - at[i - 1]!.t }));
  }
  // A quiet wave halves the plan at the single exit, so both paths above get it.
  if (isQuietWave(wave)) finalSpawns = quietHalve(finalSpawns);
  // A tight wave bunches the plan at the single exit, so both paths above get it (it is never a quiet wave).
  if (isTightWave(wave)) finalSpawns = tightHalve(finalSpawns);
  // A Mute wave always sends its Mute, even when the halving would drop it: it walks in first.
  if (wave >= 11 && (wave - 11) % 3 === 0 && !finalSpawns.some((s) => s.enemy === 'mute')) finalSpawns = [{ enemy: 'mute', delaySec: 0 }, ...finalSpawns];
  // A Bulwark wave always sends its Bulwark, even when the halving would drop it: it walks in first.
  if (wave >= 12 && (wave - 12) % 4 === 0 && !finalSpawns.some((s) => s.enemy === 'bulwark')) finalSpawns = [{ enemy: 'bulwark', delaySec: 0 }, ...finalSpawns];
  // A Ward wave always sends its Ward, even when the halving would drop it: it walks in first (wave 20 is the boss's slot).
  if (wave >= 15 && wave % 5 === 0 && wave !== 20 && !finalSpawns.some((s) => s.enemy === 'ward')) finalSpawns = [{ enemy: 'ward', delaySec: 0 }, ...finalSpawns];
  return { number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave), tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : isScatterWave(wave) ? ['scatter'] : [] };
}

/**
 * A wave plan under the run's level augments (Crowded): the enemy count times the run's count
 * factor, rounded half up — the extras repeat the plan's entries in order. Off (factor 1) and
 * on a boss wave it returns the same plan, so those runs stay byte-identical.
 */
export function planWithLevel(plan: WavePlan, mul: number): WavePlan {
  if (mul === 1 || isBossWave(plan.number)) return plan;
  const want = Math.floor(plan.spawns.length * mul + 0.5);
  if (want <= plan.spawns.length) return plan;
  return { ...plan, spawns: [...plan.spawns, ...plan.spawns.slice(0, want - plan.spawns.length)] };
}

/** What a wave sends: each enemy type it sends, and how many (no zeros), in first-arrival order. */
export function waveCounts(plan: WavePlan): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of plan.spawns) counts.set(s.enemy, (counts.get(s.enemy) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count }));
}
