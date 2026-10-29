/** The device's profile: best wave, runs played, coins, and the four most recent runs. Storage is passed in, so this stays pure and testable. */
export interface Profile {
  bestWave: number;
  /** Seed of the board the best wave was fought on; null until a finished run sets one. */
  bestSeed: number | null;
  runsPlayed: number;
  coins: number;
  /** Tech tree node ids bought with the coins; spent coins are gone. */
  purchased: string[];
  lastRun: { wave: number; coins: number } | null;
  recent: { wave: number; coins: number }[];
  sound: boolean;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RunResult {
  waves: number;
  stopped: number;
  clean: number;
  /** This run's seed. */
  seed: number;
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
    const bestSeed =
      typeof parsed.bestSeed === 'number' && Number.isInteger(parsed.bestSeed) && parsed.bestSeed >= 0 && parsed.bestSeed <= 2 ** 31
        ? parsed.bestSeed
        : null;
    const purchased = Array.isArray(parsed.purchased)
      ? [...new Set(parsed.purchased.filter((id): id is string => typeof id === 'string' && id.length > 0))]
      : [];
    return {
      bestWave: Number(parsed.bestWave) || 0,
      bestSeed,
      runsPlayed: Number(parsed.runsPlayed) || 0,
      coins: Number(parsed.coins) || 0,
      purchased,
      lastRun,
      recent,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
    };
  } catch {
    return { bestWave: 0, bestSeed: null, runsPlayed: 0, coins: 0, purchased: [], lastRun: null, recent: [], sound: true };
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
  const newBest = result.waves > old.bestWave;
  const profile: Profile = {
    bestWave: Math.max(old.bestWave, result.waves),
    // A ghost run replays the best board, so it never moves the button.
    bestSeed: newBest && result.seed !== old.bestSeed ? result.seed : old.bestSeed,
    runsPlayed: old.runsPlayed + 1,
    coins: old.coins + coins,
    purchased: old.purchased,
    lastRun: { wave: result.waves, coins },
    recent: [{ wave: result.waves, coins }, ...old.recent].slice(0, 4),
    sound: old.sound,
  };
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the profile just isn't kept */
  }
  return { profile, coins, newBest };
}

/** Saves the sound preference; the profile's other fields keep what they had. */
export function saveSound(store: KeyValueStore | undefined, on: boolean): void {
  const profile = loadProfile(store);
  profile.sound = on;
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the preference just isn't kept */
  }
}
