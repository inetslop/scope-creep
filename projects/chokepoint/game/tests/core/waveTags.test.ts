import { describe, expect, it } from 'vitest';
import { isBossWave, isClumpsWave, isDoubleWave, isQuietWave, isScreenWave, isShortCutWave, isTightWave } from '../../src/core/waves';
import { WAVE_TAG_ROWS, nextTaggedWave } from '../../src/core/waveTags';

/**
 * The waves reference's rows: the tag order, the game's own rules behind each row, and the
 * 'next: wave N' read-off, so the reference can never disagree with the waves that come.
 */
describe('wave tags reference', () => {
  it("next: wave N is the first wave after the current one the tag's own rule tags", () => {
    expect(nextTaggedWave(0, isQuietWave)).toBe(4);
    expect(nextTaggedWave(4, isQuietWave)).toBe(8);
    expect(nextTaggedWave(5, isTightWave)).toBe(6);
    expect(nextTaggedWave(6, isTightWave)).toBe(14);
    expect(nextTaggedWave(0, isBossWave)).toBe(10);
    expect(nextTaggedWave(19, isBossWave)).toBe(20);
    expect(nextTaggedWave(0, isShortCutWave)).toBe(34); // 16 is the quiet wave's slot, 25 the rush wave's
    expect(nextTaggedWave(34, isShortCutWave)).toBe(43);
    expect(nextTaggedWave(0, isDoubleWave)).toBe(21);
    expect(nextTaggedWave(0, isClumpsWave)).toBe(26);
    expect(nextTaggedWave(26, isClumpsWave)).toBe(59); // 37 is the double wave's slot
    expect(nextTaggedWave(0, isScreenWave)).toBe(51); // 18 is the rush wave's slot, 29 the double's, 40 the boss's, 62 tight and 84 quiet
    expect(nextTaggedWave(51, isScreenWave)).toBe(73);
  });
  it("lists the eight tags in the order the run meets them, each with the game's own rule", () => {
    expect(WAVE_TAG_ROWS.map((r) => r.tag)).toEqual(['quiet', 'tight', 'boss', 'rush', 'double', 'clumps', 'short cut', 'screen']);
    const first = [4, 6, 10, 11, 21, 26, 34, 51];
    WAVE_TAG_ROWS.forEach((row, i) => expect(row.rule(first[i]!)).toBe(true));
  });
});
