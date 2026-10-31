import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The kiss: the face shelf's step between Heart Shades and Mustache. */
describe('kiss accessory', () => {
  it('is a face accessory, 300 coins, no prestige lock', () => {
    const kiss = CONTENT.accessories.find((a) => a.id === 'kiss');
    expect(kiss, 'the kiss is registered').toBeTruthy();
    expect(kiss!.slot).toBe('face');
    expect(kiss!.price).toBe(300);
    expect(kiss!.prestige).toBeUndefined();
    expect(kiss!.name.length).toBeLessThanOrEqual(18);
    expect(kiss!.description).toBe('A small red kiss mark on the cheek.');
  });
});
