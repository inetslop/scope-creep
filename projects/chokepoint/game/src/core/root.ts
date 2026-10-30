/** The root's own timer. Repeated pushes and roots grow weaker instead (core/control.ts): nothing holds an enemy in place. */
export interface RootState {
  /** Seconds of the full stop left; 0: not rooted. */
  rootLeft: number;
}

/**
 * Roots it for `sec` seconds, unless it is rooted already (a root is never refreshed or
 * extended while it holds). Returns whether the root took hold.
 */
export function applyRoot(s: RootState, sec: number): boolean {
  if (sec <= 0 || s.rootLeft > 0) return false;
  s.rootLeft = sec;
  return true;
}

/** Counts the root down by `dt` seconds. */
export function tickRoot(s: RootState, dt: number): void {
  if (s.rootLeft > 0) {
    s.rootLeft -= dt;
    if (s.rootLeft <= 0) s.rootLeft = 0;
  }
}
