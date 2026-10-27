import { describe, expect, it } from 'vitest';
import { BPM_PER_PICK, BossTempo, BOSS_BPM, BOSS_GLIDE_SEC, bpmForTime, effectiveTempo, secondVoiceActive } from '../../src/core/music';

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

describe('boss tempo hold', () => {
  it('plays the run curve while no boss is alive', () => {
    const t = new BossTempo();
    expect(t.bpmFor(300)).toBe(100);
    expect(t.holding(300)).toBe(false);
  });

  it('glides from the run tempo down to BOSS_BPM over the spawn edge and holds there', () => {
    const t = new BossTempo();
    t.bossEnter(300); // the run curve is 100 BPM at 5:00
    expect(t.bpmFor(300)).toBe(100);
    expect(t.bpmFor(300.75)).toBe(82);
    expect(t.bpmFor(300 + BOSS_GLIDE_SEC)).toBe(BOSS_BPM);
    expect(t.bpmFor(900)).toBe(BOSS_BPM);
    expect(t.holding(301.4)).toBe(false);
    expect(t.holding(301.5)).toBe(true);
  });

  it('glides back to the run curve over the death edge, with no 64 BPM residue', () => {
    const t = new BossTempo();
    t.bossEnter(300);
    t.bossLeave(360); // the run curve is 104 BPM at 6:00
    expect(t.bpmFor(360)).toBe(BOSS_BPM);
    expect(t.bpmFor(360.75)).toBe(84);
    expect(t.bpmFor(360 + BOSS_GLIDE_SEC)).toBe(104);
    expect(t.holding(360)).toBe(false);
    expect(t.bpmFor(361.51)).toBe(bpmForTime(361.51)); // the moving curve, not the frozen death-time value
  });

  it('re-targets a return glide when a new boss spawns mid-glide', () => {
    const t = new BossTempo();
    t.bossEnter(300);
    t.bossLeave(600); // the run curve is capped at 120 BPM at 10:00
    expect(t.bpmFor(600.75)).toBe(92);
    t.bossEnter(600.75); // re-arms from the tempo at that moment (92)
    expect(t.bpmFor(601.5)).toBe(78);
    expect(t.bpmFor(602.25)).toBe(BOSS_BPM);
  });

  it('suspends the build nudge while a boss is alive', () => {
    const t = new BossTempo();
    t.bossEnter(300, 20); // effective tempo would be 120 without the boss
    expect(t.bpmFor(300, 20)).toBe(120);
    expect(t.bpmFor(301.5, 20)).toBe(BOSS_BPM);
    expect(t.bpmFor(900, 20)).toBe(BOSS_BPM);
  });

  it('glides back to the nudged tempo on boss death, capped at 120', () => {
    const t = new BossTempo();
    t.bossEnter(300, 5);
    t.bossLeave(360, 5); // base curve is 104 at 6:00, nudged to 114
    expect(t.bpmFor(360, 5)).toBe(BOSS_BPM);
    expect(t.bpmFor(361.5, 5)).toBe(114);
    expect(t.bpmFor(361.51, 5)).toBe(effectiveTempo(361.51, 5)); // moving nudged curve, not the bare one
    const capped = new BossTempo();
    capped.bossEnter(300, 20);
    capped.bossLeave(360, 20); // 104 + 40 would be 144
    expect(capped.bpmFor(361.5, 20)).toBe(120);
  });
});

describe('build nudge (effective tempo)', () => {
  it('equals the bare curve with no picks', () => {
    expect(effectiveTempo(0, 0)).toBe(80);
    expect(effectiveTempo(300, 0)).toBe(100);
    expect(effectiveTempo(600, 0)).toBe(120);
    expect(effectiveTempo(900, 0)).toBe(120);
  });

  it('at base 80 (t = 0) adds 2 BPM per pick, capped at 120', () => {
    expect(effectiveTempo(0, 0)).toBe(80);
    expect(effectiveTempo(0, 10)).toBe(100);
    expect(effectiveTempo(0, 20)).toBe(120);
    expect(effectiveTempo(0, 30)).toBe(120);
  });

  it('at base 100 (t = 300) nudges 5 / 10 picks to 110 / 120', () => {
    expect(effectiveTempo(300, 5)).toBe(110);
    expect(effectiveTempo(300, 10)).toBe(120);
  });

  it('at base 120 (t = 600) stays at 120 for any pick count', () => {
    expect(effectiveTempo(600, 0)).toBe(120);
    expect(effectiveTempo(600, 50)).toBe(120);
    expect(effectiveTempo(600, 1000)).toBe(120);
  });

  it('each pick is exactly BPM_PER_PICK over the base curve', () => {
    expect(effectiveTempo(0, 1)).toBe(80 + BPM_PER_PICK);
  });
});
