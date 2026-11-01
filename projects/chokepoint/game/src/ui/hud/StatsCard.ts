import type Phaser from 'phaser';
import { START } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import { cleanWavePay, flawlessPay, heldPay } from '../../content/tech/claim';
import { artScale, COIN_TEXTURE, LIFE_TEXTURE } from '../../art/textures';
import { bankInterest } from '../../core/bankInterest';
import { coinsForRun, loadProfile } from '../../core/profile';
import { isLastStand } from '../../core/lastStand';
import { isQuietWave } from '../../core/waves';
import type { GameScene } from '../../scenes/GameScene';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/** Top left: lives and gold, and the run's coin tally so far. */
export class StatsCard implements HudPart {
  private readonly box: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly lives: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly coins: Phaser.GameObjects.Text;
  private readonly card: Phaser.GameObjects.Image;
  private readonly coinTallyIcon: Phaser.GameObjects.Image;
  private readonly bankIcon: Phaser.GameObjects.Image;
  private readonly bank: Phaser.GameObjects.Text;
  private bankShown = false;
  private readonly coinIcon: Phaser.GameObjects.Image;
  private readonly goldTag: Phaser.GameObjects.Text;
  private readonly cleanPay: number;
  private readonly flawlessPay: number;
  private readonly heldPay: number;
  private lastN = 0;
  private popping = false;
  private lastLives: number = START.lives;
  private livesPop = false;
  private lastWave = -1;
  private livesPulsing = false;
  private goldPulsing = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // The profile can't change mid-run (the tech screen is only reachable from the menu), so the
    // node pays are read once here, not on every frame of update().
    const purchased = loadProfile(window.localStorage).purchased;
    this.cleanPay = cleanWavePay(purchased);
    this.flawlessPay = flawlessPay(purchased);
    this.heldPay = heldPay(purchased);
    this.card = makeCard(scene, 0, 0, 196, 72, 24);
    const lifeIcon = artScale(scene.add.image(-74, -14, LIFE_TEXTURE), 1.25);
    this.lives = scene.add.text(-56, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.coinIcon = artScale(scene.add.image(14, -14, COIN_TEXTURE), 1.25);
    this.gold = scene.add.text(32, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.goldTag = scene.add.text(32, -13, '×4', textStyle(13, PALETTE.yellow, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.goldTag.setVisible(false);
    this.coinTallyIcon = artScale(scene.add.image(-74, 16, COIN_TEXTURE), 12 / 28);
    this.coins = scene.add.text(-60, 17, '', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
    this.bankIcon = artScale(scene.add.image(-74, 36, COIN_TEXTURE), 12 / 28);
    this.bank = scene.add.text(-60, 37, '', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
    this.bankIcon.setVisible(false);
    this.bank.setVisible(false);
    this.box = scene.add.container(0, 0, [this.card, lifeIcon, this.lives, this.coinIcon, this.gold, this.goldTag, this.coinTallyIcon, this.coins, this.bankIcon, this.bank]);
  }

  layout(): void {
    // Card top stays at y = 12, so the card is 12..84 and nothing is pushed off screen.
    this.box.setPosition(EDGE + 98, 12 + 72 / 2);
    // The gold number's screen position (CSS pixels), shared with the kill's coin (systems/enemyHooks/killCoin.ts).
    this.scene.registry.set('statsGold', { x: this.box.x + this.gold.x, y: this.box.y + this.gold.y });
  }

  update(game: GameScene): void {
    this.lives.setText(String(game.run.lives));
    this.lives.setColor(cssColor(isLastStand(game.run) ? PALETTE.red : PALETTE.ink));
    if (game.run.lives > this.lastLives) this.popLives();
    this.lastLives = game.run.lives;
    this.gold.setText(String(game.run.gold));
    const pay = this.scene.registry.pop('bankPay') as number | undefined; // the bank's pay, from RunFlow this frame
    if (pay !== undefined && pay > 0) this.popGold(pay);
    this.goldTagRow(game.run.phase === 'wave' && isQuietWave(game.run.wave) && isLastStand(game.run));
    const interest = bankInterest(game.run.gold);
    this.bankRow(game.run.phase === 'build' && !game.scene.isPaused() && interest >= 1, interest);
    const n = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves, seed: game.run.seed, bgen: game.run.bgen, held: game.run.heldLives }, this.cleanPay, game.run.mode === 'iron' ? 2 : 1, game.run.levelHpMul, this.flawlessPay, this.heldPay);
    this.coins.setText(`+${n} coins`);
    if (n > this.lastN) this.pop();
    this.lastN = n;
    if (this.lastWave < 0) this.lastWave = game.run.wave; // first frame (also for resumed runs): no pulse
    else if (game.run.wave !== this.lastWave) {
      this.lastWave = game.run.wave; // run.wave only moves in startWave()
      if (isLastStand(game.run)) this.pulseLives();
    }
  }

  /** The run's richest minute: a quiet wave in the last stand pays ×4 kill gold (quiet ×2, last stand ×2).
   * The tag sits right of the gold number; when a long number would push it past the card's right edge,
   * the coin icon, number and tag shift left as one unit (the lives number is "1" in the last stand, so the left side is clear). */
  private goldTagRow(rich: boolean): void {
    if (!rich) {
      if (this.goldTag.visible) {
        this.goldTag.setVisible(false);
        this.coinIcon.x = 14;
        this.gold.x = 32;
      }
      return;
    }
    this.goldTag.visible = true;
    const shift = Math.max(0, 32 + this.gold.width + 6 + this.goldTag.width - (196 / 2 - 4)); // 196 = card width, 4 px right padding
    this.coinIcon.x = 14 - shift;
    this.gold.x = 32 - shift;
    this.goldTag.x = this.gold.x + this.gold.width + 6;
  }

  /** The "bank +N" line: the bank's pay for the run's gold (core/bankInterest) while the build's choice is open.
   * Re-derived from the gold every frame, so a resumed run shows it from the restored gold; the card grows
   * 72 to 92 while it is up and the level chips follow the new edge (ui/hud/LevelChips.ts reads 'statsCardBottom'). */
  private bankRow(show: boolean, pay: number): void {
    if (show) this.bank.setText(`bank +${pay}`); // live: the number falls as the bank falls
    if (show === this.bankShown) return;
    this.bankShown = show;
    this.bankIcon.setVisible(show);
    this.bank.setVisible(show);
    this.card.setTexture(show ? cardTexture(this.scene, 196, 92, 24) : cardTexture(this.scene, 196, 72, 24));
    this.card.y = show ? 10 : 0; // card top stays at y = 12 (box centre 48; half-heights 46 / 36)
    this.scene.registry.set('statsCardBottom', 12 + (show ? 92 : 72));
  }

  /** One quiet pop per coin gain: tally and coin scale to 1.15 and back over ~150 ms; the coin
   * flashes white the same time. Skipped if one is already running. */
  private pop(): void {
    if (this.popping) return;
    this.popping = true;
    this.coinTallyIcon.setTintFill(0xffffff);
    const base = this.coinTallyIcon.scale;
    this.scene.tweens.add({ targets: this.coins, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.coins.setScale(1) });
    this.scene.tweens.add({ targets: this.coinTallyIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.popping = false; this.coinTallyIcon.setScale(base); this.coinTallyIcon.clearTint(); } });
  }

  /** The bank's pay at the wave start: a small gold "+N" rises off the gold number (the gold pop's look)
   *  while the number scales 1.15 and back over ~150 ms (the coin pop's timing). */
  private popGold(n: number): void {
    const x = this.box.x + this.gold.x;
    const y = this.box.y + this.gold.y;
    const t = this.scene.add.text(x, y - 16, `+${n}`, textStyle(14, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
    if (this.goldPulsing) return;
    this.goldPulsing = true;
    this.scene.tweens.add({ targets: this.gold, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.goldPulsing = false; this.gold.setScale(1); } });
  }

  /** Last stand: the red lives number pops once at each wave start, same timing as the coin pop. */
  private pulseLives(): void {
    if (this.livesPulsing) return;
    this.livesPulsing = true;
    this.scene.tweens.add({ targets: this.lives, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.livesPulsing = false; this.lives.setScale(1); } });
  }

  /** The streak's one payback: the lives number flashes green and scales 1.15 and back over ~150 ms. */
  private popLives(): void {
    if (this.livesPop) return;
    this.livesPop = true;
    this.lives.setTintFill(PALETTE.green);
    this.scene.tweens.add({ targets: this.lives, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.livesPop = false; this.lives.setScale(1); this.lives.clearTint(); } });
  }
}
