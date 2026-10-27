import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import type { RunState } from '../core/run';
import type { Controls } from '../input/Controls';
import type { StillLifeSystem } from '../systems/StillLifeSystem';
import type { UnderstudySystem } from '../systems/UnderstudySystem';

/** Scene keys. Use these constants instead of string literals. */
export const SCENES = {
  boot: 'Boot',
  menu: 'Menu',
  game: 'Game',
  hud: 'Hud',
  levelUp: 'LevelUp',
  pause: 'Pause',
  gameOver: 'GameOver',
} as const;

/** Custom events emitted on GameScene's `events` emitter by other scenes. */
export const GAME_EVENTS = {
  pauseRequest: 'pause-request',
  /** The player took damage. HudScene shows the hurt frame. */
  playerHit: 'player-hit',
  /** The Eraser removed the player's most recent upgrade level. Payload: the erased upgrade id. */
  upgradeErased: 'upgrade-erased',
} as const;

/** Typed access to objects GameScene shares through the game registry. */
export function getRun(scene: Phaser.Scene): RunState {
  return scene.registry.get('run') as RunState;
}

export function getControls(scene: Phaser.Scene): Controls | undefined {
  return scene.registry.get('controls') as Controls | undefined;
}

export function getUnderstudy(scene: Phaser.Scene): UnderstudySystem | undefined {
  return scene.registry.get('understudy') as UnderstudySystem | undefined;
}

export function getStillLife(scene: Phaser.Scene): StillLifeSystem | undefined {
  return scene.registry.get('stillLife') as StillLifeSystem | undefined;
}

export function getSfx(scene: Phaser.Scene): Sfx | undefined {
  return scene.registry.get('sfx') as Sfx | undefined;
}

/** Runs `fn` on every resize until the scene shuts down (avoids leaked listeners). */
export function onResize(scene: Phaser.Scene, fn: (width: number, height: number) => void): void {
  const handler = (size: Phaser.Structs.Size): void => fn(size.width, size.height);
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => scene.scale.off('resize', handler));
}
