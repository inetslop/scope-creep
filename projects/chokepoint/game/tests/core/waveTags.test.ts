import { describe, expect, it } from 'vitest';
import { isBossWave, isQuietWave, isShortCutWave, isTightWave } from '../../src/core/waves';
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
  });
  it("lists the five tags in the order the run meets them, each with the game's own rule", () => {
    expect(WAVE_TAG_ROWS.map((r) => r.tag)).toEqual(['quiet', 'tight', 'boss', 'rush', 'short cut']);
    const first = [4, 6, 10, 11, 34];
    WAVE_TAG_ROWS.forEach((row, i) => expect(row.rule(first[i]!)).toBe(true));
  });
});
