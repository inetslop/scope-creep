import Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';
import { loadBoardName } from '../core/boardName';
import type { RunState } from '../core/run';
import { boardsOn, isBoardError, submitRun, type Place, type Submitted } from '../net/boards';
import { NAME_PICKED, type NameSceneData } from '../scenes/NameScene';
import { SCENES } from '../scenes/keys';
import { makeCard } from './card';
import { textStyle } from './text';

/** "#3 of 57" for a board place. */
const placeText = (p: Place): string => `#${p.rank} of ${p.total}`;

/** The posted line: the places on both boards. */
export const postedText = (s: Submitted): string => `Today ${placeText(s.today)} · Forever ${placeText(s.forever)}`;

/** The boards card's size: as wide as the game-over card, one line tall (a 44 px tap target). */
export const BOARDS_CARD_W = 360;
export const BOARDS_CARD_H = 44;

/**
 * The game-over screen's leaderboard card (net/boards.ts), a small card centered on (0, 0) in
 * `parent`; returns its height, or 0 when there is none. With a name saved it
 * posts the run straight away and shows the places it got; without one it offers "Put it on the
 * boards", which opens the name card (NameScene) and then posts. Nothing at all while the boards
 * are off, or for a run that held no wave. Each run is posted once: the scene is shown once per run.
 */
export function addBoardsCard(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, y: number, run: RunState): number {
  if (!boardsOn() || run.wavesCleared < 1) return 0;
  const card = makeCard(scene, 0, y, BOARDS_CARD_W, BOARDS_CARD_H, 22);
  const line = scene.add.text(0, y, '', textStyle(15, PALETTE.ink, { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
  parent.add([card, line]);
  // The whole card is the tap target while the line offers something (name it, retry).
  let tap: (() => void) | undefined;
  card.setInteractive().on('pointerup', () => tap?.());
  const show = (text: string, color: number, onTap?: () => void): void => {
    line.setText(text).setColor(cssColor(color));
    tap = onTap;
    if (card.input) card.input.cursor = onTap ? 'pointer' : 'default';
  };

  const askName = (note?: string): void => {
    const data: NameSceneData = { from: scene.scene.key, note };
    const picked = (name: string | null): void => {
      scene.game.events.off(NAME_PICKED, picked);
      if (name) post(name);
    };
    scene.game.events.on(NAME_PICKED, picked);
    scene.events.once('shutdown', () => scene.game.events.off(NAME_PICKED, picked));
    scene.scene.launch(SCENES.name, data);
    scene.scene.pause();
  };

  const post = (name: string): void => {
    show('Posting to the boards…', PALETTE.muted);
    void submitRun({ name, waves: run.wavesCleared, kills: run.kills, seed: run.seed, mul: run.levelHpMul }).then((result) => {
      if (!line.active) return; // the card was left meanwhile
      if (!isBoardError(result)) show(postedText(result), PALETTE.ink);
      else if (result === 'name') show('That name isn\'t allowed: pick another ›', PALETTE.red, () => askName('That name isn\'t allowed on the boards. Pick another.'));
      else if (result === 'rate') show('Too many runs this hour: not posted', PALETTE.muted);
      else show('Couldn\'t reach the boards: tap to retry ›', PALETTE.muted, () => post(name));
    });
  };

  const name = loadBoardName(window.localStorage);
  if (name) post(name);
  else show('Put it on the boards ›', PALETTE.ink, () => askName());
  return BOARDS_CARD_H;
}
