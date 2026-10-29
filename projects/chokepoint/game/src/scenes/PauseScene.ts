import Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { cleanWavePay } from '../content/tech/claim';
import { coinsForRun, loadProfile, saveSound } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { fillRing } from '../ui/ring';
import { textStyle, titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, getSfx, onKey, onResize, SCENES } from './keys';

/** Pause overlay: resume or quit, on one card. In ?smoke mode it resumes on its own. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.pause;
    const game = getGameScene(this);
    let closed = false;
    const resume = (): void => {
      if (closed) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.closePause();
    };
    const quit = (): void => {
      if (closed) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop(SCENES.hud);
      this.scene.stop(SCENES.game);
      this.scene.start(SCENES.menu);
    };

    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const panelW = 360;
    const panelH = 460;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -panelH / 2 + 54, 'Paused', titleStyle(34)).setOrigin(0.5);
    const profile = loadProfile(window.localStorage);
    const starred = profile.bestWave > 0 && game.run.wave >= profile.bestWave;
    const waveWord = game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready';
    const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves, seed: game.run.seed }, cleanWavePay(profile.purchased));
    const lineStyle = textStyle(13, PALETTE.muted);
    const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
    let x = 0;
    const waveText = this.add.text(0, 0, waveWord, lineStyle).setOrigin(0, 0.5);
    kids.push(waveText);
    x += waveText.width;
    if (starred) { kids.push(artScale(this.add.image(x + 13, 1, STAR_TEXTURE))); x += 21; }
    const restText = this.add.text(x, 0, ` · ${game.run.lives} lives · ${game.run.gold} gold`, lineStyle).setOrigin(0, 0.5);
    kids.push(restText);
    x += restText.width;
    const stats = this.add.container(-x / 2, -panelH / 2 + 78, kids);
    const worthText: Phaser.GameObjects.Text | undefined = game.run.wave > 0 ? this.add.text(0, -panelH / 2 + 96, `worth +${coins} coins`, lineStyle).setOrigin(0.5) : undefined;
    const heading = this.add.text(0, -panelH / 2 + 114, 'Controls', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const keys = this.add.text(0, -panelH / 2 + 176, 'Space — start the wave early\nSend — start the wave now, +2 gold per second left\nF — fast-forward (2x) during waves\n1-9 — pick a card from the hand\n+ / - — zoom the board', textStyle(12, PALETTE.muted, { align: 'center', lineSpacing: 6 })).setOrigin(0.5);
    const resumeButton = makeButton(this, 0, -panelH / 2 + 276, 'Resume', resume, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const quitButton = makeButton(this, 0, -panelH / 2 + 344, 'Quit run', quit, { width: 240, height: 52, radius: 26 });
    const sfx = getSfx(this);
    const glyph = this.add.graphics();
    const paintGlyph = (isOn: boolean): void => {
      glyph.clear();
      const c = isOn ? PALETTE.ink : PALETTE.muted;
      glyph.fillStyle(c, 1);
      // box: 6 wide, 8 tall, on the left, vertically centered
      glyph.fillRoundedRect(-12, -4, 6, 8, 2);
      // cone: trapezoid joined to the box's right, 8 tall at the box flaring to 18, opening right
      glyph.beginPath();
      glyph.moveTo(-6, -4);
      glyph.lineTo(-6, 4);
      glyph.lineTo(1, 9);
      glyph.lineTo(1, -9);
      glyph.closePath();
      glyph.fillPath();
      if (isOn) {
        // two sound-wave arcs to the right of the cone, centered on its middle (-2.5, 0)
        fillRing(glyph, -2.5, 0, 5, 2, Math.PI / 4, 3 * Math.PI / 4, c);
        fillRing(glyph, -2.5, 0, 9, 2, Math.PI / 4, 3 * Math.PI / 4, c);
      } else {
        // off: a small x of two 2px bars (8 long) to the right of the cone
        glyph.lineStyle(2, c, 1);
        glyph.beginPath();
        glyph.moveTo(2.2, -2.8);
        glyph.lineTo(7.8, 2.8);
        glyph.strokePath();
        glyph.beginPath();
        glyph.moveTo(2.2, 2.8);
        glyph.lineTo(7.8, -2.8);
        glyph.strokePath();
      }
    };
    const wordText = this.add.text(-62, 0, 'Sound', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const stateText = this.add.text(92, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    const refreshRow = (): void => {
      const isOn = sfx ? !sfx.muted : true;
      paintGlyph(isOn);
      const color = cssColor(isOn ? PALETTE.ink : PALETTE.muted);
      wordText.setColor(color);
      stateText.setText(isOn ? 'On' : 'Off');
      stateText.setColor(color);
    };
    const toggleSound = (): void => {
      if (!sfx) return;
      sfx.muted = !sfx.muted;
      saveSound(window.localStorage, !sfx.muted);
      refreshRow();
      if (!sfx.muted) sfx.blip();
    };
    const soundRow = makeButton(this, 0, -panelH / 2 + 406, '', toggleSound, { width: 280, height: 48, radius: 24 });
    glyph.setPosition(-88, 0);
    soundRow.content.add([glyph, wordText, stateText]);
    refreshRow();
    const boxKids: Phaser.GameObjects.GameObject[] = [panel, title, stats, heading, keys, resumeButton.container, quitButton.container, soundRow.container];
    if (worthText) boxKids.push(worthText);
    const box = this.add.container(0, 0, boxKids);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') resume();
    });
    if (flags.smoke) this.time.delayedCall(1000, resume);
  }
}
