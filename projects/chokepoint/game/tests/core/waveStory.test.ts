import { describe, expect, it } from 'vitest';
import { loudestWave } from '../../src/core/waveStory';

describe('loudestWave', () => {
  it('is the wave with the most leaks', () => {
    const story = [
      { wave: 1, leaks: 2 },
      { wave: 2, leaks: 5 },
      { wave: 3, leaks: 1 },
    ];
    expect(loudestWave(story)).toEqual({ wave: 2, leaks: 5 });
  });

  it('gives a tie to the earliest wave', () => {
    expect(loudestWave([{ wave: 1, leaks: 3 }, { wave: 2, leaks: 3 }, { wave: 3, leaks: 1 }])).toEqual({ wave: 1, leaks: 3 });
    expect(loudestWave([{ wave: 1, leaks: 0 }, { wave: 2, leaks: 0 }])).toEqual({ wave: 1, leaks: 0 });
  });

  it('is undefined for a story with no waves', () => {
    expect(loudestWave([])).toBeUndefined();
  });
});
