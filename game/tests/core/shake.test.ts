import { describe, expect, it } from 'vitest';
import { CameraShake } from '../../src/core/shake';

const frame = 16; // 60 fps in ms

describe('CameraShake', () => {
  it('starts idle: update returns null and remainingMs is 0', () => {
    const s = new CameraShake();
    expect(s.update(frame)).toBeNull();
    expect(s.remainingMs).toBe(0);
  });

  it('ignores zero amplitude or duration', () => {
    const s = new CameraShake();
    s.add(0, 300);
    s.add(8, 0);
    expect(s.update(frame)).toBeNull();
    expect(s.remainingMs).toBe(0);
  });

  it('eases out over its duration and is null once spent (300 ms ends on the 19th 16 ms frame)', () => {
    const s = new CameraShake();
    s.add(8, 300);
    expect(s.update(frame)).toBeCloseTo(8 * ((300 - frame) / 300) ** 2); // first frame: almost full amplitude
    let firstNullAt = -1;
    for (let i = 2; i <= 30; i++) {
      const amp = s.update(frame);
      if (amp === null) {
        firstNullAt = i;
        break;
      }
    }
    expect(firstNullAt).toBe(19); // 18 frames still shaking, the 19th returns null
    expect(s.remainingMs).toBe(0);
  });

  it('the small block jolt lasts nine 16 ms frames (150 ms)', () => {
    const s = new CameraShake();
    s.add(4, 150);
    for (let i = 1; i <= 9; i++) expect(s.update(frame)).not.toBeNull();
    expect(s.update(frame)).toBeNull(); // the tenth frame is gone
    expect(s.remainingMs).toBe(0);
  });

  it('combines same-instant shakes: amplitudes sum capped at 20, longest duration wins', () => {
    const s = new CameraShake();
    s.add(14, 500);
    s.add(8, 300);
    expect(s.update(frame)).toBeCloseTo(20 * ((500 - frame) / 500) ** 2);
  });
});
