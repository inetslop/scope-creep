import { describe, expect, it } from 'vitest';
import { layoutTree, TREE_GAP } from '../../src/core/techTree';

const at = (layout: ReturnType<typeof layoutTree>, id: string) => layout.spots.find((s) => s.id === id)!;

describe('tech tree layout', () => {
  it('a chain goes straight down, each node under the one it needs', () => {
    const t = layoutTree([
      { id: 'a', requires: null },
      { id: 'b', requires: 'a' },
      { id: 'c', requires: 'b' },
    ]);
    expect(t.width).toBe(1);
    expect(t.height).toBe(3);
    expect(t.spots.map((s) => [s.id, s.parent, s.x, s.y])).toEqual([
      ['a', null, 0.5, 0],
      ['b', 'a', 0.5, 1],
      ['c', 'b', 0.5, 2],
    ]);
  });

  it('a fork spreads its children side by side, the parent centered over them', () => {
    const t = layoutTree([
      { id: 'root', requires: null },
      { id: 'left', requires: 'root' },
      { id: 'right', requires: 'root' },
      { id: 'under', requires: 'left' },
    ]);
    expect(t.width).toBe(2);
    expect(t.height).toBe(3);
    expect(at(t, 'left')).toMatchObject({ x: 0.5, y: 1, parent: 'root' });
    expect(at(t, 'right')).toMatchObject({ x: 1.5, y: 1, parent: 'root' });
    expect(at(t, 'root')).toMatchObject({ x: 1, y: 0 });
    expect(at(t, 'under')).toMatchObject({ x: 0.5, y: 2, parent: 'left' });
  });

  it('independent nodes stack as separate trees with a gap, narrower ones centered', () => {
    const t = layoutTree([
      { id: 'one', requires: null },
      { id: 'fork', requires: null },
      { id: 'x', requires: 'fork' },
      { id: 'y', requires: 'fork' },
    ]);
    expect(t.width).toBe(2);
    expect(at(t, 'one')).toMatchObject({ x: 1, y: 0, parent: null });
    expect(at(t, 'fork')).toMatchObject({ x: 1, y: 1 + TREE_GAP, parent: null });
    expect(at(t, 'x').y).toBe(2 + TREE_GAP);
    expect(t.height).toBe(3 + TREE_GAP);
  });

  it('keeps the input order, and a missing or cyclic requires becomes a root', () => {
    const t = layoutTree([
      { id: 'b', requires: 'gone' },
      { id: 'p', requires: 'q' },
      { id: 'q', requires: 'p' },
    ]);
    expect(t.spots.map((s) => s.id)).toEqual(['b', 'p', 'q']);
    expect(at(t, 'b').parent).toBeNull();
    expect(t.spots).toHaveLength(3);
    expect(new Set(t.spots.map((s) => s.y)).size).toBe(3); // nothing drawn on top of anything
  });

  it('an empty branch takes no room', () => {
    expect(layoutTree([])).toEqual({ spots: [], width: 0, height: 0 });
  });
});
