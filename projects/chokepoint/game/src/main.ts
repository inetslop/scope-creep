import Phaser from 'phaser';
import { cssColor, PALETTE } from './content/palette';
import { hook, installTestHook } from './debug/testHook';
import { display, pixelRatio } from './ui/display';
import { startUpdateCheck } from './ui/updateNotice';
import { BoardsScene } from './scenes/BoardsScene';
import { BootScene } from './scenes/BootScene';
import { BossesScene } from './scenes/BossesScene';
import { CodexScene } from './scenes/CodexScene';
import { DraftScene } from './scenes/DraftScene';
import { EnemiesScene } from './scenes/EnemiesScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MenuScene } from './scenes/MenuScene';
import { NameScene } from './scenes/NameScene';
import { PauseScene } from './scenes/PauseScene';
import { WavesScene } from './scenes/WavesScene';
import { RewardsScene } from './scenes/RewardsScene';
import { TechScene } from './scenes/TechScene';

installTestHook();
startUpdateCheck();

const parent = document.getElementById('game')!;
/** The page size in CSS pixels. */
const cssSize = (): { width: number; height: number } => {
  const r = parent.getBoundingClientRect();
  return { width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) };
};
const start = cssSize();
display.ratio = pixelRatio(start.width, start.height);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: cssColor(PALETTE.ground),
  // The canvas is sized in device pixels and shown at CSS size (zoom), so it is sharp at any
  // pixel density; cameras zoom by display.ratio so scene code works in CSS pixels (ui/display.ts).
  scale: {
    mode: Phaser.Scale.NONE,
    width: start.width * display.ratio,
    height: start.height * display.ratio,
    zoom: 1 / display.ratio,
  },
  input: { activePointers: 2 },
  // pixelArt must be off explicitly: Phaser turns it on whenever the zoom isn't 1 (ours is
  // 1/ratio), and pixel-art mode switches off all smoothing of textures, text and the canvas.
  render: { pixelArt: false, antialias: true, antialiasGL: true, roundPixels: false, powerPreference: 'high-performance' },
  disableContextMenu: true,
  banner: false,
  // Order is draw order: later scenes draw on top (the HUD over the board, overlays over the HUD).
  scene: [BootScene, MenuScene, GameScene, HudScene, DraftScene, PauseScene, EnemiesScene, WavesScene, BossesScene, GameOverScene, RewardsScene, TechScene, CodexScene, BoardsScene, NameScene],
});

/** Follows the page size and the pixel density (browser zoom, moving to another screen). */
const fit = (): void => {
  const { width, height } = cssSize();
  display.ratio = pixelRatio(width, height);
  game.scale.setZoom(1 / display.ratio);
  game.scale.resize(width * display.ratio, height * display.ratio);
};
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);

game.events.on(Phaser.Core.Events.POST_STEP, () => {
  hook.frame += 1;
});
