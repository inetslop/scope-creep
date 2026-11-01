import type { WaveRecord } from './run';

/** The wave with the most leaks (the earliest one wins a tie); undefined for a story with no waves. */
export function loudestWave(story: readonly WaveRecord[]): WaveRecord | undefined {
  let best: WaveRecord | undefined;
  for (const r of story) if (r.leaks > (best?.leaks ?? -1)) best = r;
  return best;
}
