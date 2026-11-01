import { describe, expect, it } from 'vitest';
import { BOARD_FACTS, boardFactTag } from '../../src/core/boardFacts';
import { BOARD_NODES } from '../../src/content/tech/board';

describe('the board facts', () => {
  it('lists the eight modifiers in order, each with its mark key', () => {
    expect(BOARD_FACTS.map((r) => r.mark)).toEqual(['choke', 'bend', 'longway', 'twochokes', 'switchback', 'fargate', 'fork', 'markedcell']);
  });

  it('the tech tags point at the tech tree\'s own node ids, read from its data', () => {
    const ids: string[] = [];
    for (const row of BOARD_FACTS) {
      const tag = row.tag;
      if (tag.kind === 'tech') ids.push(tag.node);
    }
    expect(ids).toEqual(['one-more-bend', 'long-way', 'two-chokes', 'switchback']);
    for (const row of BOARD_FACTS) {
      const tag = row.tag;
      if (tag.kind !== 'tech') continue;
      const node = tag.node;
      expect(BOARD_NODES.find((n) => n.id === node)).toBeDefined();
    }
  });

  it('resolves the tag: always, some boards, the tree\'s own name, and owned while purchased', () => {
    expect(boardFactTag(BOARD_FACTS[0]!, [])).toBe('always');
    expect(boardFactTag(BOARD_FACTS[5]!, [])).toBe('some boards');
    expect(boardFactTag(BOARD_FACTS[6]!, [])).toBe('some boards');
    expect(boardFactTag(BOARD_FACTS[7]!, [])).toBe('some boards');
    // Unowned: the tree's own node name, never retyped.
    expect(boardFactTag(BOARD_FACTS[1]!, [])).toBe('One more bend');
    expect(boardFactTag(BOARD_FACTS[1]!, ['one-more-bend'])).toBe('owned');
    expect(boardFactTag(BOARD_FACTS[4]!, [])).toBe('The switchback');
    expect(boardFactTag(BOARD_FACTS[4]!, ['switchback'])).toBe('owned');
  });
});
