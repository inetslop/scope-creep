import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/core/rng';

describe('Rng determinism', () => {
  it('same seed produces identical output for the first 10 draws', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const drawsA: number[] = [];
    const drawsB: number[] = [];
    for (let i = 0; i < 10; i++) {
      drawsA.push(a.next());
      drawsB.push(b.next());
    }
    expect(drawsA).toEqual(drawsB);
  });

  it('different seeds produce different output within the first 10 draws', () => {
    const a = new Rng(1234);
    const b = new Rng(4321);
    const drawsA: number[] = [];
    const drawsB: number[] = [];
    for (let i = 0; i < 10; i++) {
      drawsA.push(a.next());
      drawsB.push(b.next());
    }
    expect(drawsA).not.toEqual(drawsB);
  });

  it('next() stays within [0, 1)', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
