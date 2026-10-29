import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE, STAR_TEXTURE } from '../../art/textures';
import { PALETTE } from '../../content/palette';
import type { Profile } from '../../core/profile';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';
import { buildRecentLine } from './RecentLine';

const PAD = 14;
const LINE_GAP = 10;
const COIN_GAP = 8;

/** The card's width in pixels; it is scaled down to fit very narrow screens. */
export const PROFILE_CARD_W = 300;

export interface ProfileCard {
  container: Phaser.GameObjects.Container;
  width: number;
  height: number;
}

/** The card's muted runs line: the total runs played, plus the average wave of the recent runs once there are two. */
function runsText(profile: Profile): string {
  let text = `runs ${profile.runsPlayed}`;
  if (profile.recent.length >= 2) {
    let sum = 0;
    for (const r of profile.recent) sum += r.wave;
    text += ` · avg ${Math.floor(sum / profile.recent.length)}`;
  }
  return text;
}

/**
 * The menu's profile card, as a centered column: the coin beside its number, the best wave
 * (starred when it is also the last run), the runs line, and the recent runs as the last line.
 * Its height comes from its lines, so the menu lays it out in the column instead of a fixed
 * card height. The menu is relaunched after every run, so it always shows the saved profile fresh.
 */
export function buildProfileCard(scene: Phaser.Scene, profile: Profile): ProfileCard {
  const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 1.4);
  const coins = scene.add.text(0, 0, String(profile.coins), textStyle(30, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
  const pairW = coin.displayWidth + COIN_GAP + coins.width;
  coin.setX(-pairW / 2 + coin.displayWidth / 2);
  coins.setX(-pairW / 2 + coin.displayWidth + COIN_GAP + coins.width / 2);
  const h1 = Math.max(coin.displayHeight, coins.height);

  const best = scene.add.text(0, 0, `Best wave ${profile.bestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const star = artScale(scene.add.image(0, 0, STAR_TEXTURE));
  star.setX(best.width / 2 + 13);
  star.setVisible(profile.lastRun !== null && profile.lastRun.wave === profile.bestWave);
  const h2 = best.height;

  const runs = scene.add.text(0, 0, runsText(profile), textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const h3 = runs.height;

  const recent = buildRecentLine(scene, profile);
  const h4 = recent ? 16 : 0;

  const height = PAD * 2 + h1 + h2 + h3 + h4 + (recent ? 3 : 2) * LINE_GAP;
  const card = makeCard(scene, 0, 0, PROFILE_CARD_W, height, 20);

  let y = -height / 2 + PAD;
  const put = (h: number): number => {
    const c = y + h / 2;
    y += h + LINE_GAP;
    return c;
  };
  const c1 = put(h1);
  coin.setY(c1);
  coins.setY(c1);
  const c2 = put(h2);
  best.setY(c2);
  star.setY(c2 + 1);
  const c3 = put(h3);
  runs.setY(c3);
  if (recent) {
    const c4 = put(h4);
    const s = Math.max(Math.min(1, (PROFILE_CARD_W - PAD * 2) / recent.width), 11 / 12);
    recent.container.setPosition(-(recent.width * s) / 2, c4);
    recent.container.setScale(s);
  }
  return {
    container: scene.add.container(
      0,
      0,
      recent ? [card, coin, coins, best, star, runs, recent.container] : [card, coin, coins, best, star, runs],
    ),
    width: PROFILE_CARD_W,
    height,
  };
}
