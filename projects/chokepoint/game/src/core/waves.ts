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
  return 1 + 0.2 * n + 0.004 * n * n;
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

/** Every 10th wave is the boss wave: one Colossus (the Guard and the Titan on wave 20, the Orb on wave 30), nothing else. */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}

/** The enemy the plan declares as the boss of wave `wave`; undefined on non-boss waves. */
export function bossId(wave: number): string | undefined {
  if (!isBossWave(wave)) return undefined;
  return wave === 30 ? 'orb' : wave === 20 ? 'titan' : 'colossus';
}

/**
 * Which enemies a wave sends, in order, and when. A boss wave is exactly one boss — the Colossus,
 * the Guard and the Titan on wave 20, the Orb on wave 30 — and nothing else; every other wave
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
    // Wave 30 is the Orb's wave: the boss wave's shape is its own (the Colossus on every other boss wave).
    return { number: wave, spawns: [{ enemy: bossId(wave)!, delaySec: 0 }], hpMul: waveHpMul(wave), tags: ['boss'] };
  }
  return planNormalWave(wave, rng, enemies);
}

function planNormalWave(wave: number, rng: Rng, enemies: readonly EnemyDef[]): WavePlan {
  const unlocked = enemies.filter((e) => !e.spawnOnly && e.fromWave <= wave && e.threat > 0);
  const rampers = unlocked.filter((e) => e.speedRamp !== undefined);
  const walkers = unlocked.filter((e) => e.speedRamp === undefined && e.dashCycle === undefined && e.splitsInto === undefined && e.id !== 'hauler' && e.id !== 'mute' && e.id !== 'bulwark' && e.id !== 'ward');
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
  return { number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave), tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : [] };
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
