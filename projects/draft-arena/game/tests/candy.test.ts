import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The candy: the head shelf's middle step. */
describe('candy accessory', () => {
  it('is a head accessory, 240 coins, no prestige lock', () => {
    const candy = CONTENT.accessories.find((a) => a.id === 'candy');
    expect(candy, 'the candy is registered').toBeTruthy();
    expect(candy!.slot).toBe('head');
    expect(candy!.price).toBe(240);
    expect(candy!.prestige).toBeUndefined();
    expect(candy!.name.length).toBeLessThanOrEqual(18);
    expect(candy!.description).toBe('A striped orange and white candy on the side of the head.');
  });
});
