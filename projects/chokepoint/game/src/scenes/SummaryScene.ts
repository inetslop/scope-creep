import Phaser from 'phaser';
import { artScale, augmentTexture, STAR_TEXTURE } from '../art/textures';
import { boardCode } from '../core/boardCode';
import { towerDps } from '../core/towerDps';
import { loudestWave } from '../core/waveStory';
import { PALETTE } from '../content/palette';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { pipColor } from '../entities/towerLook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getGameScene, getSfx, onResize, SCENES } from './keys';

/**
 * The run so far, off the pause: the claim card's own reads while the run is still going
 * (waves held, clean, stopped, score and its recipe, best combo, the board code, Flawless
 * when earned) and which towers are paying — the end card's by-tower chip with the panel's
 * ≈N/s line, highest kills first. Every value is read once, from the live run and the
 * towers standing; the pause sits dimmed behind and the run stays put, so the page owns no
 * state of its own (a sold tower is simply gone, like on the end card).
 */
export class SummaryScene extends Phaser.Scene {
  private panelW = 340;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.summary);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.summary;
    this.closed = false;
    // The pause stays behind: the shade dims it, and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      hook.overlay = SCENES.pause;
      this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
    };
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
    const towers = getGameScene(this).towers.towers;
    const PAD = 28, GAP = 10, GAP_BIG = 20, CHIP_W = 64, CHIP_H = 34, GAP_X = 8, PER_ROW = 4, ROW_GAP_Y = 10, LINE_H = 14;
    const ENTRY_H = CHIP_H + 4 + LINE_H + 4 + LINE_H; // the chip, the ≈N/s line and the dmg line under it, each with its 4 px gap

    // The claim card's own reads, in the claim card's order: its labels, values and colors.
    // No coins or coin recipe: the pause's worth line already pays them.
    const waves = this.add.text(0, 0, `Waves held ${run.wavesCleared}`, titleStyle(22)).setOrigin(0.5);
    const clean = run.cleanWaves > 0 ? this.add.text(0, 0, `Clean ${run.cleanWaves}`, titleStyle(22, PALETTE.greenDeep)).setOrigin(0.5) : undefined;
    const stopped = this.add.text(0, 0, `Stopped ${run.kills}`, titleStyle(22)).setOrigin(0.5);
    const score = this.add.text(0, 0, `Score ${run.score}`, titleStyle(22)).setOrigin(0.5);
    const recipe = this.add.text(0, 0, `waves +${run.wavesCleared * 100} · stopped +${run.kills}`, titleStyle(16, PALETTE.muted)).setOrigin(0.5);
    const combo = run.bestCombo >= 2 ? this.add.text(0, 0, `Best combo ×${run.bestCombo}`, titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)).setOrigin(0.5) : undefined;
    const board = this.add.text(0, 0, `Board ${boardCode(run.seed)}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
    // The claim card's own rule: every held wave clean, at least one held — so far.
    const flawless = run.wavesCleared === run.cleanWaves && run.wavesCleared > 0;
    const flawlessText = flawless ? this.add.text(0, 0, 'Flawless', titleStyle(22, PALETTE.muted)).setOrigin(0.5) : undefined;
    const flawlessStar = flawless ? artScale(this.add.image(0, 0, STAR_TEXTURE), 1.5) : undefined;
    const readLines: Phaser.GameObjects.Text[] = [waves];
    if (clean) readLines.push(clean);
    readLines.push(stopped, score, recipe);
    if (combo) readLines.push(combo);
    readLines.push(board);
    if (flawlessText) readLines.push(flawlessText);

    // The towers paying, from the same live read the end card's by-tower card uses.
    const entries = towers
      .map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills, damage: Math.floor(t.damageDealt), perSec: Math.floor(towerDps(t.spec, t.rallyRateMul, t.cellMul)) }))
      .sort((a, b) => b.kills - a.kills || (a.first ?? '').localeCompare(b.first ?? ''));
    const entryRows = Math.ceil(entries.length / PER_ROW);
    let heading: Phaser.GameObjects.Text | undefined;
    if (entries.length > 0) {
      // An unused text left at 0,0 would float on the screen: create it only when shown.
      heading = this.add.text(0, 0, 'By tower', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    }

    // The run's story, the claim card's own marks (T0333): one per wave faced — green clean,
    // muted held. There is no lost wave mid-run, so no red mark on this page. Absent while no
    // wave has ended yet (before wave 1, the pause reads "Ready").
    const story = run.story;
    const loudest = loudestWave(story);
    const MARK = 6, MARK_GAP = 3, MARKS_PER_ROW = 14; // the claim card's own mark size and wrap
    const marksRows = Math.ceil(story.length / MARKS_PER_ROW);
    const marksH = marksRows * MARK + Math.max(0, marksRows - 1) * MARK_GAP;
    let storyHeading: Phaser.GameObjects.Text | undefined;
    let legendClean: Phaser.GameObjects.Text | undefined;
    let legendHeld: Phaser.GameObjects.Text | undefined;
    let loudestText: Phaser.GameObjects.Text | undefined;
    if (story.length > 0) {
      storyHeading = this.add.text(0, 0, 'Story', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      legendClean = this.add.text(0, 0, 'clean', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
      legendHeld = this.add.text(0, 0, 'held', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
      // The claim card's own line, shown once any wave has been held: a story of all-clean
      // waves still has a loudestWave (its first record, 0 leaks) and must not print it.
      if (loudest && loudest.leaks > 0) loudestText = this.add.text(0, 0, `loudest · wave ${loudest.wave} · ${loudest.leaks} leaks`, textStyle(13, PALETTE.muted)).setOrigin(0.5);
    }

    // The card grows to its content, top-down: the title, the read lines, then the by-tower rows.
    const title = this.add.text(0, 0, 'Summary', titleStyle(28)).setOrigin(0.5);
    let h = PAD + title.height + GAP;
    readLines.forEach((line, i) => {
      h += line.height + (i === readLines.length - 1 ? 0 : GAP);
    });
    if (story.length > 0 && storyHeading && legendClean && legendHeld) {
      h += GAP_BIG + storyHeading.height + GAP + marksH + 12 + Math.max(legendClean.height, legendHeld.height) + (loudestText ? 10 + loudestText.height : 0);
    }
    if (entries.length > 0 && heading) {
      h += GAP_BIG + heading.height + GAP + entryRows * ENTRY_H + (entryRows - 1) * ROW_GAP_Y;
    }
    h += PAD;
    this.panelH = Math.ceil(h);

    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28), title, ...readLines];
    if (flawlessStar) parts.push(flawlessStar);
    if (heading) parts.push(heading);

    let y = -this.panelH / 2 + PAD;
    const cy = (hh: number): number => {
      const c = y + hh / 2;
      y += hh;
      return c;
    };
    title.setY(cy(title.height));
    for (const line of readLines) {
      y += GAP;
      line.setY(cy(line.height));
    }
    if (flawlessText && flawlessStar) {
      // The star sits right of the word, like the claim card's (the texture is painted 1px low).
      flawlessStar.setY(flawlessText.y + 1);
      flawlessStar.setX(flawlessText.width / 2 + 13);
    }
    if (story.length > 0 && storyHeading && legendClean && legendHeld) {
      y += GAP_BIG;
      storyHeading.setY(cy(storyHeading.height));
      y += GAP;
      const markTopY = y; // top of the marks' first row, in the card's top-down y
      y += marksH;
      y += 12;
      const legendY = cy(Math.max(legendClean.height, legendHeld.height));
      // Marks and legend swatches share one graphics object, drawn in card coordinates
      // (card center is 0,0), the claim card's own mark: 6px rounded squares, gap 3.
      const marks = this.add.graphics();
      story.forEach((r, i) => {
        const row = (i / MARKS_PER_ROW) | 0;
        const inRow = Math.min(MARKS_PER_ROW, story.length - row * MARKS_PER_ROW);
        const w = inRow * MARK + (inRow - 1) * MARK_GAP;
        const x = -w / 2 + (i % MARKS_PER_ROW) * (MARK + MARK_GAP); // left edge; rows center on the card
        marks.fillStyle(r.leaks === 0 ? PALETTE.green : PALETTE.muted);
        marks.fillRoundedRect(x, markTopY + row * (MARK + MARK_GAP), MARK, MARK, 2);
      });
      // The legend is T0333's own, sans "lost": the death wave's mark lives on the claim card only.
      const items = [legendClean, legendHeld];
      const colors = [PALETTE.green, PALETTE.muted];
      const itemW = items.map((t) => MARK + 4 + t.width);
      let lx = -(itemW[0] + 12 + itemW[1]) / 2;
      items.forEach((t, i) => {
        marks.fillStyle(colors[i]);
        marks.fillRoundedRect(lx, legendY - MARK / 2, MARK, MARK, 2);
        t.setPosition(lx + MARK + 4, legendY);
        lx += itemW[i] + 12;
      });
      parts.push(storyHeading, marks, legendClean, legendHeld);
      if (loudestText) {
        y += 10;
        loudestText.setY(cy(loudestText.height));
        parts.push(loudestText);
      }
    }
    if (entries.length > 0 && heading) {
      y += GAP_BIG;
      heading.setY(cy(heading.height));
      y += GAP;
      entries.forEach((t, i) => {
        // Chips in a row the way the end card lays them out; a short row centers on the card.
        const row = Math.floor(i / PER_ROW);
        const inRow = Math.min(PER_ROW, entries.length - row * PER_ROW);
        const rowW = inRow * CHIP_W + (inRow - 1) * GAP_X;
        const x = -rowW / 2 + CHIP_W / 2 + (i % PER_ROW) * (CHIP_W + GAP_X);
        const rowTop = y + row * (ENTRY_H + ROW_GAP_Y);
        const chip = this.add.container(x, rowTop + CHIP_H / 2);
        chip.add(makeCard(this, 0, 0, CHIP_W, CHIP_H, 12));
        if (t.first) chip.add(artScale(this.add.image(-CHIP_W / 2 + 14, 0, augmentTexture(t.first)), 0.7));
        if (t.first && t.tier) {
          const g = this.add.graphics();
          g.fillStyle(pipColor(t.tier), 1);
          g.fillCircle(-10, 8, 4); // tier pip at the icon's bottom right, same r=4 circle as the slot pips
          chip.add(g);
        }
        chip.add(this.add.text(8, 0, `×${t.kills}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5));
        parts.push(chip);
        // The panel's condition: no line for a tower that does no damage per second.
        if (t.perSec >= 1) parts.push(this.add.text(x, rowTop + CHIP_H + 4 + LINE_H / 2, `≈ ${t.perSec}/s`, textStyle(11, PALETTE.muted)).setOrigin(0.5));
        // Its damage term, always shown: a support that deals none reads 0, like its kills line.
        parts.push(this.add.text(x, rowTop + CHIP_H + 4 + LINE_H + 4 + LINE_H / 2, `dmg ${t.damage}`, textStyle(11, PALETTE.muted)).setOrigin(0.5));
      });
    }
    this.box = this.add.container(0, 0, parts);
  }
}
