import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The lollipop: the back slot's top — a 500-coin accessory gated on 2 prestiges in all. */
describe('lollipop accessory', () => {
  it('is a back accessory, 500 coins, gated on 2 prestiges', () => {
    const lollipop = CONTENT.accessories.find((a) => a.id === 'lollipop');
    expect(lollipop, 'the lollipop is registered').toBeTruthy();
    expect(lollipop!.slot).toBe('back');
    expect(lollipop!.price).toBe(500);
    expect(lollipop!.prestige).toBe(2);
    expect(lollipop!.name.length).toBeLessThanOrEqual(18);
    expect(lollipop!.description).toBe('A big green lollipop with a white swirl. Needs 2 prestiges in all.');
  });
});
