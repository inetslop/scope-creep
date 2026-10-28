import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { PALETTE } from '../../content/palette';
import type { Profile } from '../../core/profile';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';

/** The card size in pixels; it is scaled down to fit very narrow screens. */
export const PROFILE_CARD_W = 300;
export const PROFILE_CARD_H = 124;

/**
 * The menu's profile card: total coins (coin icon and big number), best wave, runs played, and
 * the last run (only once there is one). The menu is relaunched after every run, so it always
 * shows the saved profile fresh.
 */
export function buildProfileCard(scene: Phaser.Scene, profile: Profile): Phaser.GameObjects.Container {
  const card = makeCard(scene, 0, 0, PROFILE_CARD_W, PROFILE_CARD_H, 20);
  const coin = artScale(scene.add.image(-116, -36, COIN_TEXTURE), 1.4);
  const coins = scene.add.text(-92, -36, String(profile.coins), textStyle(30, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
  const best = scene.add.text(0, 0, `Best wave ${profile.bestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const runs = scene.add.text(0, 24, `Runs ${profile.runsPlayed}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
  const last = scene
    .add.text(0, 48, profile.lastRun ? `Last: wave ${profile.lastRun.wave} · +${profile.lastRun.coins} coins` : '', textStyle(15, PALETTE.faint))
    .setOrigin(0.5);
  return scene.add.container(0, 0, [card, coin, coins, best, runs, last]);
}
