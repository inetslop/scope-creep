import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The medal: the shop's longest goal — a back accessory buyable only after 2 prestiges in all. */
describe('medal accessory', () => {
  it('is a back accessory, 400 coins, gated on 2 prestiges', () => {
    const medal = CONTENT.accessories.find((a) => a.id === 'medal');
    expect(medal, 'the medal is registered').toBeTruthy();
    expect(medal!.slot).toBe('back');
    expect(medal!.price).toBe(400);
    expect(medal!.prestige).toBe(2);
    expect(medal!.name.length).toBeLessThanOrEqual(18);
    expect(medal!.description).toBe('A yellow medal with a red ribbon. Needs 2 prestiges in all.');
  });
});
