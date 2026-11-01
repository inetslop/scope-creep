import type Phaser from 'phaser';
import { CELL } from '../../config';
import { PALETTE } from '../../content/palette';
import { placeConfirmButtons } from '../../core/placeConfirm';
import type { GameScene } from '../../scenes/GameScene';
import { viewSize } from '../display';
import { makeButton, type Button } from '../button';
import type { HudPart } from './hud';

/** Where the ✓/✗ buttons sit on screen (CSS pixels, radius in), shared with the tap skip (scenes/GameScene.ts). */
export interface PlaceButtonsOnScreen {
  cancel: { x: number; y: number; r: number };
  confirm: { x: number; y: number; r: number };
}

/**
 * The touch placement's ✓/✗ buttons beside the waiting cell: the first tap on an empty cell only
 * previews the tower (systems/Building.ts pendingCell); ✓ builds it there, ✗ cancels. They follow
 * the cell every frame — a drag or zoom moves it — and their screen circles are published in the
 * scene registry as `placeButtons`, so a tap on them never reaches the board.
 */
export class PlaceConfirm implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly confirm: Button;
  private readonly cancel: Button;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.scene = scene;
    const size = 56;
    this.confirm = makeButton(scene, 0, 0, '', () => game.building.confirmPending(), { width: size, height: size, radius: size / 2, fill: PALETTE.ink });
    this.cancel = makeButton(scene, 0, 0, '', () => game.building.cancelPending(), { width: size, height: size, radius: size / 2 });
    const check = scene.add.graphics();
    check.lineStyle(5, PALETTE.card, 1);
    check.beginPath();
    check.moveTo(-10, 2);
    check.lineTo(-3, 9);
    check.lineTo(11, -8);
    check.strokePath();
    this.confirm.content.add(check);
    const cross = scene.add.graphics();
    cross.lineStyle(5, PALETTE.ink, 1);
    cross.beginPath();
    cross.moveTo(-8, -8);
    cross.lineTo(8, 8);
    cross.strokePath();
    cross.beginPath();
    cross.moveTo(-8, 8);
    cross.lineTo(8, -8);
    cross.strokePath();
    this.cancel.content.add(cross);
    this.confirm.container.setVisible(false);
    this.cancel.container.setVisible(false);
  }

  layout(): void {} // the row re-fits to the waiting cell every frame

  update(game: GameScene): void {
    const cell = game.building.pendingCell;
    if (!cell) {
      this.confirm.container.setVisible(false);
      this.cancel.container.setVisible(false);
      this.scene.registry.set('placeButtons', undefined);
      return;
    }
    const board = game.board;
    const c = board.toScreen(board.centerOf(cell));
    // Screen px per board unit at the current zoom (the sellTower trick, systems/Building.ts).
    const px = board.toScreen({ x: 1, y: 0 }).x - board.toScreen({ x: 0, y: 0 }).x;
    const side = CELL * px;
    const b = placeConfirmButtons({ x: c.x - side / 2, y: c.y - side / 2, width: side, height: side }, viewSize(this.scene), 56);
    this.confirm.container.setVisible(true).setPosition(b.confirm.x, b.confirm.y);
    this.cancel.container.setVisible(true).setPosition(b.cancel.x, b.cancel.y);
    this.scene.registry.set('placeButtons', { cancel: { x: b.cancel.x, y: b.cancel.y, r: 28 }, confirm: { x: b.confirm.x, y: b.confirm.y, r: 28 } });
  }
}
