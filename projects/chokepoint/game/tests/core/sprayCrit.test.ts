import { describe, expect, it } from 'vitest';
import { SPRAY_CRIT_CHANCE, sprayPelletDamage } from '../../src/core/sprayCrit';

describe('sprayPelletDamage (T0299)', () => {
  it('a critting pellet deals exactly twice the normal pellet damage, and only that pellet', () => {
    expect(sprayPelletDamage(8, 0)).toEqual({ damage: 16, crit: true });
  });

  it('the tier\'s damageMul is applied before the doubling', () => {
    const rare = 4 * (5 / 4); // Rare Spray's per-pellet damage
    expect(sprayPelletDamage(rare, 0).damage).toBe(rare * 2);
  });

  it('a non-crit pellet is byte-identical to its normal damage', () => {
    expect(sprayPelletDamage(8, 0.5)).toEqual({ damage: 8, crit: false });
  });

  it('the roll is against the chance: under it crits, 0.15 itself does not', () => {
    expect(SPRAY_CRIT_CHANCE).toBe(0.15);
    expect(sprayPelletDamage(4, 0.14999)).toEqual({ damage: 8, crit: true });
    expect(sprayPelletDamage(4, SPRAY_CRIT_CHANCE)).toEqual({ damage: 4, crit: false });
    expect(sprayPelletDamage(4, 0.999)).toEqual({ damage: 4, crit: false });
  });
});
