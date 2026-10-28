/** The device's profile: best wave, runs played, coins, and the four most recent runs. Storage is passed in, so this stays pure and testable. */
export interface Profile {
  bestWave: number;
  runsPlayed: number;
  coins: number;
  lastRun: { wave: number; coins: number } | null;
  recent: { wave: number; coins: number }[];
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RunResult {
  waves: number;
  stopped: number;
  clean: number;
}

export interface RecordResult {
  profile: Profile;
  coins: number;
  newBest: boolean;
}

export const PROFILE_KEY = 'chokepoint:profile';

export function loadProfile(store: KeyValueStore | undefined): Profile {
  try {
    const raw = store?.getItem(PROFILE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Profile>) : {};
    const lastRun =
      parsed.lastRun &&
      typeof parsed.lastRun === 'object' &&
      Number.isFinite(parsed.lastRun.wave) &&
      parsed.lastRun.wave >= 0 &&
      Number.isFinite(parsed.lastRun.coins) &&
      parsed.lastRun.coins >= 0
        ? { wave: Number(parsed.lastRun.wave), coins: Number(parsed.lastRun.coins) }
        : null;
    const recent = Array.isArray(parsed.recent)
      ? parsed.recent
          .filter((r) => !!r && typeof r === 'object' && Number.isFinite(r.wave) && r.wave >= 0 && Number.isFinite(r.coins) && r.coins >= 0)
          .slice(0, 4)
          .map((r) => ({ wave: Number(r.wave), coins: Number(r.coins) }))
      : [];
    return {
      bestWave: Number(parsed.bestWave) || 0,
      runsPlayed: Number(parsed.runsPlayed) || 0,
      coins: Number(parsed.coins) || 0,
      lastRun,
      recent,
    };
  } catch {
    return { bestWave: 0, runsPlayed: 0, coins: 0, lastRun: null, recent: [] };
  }
}

/** What a run is worth in coins: the waves held, a coin per ten stopped, and one per clean wave. */
export function coinsForRun(result: RunResult): number {
  return result.waves + Math.floor(result.stopped / 10) + result.clean;
}

/** Folds a finished run into the saved profile and saves it. */
export function recordRun(store: KeyValueStore | undefined, result: RunResult): RecordResult {
  const old = loadProfile(store);
  const coins = coinsForRun(result);
  const profile: Profile = {
    bestWave: Math.max(old.bestWave, result.waves),
    runsPlayed: old.runsPlayed + 1,
    coins: old.coins + coins,
    lastRun: { wave: result.waves, coins },
    recent: [{ wave: result.waves, coins }, ...old.recent].slice(0, 4),
  };
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the profile just isn't kept */
  }
  return { profile, coins, newBest: result.waves > old.bestWave };
}
