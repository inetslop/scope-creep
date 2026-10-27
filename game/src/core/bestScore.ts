/** All-time best score, persisted in localStorage across reloads. */

export const BEST_SCORE_KEY = 'scope-creep.best-score';

/** The stored all-time best score; 0 when absent, unparseable, or storage is blocked. */
export function loadBestScore(): number {
  try {
    const n = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0; // no localStorage (private mode, non-browser context)
  }
}

/** Persists the all-time best score. Never throws; blocked storage is simply not remembered. */
export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // storage blocked: keep playing without a persistent best
  }
}
