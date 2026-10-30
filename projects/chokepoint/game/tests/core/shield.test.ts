import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import { SHIELD_MUL, shieldMul } from '../../src/core/shield';

describe('shieldMul', () => {
  it('is 0.5 for a shield-carrying enemy while its shield is up', () => {
    expect(SHIELD_MUL).toBe(0.5);
    const titan = getEnemy('titan');
    expect(titan.shieldCarrier).toBe('guard');
    expect(shieldMul(titan, true)).toBe(0.5);
  });
  it('is 1 for the same enemy once the shield is down', () => {
    expect(shieldMul(getEnemy('titan'), false)).toBe(1);
  });
  it('is 1 for an enemy without a shield, shielded or not', () => {
    for (const id of ['dot', 'colossus', 'orb']) expect(shieldMul(getEnemy(id), true)).toBe(1);
    expect(shieldMul(getEnemy('dot'), false)).toBe(1);
  });
});
