import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The kill-coins wiring, as the engine loads it. (tests/ may only import engine/api.ts, so the 5-minute
 * pacing itself is checked in a real match, not here.) */
describe('kill coins in the content bundle', () => {
  it('registers the pay director and the coin effect it plays', () => {
    expect(CONTENT.directors.some((d) => d.id === 'kill-coins')).toBe(true);
    expect(CONTENT.effects.some((e) => e.id === 'coin')).toBe(true);
  });
});
