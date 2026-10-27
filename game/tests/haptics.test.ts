import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Haptics, haptics } from '../src/audio/Haptics';

describe('Haptics', () => {
  let vibrate: ReturnType<typeof vi.fn>;
  let getItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrate = vi.fn();
    getItem = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    vi.stubGlobal('localStorage', { getItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('buzzes exactly 30 on hit, [20, 40, 20] on level up and 120 on boss', () => {
    // Pin the clock so the singleton's first hit is never inside its throttle window.
    const now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    haptics.hit();
    expect(vibrate).toHaveBeenCalledWith(30);
    haptics.levelUp();
    expect(vibrate).toHaveBeenCalledWith([20, 40, 20]);
    haptics.boss();
    expect(vibrate).toHaveBeenCalledWith(120);
    expect(vibrate).toHaveBeenCalledTimes(3);
  });

  it('never vibrates while muted', () => {
    getItem.mockReturnValue('1');
    haptics.hit();
    haptics.levelUp();
    haptics.boss();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('does nothing when navigator.vibrate is missing (desktop, headless)', () => {
    vi.unstubAllGlobals(); // node's own navigator has no vibrate
    expect(() => {
      haptics.hit();
      haptics.levelUp();
      haptics.boss();
    }).not.toThrow();
  });

  it('throttles hit() to at most one buzz per 150 ms', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const fresh = new Haptics(); // the singleton's lastHitAt must not leak in
    fresh.hit();
    expect(vibrate).toHaveBeenCalledTimes(1);
    fresh.hit(); // immediate second hit: still within 150 ms, swallowed
    expect(vibrate).toHaveBeenCalledTimes(1);
    now += 151;
    fresh.hit();
    expect(vibrate).toHaveBeenCalledTimes(2);
  });

  it('does not stamp the throttle for a muted hit, so an un-muted hit still buzzes', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const fresh = new Haptics();
    getItem.mockReturnValue('1');
    fresh.hit(); // muted: swallowed before lastHitAt is stamped
    expect(vibrate).not.toHaveBeenCalled();
    getItem.mockReturnValue(null);
    now += 1;
    fresh.hit(); // un-muted: not throttled by the swallowed call
    expect(vibrate).toHaveBeenCalledTimes(1);
  });
});
