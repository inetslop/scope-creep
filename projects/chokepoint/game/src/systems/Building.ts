import { CELL } from '../config';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { slotCost, towerSpec } from '../core/augments';
import { cellsBesidePath, type Cell } from '../core/map';
import type { Point } from '../core/path';
import type { RunState } from '../core/run';
import type { Tower } from '../entities/Tower';
import type { Sfx } from '../audio/Sfx';
import type { Board } from './Board';
import type { FxSystem } from './FxSystem';
import { goldCoin } from './fx/goldCoin';
import { TowerGhost } from './towerGhost';
import type { TowerSystem } from './TowerSystem';

/**
 * The player's building: which hand card is selected, which tower's panel is open, and what a
 * tap on the board does with them. Augments wait in the run's hand until they go into a tower:
 * tap a card, then an empty cell (a new tower with it) or a tower with a free slot. The HUD reads
 * the selection and redraws when `uiVersion` changes.
 */
export class Building {
  /** Hand index of the augment a tap on the board places, if any. */
  selectedAugment: number | undefined;
  /** The tower whose panel is open (ui/hud/TowerPanel.ts), if any. */
  selectedTower: Tower | undefined;
  /** Bumped whenever the hand, a tower's slots or a selection changes, so the HUD redraws them. */
  uiVersion = 0;
  /** The tower the pointer is over (desktop hover; a tap is also a pointer position). */
  private pointerTower: Tower | undefined;
  /** A desktop hover has happened; touch never does, so every free tower shows the ghost. */
  private hoverSeen = false;

  constructor(
    private readonly run: RunState,
    private readonly board: Board,
    private readonly towers: TowerSystem,
    private readonly fx: FxSystem,
    private readonly sfx: Sfx | undefined,
    private readonly ghost: TowerGhost,
  ) {
    this.selectedAugment = run.hand.length > 0 ? 0 : undefined;
  }

  /** The augment copy the selected card holds. */
  get heldCopy(): AugmentCopy | undefined {
    return this.selectedAugment === undefined ? undefined : this.run.hand[this.selectedAugment];
  }

  /**
   * A tap on the board at a board point:
   * - a tower: with a card held and a free slot, put the augment in; either way open its panel;
   * - an empty cell with a card held: build a tower with that augment (pays the first slot);
   * - an empty cell with nothing held: close the panel.
   */
  tap(x: number, y: number): void {
    if (this.run.phase === 'over' || this.run.phase === 'draft') return;
    const cell = this.board.cellAt(x, y);
    if (!cell) return;
    this.pointerTower = this.board.towerAt(cell); // a tap is also a pointer position
    this.board.showHover(undefined, false, 0);
    const held = this.heldCopy;
    const tower = this.board.towerAt(cell);
    if (tower) {
      if (held && tower.freeSlots > 0) this.placeHeld(tower);
      this.selectTower(tower);
      return;
    }
    if (!held) {
      this.closePanel();
      if (this.run.hand.length === 0) this.hint(cell, 'New augment after each wave');
      return;
    }
    const result = this.towers.build(cell, held);
    if (typeof result === 'string') {
      if (result === 'gold') this.hint(cell, `Need ${slotCost(0)} gold`, PALETTE.red);
      else this.sfx?.deny();
      return;
    }
    this.run.useAugment(this.selectedAugment!);
    this.afterHandChange();
    this.selectTower(result);
  }

  /**
   * Desktop hover preview for the held augment at a board point (undefined: off the play area):
   * on an empty cell, a new tower with it and its range; on a tower with a free slot, that tower's
   * range with it added.
   */
  hover(x: number | undefined, y: number): void {
    const cell = x === undefined ? undefined : this.board.cellAt(x, y);
    const held = this.heldCopy;
    const tower = cell ? this.board.towerAt(cell) : undefined;
    this.pointerTower = tower;
    this.hoverSeen = true;
    this.refreshGhosts(); // one call covers every return below
    if (!cell || !held) {
      this.board.showHover(cell && !tower && this.board.canBuild(cell) ? cell : undefined, false, 0);
      return;
    }
    const augments = [...(tower?.augments ?? []), held];
    const ok = tower ? tower.freeSlots > 0 : this.board.canBuild(cell) && this.run.canAfford(slotCost(0)!);
    this.board.showHover(cell, ok, ok ? towerSpec(augments).range * CELL : 0);
  }

  /** A drag began: the pointer is on nothing, so the ghost goes with it. */
  dragStarted(): void {
    this.pointerTower = undefined;
    this.refreshGhosts();
  }

  /**
   * A hand card was tapped (or its key pressed). With a tower panel open on a tower with a free
   * slot, the augment goes straight in; otherwise the card is selected.
   */
  pickCard(index: number): void {
    if (index < 0 || index >= this.run.hand.length || this.run.phase === 'over') return;
    const tower = this.selectedTower;
    this.selectedAugment = index;
    this.refreshGhosts();
    if (tower && tower.freeSlots > 0) this.placeHeld(tower);
    this.uiVersion += 1;
  }

