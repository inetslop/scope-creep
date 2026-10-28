/**
 * Seconds an enemy shrugs off roots after one wears off. Without it a tower that roots on every
 * hit (Splash or Bolt with an Anchor added) re-roots before the root ends and holds everything
 * in place for good; with it a root stops an enemy for at most about a third of the time. A lone
 * Anchor tower (a 0.75s root every 3s) is never slowed down by it.
 */
export const ROOT_IMMUNE_SEC = 2;

/** An enemy's root timers (entities/Enemy has both fields). */
export interface RootState {
  /** Seconds of the full stop left; 0: not rooted. */
  rootLeft: number;
  /** Seconds it still shrugs off roots; 0: it can be rooted. */
  rootImmuneLeft: number;
}

/**
 * Roots it for `sec` seconds, unless it is rooted already (a root is never refreshed or extended
 * while it holds) or still shrugging roots off. Returns whether the root took hold.
 */
export function applyRoot(s: RootState, sec: number): boolean {
  if (sec <= 0 || s.rootLeft > 0 || s.rootImmuneLeft > 0) return false;
  s.rootLeft = sec;
  return true;
}

/** Counts the timers down by `dt` seconds: when a root wears off, the immunity starts. */
export function tickRoot(s: RootState, dt: number): void {
  if (s.rootLeft > 0) {
    s.rootLeft -= dt;
    if (s.rootLeft <= 0) {
      s.rootLeft = 0;
      s.rootImmuneLeft = ROOT_IMMUNE_SEC;
    }
  } else if (s.rootImmuneLeft > 0) {
    s.rootImmuneLeft = Math.max(0, s.rootImmuneLeft - dt);
  }
}
