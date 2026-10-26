/** Exit codes understood by loop/start-agent.ps1. */
export const EXIT_RESTART = 75;
export const EXIT_NO_MODEL = 76;

/** Changes to these paths mean the running loop code is stale and the runner must restart. */
export function needsRestart(changed: readonly string[]): boolean {
  return changed.some((p) => p.startsWith('loop/') || p === 'package.json' || p === 'package-lock.json');
}
