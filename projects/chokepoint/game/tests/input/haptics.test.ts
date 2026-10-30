import { describe, expect, it } from 'vitest';
import { haptic, PATTERNS } from '../../src/input/haptics';

describe('haptics', () => {
  it('maps the two moments to their buzz, in ms', () => {
    expect(PATTERNS.place).toEqual([20]);
    expect(PATTERNS.leak).toEqual([80]);
  });

  it('is a total no-op where the phone cannot vibrate', () => {
    // The node test env has no `vibrate`: a forgotten guard would throw calling `navigator.vibrate`.
    expect(() => haptic('place')).not.toThrow();
    expect(() => haptic('leak')).not.toThrow();
  });
});
