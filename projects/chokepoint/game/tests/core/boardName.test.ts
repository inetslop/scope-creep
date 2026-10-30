import { describe, expect, it } from 'vitest';
import { BOARD_NAME_KEY, isBoardName, loadBoardName, saveBoardName, stepLetter } from '../../src/core/boardName';

const store = (): Map<string, string> & { getItem(k: string): string | null; setItem(k: string, v: string): void } => {
  const m = new Map<string, string>() as Map<string, string> & { getItem(k: string): string | null; setItem(k: string, v: string): void };
  m.getItem = (k) => m.get(k) ?? null;
  m.setItem = (k, v) => void m.set(k, v);
  return m;
};

describe('the board name', () => {
  it('is four capital letters, saved and loaded; anything else reads as no name', () => {
    const s = store();
    expect(loadBoardName(s)).toBe('');
    saveBoardName(s, 'WREN');
    expect(loadBoardName(s)).toBe('WREN');
    saveBoardName(s, 'NO');
    expect(loadBoardName(s)).toBe('WREN');
    s.setItem(BOARD_NAME_KEY, 'ab1d');
    expect(loadBoardName(s)).toBe('');
    expect(isBoardName('ABCD')).toBe(true);
    expect(isBoardName('ABCDE')).toBe(false);
  });

  it('steps letters through the alphabet, wrapping', () => {
    expect(stepLetter('A', 1)).toBe('B');
    expect(stepLetter('Z', 1)).toBe('A');
    expect(stepLetter('A', -1)).toBe('Z');
  });
});
