import type Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../../art/textures';
import { PALETTE } from '../../content/palette';
import type { Profile } from '../../core/profile';
import { textStyle } from '../../ui/text';

/** The built row and its width, so the menu can scale it to fit narrow screens. */
export interface RecentLine {
  container: Phaser.GameObjects.Container;
  width: number;
}

/**
 * The menu's Recent line: `Recent` and your last four runs (wave + coins), most recent first.
 * An entry at your best wave gets the small yellow star to the right of its numbers, drawn
 * like the profile card's star (ProfileCard.ts): STAR_TEXTURE, centre 13 px past the entry's
 * right edge and 1 px below the text centre.
 */
export function buildRecentLine(scene: Phaser.Scene, profile: Profile): RecentLine | null {
  if (!profile.recent.length) return null;
  const style = textStyle(12, PALETTE.muted);
  const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  let x = 0;
  const label = scene.add.text(0, 0, 'Recent', style).setOrigin(0, 0.5);
  kids.push(label);
  x += label.width + 8;
  profile.recent.forEach((r, i) => {
    const entry = scene.add.text(x, 0, `W${r.wave} +${r.coins}`, style).setOrigin(0, 0.5);
    kids.push(entry);
    x += entry.width;
    if (r.wave === profile.bestWave) {
      kids.push(artScale(scene.add.image(x + 13, 1, STAR_TEXTURE)));
      x += 21;
    }
    if (i < profile.recent.length - 1) {
      const sep = scene.add.text(x, 0, ' · ', style).setOrigin(0, 0.5);
      kids.push(sep);
      x += sep.width;
    }
  });
  return { container: scene.add.container(0, 0, kids), width: x };
}
