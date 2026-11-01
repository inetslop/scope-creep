import Phaser from 'phaser';
import { levelMultiplierLabel } from '../core/levels';
import { loadProfile } from '../core/profile';
import { PALETTE } from '../content/palette';
import { cleanWavePay, flawlessPay } from '../content/tech/claim';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getGameScene, getSfx, onResize, SCENES } from './keys';

/**
 * How a run pays, off the pause: the current rates ("Pays"), this run's terms so far ("This
 * run", the claim card's own recipe parts) and the factors behind them ("Multipliers": Iron's
 * ×2, the level augments). Every value is read once, from the live run and the profile; the
 * pause sits dimmed behind, and the total is never repeated here (the pause's worth line keeps
 * it, like on every other reference page).
 */
export class CoinsScene extends Phaser.Scene {
  private panelW = 340;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.coins);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.coins;
    this.closed = false;
    // The pause stays behind: the shade dims it, and a tap on the dimmed area closes, like the back button.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      hook.overlay = SCENES.pause;
      this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
    };
    this.shade.on('pointerdown', doBack);
    // The back button: a round ink card with a white arrow, top right (the codex's).
    this.back = makeButton(this, 0, 0, '', doBack, { width: 48, height: 48, radius: 24, fill: PALETTE.ink });
    const arrow = this.add.graphics();
    arrow.fillStyle(PALETTE.card, 1);
    arrow.fillTriangle(3, -7, 3, 7, -8, 0);
    this.back.content.add(arrow);
    this.build();
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      // The whole card scales to fit, like the references: no scroll, no clip.
      this.box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
      this.back.container.setPosition(width - EDGE - 24, 40);
    };
    const size = viewSize(this);
    layout(size.width, size.height);
    onResize(this, layout);
    // A smoke tap on the pause can land on the new button; back out so the run is not stranded here.
    if (flags.smoke) this.time.delayedCall(1000, doBack);
  }

  private build(): void {
    const run = getGameScene(this).run;
    const owned = loadProfile(window.localStorage).purchased;
    const cleanPay = cleanWavePay(owned);
    const flawPay = flawlessPay(owned);
    const hasFlawless = flawPay > 0;
    const iron = run.mode === 'iron' ? 2 : 1;
    // The claim card's own rule, so far: every held wave clean, at least one held.
    const flawlessSoFar = run.wavesCleared === run.cleanWaves && run.wavesCleared > 0;

    const PAD = 28, GAP = 10, GAP_BIG = 20;
    const innerW = this.panelW - PAD * 2;

    const title = this.add.text(0, 0, 'Coins', titleStyle(28)).setOrigin(0.5);
    const paysHeading = this.add.text(0, 0, 'Pays', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const paysLines: Phaser.GameObjects.Text[] = [
      this.add.text(0, 0, 'each wave held · +1', textStyle(12, PALETTE.muted)).setOrigin(0.5),
      this.add.text(0, 0, 'every 10 stopped · +1', textStyle(12, PALETTE.muted)).setOrigin(0.5),
      this.add.text(0, 0, `each clean wave · +${cleanPay}`, textStyle(12, PALETTE.muted)).setOrigin(0.5),
    ];
    // An unused text left at 0,0 would float on the screen: create it only when the node is owned.
    const flawlessLine = hasFlawless ? this.add.text(0, 0, `a flawless run · +${flawPay}`, textStyle(12, PALETTE.muted)).setOrigin(0.5) : undefined;

    // The run's terms so far, the claim card's recipe parts (its own values, so mid- and end-run agree).
    const runHeading = this.add.text(0, 0, 'This run', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const recipeParts = [`waves +${run.wavesCleared * iron}`, `stopped +${Math.floor(run.kills / 10) * iron}`, `clean +${run.cleanWaves * cleanPay * iron}`];
    if (hasFlawless && flawlessSoFar) recipeParts.push(`flawless +${flawPay * iron}`);
    const recipe = this.add.text(0, 0, recipeParts.join(' · '), textStyle(14, PALETTE.ink, { fontStyle: 'bold', wordWrap: { width: innerW } })).setOrigin(0.5);

    const multFacts = (run.mode === 'iron' ? ['×2 Iron'] : []).concat(run.levelHpMul > 1 ? [`${levelMultiplierLabel(run.level)} level augments`] : []);
    const multHeading = multFacts.length > 0 ? this.add.text(0, 0, 'Multipliers', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5) : undefined;
    const multLines: Phaser.GameObjects.Text[] = multFacts.map((fact) => this.add.text(0, 0, fact, textStyle(12, PALETTE.muted)).setOrigin(0.5));

    // The card grows to its content, top-down: title, the pays lines, this run, the multipliers.
    let h = PAD + title.height + GAP_BIG + paysHeading.height;
    for (const line of paysLines) h += GAP + line.height;
    if (flawlessLine) h += GAP + flawlessLine.height;
    h += GAP_BIG + runHeading.height + GAP + recipe.height;
    if (multHeading) {
      h += GAP_BIG + multHeading.height;
      for (const line of multLines) h += GAP + line.height;
    }
    h += PAD;
    this.panelH = Math.ceil(h);

    const cardParts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28), title, paysHeading, ...paysLines, runHeading, recipe, ...multLines];
    if (flawlessLine) cardParts.push(flawlessLine);
    if (multHeading) cardParts.push(multHeading);

    let y = -this.panelH / 2 + PAD;
    const cy = (hh: number): number => {
      const c = y + hh / 2;
      y += hh;
      return c;
    };
    title.setY(cy(title.height));
    y += GAP_BIG;
    paysHeading.setY(cy(paysHeading.height));
    for (const line of paysLines) {
      y += GAP;
      line.setY(cy(line.height));
    }
    if (flawlessLine) {
      y += GAP;
      flawlessLine.setY(cy(flawlessLine.height));
    }
    y += GAP_BIG;
    runHeading.setY(cy(runHeading.height));
    y += GAP;
    recipe.setY(cy(recipe.height));
    if (multHeading) {
      y += GAP_BIG;
      multHeading.setY(cy(multHeading.height));
      for (const line of multLines) {
        y += GAP;
        line.setY(cy(line.height));
      }
    }
    this.box = this.add.container(0, 0, cardParts);
  }
}
