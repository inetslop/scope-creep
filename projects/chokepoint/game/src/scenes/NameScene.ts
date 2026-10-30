import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { loadBoardName, saveBoardName } from '../core/boardName';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { makeLetterPicker, PICKER_H, PICKER_W } from '../ui/letterPicker';
import { textStyle, titleStyle } from '../ui/text';
import { onKey, onResize, SCENES } from './keys';

/** Fired on game.events when the name card closes: the saved name, or null when cancelled. */
export const NAME_PICKED = 'board-name-picked';

/** What NameScene needs: the scene it was opened over (paused, resumed on close) and an optional line above the letters. */
export interface NameSceneData {
  from: string;
  note?: string;
}

const PANEL_W = 320;
const PAD = 26;

/**
 * The leaderboards' name card: four letters, saved on the device (core/boardName.ts). Opened over
 * the boards (to change it) and over the game-over card (the first time a run is posted).
 */
export class NameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.name);
  }

  create(data: NameSceneData): void {
    uiCamera(this);
    const overlayBefore = hook.overlay;
    hook.overlay = SCENES.name;
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const title = this.add.text(0, 0, 'Your name', titleStyle(28)).setOrigin(0.5);
    const note = this.add.text(0, 0, data.note ?? 'Four letters, shown on the boards.', textStyle(14, PALETTE.muted, { align: 'center', wordWrap: { width: PANEL_W - PAD * 2 } })).setOrigin(0.5);
    const picker = makeLetterPicker(this, loadBoardName(window.localStorage) || 'AAAA');
    const close = (name: string | null): void => {
      hook.overlay = overlayBefore;
      this.game.events.emit(NAME_PICKED, name);
      this.scene.stop();
      this.scene.resume(data.from);
    };
    const save = (): void => {
      saveBoardName(window.localStorage, picker.value());
      close(picker.value());
    };
    const saveButton = makeButton(this, 0, 0, 'Save', save, { width: 240, height: 52, radius: 26, fill: PALETTE.ink });
    const cancel = makeButton(this, 0, 0, 'Cancel', () => close(null), { width: 240, height: 48, radius: 24 });

    // One column: title, note, letters, Save, Cancel; the card's height is its content plus padding.
    const rows: [Phaser.GameObjects.Components.Transform, number, number][] = [
      [title, title.height, 6],
      [note, note.height, 18],
      [picker.container, PICKER_H, 22],
      [saveButton.container, 52, 10],
      [cancel.container, 48, 0],
    ];
    const contentH = rows.reduce((h, [, rowH, after]) => h + rowH + after, 0);
    const panelH = contentH + PAD * 2;
    let y = -panelH / 2 + PAD;
    for (const [obj, rowH, after] of rows) {
      obj.y = y + rowH / 2;
      y += rowH + after;
    }
    const panel = makeCard(this, 0, 0, PANEL_W, panelH, 28);
    const box = this.add.container(0, 0, [panel, title, note, picker.container, saveButton.container, cancel.container]);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / Math.max(PANEL_W, PICKER_W), (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Enter') save();
      else if (e.key === 'Escape') close(null);
      else picker.key(e);
    });
  }
}
