import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import type { Board } from './Board';
import type { RunFlow } from './RunFlow';

/**
 * The wave's enemies still to come or alive, at the exit: during a wave a small white chip sits
 * just above the exit gate (where the leak warning paints its copy) with the same number the
 * "next wave" button shows — the wave's plan total minus killed minus leaked. Not painted at all
 * when that count reaches 0 (between waves, draft), or under the pause overlay. Board space: it
 * scales with the board like the leak warning, so it sits right at both resolutions.
 */
export class ExitCount {
  private readonly flow: RunFlow;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly chip: Phaser.GameObjects.Container;
  private shown = -1;
  private hiddenByPause = false;

  constructor(scene: Phaser.Scene, board: Board, flow: RunFlow) {
    this.flow = flow;
    this.g = scene.add.graphics();
    // No ui/text.ts import (it drags in debug/flags -> window): same inline style as nameLabel.
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: cssColor(PALETTE.muted),
      resolution: 1 / scene.scale.zoom,
    });
    this.label.setOrigin(0.5);
    const pts = board.path.points; // the leak warning's spot (ExitWarning.ts)
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2 - 56; // just above it, clear of its pulse
    this.chip = scene.add.container(x, y, [this.g, this.label]);
    this.chip.setDepth(DEPTH.fx).setVisible(false);
  }

  /** One frame of the wave, driven by GameScene. */
  update(): void {
    const n = this.flow.enemiesLeft;
    if (n !== this.shown) {
      this.shown = n;
      if (n > 0) {
        // The name tag's chip look: white card over its dark side face, bold muted number.
        this.label.setText(String(n));
        const w = this.label.width + 14;
        this.g.clear();
        this.g.fillStyle(PALETTE.cardDeep, 1);
        this.g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
        this.g.fillStyle(PALETTE.card, 1);
        this.g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
      }
    }
    this.chip.setVisible(!this.hiddenByPause && n > 0);
  }

  /** The pause overlay opened: the board is dimmed under it, the chip goes with it. The scene is
   * paused right after, so update() cannot apply the flag — the chip must hide itself here. */
  hide(): void {
    this.hiddenByPause = true;
    this.chip.setVisible(false);
  }

  /** The pause overlay closed: the next frame repaints the chip if the count is above 0. */
  show(): void {
    this.hiddenByPause = false;
  }

  /** Invariant: a visible chip has a finite position. */
  broken(): string | undefined {
    if (!this.chip.visible) return undefined;
    return Number.isFinite(this.chip.x) && Number.isFinite(this.chip.y)
      ? undefined
      : `exit count at (${this.chip.x}, ${this.chip.y})`;
  }
}
