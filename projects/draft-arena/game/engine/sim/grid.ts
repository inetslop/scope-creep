/** Uniform spatial hash: rebuilt every tick, queried for "what is near this point". */
export class Grid<T extends { x: number; y: number }> {
  private readonly size: number;
  private readonly cells = new Map<number, T[]>();
  private readonly used: T[][] = [];

  constructor(cellSize: number) {
    this.size = cellSize;
  }

  private static key(cx: number, cy: number): number {
    return (cx + 1024) * 8192 + (cy + 1024);
  }

  clear(): void {
    for (const cell of this.used) cell.length = 0;
    this.used.length = 0;
  }

  insert(item: T): void {
    const key = Grid.key(Math.floor(item.x / this.size), Math.floor(item.y / this.size));
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    if (cell.length === 0) this.used.push(cell);
    cell.push(item);
  }

  /**
   * Calls fn for every item in the cells a circle touches. Items may be up to a cell outside the
   * circle: check the distance yourself. Return true from fn to stop.
   */
  each(x: number, y: number, radius: number, fn: (item: T) => boolean | void): void {
    const x0 = Math.floor((x - radius) / this.size);
    const x1 = Math.floor((x + radius) / this.size);
    const y0 = Math.floor((y - radius) / this.size);
    const y1 = Math.floor((y + radius) / this.size);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const cell = this.cells.get(Grid.key(cx, cy));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) if (fn(cell[i]!) === true) return;
      }
    }
  }
}
