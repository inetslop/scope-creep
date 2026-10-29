import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import type { RunState } from '../core/run';
import { viewSize } from '../ui/display';
import type { GameScene } from './GameScene';

/** Scene keys. Use these constants instead of string literals. */
export const SCENES = {
  boot: 'Boot',
  menu: 'Menu',
  tech: 'Tech',
  game: 'Game',
  hud: 'Hud',
  draft: 'Draft',
  pause: 'Pause',
  gameOver: 'GameOver',
  rewards: 'Rewards',
} as const;

/** The current run (set by GameScene, kept for GameOver). */
export function getRun(scene: Phaser.Scene): RunState {
  return scene.registry.get('run') as RunState;
}

export function getSfx(scene: Phaser.Scene): Sfx | undefined {
  return scene.registry.get('sfx') as Sfx | undefined;
}

/** GameScene, for the HUD and overlays to call into (selectTower, startWaveNow, finishDraft...). */
export function getGameScene(scene: Phaser.Scene): GameScene {
  return scene.scene.get(SCENES.game) as GameScene;
}

/** Runs `fn` with the new screen size in CSS pixels on every resize, until the scene shuts down. */
export function onResize(scene: Phaser.Scene, fn: (width: number, height: number) => void): void {
  const handler = (): void => {
    const { width, height } = viewSize(scene);
    fn(width, height);
  };
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => scene.scale.off('resize', handler));
}

/** Runs `fn` on every keydown until the scene shuts down. */
export function onKey(scene: Phaser.Scene, fn: (event: KeyboardEvent) => void): void {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  keyboard.on('keydown', fn);
  scene.events.once('shutdown', () => keyboard.off('keydown', fn));
}
