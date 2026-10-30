import type Phaser from 'phaser';
import { CELL, DEPTH, HUD, ZOOM } from '../config';
import { PALETTE } from '../content/palette';
import { BOARD_MARGIN, paintBoard } from '../art/board';
import { artScale } from '../art/textures';
import { kindAt, type Cell, type GameMap } from '../core/map';
import { cellCenter, pathLineFor, type PathLine, type Point } from '../core/path';
import { display } from '../ui/display';
import { clampView, fitView, panBy, scaleOf, toBoard, toScreen, zoomAt, type View, type ViewArea } from '../core/view';
import type { Tower } from '../entities/Tower';

/**
 * The board: the map's cells, which cells hold towers, and the camera. The camera fits the board
 * between the HUD bars and the player can zoom in (up to ZOOM.max) and drag it around; the view
 * math is in core/view.ts. Board units are world units (one cell = CELL), so input uses
 * pointer.worldX/worldY (or toBoard() for a screen point).
 */
export class Board {
  readonly map: GameMap;
  readonly path: PathLine;
  /** Board size in board units. */
  readonly width: number;
  readonly height: number;
  private readonly scene: Phaser.Scene;
  private readonly towers: (Tower | undefined)[][];
  private readonly hover: Phaser.GameObjects.Graphics;
  private readonly range: Phaser.GameObjects.Graphics;
  private area: ViewArea = { x: 0, y: 0, width: 1, height: 1 };
  private view: View = { fit: 1, zoom: 1, focus: { x: 0, y: 0 } };
  private everLaidOut = false;
  /** The screen in CSS pixels (as of the last layout). */
  private screen = { width: 1, height: 1 };

  constructor(scene: Phaser.Scene, map: GameMap) {
    this.scene = scene;
    this.map = map;
    this.path = pathLineFor(map, CELL);
    this.width = map.cols * CELL;
    this.height = map.rows * CELL;
    this.towers = Array.from({ length: map.rows }, () => Array.from({ length: map.cols }, () => undefined));
    this.drawCells();
    this.hover = scene.add.graphics().setDepth(DEPTH.preview);
    this.range = scene.add.graphics().setDepth(DEPTH.preview);
  }

  /** The painted board (art/textures.ts paintBoard): island, grid dots, rocks, road, gates. */
  private drawCells(): void {
    const key = paintBoard(this.scene, Board.TEXTURE, this.map, this.path);
    artScale(this.scene.add.image(-BOARD_MARGIN, -BOARD_MARGIN, key).setOrigin(0).setDepth(DEPTH.board));
  }

  /** Texture key of the current run's board (repainted every run). */
  static readonly TEXTURE = 'board';

  /** Fits the board between the HUD bars, keeping the player's zoom. Call on create and on every resize. */
  layout(width: number, height: number): void {
    this.screen = { width, height };
    this.area = {
      x: HUD.margin,
      y: HUD.top + HUD.margin,
      width: Math.max(1, width - HUD.margin * 2),
      height: Math.max(1, height - HUD.top - HUD.bottom - HUD.margin * 2),
    };
    const fitted = fitView(this.area, this);
    this.view = this.everLaidOut ? { ...this.view, fit: fitted.fit } : fitted;
    this.everLaidOut = true;
    this.apply();
  }

  /** Current zoom as a multiple of the fit zoom (1 = the whole board fits). */
  get zoom(): number {
    return this.view.zoom;
  }

  /** Zooms to `zoom` (a multiple of the fit zoom, clamped to ZOOM) around a screen point. */
  zoomAt(screenX: number, screenY: number, zoom: number): void {
    this.view = zoomAt(this.view, this.area, { x: screenX, y: screenY }, Math.min(ZOOM.max, Math.max(ZOOM.min, zoom)));
    this.apply();
  }

  /** Zooms around the middle of the play area (the + and - buttons and keys). */
  zoomBy(factor: number): void {
    this.zoomAt(this.area.x + this.area.width / 2, this.area.y + this.area.height / 2, this.view.zoom * factor);
  }

