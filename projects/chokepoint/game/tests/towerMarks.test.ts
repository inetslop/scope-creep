import { describe, expect, it } from 'vitest';
import { BARREL_MARKS } from '../src/art/barrelMarks';
import { AUGMENTS } from '../src/content/augments';

describe('tower marks', () => {
  it('every first augment wears one of the 16 marks, and no two wear the same', () => {
    expect(Object.keys(BARREL_MARKS).length).toBe(16);
    for (const a of AUGMENTS) expect(BARREL_MARKS[a.id]).toBeDefined();
    expect(new Set(Object.values(BARREL_MARKS)).size).toBe(16);
  });
});
