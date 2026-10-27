import Phaser from 'phaser';
import { applyDeadZone, length, normalize, sub, type Vec2 } from '../core/vec';
import { TouchSticks } from './TouchSticks';

export type InputDevice = 'keyboard' | 'touch' | 'gamepad';

/** What the player wants this frame, independent of input device. */
export interface ControlState {
  /** Movement, length 0..1. */
  move: Vec2;
  /** Unit aim direction (last known direction when not actively aiming). */
  aim: Vec2;
  /** True while the player wants to shoot. */
  firing: boolean;
  /** Device used most recently (HUD shows matching hints). */
  device: InputDevice;
}

const MOVE_DEAD_ZONE = 0.15;
const AIM_DEAD_ZONE = 0.25;

/**
 * Twin-stick controls:
 *   keyboard+mouse  WASD/arrows move, mouse aims, hold left button to fire
 *   touch           left thumb = floating move stick, right thumb = aim + fire
 *   gamepad         left stick move, right stick aim + fire (or hold RT)
 */
export class Controls {
  readonly touch: TouchSticks;
  device: InputDevice = 'keyboard';
  private readonly scene: Phaser.Scene;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;
  private lastAim: Vec2 = { x: 1, y: 0 };
  private lastMouse: Vec2 = { x: -1, y: -1 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.touch = new TouchSticks(scene);
    this.keys = scene.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as Record<string, Phaser.Input.Keyboard.Key> | undefined;
  }

  /** Call when the scene resumes so no stick or button stays "held". */
  reset(): void {
    this.touch.reset();
    if (this.keys) Object.values(this.keys).forEach((k) => k.reset());
  }

  /** `playerScreen` is the player's position in screen pixels (for mouse aiming). */
  read(playerScreen: Vec2): ControlState {
    return this.readGamepad() ?? this.readTouch() ?? this.readKeyboardMouse(playerScreen);
  }

  private readTouch(): ControlState | null {
    const { left, right } = this.touch;
    if (!left.active && !right.active) return null;
    this.device = 'touch';
    const move = applyDeadZone(left.value, MOVE_DEAD_ZONE);
    const aimRaw = right.active ? applyDeadZone(right.value, AIM_DEAD_ZONE) : { x: 0, y: 0 };
    const aiming = length(aimRaw) > 0;
    if (aiming) this.lastAim = normalize(aimRaw);
    else if (length(move) > 0) this.lastAim = normalize(move);
    return { move, aim: this.lastAim, firing: aiming, device: 'touch' };
  }

  private readGamepad(): ControlState | null {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad || !pad.connected) return null;
    const move = applyDeadZone({ x: pad.leftStick.x, y: pad.leftStick.y }, MOVE_DEAD_ZONE);
    const aimRaw = applyDeadZone({ x: pad.rightStick.x, y: pad.rightStick.y }, AIM_DEAD_ZONE);
    const trigger = pad.R2 > 0.3;
    if (length(move) === 0 && length(aimRaw) === 0 && !trigger && this.device !== 'gamepad') return null;
    this.device = 'gamepad';
    if (length(aimRaw) > 0) this.lastAim = normalize(aimRaw);
    else if (length(move) > 0 && !trigger) this.lastAim = normalize(move);
    return { move, aim: this.lastAim, firing: length(aimRaw) > 0 || trigger, device: 'gamepad' };
  }

  private readKeyboardMouse(playerScreen: Vec2): ControlState {
    const k = this.keys;
    const down = (...names: string[]): boolean => names.some((n) => k?.[n]?.isDown === true);
    const move = normalize({
      x: (down('D', 'RIGHT') ? 1 : 0) - (down('A', 'LEFT') ? 1 : 0),
      y: (down('S', 'DOWN') ? 1 : 0) - (down('W', 'UP') ? 1 : 0),
    });
    const mouse = this.scene.input.mousePointer;
    const mouseDown = mouse?.isDown ?? false;
    const mouseMoved = !!mouse && (mouse.x !== this.lastMouse.x || mouse.y !== this.lastMouse.y);
    if (mouse && mouseMoved) this.lastMouse = { x: mouse.x, y: mouse.y };
    if (length(move) > 0 || mouseMoved || mouseDown) this.device = 'keyboard';

    if (this.lastMouse.x >= 0) {
      const toMouse = sub(this.lastMouse, playerScreen);
      if (length(toMouse) > 4) this.lastAim = normalize(toMouse);
    } else if (length(move) > 0) {
      this.lastAim = move; // keyboard-only players aim where they walk
    }
    return { move, aim: this.lastAim, firing: mouseDown, device: this.device };
  }
}
