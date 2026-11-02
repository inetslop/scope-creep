import { describe, expect, it } from 'vitest';
import { CELL, START } from '../../src/config';
import { slotCost, towerSpec } from '../../src/core/augments';
import { RunState } from '../../src/core/run';
import type { AugmentCopy } from '../../src/content/types';
import type { Cell } from '../../src/core/map';
import type { Tower } from '../../src/entities/Tower';
import type { Sfx } from '../../src/audio/Sfx';
import type { Board } from '../../src/systems/Board';
import { Building } from '../../src/systems/Building';
import type { FxSystem } from '../../src/systems/FxSystem';
import type { TowerGhost } from '../../src/systems/towerGhost';
import type { TowerSystem } from '../../src/systems/TowerSystem';

/** A 2x2 board where (0,1) is a rock: what a tap does on touch (a waiting placement the ✓/✗
 * buttons finish) and on mouse (a build at once, as before). */
function makeFixture(gold: number = START.gold) {
  const run = new RunState(1);
  run.startBuild(8);
  run.gold = gold;
  run.takeAugment({ id: 'lance', tier: 'common' });
  run.takeAugment({ id: 'bolt', tier: 'common' });
  interface FakeTower { cell: Cell; augments: AugmentCopy[]; freeSlots: number }
  const built: [Cell, AugmentCopy][] = [];
  const hovers: [Cell | undefined, boolean, number][] = [];
  const pops: string[] = [];
  const sounds: string[] = [];
  let tower: FakeTower | undefined;
  const board = {
    cellAt: (x: number, y: number): Cell | undefined => {
      const col = Math.floor(x / CELL), row = Math.floor(y / CELL);
      return col >= 0 && col < 2 && row >= 0 && row < 2 ? { col, row } : undefined;
    },
    towerAt: (c: Cell): Tower | undefined => (tower && tower.cell.col === c.col && tower.cell.row === c.row ? (tower as unknown as Tower) : undefined),
    canBuild: (c: Cell): boolean => !(c.col === 0 && c.row === 1) && !board.towerAt(c), // (0,1) is a rock
    showHover: (cell: Cell | undefined, ok: boolean, range: number): void => { hovers.push([cell, ok, range]); },
    centerOf: (c: Cell) => ({ x: c.col * CELL + CELL / 2, y: c.row * CELL + CELL / 2 }),
  };
  const towersFake = {
    towers: [] as Tower[],
    build: (cell: Cell, copy: AugmentCopy): Tower | 'blocked' | 'gold' => {
      if (!board.canBuild(cell)) return 'blocked';
      if (!run.spend(slotCost(0)!)) return 'gold';
      tower = { cell, augments: [copy], freeSlots: 3 };
      built.push([cell, copy]);
      towersFake.towers.push(tower as unknown as Tower);
      return tower as unknown as Tower;
    },
    place: (t: Tower, copy: AugmentCopy): true | 'full' => {
      const fake = t as unknown as FakeTower;
      if (fake.freeSlots <= 0) return 'full';
      fake.augments.push(copy);
      fake.freeSlots -= 1;
      return true;
    },
    rangeOf: (): number => 100,
  };
  const building = new Building(
    run,
    board as unknown as Board,
    towersFake as unknown as TowerSystem,
    { popText: (_x: number, _y: number, text: string): void => { pops.push(text); }, track: () => {}, full: false } as unknown as FxSystem,
    { deny: (): void => { sounds.push('deny'); } } as unknown as Sfx,
    { towers: [], clearAll: () => {}, show: () => {}, clear: () => {} } as unknown as TowerGhost,
    0,
  );
  const tapAt = (col: number, row: number, wasTouch: boolean): void => building.tap(col * CELL + CELL / 2, row * CELL + CELL / 2, wasTouch);
  return { run, building, built, hovers, pops, sounds, tower: () => (tower as unknown as Tower | undefined), tapAt };
}

describe('Building.tap on touch: the first tap waits, the buttons decide', () => {
  it('a first tap on an empty cell previews the tower and spends nothing', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    expect(f.built).toEqual([]);
    expect(f.run.gold).toBe(START.gold);
    expect(f.building.pendingCell).toEqual({ col: 0, row: 0 });
    expect(f.hovers.at(-1)).toEqual([{ col: 0, row: 0 }, true, towerSpec([{ id: 'lance', tier: 'common' }]).range * CELL]);
  });

  it('confirmPending builds there: the gold is paid, the card leaves, the panel opens, nothing waits', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.building.confirmPending();
    expect(f.built).toEqual([[{ col: 0, row: 0 }, { id: 'lance', tier: 'common' }]]);
    expect(f.run.gold).toBe(START.gold - slotCost(0)!);
    expect(f.run.hand.length).toBe(1);
    expect(f.building.selectedTower).toBe(f.tower());
    expect(f.building.pendingCell).toBeUndefined();
  });

  it('cancelPending drops the preview with nothing changed', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.building.cancelPending();
    expect(f.building.pendingCell).toBeUndefined();
    expect(f.hovers.at(-1)).toEqual([undefined, false, 0]);
    expect(f.run.gold).toBe(START.gold);
    expect(f.run.hand.length).toBe(2);
    expect(f.built).toEqual([]);
  });

  it('a tap on another empty cell moves the preview; a tap on the same cell keeps it', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.tapAt(1, 0, true);
    expect(f.building.pendingCell).toEqual({ col: 1, row: 0 });
    f.tapAt(1, 0, true);
    expect(f.building.pendingCell).toEqual({ col: 1, row: 0 });
    expect(f.built).toEqual([]);
  });

  it('a tap on a rock while waiting: the deny plays, the wait stays where it was', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.tapAt(0, 1, true);
    expect(f.building.pendingCell).toEqual({ col: 0, row: 0 });
    expect(f.sounds).toContain('deny');
    expect(f.built).toEqual([]);
  });

  it('a cell the gold cannot cover: the hint plays, no placement starts', () => {
    const f = makeFixture(30); // less than slotCost(0)
    f.tapAt(0, 0, true);
    expect(f.building.pendingCell).toBeUndefined();
    expect(f.pops).toContain(`Need ${slotCost(0)} gold`);
    expect(f.sounds).toContain('deny');
  });

  it('a tap on a tower ends the waiting placement, then does what it does today', () => {
    const f = makeFixture();
    f.tapAt(0, 0, false); // the mouse builds at once
    f.tapAt(1, 0, true);
    expect(f.building.pendingCell).toEqual({ col: 1, row: 0 });
    f.tapAt(0, 0, true);
    expect(f.building.pendingCell).toBeUndefined();
    expect(f.building.selectedTower).toBe(f.tower());
  });

  it('a touch tap off the board cancels the waiting placement', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.building.tap(-10, -10, true);
    expect(f.building.pendingCell).toBeUndefined();
  });

  it('picking another card redraws the preview for the same cell', () => {
    const f = makeFixture();
    f.tapAt(0, 0, true);
    f.building.pickCard(1);
    expect(f.building.pendingCell).toEqual({ col: 0, row: 0 });
    expect(f.hovers.at(-1)).toEqual([{ col: 0, row: 0 }, true, towerSpec([{ id: 'bolt', tier: 'common' }]).range * CELL]);
  });

  it('a mouse tap still builds at once, with nothing waiting', () => {
    const f = makeFixture();
    f.tapAt(0, 0, false);
    expect(f.building.pendingCell).toBeUndefined();
    expect(f.built).toHaveLength(1);
    expect(f.run.gold).toBe(START.gold - slotCost(0)!);
  });
});