  /** Opens the panel of `tower` and shows its range. */
  selectTower(tower: Tower): void {
    this.selectedTower = tower;
    this.board.showRange(tower, this.towers.rangeOf(tower));
    this.uiVersion += 1;
  }

  closePanel(): void {
    if (!this.selectedTower) return;
    this.selectedTower = undefined;
    this.board.showRange(undefined, 0);
    this.uiVersion += 1;
  }

  /** The panel's unlock button: buys the open tower's next slot, and puts the held augment in it. */
  unlockSlot(): void {
    const tower = this.selectedTower;
    if (!tower) return;
    const result = this.towers.unlockSlot(tower);
    if (result === 'gold') this.hint(tower.cell, `Need ${this.towers.nextSlotCost(tower)} gold`, PALETTE.red);
    if (result === true && this.heldCopy) this.placeHeld(tower);
    this.selectTower(tower);
    this.refreshGhosts();
  }

  /**
   * The panel's "Sell · +N" line (build phase only): the tower lifts out of the board, its cell
   * frees, and the gold pays at the plinth — the pop, and one coin to the stats gold. The
   * augments are gone (a refund, not a retrieve), and the panel closes.
   */
  sellTower(): void {
    const tower = this.selectedTower;
    if (!tower || this.run.phase !== 'build') return;
    const paid = this.towers.sell(tower);
    const c = this.board.centerOf(tower.cell);
    this.fx.popText(c.x, c.y - 20, `+${paid}`);
    // One coin to the stats card's gold number, the kill coin's size at the current zoom.
    const spot = this.fx.scene.registry.get('statsGold') as Point | undefined;
    if (spot) {
      const px = this.board.toScreen({ x: 1, y: 0 }).x - this.board.toScreen({ x: 0, y: 0 }).x;
      goldCoin(this.fx, { x: c.x, y: c.y - 20 }, this.board.toBoard(spot), 10 / px, 24 / px);
    }
    this.sfx?.coinBlip();
    this.pointerTower = undefined;
    this.closePanel();
    this.refreshGhosts();
  }

  /** The draft put a new card in the hand: select it if nothing is selected. */
  cardAdded(): void {
    if (this.selectedAugment === undefined && this.run.hand.length > 0) this.selectedAugment = this.run.hand.length - 1;
    this.uiVersion += 1;
    this.refreshGhosts();
  }

  /**
   * ?smoke: the taps are random, so the first tower is built on its own: the held card on the
   * first open cell beside the road, nearest the entrance (the wave's first enemies pass it).
   */
  autoBuild(): void {
    if (this.towers.towers.length > 0) return;
    const held = this.heldCopy;
    if (!held) return;
    const cell = cellsBesidePath(this.board.map).find((c) => this.board.canBuild(c));
    if (!cell) return;
    const result = this.towers.build(cell, held);
    if (typeof result === 'string') return;
    this.run.useAugment(this.selectedAugment!);
    this.afterHandChange();
  }

  /** Invariant: the selected card exists. */
  brokenSelection(): string | undefined {
    const i = this.selectedAugment;
    return i !== undefined && i >= this.run.hand.length ? `selected card ${i} of ${this.run.hand.length}` : undefined;
  }

  /** Puts the held augment copy into `tower`'s free slot. */
  private placeHeld(tower: Tower): void {
    const held = this.heldCopy;
    if (!held || this.towers.place(tower, held) !== true) return;
    this.run.useAugment(this.selectedAugment!);
    this.afterHandChange();
  }

  /** After a card left the hand: keep a card selected if there is one, so the next tap places it. */
  private afterHandChange(): void {
    const n = this.run.hand.length;
    this.selectedAugment = n === 0 ? undefined : Math.min(this.selectedAugment ?? 0, n - 1);
    this.uiVersion += 1;
    this.refreshGhosts(); // every commit funnels here, so this also clears the ghosts
  }

  /**
   * Which towers show the what-if ghost for the held card: on desktop the one under the pointer,
   * on touch (no hover) every tower with a free slot. Full towers never show one.
   */
  private refreshGhosts(): void {
    const held = this.heldCopy;
    if (!held || this.run.phase === 'over') { this.ghost.clearAll(); return; }
    const targets = this.hoverSeen
      ? (this.pointerTower && this.pointerTower.freeSlots > 0 ? [this.pointerTower] : [])
      : this.towers.towers.filter((t) => t.freeSlots > 0);
    for (const t of this.ghost.towers) if (!targets.includes(t)) this.ghost.clear(t);
    for (const t of targets) this.ghost.show(t, held);
  }

  private hint(cell: Cell, text: string, color: number = PALETTE.muted): void {
    const c = this.board.centerOf(cell);
    this.fx.popText(c.x, c.y, text, color);
    this.sfx?.deny();
  }
}
