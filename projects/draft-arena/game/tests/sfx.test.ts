import { describe, expect, it } from 'vitest';
import { pitchFor } from '../src/audio/sfx.ts';

describe('sfx: the pop pitch', () => {
  it('small monsters pop higher than big ones', () => {
    expect(pitchFor(11)).toBeGreaterThan(pitchFor(14)); // Flee, Dot
    expect(pitchFor(14)).toBeGreaterThan(pitchFor(22)); // Dot, Puff
  });
  it('stays in the candy range for any radius', () => {
    for (const r of [8, 11, 14, 18, 22, 40, 100]) {
      const f = pitchFor(r);
      expect(f).toBeGreaterThanOrEqual(180);
      expect(f).toBeLessThanOrEqual(900);
    }
  });
});
