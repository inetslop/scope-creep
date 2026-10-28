/** The best run on this device. Storage is passed in, so this stays pure and testable. */
export interface BestRun {
  wave: number;
  score: number;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const BEST_KEY = 'chokepoint:best';

export function loadBest(store: KeyValueStore | undefined): BestRun {
  try {
    const raw = store?.getItem(BEST_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<BestRun>) : {};
    return { wave: Number(parsed.wave) || 0, score: Number(parsed.score) || 0 };
  } catch {
    return { wave: 0, score: 0 };
  }
}

/** Saves the run if it beat the best score. Returns true when it did. */
export function saveIfBest(store: KeyValueStore | undefined, run: BestRun): boolean {
  const best = loadBest(store);
  if (run.score <= best.score) return false;
  try {
    store?.setItem(BEST_KEY, JSON.stringify(run));
  } catch {
    /* private mode or full storage: the best score just isn't kept */
  }
  return true;
}