  /** The + and - buttons and keys: one step in or out, around the middle of the play area. */
  zoomIn(): void {
    this.zoomBy(ZOOM.step);
  }

  zoomOut(): void {
    this.zoomBy(1 / ZOOM.step);
  }

  /** Back to the whole board. */
  resetZoom(): void {
    this.view = fitView(this.area, this);
    this.apply();
  }

  /** Drags the board by `dx`, `dy` screen pixels. */
  panBy(dx: number, dy: number): void {
    this.view = panBy(this.view, dx, dy);
    this.apply();
  }

  /** Clamps the view and points the camera at it. */
  private apply(): void {
    // 1.5 cells of overscroll, so the edge columns can be zoomed in on and brought toward the middle.
    this.view = clampView(this.view, this.area, this, ZOOM.min, ZOOM.max, CELL * 1.5);
    const cam = this.scene.cameras.main;
    const scale = scaleOf(this.view);
    // The camera centers on the screen middle; the play area's middle is offset by the HUD bars.
    // The view math is in CSS pixels; the canvas is in device pixels (ui/display.ts).
    const screenMid = { x: this.screen.width / 2, y: this.screen.height / 2 };
    const areaMid = { x: this.area.x + this.area.width / 2, y: this.area.y + this.area.height / 2 };
    cam.setZoom(scale * display.ratio);
    cam.centerOn(this.view.focus.x + (screenMid.x - areaMid.x) / scale, this.view.focus.y + (screenMid.y - areaMid.y) / scale);
  }

  /** Screen position (CSS pixels) of a board point. */
  toScreen(p: Point): Point {
    return toScreen(this.view, this.area, p);
  }

  /** Board point under a screen position (CSS pixels). */
  toBoard(p: Point): Point {
    return toBoard(this.view, this.area, p);
  }

  /** The cell under a board point, or undefined off the board. */
  cellAt(x: number, y: number): Cell | undefined {
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    return kindAt(this.map, col, row) ? { col, row } : undefined;
  }

  centerOf(cell: Cell): Point {
    return cellCenter(cell, CELL);
  }

  towerAt(cell: Cell): Tower | undefined {
    return this.towers[cell.row]?.[cell.col];
  }

  canBuild(cell: Cell): boolean {
    return kindAt(this.map, cell.col, cell.row) === 'open' && !this.towerAt(cell);
  }

  /** Puts `tower` on `cell`; `undefined` frees the cell (a sold tower lifts out of it). */
  place(cell: Cell, tower: Tower | undefined): void {
    this.towers[cell.row]![cell.col] = tower;
  }

  /** Desktop hover preview: the cell, and the range the tower would have. */
  showHover(cell: Cell | undefined, ok: boolean, range: number): void {
    this.hover.clear();
    if (!cell) return;
    const color = ok ? PALETTE.teal : PALETTE.red;
    const inset = 5;
    this.hover.fillStyle(color, 0.14);
    this.hover.fillRoundedRect(cell.col * CELL + inset, cell.row * CELL + inset, CELL - inset * 2, CELL - inset * 2, 12);
    this.hover.lineStyle(3, color, 0.9);
    this.hover.strokeRoundedRect(cell.col * CELL + inset, cell.row * CELL + inset, CELL - inset * 2, CELL - inset * 2, 12);
    if (ok && range > 0) {
      const c = this.centerOf(cell);
      this.hover.fillStyle(color, 0.07);
      this.hover.fillCircle(c.x, c.y, range);
      this.hover.lineStyle(2, color, 0.45);
      this.hover.strokeCircle(c.x, c.y, range);
    }
  }

  /** A range ring around a built tower (shown when it is tapped). */
  showRange(p: Point | undefined, range: number): void {
    this.range.clear();
    if (!p) return;
    this.range.fillStyle(PALETTE.ink, 0.06);
    this.range.fillCircle(p.x, p.y, range);
    this.range.lineStyle(2, PALETTE.ink, 0.35);
    this.range.strokeCircle(p.x, p.y, range);
  }
}
