import { expect, it } from 'vitest';
import { generateMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

// TEMPORARY measurement scratch — safe to delete. The real far-gate tests live in
// tests/core/farGate.test.ts (the net far-gate rate is pinned there, over 600 seeds).
it('placeholder, safe to delete', () => {
  const m = generateMap(new Rng(1), 14, 8, 5);
  expect(m.path.length).toBeGreaterThan(0);
});
