import { describe, expect, it } from 'vitest';
import { bpmForTime, secondVoiceActive } from '../../src/core/music';

describe('music tempo curve', () => {
  it('starts at 80 BPM', () => {
    expect(bpmForTime(0)).toBe(80);
  });

  it('reaches 100 BPM at 5:00', () => {
    expect(bpmForTime(300)).toBe(100);
  });

  it('caps at 120 BPM from 10:00 onward', () => {
    expect(bpmForTime(600)).toBe(120);
    expect(bpmForTime(3600)).toBe(120);
  });

  it('clamps at 120 BPM at 15:00', () => {
    expect(bpmForTime(900)).toBe(120);
  });

  it('is monotonic over the first hour', () => {
    let prev = bpmForTime(0);
    for (let t = 1; t <= 3600; t += 1) {
      const bpm = bpmForTime(t);
      expect(bpm).toBeGreaterThanOrEqual(prev);
      prev = bpm;
    }
  });

  it('second voice activates exactly at 100 BPM', () => {
    expect(secondVoiceActive(299)).toBe(false);
    expect(secondVoiceActive(300)).toBe(true);
  });
});
