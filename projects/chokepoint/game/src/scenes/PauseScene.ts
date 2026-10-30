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

/** The lines shown under "Controls", one per entry; the card lays out however many there are. */
const CONTROLS: string[] = [
  'Space or the big button — start the wave early, +2 gold per second left',
  'F — fast-forward (2x) during waves',
  '1-9 — pick a card from the hand',
  'Sell — the panel\'s line, build phase only',
  '+ / - — zoom the board',
  'Enemies — the shapes and what they do',
  'Waves — the tags and when they come',
  'Bosses — the bosses and their trick',
  'Summary — the run so far: score, combo, by tower',
];

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
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.closePause();
    };
    const quit = (): void => {
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop(SCENES.hud);
      this.scene.stop(SCENES.game);
      this.scene.start(SCENES.menu);
    };

    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const panelW = 360;
    const PAD = 28;
    const GAP_S = 10;
    const GAP_B = 22;
    const maxW = panelW - 32;

    // Group 1: "Paused", the stats line, and "worth" (only after wave 1)
    const title = this.add.text(0, 0, 'Paused', titleStyle(34)).setOrigin(0.5);
    const profile = loadProfile(window.localStorage);
    const starred = profile.bestWave > 0 && game.run.wave >= profile.bestWave;
    const waveWord = game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready';
    const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves, seed: game.run.seed, bgen: game.run.bgen }, cleanWavePay(profile.purchased), game.run.mode === 'iron' ? 2 : 1, game.run.levelHpMul);
    const lineStyle = textStyle(13, PALETTE.muted);
    const waveText = this.add.text(0, 0, waveWord, lineStyle).setOrigin(0, 0.5);
    const restText = this.add.text(0, 0, ` · ${game.run.lives} lives · ${game.run.gold} gold`, lineStyle).setOrigin(0, 0.5);
    const worthText: Phaser.GameObjects.Text | undefined = game.run.wave > 0 ? this.add.text(0, 0, `worth +${coins} coins`, lineStyle).setOrigin(0.5) : undefined;
    // Group 2: "Controls" and its lines, one per entry
    const heading = this.add.text(0, 0, 'Controls', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const lines: Phaser.GameObjects.Text[] = [];
    for (const line of CONTROLS) {
      lines.push(this.add.text(0, 0, line, textStyle(12, PALETTE.muted, { align: 'center' })).setOrigin(0.5));
    }

    // Shrink to fit the card, never below 11 px; wrap only if it is still too wide then
    const fitTo = (texts: Phaser.GameObjects.Text[], start: number, extra = 0): void => {
      let size = start;
      while (texts.reduce((w, t) => w + t.width, extra) > maxW && size > 11) {
        size -= 0.5;
        for (const t of texts) t.setFontSize(size);
      }
    };
    fitTo([waveText, restText], 13, starred ? 21 : 0);
    for (const t of lines) {
      fitTo([t], 12);
      if (t.width > maxW) t.setStyle({ wordWrap: { width: maxW } });
    }

    // Assemble the stats line now that its widths are final
    const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [waveText];
    let x = waveText.width;
    if (starred) {
      kids.push(artScale(this.add.image(x + 13, 1, STAR_TEXTURE)));
      x += 21;
    }
    restText.setX(x);
    kids.push(restText);
    x += restText.width;
    const statsH = waveText.height;
    const stats = this.add.container(-x / 2, 0, kids);

    // Group 3: the action rows, all the same width
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
    const soundText = this.add.text(0, 0, 'Sound on', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const refreshRow = (): void => {
      const isOn = sfx ? !sfx.muted : true;
      paintGlyph(isOn);
      soundText.setText(isOn ? 'Sound on' : 'Sound off');
      soundText.setColor(cssColor(isOn ? PALETTE.ink : PALETTE.muted));
      // glyph spans -12..+8 (20 wide), 8 gap to the word: the pair is centered together
      const leftEdge = -(28 + soundText.width) / 2;
      glyph.setPosition(leftEdge + 12, 0);
      soundText.setPosition(leftEdge + 28, 0);
    };
    const toggleSound = (): void => {
      if (!sfx) return;
      sfx.muted = !sfx.muted;
      saveSound(window.localStorage, !sfx.muted);
      refreshRow();
      if (!sfx.muted) sfx.blip();
    };
    const resumeButton = makeButton(this, 0, 0, 'Resume', resume, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const quitButton = makeButton(this, 0, 0, 'Quit run', quit, { width: 240, height: 52, radius: 26 });
    const soundRow = makeButton(this, 0, 0, '', toggleSound, { width: 240, height: 52, radius: 26 });
    soundRow.content.add([glyph, soundText]);
    refreshRow();
    const showEnemies = (): void => {
      if (closed) return;
      this.scene.launch(SCENES.enemies);
      this.scene.pause(); // the pause card's Escape key must not fire under the reference
    };
    const enemiesButton = makeButton(this, 0, 0, 'Enemies', showEnemies, { width: 240, height: 52, radius: 26 });
    const showWaves = (): void => {
      if (closed) return;
      this.scene.launch(SCENES.waves);
      this.scene.pause(); // the pause card's Escape key must not fire under the reference
    };
    const wavesButton = makeButton(this, 0, 0, 'Waves', showWaves, { width: 240, height: 52, radius: 26 });
    const showBosses = (): void => {
      if (closed) return;
      this.scene.launch(SCENES.bosses);
      this.scene.pause(); // the pause card's Escape key must not fire under the reference
    };
    const bossesButton = makeButton(this, 0, 0, 'Bosses', showBosses, { width: 240, height: 52, radius: 26 });
    const showSummary = (): void => {
      if (closed) return;
      this.scene.launch(SCENES.summary);
      this.scene.pause(); // the pause card's Escape key must not fire under the reference
    };
    const summaryButton = makeButton(this, 0, 0, 'Summary', showSummary, { width: 240, height: 52, radius: 26 });

    // Card height from the content, then place everything top-down in one column
    let h = PAD + title.height + GAP_S + statsH;
    if (worthText) h += worthText.height + GAP_S;
    h += GAP_B + heading.height;
    for (const t of lines) h += GAP_S + t.height;
    h += GAP_B + 56 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + PAD;
    const panelH = Math.ceil(h);
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    let y = -panelH / 2 + PAD;
    const cy = (hh: number): number => {
      const c = y + hh / 2;
      y += hh;
      return c;
    };
    title.setY(cy(title.height));
    y += GAP_S;
    stats.setY(cy(statsH));
    if (worthText) {
      y += GAP_S;
      worthText.setY(cy(worthText.height));
    }
    y += GAP_B;
    heading.setY(cy(heading.height));
    for (const t of lines) {
      y += GAP_S;
      t.setY(cy(t.height));
    }
    y += GAP_B;
    resumeButton.container.setY(cy(56));
    y += GAP_S;
    quitButton.container.setY(cy(52));
    y += GAP_S;
    soundRow.container.setY(cy(52));
    y += GAP_S;
    enemiesButton.container.setY(cy(52));
    y += GAP_S;
    wavesButton.container.setY(cy(52));
    y += GAP_S;
    bossesButton.container.setY(cy(52));
    y += GAP_S;
    summaryButton.container.setY(cy(52));

    const boxKids: Phaser.GameObjects.GameObject[] = [panel, title, stats, heading, ...lines, resumeButton.container, quitButton.container, soundRow.container, enemiesButton.container, wavesButton.container, bossesButton.container, summaryButton.container];
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
