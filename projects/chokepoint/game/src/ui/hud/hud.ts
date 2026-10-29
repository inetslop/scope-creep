import type { GameScene } from '../../scenes/GameScene';

/**
 * One element of the HUD (scenes/HudScene.ts lists them): it creates its objects in its
 * constructor, places them in layout() (screen size in CSS pixels, called at start and on every
 * resize), and refreshes them from the game in update() every frame. A new HUD element is a new
 * file here and one line in HudScene.
 */
export interface HudPart {
  layout(width: number, height: number): void;
  update(game: GameScene): void;
}

/** Gap from the screen edge, the hand card size, the round next-wave button. */
export const EDGE = 16;
export const CARD = 84;
export const NEXT_SIZE = 76;

/** The "Send" row under the wave preview card: its height and the gap between the card and it. */
export const SEND_BTN = { height: 48, gap: 10 } as const;

/** Narrow (phone portrait) screens put the next-wave words above its button, so the hand gets the width. */
export const isNarrow = (width: number): boolean => width < 600;
