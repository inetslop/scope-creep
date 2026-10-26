import Phaser from 'phaser';
import { cssColor, PALETTE } from './content/palette';
import { flags } from './debug/flags';
import { hook, installTestHook } from './debug/testHook';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';

installTestHook();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: cssColor(PALETTE.paper),
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: { debug: flags.debug, gravity: { x: 0, y: 0 } },
  },
  input: { activePointers: 3, gamepad: true },
  render: { antialias: true, powerPreference: 'high-performance' },
  disableContextMenu: true,
  banner: false,
  scene: [BootScene, MenuScene, GameScene, HudScene, LevelUpScene, PauseScene, GameOverScene],
});

game.events.on(Phaser.Core.Events.POST_STEP, () => {
  hook.frame += 1;
});
