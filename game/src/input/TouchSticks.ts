import Phaser from 'phaser';
import { clampLength, scale, sub, type Vec2 } from '../core/vec';

export interface StickState {
  active: boolean;
  pointerId: number;
  /** Screen position where the thumb landed (the stick base follows if the thumb drags too far). */
  origin: Vec2;
  /** Current thumb position in screen space. */
  thumb: Vec2;
  /** Stick deflection, length 0..1. */
  value: Vec2;
}

const idle = (): StickState => ({ active: false, pointerId: -1, origin: { x: 0, y: 0 }, thumb: { x: 0, y: 0 }, value: { x: 0, y: 0 } });

/**
 * Floating twin sticks for touch screens. A touch on the left half of the screen
 * becomes the move stick, a touch on the right half the aim/fire stick.
 * Only handles state; HudScene draws the sticks.
 */
export class TouchSticks {
  readonly left: StickState = idle();
  readonly right: StickState = idle();
  /** Max thumb distance from the base, in screen pixels. */
  radius = 64;
  /** Touches starting in this top band are ignored (HUD buttons live there). */
  ignoreTopPx = 72;
  /** True once any touch has been seen; used to show stick hints. */
  everTouched = false;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.addPointer(2);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  reset(): void {
    Object.assign(this.left, idle());
    Object.assign(this.right, idle());
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!p.wasTouch || p.y < this.ignoreTopPx) return;
    this.everTouched = true;
    const stick = p.x < this.scene.scale.width / 2 ? this.left : this.right;
    if (stick.active) return;
    stick.active = true;
    stick.pointerId = p.id;
    stick.origin = { x: p.x, y: p.y };
    stick.thumb = { x: p.x, y: p.y };
    stick.value = { x: 0, y: 0 };
  }

  private onMove(p: Phaser.Input.Pointer): void {
    const stick = this.stickFor(p);
    if (!stick) return;
    stick.thumb = { x: p.x, y: p.y };
    let offset = sub(stick.thumb, stick.origin);
    const dist = Math.hypot(offset.x, offset.y);
    if (dist > this.radius) {
      // Drag the base along so the stick never "sticks" at the edge.
      const excess = scale(offset, (dist - this.radius) / dist);
      stick.origin = { x: stick.origin.x + excess.x, y: stick.origin.y + excess.y };
      offset = sub(stick.thumb, stick.origin);
    }
    stick.value = clampLength(scale(offset, 1 / this.radius), 1);
  }

  private onUp(p: Phaser.Input.Pointer): void {
    const stick = this.stickFor(p);
    if (stick) Object.assign(stick, idle());
  }

  private stickFor(p: Phaser.Input.Pointer): StickState | undefined {
    if (this.left.active && this.left.pointerId === p.id) return this.left;
    if (this.right.active && this.right.pointerId === p.id) return this.right;
    return undefined;
  }

  private destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
  }
}
