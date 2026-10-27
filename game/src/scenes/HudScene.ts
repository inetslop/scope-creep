import Phaser from 'phaser';
import { BOSS_BY_ID } from '../content/bosses';
import { cssColor, PALETTE } from '../content/palette';
import { CROP } from '../core/crop';
import { formatTime } from '../core/progression';
import type { RunState } from '../core/run';
import { STREAK_FIRE_BONUS_STREAK } from '../core/stats';
import { flags } from '../debug/flags';
import type { StickState } from '../input/TouchSticks';
import { makeButton } from '../ui/button';
import { textStyle } from '../ui/text';
import { GAME_EVENTS, getControls, getRun, SCENES } from './keys';

const PAD = 12;
/** After a hit the HP just lost shows as a yellow chunk that waits, then drains, while the bar gives a small shake. */
const HP_HIT = { holdSec: 0.25, drainRate: 7, nudgeSec: 0.22, nudgePx: 4 } as const;
/** Seconds the boss nameplate stays on the page before it is removed. */
const BOSS_PLATE_SEC = 2;

/** Overlay drawn above GameScene: bars, timer, kills, pause button, touch sticks. Read-only view of RunState. */
export class HudScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private rhythmText!: Phaser.GameObjects.Text;
  private cropText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Container;
  /** Boss health bar: its own Graphics, so the 0.5 s death fade can lower alpha without clearing the main HUD. */
  private bossG!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.Text;
  private bossWarnText!: Phaser.GameObjects.Text;
  /** Boss nameplate: the boss's name printed below its bar when the boss first spawns this run. */
  private bossPlate!: Phaser.GameObjects.Text;
  /** Boss approach warning: flashes below the nameplate line in the 5 s before a spawn. */
  private bossApproachText!: Phaser.GameObjects.Text;
  private bossPlateActive = false;
  private bossPlateAge = 0;
  /** Edge-trigger state for the approach flash: true while it is on screen. */
  private approachEdge = false;
  /** True once the flash has played for the current window, so it does not re-trigger after fading out. */
  private approachShown = false;
  /** Seconds the approach flash has been on screen; advances only while the game scene is active. */
  private approachAge = 0;
  /** Boss bar alpha while fading out after a kill. */
  private bossFade = 1;
  /** HP fraction the yellow "just lost" chunk reaches to. */
  private hpGhost = 1;
  /** Seconds since the player was last hit. */
  private sinceHit = Number.POSITIVE_INFINITY;
  /** Kill-streak tally state. The scene instance survives stop/launch, so reset in create(). */
  private streakShown = false;
  private lastStreak = 0;
  private flashUntil = 0;
  private rhythmUntil = 0;
  private cropUntil = 0;
  private cropFlashed = false;
  private flashRed = false;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.g = this.add.graphics();
    this.hpText = this.add.text(0, 0, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.levelText = this.add.text(0, 0, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.timeText = this.add.text(0, 0, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    this.killText = this.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(1, 0.5);
    this.scoreText = this.add.text(0, 0, 'SCORE 0', textStyle(14, PALETTE.ink)).setOrigin(0, 0.5);
    this.streakText = this.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(1, 0.5).setVisible(false);
    this.rhythmText = this.add.text(0, 0, 'RHYTHM', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(1, 0.5).setVisible(false);
    this.cropText = this.add.text(0, 0, 'CROPPING', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(1, 0.5).setVisible(false);
    this.pauseButton = makeButton(this, 0, 0, 'II', () => this.scene.get(SCENES.game).events.emit(GAME_EVENTS.pauseRequest), { width: 44, height: 44, fontSize: 18 });
    if (flags.debug) this.fpsText = this.add.text(PAD, 0, '', textStyle(12, PALETTE.green));
    this.bossG = this.add.graphics();
    this.bossName = this.add.text(0, 0, '', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    this.bossWarnText = this.add.text(0, 0, '', textStyle(48, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0.5).setAlpha(0);
    this.bossPlate = this.add.text(0, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0).setVisible(false);
    this.bossApproachText = this.add.text(0, 0, 'SOMETHING HEAVY APPROACHES', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(0.5, 0).setAlpha(0);

    this.bossFade = 1;
    this.bossPlateActive = false;
    this.bossPlateAge = 0;
    this.approachEdge = false;
    this.approachShown = false;
    this.approachAge = 0;
    this.hpGhost = 1;
    this.sinceHit = Number.POSITIVE_INFINITY;
    this.streakShown = false;
    this.lastStreak = 0;
    this.flashUntil = 0;
    this.rhythmUntil = 0;
    this.cropUntil = 0;
    this.cropFlashed = false;
    this.flashRed = false;
    const gameEvents = this.scene.get(SCENES.game).events;
    const onPlayerHit = (): void => {
      this.sinceHit = 0;
    };
    gameEvents.on(GAME_EVENTS.playerHit, onPlayerHit);
    const onBossNameplate = (name: string): void => {
      this.bossPlate.setText(name);
      this.bossPlateAge = 0;
      this.bossPlateActive = true;
      const p = this.bossPlatePos(this.scale.width); // place it now: HudScene updates before GameScene, so this frame's render would otherwise catch it at (0,0)
      this.bossPlate.setPosition(p.x, p.y);
      this.bossPlate.setAlpha(1).setVisible(true);
    };
    gameEvents.on(GAME_EVENTS.bossNameplate, onBossNameplate);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off(GAME_EVENTS.playerHit, onPlayerHit);
      gameEvents.off(GAME_EVENTS.bossNameplate, onBossNameplate);
    });
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
    this.drawBar(this.g, PAD + nudge, PAD, barW, 18, hpFrac, hpFrac > 0.3 ? PALETTE.red : PALETTE.redDark, this.hpGhost);
    this.hpText.setPosition(PAD + 8 + nudge, PAD + 9).setText(`${Math.ceil(run.hp)} / ${Math.round(run.stats.maxHp)}`);

    // XP bar + level
    this.drawBar(this.g, PAD, PAD + 24, barW, 8, Phaser.Math.Clamp(run.xp / run.xpToNext, 0, 1), PALETTE.blue);
    this.levelText.setPosition(PAD + barW + 10, PAD + 18).setText(`LV ${run.level}`);

    // On narrow (phone) screens the bars + level label reach the center, so the timer drops below them.
    const narrow = PAD + barW + 80 > width / 2 - 30;
    this.timeText.setPosition(width / 2, narrow ? PAD + 40 : PAD).setText(formatTime(run.timeSec));

    // Boss: the center warning, and the health bar below the top-center timer.
    const bossName = run.bossId !== '' ? BOSS_BY_ID.get(run.bossId)?.name ?? '' : '';
    this.bossWarnText.setPosition(width / 2, height / 2).setAlpha(run.bossWarning ? 1 : 0).setText(bossName);
    // Approach flash: "SOMETHING HEAVY APPROACHES" below the nameplate line, fading out over 2 s.
    const nameTop = this.bossPlatePos(width).y; // the boss nameplate line
    if (run.bossApproach && !this.approachShown) {
      this.approachShown = true;
      this.approachEdge = true;
      this.approachAge = 0;
      this.tweens.killTweensOf(this.bossApproachText);
      this.tweens.add({ targets: this.bossApproachText, scale: 1.15, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }
    if (!run.bossApproach) {
      this.approachEdge = false;
      this.approachShown = false; // a new window (first spawn, respawn, next boss) may flash again
    }
    if (this.approachEdge) {
      if (this.scene.isActive(SCENES.game)) this.approachAge += dt; // pause with the game
      const a = Phaser.Math.Clamp(1 - this.approachAge / 2, 0, 1);
      this.bossApproachText.setPosition(width / 2, nameTop + 20).setAlpha(a);
      if (a <= 0) this.approachEdge = false;
    } else this.bossApproachText.setAlpha(0);
    if (run.bossAlive) {
      this.bossFade = 1;
      const top = (narrow ? PAD + 40 : PAD) + 26;
      this.bossName.setPosition(width / 2, top).setAlpha(1).setText(bossName);
      this.bossG.clear().setAlpha(1);
      this.drawBar(this.bossG, (width - width * 0.6) / 2, top + 18, width * 0.6, 12, Phaser.Math.Clamp(run.bossHp / run.bossMaxHp, 0, 1), PALETTE.red);
    } else if (this.bossFade > 0) {
      // Fade out over 0.5 s without clearing: lower the alpha of the last-drawn pixels.
      this.bossFade = Math.max(0, this.bossFade - dt / 0.5);
      this.bossG.setAlpha(this.bossFade);
      this.bossName.setAlpha(this.bossFade);
      if (this.bossFade === 0) {
        this.bossG.clear();
        this.bossG.setAlpha(1);
      }
    }

    if (this.bossPlateActive) {
      if (this.scene.isActive(SCENES.game)) this.bossPlateAge += dt; // frozen while pause/level-up is up
      const p = this.bossPlatePos(width);
      this.bossPlate.setPosition(p.x, p.y); // 12 px below the bar's bottom edge
      if (this.bossPlateAge >= BOSS_PLATE_SEC) {
        this.bossPlateActive = false;
        this.bossPlate.setAlpha(0).setVisible(false);
      } else {
        this.bossPlate.setAlpha(1 - this.bossPlateAge / BOSS_PLATE_SEC);
      }
    }

    this.pauseButton.setPosition(width - PAD - 22, PAD + 22);
    this.killText.setPosition(width - PAD - 54, PAD + 22).setText(`${run.kills} kills`);
    this.scoreText.setPosition(PAD, PAD + 48).setText(`SCORE ${run.score}`);
    this.updateStreak(run, width);
    if (!this.cropFlashed && run.timeSec >= CROP.startSec) {
      this.cropFlashed = true;
      this.cropUntil = this.time.now + 800;
      this.tweens.killTweensOf(this.cropText);
      this.cropText.setScale(1).setAlpha(1);
      this.tweens.add({ targets: this.cropText, alpha: 0.35, scale: 1.2, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }
    this.cropText.setPosition(width - PAD - this.streakText.width - 8, PAD + 60); // same slot as RHYTHM
    this.cropText.setVisible(this.time.now < this.cropUntil);
    this.fpsText?.setPosition(PAD, height - 24).setText(`${Math.round(this.game.loop.actualFps)} fps`);

    const controls = getControls(this);
    if (controls && (controls.touch.everTouched || this.sys.game.device.input.touch)) {
      this.drawStick(controls.touch.left, width * 0.18, height * 0.8, controls.touch.radius);
      this.drawStick(controls.touch.right, width * 0.82, height * 0.8, controls.touch.radius);
    }
  }

  /** Centered x and y (12 px below the boss bar's bottom edge) for the boss nameplate, matching the bar layout. */
  private bossPlatePos(width: number): { x: number; y: number } {
    const barW = Math.min(260, width * 0.42);
    const narrow = PAD + barW + 80 > width / 2 - 30;
    const bossTop = (narrow ? PAD + 40 : PAD) + 26;
    return { x: width / 2, y: bossTop + 42 };
  }

  /** "×N" kill-streak tally top-right; a red "RHYTHM" flash at every 8th consecutive kill. */
  private updateStreak(run: RunState, width: number): void {
    const s = run.streak;
    const now = this.time.now;
    if (s >= 2 && !this.streakShown) {
      this.streakShown = true;
      this.tweens.killTweensOf(this.streakText); // cancel a fade-out still running
      this.streakText.setVisible(true).setAlpha(1);
    } else if (s < 2 && this.streakShown) {
      this.streakShown = false;
      this.rhythmUntil = 0;
      this.tweens.killTweensOf(this.streakText);
      this.tweens.add({ targets: this.streakText, alpha: 0, duration: 300, ease: 'Linear', onComplete: () => this.streakText.setVisible(false) });
    }
    if (s > this.lastStreak && Math.floor(s / 8) > Math.floor(this.lastStreak / 8)) {
      this.flashUntil = now + 800;
      this.rhythmUntil = now + 800;
      this.tweens.killTweensOf(this.streakText);
      this.streakText.setAlpha(1);
      this.tweens.add({ targets: this.streakText, alpha: 0.3, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      this.tweens.killTweensOf(this.rhythmText);
      this.rhythmText.setScale(1).setAlpha(1);
      this.tweens.add({ targets: this.rhythmText, alpha: 0.35, scale: 1.2, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }
    this.lastStreak = s;
    if (s >= 2) {
      this.streakText.setText(`×${s}`);
      const red = now < this.flashUntil || s >= STREAK_FIRE_BONUS_STREAK;
      if (red !== this.flashRed) {
        this.flashRed = red;
        this.streakText.setColor(cssColor(red ? PALETTE.red : PALETTE.ink));
      }
    }
    const y = PAD + 60;
    this.streakText.setPosition(width - PAD, y);
    this.rhythmText.setPosition(width - PAD - this.streakText.width - 8, y);
    this.rhythmText.setVisible(s >= 2 && now < this.rhythmUntil);
  }

  /** `ghost` > `frac` draws the span between them in yellow (HP just lost). */
  private drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, frac: number, color: number, ghost = 0): void {
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
