import type Phaser from 'phaser';
import { LEVEL_AUGMENTS, type LevelAugmentDef } from '../../content/levels';
import { cssColor, PALETTE } from '../../content/palette';
import { capLevelChoice, levelMultiplier, levelMultiplierLabel } from '../../core/levels';
import { makeButton, type Button } from '../../ui/button';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';

/** The card's width: the Iron card's. */
const CARD_W = 220;
const ROW_H = 52;
const ROW_GAP = 6;
const LOCKED_LINE = 'Level — reach wave 30 to unlock';

export interface LevelCard {
  container: Phaser.GameObjects.Container;
  width: number;
  height: number;
  /** The level augments currently on, in the player's order. */
  on: string[];
}

/**
 * The level-augment picker under the Iron card: one chunky row per level augment, each a tap that
 * turns it on or off, capped at the player's level slots. With no slots earned it is one muted
 * line and nothing else. `onToggle` fires with the new set after every tap.
 */
export function buildLevelCard(scene: Phaser.Scene, slots: number, initial: string[], onToggle: (on: string[]) => void): LevelCard {
  const on = capLevelChoice(slots, initial);
  if (slots <= 0) {
    const height = 44;
    const card = makeCard(scene, 0, 0, CARD_W, height, 22);
    const line = scene.add.text(0, 0, LOCKED_LINE, textStyle(14, PALETTE.muted)).setOrigin(0.5);
    return { container: scene.add.container(0, 0, [card, line]), width: CARD_W, height, on };
  }
  const n = LEVEL_AUGMENTS.length;
  const goalShown = slots < n;
  const headerToRows = goalShown ? 32 : 10; // 8 down to the line, 14 for it, 10 to the rows
  const height = 12 + 20 + headerToRows + n * ROW_H + (n - 1) * ROW_GAP + 12;
  const card = makeCard(scene, 0, 0, CARD_W, height, 20);
  const header = scene.add.text(-98, 0, 'Level', textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
  const mul = scene.add.text(98, 0, '', textStyle(14, PALETTE.muted)).setOrigin(1, 0.5);
  let goal: Phaser.GameObjects.Text | undefined;
  if (goalShown) goal = scene.add.text(0, 0, `wave 30 with ${slots} on unlocks the next`, textStyle(12, PALETTE.muted)).setOrigin(0.5);
  const kids: Phaser.GameObjects.GameObject[] = [card, header, mul];
  if (goal) kids.push(goal);
  const rows: { def: LevelAugmentDef; row: Button; state: Phaser.GameObjects.Text }[] = [];
  const toggle = (def: LevelAugmentDef): void => {
    const i = on.indexOf(def.id);
    if (i >= 0) on.splice(i, 1);
    else if (on.length < slots) on.push(def.id); // the cap: a full set adds nothing
    refresh();
    onToggle(on);
  };
  LEVEL_AUGMENTS.forEach((def, i) => {
    const row = makeButton(scene, 0, 0, '', () => toggle(def), { width: CARD_W - 24, height: ROW_H, radius: 14 });
    row.label.setVisible(false);
    const name = scene.add.text(-84, -11, def.name, textStyle(15, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const line = scene.add.text(-84, 11, def.line, textStyle(12, PALETTE.muted, { wordWrap: { width: 132 }, lineSpacing: 2 })).setOrigin(0, 0.5);
    const state = scene.add.text(84, 0, '', textStyle(14, PALETTE.muted)).setOrigin(1, 0.5);
    row.content.add([name, line, state]);
    row.container.setY(-height / 2 + 12 + 20 + headerToRows + ROW_H / 2 + i * (ROW_H + ROW_GAP));
    kids.push(row.container);
    rows.push({ def, row, state });
  });
  header.setY(-height / 2 + 12 + 10);
  mul.setY(header.y);
  if (goal) goal.setY(-height / 2 + 47);
  const refresh = (): void => {
    mul.setText(levelMultiplierLabel(on));
    mul.setColor(cssColor(levelMultiplier(on) > 1 ? PALETTE.ink : PALETTE.muted));
    for (const r of rows) {
      const isOn = on.includes(r.def.id);
      const full = !isOn && on.length >= slots; // off while the slots are full: dim, and read 'full'
      r.row.setEnabled(!full);
      r.state.setText(isOn ? 'On' : full ? 'full' : 'Off');
      r.state.setColor(cssColor(isOn ? PALETTE.ink : PALETTE.muted));
      r.state.setFontStyle(isOn ? 'bold' : 'normal');
    }
  };
  refresh();
  return { container: scene.add.container(0, 0, kids), width: CARD_W, height, on };
}
