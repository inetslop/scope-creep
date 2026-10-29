import Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { coinsForRun, loadProfile, saveSound } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
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
    const panelH = 458;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -panelH / 2 + 54, 'Paused', titleStyle(34)).setOrigin(0.5);
    const profile = loadProfile(window.localStorage);
    const starred = profile.bestWave > 0 && game.run.wave >= profile.bestWave;
    const waveWord = game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready';
    const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves, seed: game.run.seed });
    const lineStyle = textStyle(13, PALETTE.muted);
    const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
    let x = 0;
    const waveText = this.add.text(0, 0, waveWord, lineStyle).setOrigin(0, 0.5);
    kids.push(waveText);
    x += waveText.width;
    if (starred) { kids.push(artScale(this.add.image(x + 13, 1, STAR_TEXTURE))); x += 21; }
    const restText = this.add.text(x, 0, ` · ${game.run.lives} lives · ${game.run.gold} gold · +${coins} coins`, lineStyle).setOrigin(0, 0.5);
    kids.push(restText);
    x += restText.width;
    const stats = this.add.container(-x / 2, -panelH / 2 + 78, kids);
    const heading = this.add.text(0, -panelH / 2 + 96, 'Controls', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const keys = this.add.text(0, -panelH / 2 + 158, 'Space — start the wave early\nSend — start the wave now, +2 gold per second left\nF — fast-forward (2x) during waves\n1-9 — pick a card from the hand\n+ / - — zoom the board', textStyle(12, PALETTE.muted, { align: 'center', lineSpacing: 6 })).setOrigin(0.5);
    const resumeButton = makeButton(this, 0, -panelH / 2 + 258, 'Resume', resume, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const quitButton = makeButton(this, 0, -panelH / 2 + 326, 'Quit run', quit, { width: 240, height: 52, radius: 26 });
    const actionLine = this.add.text(0, 134, 'Panic — clear the board, 25 gold, once per wave', textStyle(12, PALETTE.muted)).setOrigin(0.5);
    const sfx = getSfx(this);
    const glyph = this.add.graphics();
    const paintGlyph = (isOn: boolean): void => {
      glyph.clear();
      glyph.fillStyle(isOn ? PALETTE.ink : PALETTE.muted, 1);
      glyph.fillRoundedRect(-12, -10, 14, 20, 5);
      glyph.fillTriangle(2, -8, 2, 8, 12, 0);
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
    const soundRow = makeButton(this, 0, -panelH / 2 + 398, '', toggleSound, { width: 280, height: 48, radius: 24 });
    glyph.setPosition(-88, 0);
    soundRow.content.add([glyph, wordText, stateText]);
    refreshRow();
    const box = this.add.container(0, 0, [panel, title, stats, heading, keys, actionLine, resumeButton.container, quitButton.container, soundRow.container]);

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
