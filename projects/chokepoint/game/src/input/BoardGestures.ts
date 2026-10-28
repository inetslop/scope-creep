import Phaser from 'phaser';
import { TAP_SLOP } from '../config';
import type { Point } from '../core/path';
import type { Board } from '../systems/Board';
import { pointerCss } from '../ui/display';

/** What the gestures do besides moving the board. */
export interface GestureHandlers {
  /** A press that barely moved: build, place, select (see systems/Building.ts). */
  tap(pointer: Phaser.Input.Pointer): void;
  /** The mouse moved with no button down (desktop hover preview). */
  hover(pointer: Phaser.Input.Pointer): void;
  /** A press turned into a drag or a pinch. */
  dragStart(): void;
}

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Turns pointers on the board into gestures: a press that moves less than TAP_SLOP is a tap; more
 * drags the board; two fingers pinch-zoom it around their midpoint; the mouse wheel zooms around
 * the cursor. All positions in CSS pixels. Listeners live on the scene's input plugin, so they go
 * with the scene.
 */
export class BoardGestures {
  /** Screen positions of the pointers held down on the board, by pointer id. */
  private readonly downs = new Map<number, Point>();
  private start: Point = { x: 0, y: 0 };
  private last: Point = { x: 0, y: 0 };
  /** This press became a drag or a pinch, so letting go is not a tap. */
  private moved = false;
  private pinch: { dist: number; zoom: number; mid: Point } | undefined;
  private readonly scene: Phaser.Scene;
  private readonly board: Board;
  private readonly handlers: GestureHandlers;

  constructor(scene: Phaser.Scene, board: Board, handlers: GestureHandlers) {
    this.scene = scene;
    this.board = board;
    this.handlers = handlers;
    const input = scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    input.on('pointerup', (p: Phaser.Input.Pointer) => this.release(p, true));
    input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.release(p, false));
    input.on('wheel', (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      const at = pointerCss(p);
      this.board.zoomAt(at.x, at.y, this.board.zoom * Math.exp(-dy * 0.0015));
    });
  }

  /** A press released over a HUD button never reaches this scene: forget pointers that are up. */
  private prune(): void {
    for (const id of [...this.downs.keys()]) if (!this.scene.input.manager.pointers.find((q) => q.id === id)?.isDown) this.downs.delete(id);
  }

  private pair(): [Point, Point] | undefined {
    const [a, b] = [...this.downs.values()];
    return a && b ? [a, b] : undefined;
  }

  private down(p: Phaser.Input.Pointer): void {
    this.prune();
    const at = pointerCss(p);
    this.downs.set(p.id, at);
    if (this.downs.size === 1) {
      this.start = this.last = at;
      this.moved = false;
      this.pinch = undefined;
    }
    const two = this.pair();
    if (two) {
      this.startDrag();
      this.pinch = { dist: Math.max(1, Phaser.Math.Distance.BetweenPoints(two[0], two[1])), zoom: this.board.zoom, mid: midpoint(two[0], two[1]) };
    }
  }

  private move(p: Phaser.Input.Pointer): void {
    if (!this.downs.has(p.id)) {
      if (!p.wasTouch && !p.isDown) this.handlers.hover(p);
      return;
    }
    const at = pointerCss(p);
    this.downs.set(p.id, at);
    const two = this.pair();
    if (two && this.pinch) {
      const mid = midpoint(two[0], two[1]);
      const dist = Math.max(1, Phaser.Math.Distance.BetweenPoints(two[0], two[1]));
      this.board.panBy(mid.x - this.pinch.mid.x, mid.y - this.pinch.mid.y);
      this.board.zoomAt(mid.x, mid.y, this.pinch.zoom * (dist / this.pinch.dist));
      this.pinch.mid = mid;
      return;
    }
    if (!this.moved && Phaser.Math.Distance.BetweenPoints(this.start, at) > TAP_SLOP) this.startDrag();
    if (this.moved) this.board.panBy(at.x - this.last.x, at.y - this.last.y);
    this.last = at;
  }

  private startDrag(): void {
    if (this.moved) return;
    this.moved = true;
    this.handlers.dragStart();
  }

  private release(p: Phaser.Input.Pointer, tap: boolean): void {
    const wasTap = tap && this.downs.size === 1 && this.downs.has(p.id) && !this.moved;
    this.downs.delete(p.id);
    // Lifting one finger of a pinch: the other one drags on from where it is, without a jump.
    const rest = [...this.downs.values()][0];
    if (rest) this.last = rest;
    this.pinch = undefined;
    if (wasTap) this.handlers.tap(p);
  }
}
