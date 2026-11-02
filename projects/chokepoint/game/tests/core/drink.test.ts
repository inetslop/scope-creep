import { describe, expect, it } from 'vitest';
import { drinkLeg } from '../../src/core/drink';

// The Leech's spec (content/enemies/leech.ts): a 5 s cycle — 3.6 s of walking, a 0.8 s flash, a 0.6 s drink.
const spec = { everySec: 5, telegraphSec: 0.8, drinkSec: 0.6, maxDrinks: 8, drinkPct: 0.08, escort: 'hauler' };

describe('drinkLeg', () => {
  it('walks idle for most of the cycle, flashes before it drinks, drinks last', () => {
    expect(drinkLeg(spec, 0)).toBe('idle');
    expect(drinkLeg(spec, 1.2)).toBe('idle');
    expect(drinkLeg(spec, 3.5)).toBe('idle');
    expect(drinkLeg(spec, 3.6 - 1e-6)).toBe('idle'); // at the telegraph line the flash begins
    expect(drinkLeg(spec, 3.6 + 1e-6)).toBe('flash');
    expect(drinkLeg(spec, 4)).toBe('flash');
    expect(drinkLeg(spec, 4.4 - 1e-6)).toBe('flash'); // at the drink line the drink begins
    expect(drinkLeg(spec, 4.4 + 1e-6)).toBe('drink');
    expect(drinkLeg(spec, 4.9)).toBe('drink');
  });

  it('wraps every cycle, second after second', () => {
    expect(drinkLeg(spec, 5)).toBe('idle'); // 5 % 5 = 0: a fresh cycle
    expect(drinkLeg(spec, 8.7)).toBe('flash'); // 8.7 % 5 = 3.7
    expect(drinkLeg(spec, 9.5)).toBe('drink'); // 9.5 % 5 = 4.5
    expect(drinkLeg(spec, 14.9)).toBe('drink'); // 14.9 % 5 = 4.9
    expect(drinkLeg(spec, 15)).toBe('idle');
  });

  it('the lines fall on the spec fractions: the telegraph, then the drink, then the wrap', () => {
    const rest = spec.everySec - spec.telegraphSec - spec.drinkSec; // 3.6
    expect(drinkLeg(spec, rest - 1e-6)).toBe('idle');
    expect(drinkLeg(spec, rest + 1e-6)).toBe('flash');
    expect(drinkLeg(spec, rest + spec.telegraphSec + 1e-6)).toBe('drink');
  });
});
