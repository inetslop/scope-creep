import Phaser from 'phaser';
import { LEVEL_AUGMENTS } from '../content/levels';
import { PALETTE } from '../content/palette';
import { LEVEL_UNLOCK_WAVE } from '../core/levels';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { textStyle, titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, getSfx, onKey, onResize, SCENES } from './keys';

/** The wave-30 milestone: one card asking to claim the run now or keep going. In ?smoke it keeps going on its own. */
export class MilestoneScene extends Phaser.Scene {
  constructor() {
    super(SCENES.milestone);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.milestone;
    const game = getGameScene(this);
    let closed = false;
    const keepGoing = (): void => {
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.openDraft();
    };
    const claim = (): void => {
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.endRunIntentionally(); // the pause's deliberate end: pays out and opens the "Run ended" card
    };

    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const profile = loadProfile(window.localStorage);
    const slots = profile.levelSlots;
    // This run earns the next slot: every slot is switched on and the set is not full.
    const unlocks = game.run.level.length === slots && slots < LEVEL_AUGMENTS.length;
    const lineText = unlocks ? `Level ${slots + 1} is yours. Claim now to play it.` : `${LEVEL_UNLOCK_WAVE} waves held.`;

    const panelW = 360;
    const PAD = 28;
    const GAP_S = 10;
    const GAP_B = 22;
    const maxW = panelW - 32;

    const title = this.add.text(0, 0, `Wave ${LEVEL_UNLOCK_WAVE}!`, titleStyle(34)).setOrigin(0.5);
    const line = this.add.text(0, 0, lineText, textStyle(15, PALETTE.muted, { align: 'center' })).setOrigin(0.5);
    if (line.width > maxW) line.setStyle({ wordWrap: { width: maxW } });

    const claimButton = makeButton(this, 0, 0, 'Claim rewards', claim, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const keepButton = makeButton(this, 0, 0, 'Keep going', keepGoing, { width: 240, height: 52, radius: 26 });
    claimButton.content.add(this.add.text(-240 / 2 + 12, -56 / 2 + 12, 'C', textStyle(12, PALETTE.faint, { fontStyle: 'bold' })));
    keepButton.content.add(this.add.text(-240 / 2 + 12, -52 / 2 + 12, 'Space', textStyle(12, PALETTE.faint, { fontStyle: 'bold' })));

    // Card height from the content, then place everything top-down in one column.
    const panelH = Math.ceil(PAD + title.height + GAP_S + line.height + GAP_B + 56 + GAP_S + 52 + PAD);
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    let y = -panelH / 2 + PAD;
    const cy = (hh: number): number => {
      const c = y + hh / 2;
      y += hh;
      return c;
    };
    title.setY(cy(title.height));
    y += GAP_S;
    line.setY(cy(line.height));
    y += GAP_B;
    claimButton.container.setY(cy(56));
    y += GAP_S;
    keepButton.container.setY(cy(52));

    const box = this.add.container(0, 0, [panel, title, line, claimButton.container, keepButton.container]);
    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Enter' || e.key === ' ') keepGoing();
      if (e.key === 'c' || e.key === 'C') claim();
    });
    getSfx(this)?.tierChime('epic'); // the milestone chime as the card opens
    if (flags.smoke) this.time.delayedCall(1000, keepGoing);
  }
}
