---
id: T0140
title: "The board shows its corners: a notch on the bend cells"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T11:23:58Z
---

## Goal
The build cells that touch a bend of the road carry a small notch, so a first-time player sees which cells are worth more before the first placement (pillar 1: the board, not a tutorial, teaches where to build).

## Details
- A build cell that touches a bend of the road (a buildable cell beside a point where the road changes direction) carries one small notch on its face — a flat muted-ink tick in the cell's surface (the name tag's muted-ink color, T0085), not a floating chip.
- The notch is static: it is painted with the board when the board is grown (the board's own paint, alongside the road and the rocks), not a per-frame effect; it never moves, fades, or animates.
- No rule change: the notch is purely informational — it does not change a cell's value, its gold, or whether it can be built on.
- Closest example is the board's rock paint (static shapes drawn with the board); this adds a small notch to the face of each bend-adjacent build cell. The bends are the path's direction changes, already part of the board's geometry.

## Acceptance criteria
- [ ] On a new board, every build cell that touches a bend of the road shows one small muted notch on its face; cells beside straight stretches show no notch.
- [ ] The notch is static (painted with the board, no animation) and does not change a cell's value, gold, or buildability.
- [ ] The rest of the board looks the same (the road, the rocks, the cell shapes) — only the bend-adjacent cells gain the notch.
- [ ] No new sound, key, button, or pause-screen line.

## Design (architect, narcissus)

### Files
- edit `src/art/board.ts` - in `paintBoard`, add one block after the road stroke (after its `ctx.restore()`, before the `// Gates:` comment): compute each bend of the road and paint one flat muted tick on every open (buildable) cell touching it. Also change the existing `import type { GameMap } from '../core/map';` to `import { kindAt, type GameMap } from '../core/map';`. No other file changes: `paintBoard` already receives `map`, the texture is repainted every run, and Board just shows it.

### Interfaces
No new or changed signatures. Everything stays inside the existing `paintTexture` draw callback in board units (the painter draws at board-unit coordinates; `paintTexture` applies the 3x scale itself).

### Steps
1. In `src/art/board.ts`, after the road block's `ctx.restore();` (currently line 70) insert exactly:
```ts
    // Bend notches: one flat muted tick on every build cell that touches a bend of the road.
    const notched = new Set<string>();
    ctx.fillStyle = rgba(PALETTE.muted, 1);
    for (let i = 1; i < map.path.length - 1; i++) {
      const a = map.path[i - 1]!, b = map.path[i]!, c = map.path[i + 1]!;
      if (b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row) continue; // straight, no bend
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const col = b.col + dc, row = b.row + dr;
          if (kindAt(map, col, row) !== 'open') continue; // path, rock or off-board: no build cell
          const key = `${col},${row}`;
          if (notched.has(key)) continue;
          notched.add(key);
          const nx = Math.sign(dc), ny = Math.sign(dr);
          const len = Math.hypot(nx, ny); // 1 or sqrt(2), never 0 (dc/dr both 0 is the path cell)
          const px = (col + 0.5) * CELL + (nx / len) * CELL * 0.38;
          const py = (row + 0.5) * CELL + (ny / len) * CELL * 0.38;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.atan2(ny, nx));
          roundRectPath(ctx, -CELL * 0.06, -CELL * 0.15, CELL * 0.12, CELL * 0.3, CELL * 0.06);
          ctx.fill();
          ctx.restore();
        }
      }
    }
```
(`roundRectPath`, `rgba`, `PALETTE`, `CELL` are already imported in this file; only `kindAt` is new.)
2. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The tick's long axis must stay perpendicular to the cell→bend direction: after `rotate(Math.atan2(ny, nx))` the local x-axis points at the bend, so the pill's width goes on x (`CELL*0.12`) and its length on y (`CELL*0.3`). If you swap them the tick lies across the corner and looks like a slash.
- Draw order: keep the block after the road and before the gates, and set `ctx.fillStyle` inside it — the block must not rely on (or change for others) surrounding fillStyle state.
- One notch per cell: two bends can both touch one cell; the `notched` Set keeps exactly one tick there. Never remove anything from other painters' output — this only adds fills.
- Do not add a notch on the bend cell itself, path cells or rocks — that is exactly what `kindAt(...) !== 'open'` filters out.

### Tests
- none (pure board paint, no rule change).
