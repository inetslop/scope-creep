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

/** Threat points a wave spends on enemies: wave 1 is five Dots, one well-placed tower's worth. */
export function waveBudget(wave: number): number {
  return 2 + wave * 3;
}

/** Seconds between enemies of a group: roomy at first, tighter every wave. */
export function waveSpacing(wave: number): number {
  return Math.max(0.6, 1.7 - 0.12 * (wave - 1));
}

/** Enemy hp grows 12% per wave, plus a little extra later on so towers alone never keep up. */
export function waveHpMul(wave: number): number {
  const n = Math.max(0, wave - 1);
  return 1 + 0.12 * n + 0.004 * n * n;
}

/**
 * Which enemies a wave sends, in order, and when. Spends the wave's budget on enemies that are
 * unlocked (fromWave) and affordable; groups of the same type come in quick succession.
 */
export function planWave(wave: number, rng: Rng, enemies: readonly EnemyDef[]): WavePlan {
  const unlocked = enemies.filter((e) => e.fromWave <= wave && e.threat > 0);
  let budget = waveBudget(wave);
  const spawns: WaveSpawn[] = [];
  while (unlocked.length > 0) {
    const affordable = unlocked.filter((e) => e.threat <= budget);
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
  return { number: wave, spawns, hpMul: waveHpMul(wave) };
}
