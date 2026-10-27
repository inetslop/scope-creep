import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import type { Music } from '../audio/Music';
import type { RunState } from '../core/run';
import type { Controls } from '../input/Controls';
import type { Player } from '../entities/Player';
import type { RedactSystem } from '../systems/RedactSystem';

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
  /** The boss first appeared this run. Payload: the boss name (string) from its content def. */
  bossNameplate: 'boss-nameplate',
  /** The run started with a warm-start upgrade. Payload: the full note text (string). */
  warmStart: 'warm-start',
  /** The HUD's touch button asked for a Redact (keyboard and gamepad flow through ControlState). */
  redactRequest: 'redact-request',
} as const;

/** Typed access to objects GameScene shares through the game registry. */
export function getRun(scene: Phaser.Scene): RunState {
  return scene.registry.get('run') as RunState;
}

export function getControls(scene: Phaser.Scene): Controls | undefined {
  return scene.registry.get('controls') as Controls | undefined;
}

export function getSfx(scene: Phaser.Scene): Sfx | undefined {
  return scene.registry.get('sfx') as Sfx | undefined;
}

export function getRedact(scene: Phaser.Scene): RedactSystem | undefined {
  return scene.registry.get('redact') as RedactSystem | undefined;
}

export function getMusic(scene: Phaser.Scene): Music {
  return scene.registry.get('music') as Music;
}

export function getPlayer(scene: Phaser.Scene): Player {
  return scene.registry.get('player') as Player;
}

/** Runs `fn` on every resize until the scene shuts down (avoids leaked listeners). */
export function onResize(scene: Phaser.Scene, fn: (width: number, height: number) => void): void {
  const handler = (size: Phaser.Structs.Size): void => fn(size.width, size.height);
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => scene.scale.off('resize', handler));
}
