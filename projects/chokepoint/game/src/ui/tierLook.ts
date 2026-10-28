import type Phaser from 'phaser';
import { artScale, GEM_TEXTURE } from '../art/textures';
import { PALETTE } from '../content/palette';
import type { Tier } from '../content/types';

/** The look a tier gives its cards (the hand cards and the tower-panel rows, matching the draft):
 * the frame color (Common is frameless), the gem row's tint and count, and the tier's name. */

/** The card's frame color: Rare blue, Epic purple, Common none (a plain white card). */
export function tierFrameColor(tier: Tier): number | undefined {
  if (tier === 'rare') return PALETTE.blue;
  if (tier === 'epic') return PALETTE.purple;
  return undefined;
}

/** The tint of the tier's gems: Rare blue, Epic purple, Common light gray. */
export function tierGemColor(tier: Tier): number {
  if (tier === 'rare') return PALETTE.blue;
  if (tier === 'epic') return PALETTE.purple;
  return PALETTE.faint;
}

/** How many gems the tier's row shows: 1, 2 or 3. */
export function tierGemCount(tier: Tier): number {
  return tier === 'common' ? 1 : tier === 'rare' ? 2 : 3;
}

/** The tier's display name, e.g. 'rare' -> 'Rare'. */
export function tierName(tier: Tier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * The card's tier frame: a 2px rounded line just outside it, centered on the card. Common has
 * none (returns undefined). Add it last in its container, so it draws on top of the card.
 */
export function drawTierFrame(scene: Phaser.Scene, tier: Tier, w: number, h: number, radius: number): Phaser.GameObjects.Graphics | undefined {
  const color = tierFrameColor(tier);
  if (color === undefined) return undefined;
  const g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.strokeRoundedRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, radius + 1);
  return g;
}

/** The tier's gem row (10px gems, 12px apart center-to-center), centered on (x, y). */
export function gemRow(scene: Phaser.Scene, tier: Tier, x: number, y: number): Phaser.GameObjects.Container {
  const n = tierGemCount(tier);
  const gems: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < n; i++) gems.push(artScale(scene.add.image((i - (n - 1) / 2) * 12, 0, GEM_TEXTURE)).setTint(tierGemColor(tier)));
  return scene.add.container(x, y, gems);
}
