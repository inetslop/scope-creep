import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { formatTime } from '../core/progression';
import { flags } from '../debug/flags';
import type { StickState } from '../input/TouchSticks';
import { makeButton } from '../ui/button';
import { textStyle } from '../ui/text';
import { GAME_EVENTS, getControls, getRun, SCENES } from './keys';

const PAD = 12;
/** After a hit the HP just lost shows as a yellow chunk that waits, then drains, while the bar gives a small shake. */
const HP_HIT = { holdSec: 0.25, drainRate: 7, nudgeSec: 0.22, nudgePx: 4 } as const;

/** Overlay drawn above GameScene: bars, timer, kills, pause button, touch sticks. Read-only view of RunState. */
export class HudScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Container;
  /** HP fraction the yellow "just lost" chunk reaches to. */
  private hpGhost = 1;
  /** Seconds since the player was last hit. */
  private sinceHit = Number.POSITIVE_INFINITY;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.g = this.add.graphics();
    this.hpText = this.add.text(0, 0, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.levelText = this.add.text(0, 0, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.timeText = this.add.text(0, 0, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    this.killText = this.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(1, 0.5);
    this.pauseButton = makeButton(this, 0, 0, 'II', () => this.scene.get(SCENES.game).events.emit(GAME_EVENTS.pauseRequest), { width: 44, height: 44, fontSize: 18 });
    if (flags.debug) this.fpsText = this.add.text(PAD, 0, '', textStyle(12, PALETTE.green));

    this.hpGhost = 1;
    this.sinceHit = Number.POSITIVE_INFINITY;
    const gameEvents = this.scene.get(SCENES.game).events;
    const onPlayerHit = (): void => {
      this.sinceHit = 0;
    };
    gameEvents.on(GAME_EVENTS.playerHit, onPlayerHit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => gameEvents.off(GAME_EVENTS.playerHit, onPlayerHit));
  }

  update(_time: number, delta: number): void {
    const run = getRun(this);
    if (!run) return;
    const { width, height } = this.scale;
    const g = this.g;
    g.clear();
    const dt = delta / 1000;
    this.sinceHit += dt;

    // HP bar
    const barW = Math.min(260, width * 0.42);
    const hpFrac = Phaser.Math.Clamp(run.hp / run.stats.maxHp, 0, 1);
    if (hpFrac >= this.hpGhost - 0.002) this.hpGhost = hpFrac;
    else if (this.sinceHit > HP_HIT.holdSec) this.hpGhost += (hpFrac - this.hpGhost) * (1 - Math.exp(-HP_HIT.drainRate * dt));
    const t = this.sinceHit / HP_HIT.nudgeSec;
    const nudge = t < 1 ? Math.sin(this.sinceHit * 70) * HP_HIT.nudgePx * (1 - t) : 0;
    this.drawBar(PAD + nudge, PAD, barW, 18, hpFrac, hpFrac > 0.3 ? PALETTE.red : PALETTE.redDark, this.hpGhost);
    this.hpText.setPosition(PAD + 8 + nudge, PAD + 9).setText(`${Math.ceil(run.hp)} / ${Math.round(run.stats.maxHp)}`);

    // XP bar + level
    this.drawBar(PAD, PAD + 24, barW, 8, Phaser.Math.Clamp(run.xp / run.xpToNext, 0, 1), PALETTE.blue);
    this.levelText.setPosition(PAD + barW + 10, PAD + 18).setText(`LV ${run.level}`);

    // On narrow (phone) screens the bars + level label reach the center, so the timer drops below them.
    const narrow = PAD + barW + 80 > width / 2 - 30;
    this.timeText.setPosition(width / 2, narrow ? PAD + 40 : PAD).setText(formatTime(run.timeSec));
    this.pauseButton.setPosition(width - PAD - 22, PAD + 22);
    this.killText.setPosition(width - PAD - 54, PAD + 22).setText(`${run.kills} kills`);
    this.fpsText?.setPosition(PAD, height - 24).setText(`${Math.round(this.game.loop.actualFps)} fps`);

    const controls = getControls(this);
    if (controls && (controls.touch.everTouched || this.sys.game.device.input.touch)) {
      this.drawStick(controls.touch.left, width * 0.18, height * 0.8, controls.touch.radius);
      this.drawStick(controls.touch.right, width * 0.82, height * 0.8, controls.touch.radius);
    }
  }

  /** `ghost` > `frac` draws the span between them in yellow (HP just lost). */
  private drawBar(x: number, y: number, w: number, h: number, frac: number, color: number, ghost = 0): void {
    const g = this.g;
    g.fillStyle(PALETTE.paperLight, 1);
    g.fillRect(x, y, w, h);
    if (ghost > frac) {
      g.fillStyle(PALETTE.yellow, 1);
      g.fillRect(x, y, w * ghost, h);
    }
    if (frac > 0) {
      g.fillStyle(color, 1);
      g.fillRect(x, y, w * frac, h);
    }
    g.lineStyle(2, PALETTE.ink, 1);
    g.strokeRect(x, y, w, h);
  }

  /** Active sticks are drawn where the thumb is; idle ones as faint hints. */
  private drawStick(stick: StickState, hintX: number, hintY: number, radius: number): void {
    const g = this.g;
    if (!stick.active) {
      g.lineStyle(2, PALETTE.ink, 0.12);
      g.strokeCircle(hintX, hintY, radius);
      return;
    }
    g.fillStyle(PALETTE.ink, 0.06);
    g.fillCircle(stick.origin.x, stick.origin.y, radius);
    g.lineStyle(3, PALETTE.ink, 0.35);
    g.strokeCircle(stick.origin.x, stick.origin.y, radius);
    g.fillStyle(PALETTE.ink, 0.35);
    g.fillCircle(stick.origin.x + stick.value.x * radius, stick.origin.y + stick.value.y * radius, radius * 0.4);
  }
}
