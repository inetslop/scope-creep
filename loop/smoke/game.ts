/**
 * What the smoke test needs to know about one game: how to play it and what proves its core loop
 * works. One file per project in loop/smoke/games/<project>.ts (outside the game, so agents can't
 * weaken it).
 */
import type { BrowserContext, Page } from 'playwright';
import { PROJECT } from '../paths.ts';
import type { Driver } from './drivers.ts';

/** window.__SC__.stats: counters the game keeps for the smoke test. */
export type HookStats = Record<string, number | boolean>;

export interface SmokeGame {
  /** window.__SC__.scene the test waits for before it starts playing. */
  playScene: string;
  /** A desktop player (keyboard + mouse). */
  desktop(page: Page): Driver;
  /** A phone player (touch only). */
  mobile(context: BrowserContext, page: Page): Promise<Driver>;
  /** What is wrong with the stats after playing, e.g. nothing ever got shot. Empty when fine. */
  check(stats: HookStats): string[];
  /** The stats in one line for the report. */
  describe(stats: HookStats): string;
}

export async function loadSmokeGame(project = PROJECT): Promise<SmokeGame> {
  try {
    return ((await import(`./games/${project}.ts`)) as { default: SmokeGame }).default;
  } catch (err) {
    throw new Error(`no smoke play for project "${project}" (loop/smoke/games/${project}.ts): ${(err as Error).message}`);
  }
}
