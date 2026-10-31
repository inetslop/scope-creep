/**
 * Keyboard, mouse and touch, read into one input state each frame.
 *   Desktop: WASD or arrows move, the mouse aims, Space is ability A, Esc leaves. (T, the talents, is the HUD's.)
 *   Phone: drag anywhere on the playfield for a floating joystick; aim follows the movement.
 * HUD buttons sit above the canvas and take their own taps, so they never start the joystick.
 */
import type { Joystick } from './render.ts';
import type { InputState } from './session.ts';

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const STICK_RADIUS = 56;

export class Input {
  readonly state: InputState = { moveX: 0, moveY: 0, aim: 0, buttons: 0 };
  /** The last thing used was a touch screen. */
  touch = false;
  joystick: Joystick | undefined;
  onLeave: () => void = () => {};

  private readonly held = new Set<string>();
  private mouse: { x: number; y: number } | undefined;
  private stickId: number | undefined;
  private readonly canvas: HTMLCanvasElement;
  private readonly off: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const on = <K extends keyof WindowEventMap>(target: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void): void => {
      target.addEventListener(type, fn as EventListener);
      this.off.push(() => target.removeEventListener(type, fn as EventListener));
    };
    on(window, 'keydown', (e) => {
      if (isTyping(e)) return;
      if (e.code in MOVE_KEYS || e.code === 'Space') e.preventDefault();
      this.touch = false;
      this.held.add(e.code);
      if (!e.repeat && e.code === 'Escape') this.onLeave();
    });
    on(window, 'keyup', (e) => this.held.delete(e.code));
    on(window, 'blur', () => this.held.clear());
    on(canvas, 'pointerdown', (e) => {
      if (e.pointerType !== 'touch' || this.stickId !== undefined) return;
      this.touch = true;
      this.stickId = e.pointerId;
      this.joystick = { ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    });
    on(canvas, 'pointermove', (e) => {
      if (e.pointerType !== 'touch') {
        this.touch = false;
        this.mouse = { x: e.clientX, y: e.clientY };
        return;
      }
      if (e.pointerId === this.stickId && this.joystick) {
        const dx = e.clientX - this.joystick.ox;
        const dy = e.clientY - this.joystick.oy;
        const d = Math.hypot(dx, dy);
        const k = d > STICK_RADIUS ? STICK_RADIUS / d : 1;
        this.joystick.x = this.joystick.ox + dx * k;
        this.joystick.y = this.joystick.oy + dy * k;
      }
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = undefined;
      this.joystick = undefined;
    };
    on(canvas, 'pointerup', end);
    on(canvas, 'pointercancel', end);
  }

  /** Reads everything into `state`. `player` is your player on screen (CSS pixels), for aiming. */
  sample(player: { x: number; y: number } | undefined): InputState {
    let mx = 0;
    let my = 0;
    if (this.joystick) {
      mx = (this.joystick.x - this.joystick.ox) / STICK_RADIUS;
      my = (this.joystick.y - this.joystick.oy) / STICK_RADIUS;
      if (Math.hypot(mx, my) < 0.15) mx = my = 0;
    } else {
      for (const code of this.held) {
        const d = MOVE_KEYS[code];
        if (d) {
          mx += d[0];
          my += d[1];
        }
      }
    }
    const len = Math.hypot(mx, my);
    this.state.moveX = len > 1 ? mx / len : mx;
    this.state.moveY = len > 1 ? my / len : my;
    if (!this.touch && this.mouse && player) this.state.aim = Math.atan2(this.mouse.y - player.y, this.mouse.x - player.x);
    else if (len > 0.1) this.state.aim = Math.atan2(my, mx);
    this.state.buttons = this.held.has('Space') ? 1 : 0;
    return this.state;
  }

  dispose(): void {
    for (const f of this.off) f();
    this.off.length = 0;
    this.canvas.style.cursor = '';
  }
}

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
}
