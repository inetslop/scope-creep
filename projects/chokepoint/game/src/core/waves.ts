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

/**
 * Which enemies a wave sends, in order, and when. Spends the wave's budget on enemies that are
 * unlocked (fromWave) and affordable; groups of the same type come in quick succession. Ramping
 * enemies are reserved up front (a fixed count per wave), then interleaved evenly through it.
 */
export function planWave(wave: number, rng: Rng, enemies: readonly EnemyDef[]): WavePlan {
  const unlocked = enemies.filter((e) => !e.spawnOnly && e.fromWave <= wave && e.threat > 0);
  const rampers = unlocked.filter((e) => e.speedRamp !== undefined);
  const walkers = unlocked.filter((e) => e.speedRamp === undefined && e.dashCycle === undefined && e.splitsInto === undefined);
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
  if (reserved.length === 0) return { number: wave, spawns, hpMul: waveHpMul(wave) };
  // Interleave the rampers and dashing ones evenly through the wave (no rng: seeded waves stay stable).
  let t = 0;
  const at: { enemy: string; t: number }[] = spawns.map((s) => {
    t += s.delaySec;
    return { enemy: s.enemy, t };
  });
  const span = t + waveSpacing(wave) * 1.5;
  reserved.forEach((enemy, i) => at.push({ enemy, t: ((i + 0.5) / reserved.length) * span }));
  at.sort((a, b) => a.t - b.t);
  return {
    number: wave,
    spawns: at.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.t - at[i - 1]!.t })),
    hpMul: waveHpMul(wave),
  };
}

/** What a wave sends: each enemy type it sends, and how many (no zeros), in first-arrival order. */
export function waveCounts(plan: WavePlan): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of plan.spawns) counts.set(s.enemy, (counts.get(s.enemy) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count }));
}
