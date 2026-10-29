import Phaser from 'phaser';
import { HUD } from '../config';
import { PALETTE } from '../content/palette';
import { flags } from '../debug/flags';
import { uiCamera, viewSize } from '../ui/display';
import { HandBar } from '../ui/hud/HandBar';
import type { HudPart } from '../ui/hud/hud';
import { LastStandBanner } from '../ui/hud/LastStandBanner';
import { NextWaveButton } from '../ui/hud/NextWaveButton';
import { NextWavePreview } from '../ui/hud/NextWavePreview';
import { PauseButton } from '../ui/hud/PauseButton';
import { SpeedButton } from '../ui/hud/SpeedButton';
import { StatsCard } from '../ui/hud/StatsCard';
import { StayPutButton } from '../ui/hud/StayPutButton';
import { TowerPanel } from '../ui/hud/TowerPanel';
import { WaveBanner } from '../ui/hud/WaveBanner';
import { WaveCard } from '../ui/hud/WaveCard';
import { ZoomButtons } from '../ui/hud/ZoomButtons';
import { textStyle } from '../ui/text';
import { getGameScene, onResize, SCENES } from './keys';

/**
 * The HUD over GameScene, as floating cards. Each element is its own part in ui/hud/ (one line
 * each below); this scene only creates them, lays them out and updates them. Laid out for 412x915
 * and 1280x720.
 */
export class HudScene extends Phaser.Scene {
  private parts: HudPart[] = [];
  private fps: Phaser.GameObjects.Text | undefined;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    uiCamera(this);
    const game = getGameScene(this);
    const preview = new NextWavePreview(this);
    this.parts = [
      new StatsCard(this),
      new WaveCard(this),
      new WaveBanner(this),
      new PauseButton(this, game),
      new ZoomButtons(this, game),
      new NextWaveButton(this, game),
      new SpeedButton(this, game),
      preview,
      new StayPutButton(this, game, preview),
      new HandBar(this),
      new TowerPanel(this),
      new LastStandBanner(this), // last on purpose: slides in over the other cards
    ];
    this.fps = flags.debug ? this.add.text(16, HUD.top + 4, '', textStyle(12, PALETTE.muted)) : undefined;
    const layout = (w: number, h: number): void => {
      for (const part of this.parts) part.layout(w, h);
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
  }

  update(): void {
    const game = getGameScene(this);
    if (!game.run) return;
    for (const part of this.parts) part.update(game);
    if (this.fps) this.fps.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }
}
