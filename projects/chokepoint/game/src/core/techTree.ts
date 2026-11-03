/**
 * Where the tech screen draws one branch's nodes, from their `requires` alone, so new content
 * places itself. A node sits one step below the node it needs; a node's children sit side by
 * side under it (a fork spreads out); a node that needs nothing in the branch starts a new tree,
 * stacked under the trees before it with a small gap. Positions are in slots (x, the center) and
 * steps (y, the top), so the screen picks the pixel sizes.
 */
export interface TreeSpot {
  id: string;
  /** The node it hangs from in this branch (a line is drawn to it), or null for a tree's root. */
  parent: string | null;
  /** Horizontal center, in slots from the branch's left edge. */
  x: number;
  /** Vertical top, in steps from the branch's top (gaps between trees count as `TREE_GAP` steps). */
  y: number;
}

export interface TreeLayout {
  spots: TreeSpot[];
  /** How many slots wide the branch is (its widest tree). */
  width: number;
  /** How many steps tall the branch is. */
  height: number;
}

/** The space between two independent trees in one branch, in steps. */
export const TREE_GAP = 0.25;

export function layoutTree(nodes: readonly { id: string; requires: string | null }[]): TreeLayout {
  const ids = new Set(nodes.map((n) => n.id));
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const n of nodes) {
    if (n.requires === null || !ids.has(n.requires) || n.requires === n.id) roots.push(n.id);
    else children.set(n.requires, [...(children.get(n.requires) ?? []), n.id]);
  }
  interface Placed { id: string; parent: string | null; x: number; depth: number }
  const seen = new Set<string>();
  // Lays out one subtree from its left slot; returns its width in slots (leaves side by side).
  const place = (id: string, parent: string | null, depth: number, left: number, out: Placed[]): number => {
    seen.add(id);
    const kids = (children.get(id) ?? []).filter((k) => !seen.has(k));
    if (kids.length === 0) {
      out.push({ id, parent, x: left + 0.5, depth });
      return 1;
    }
    const mine: Placed = { id, parent, x: 0, depth };
    out.push(mine);
    let width = 0;
    const xs: number[] = [];
    for (const k of kids) {
      const before = out.length;
      width += place(k, id, depth + 1, left + width, out);
      xs.push(out[before].x);
    }
    mine.x = (xs[0] + xs[xs.length - 1]) / 2;
    return width;
  };
  const trees: { placed: Placed[]; width: number; depth: number }[] = [];
  const tree = (root: string): void => {
    const placed: Placed[] = [];
    const width = place(root, null, 0, 0, placed);
    trees.push({ placed, width, depth: Math.max(...placed.map((p) => p.depth)) + 1 });
  };
  roots.forEach(tree);
  // A requires-cycle has no root: its first node in the list becomes one.
  for (const n of nodes) if (!seen.has(n.id)) tree(n.id);
  const width = Math.max(0, ...trees.map((t) => t.width));
  const spots: TreeSpot[] = [];
  let top = 0;
  for (const t of trees) {
    const shift = (width - t.width) / 2; // a narrower tree centers under the widest
    for (const p of t.placed) spots.push({ id: p.id, parent: p.parent, x: p.x + shift, y: top + p.depth });
    top += t.depth + TREE_GAP;
  }
  const order = new Map(nodes.map((n, i) => [n.id, i]));
  spots.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return { spots, width, height: trees.length ? top - TREE_GAP : 0 };
}
