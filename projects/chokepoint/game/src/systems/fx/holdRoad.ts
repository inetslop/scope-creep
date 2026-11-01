import type Phaser from 'phaser';
import { DEPTH, HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { makeCard } from '../../ui/card';
import { textStyle } from '../../ui/text';
import { isNarrow } from '../../ui/hud/hud';
import { viewSize } from '../../ui/display';
import type { FxSystem } from '../FxSystem';

const H = 36; // one line of 14 px: the draft-card language, a size below the banner's 48

/** The first run's wave-1 teach, "Hold the road": a plain white card in the band just below where the wave
 *  banner rests (the boss card's band, free on wave 1) — the banner's follow-up. Pops in (~200 ms, like the
 *  boss card). It is the run's, not an effect: the caller keeps the container and ends it with fadeHoldRoad.
 *  No sound, no input. */
export function buildHoldRoad(fx: FxSystem): Phaser.GameObjects.Container {
  const scene = fx.scene;
  const label = scene.add.text(0, 0, 'Hold the road', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
  const card = makeCard(scene, 0, 0, Math.ceil(label.width) + 32, H, 12);
  const box = scene.add.container(0, 0, [card, label]).setDepth(DEPTH.fx);
  placeHoldRoad(box, viewSize(scene).width);
  box.setScale(0.4);
  scene.tweens.add({ targets: box, scale: 1, duration: 200, ease: 'Back.easeOut' });
  return box;
}

/** Top center, below the banner's resting place (the same band BossCard places at). */
export function placeHoldRoad(box: Phaser.GameObjects.Container, width: number): void {
  box.setPosition(width / 2, (isNarrow(width) ? HUD.top + 24 : 12) + 48 + 8 + H / 2);
}

/** Wave 1 ended or the run is over: the card fades out (~150 ms) and is gone. */
export function fadeHoldRoad(fx: FxSystem, box: Phaser.GameObjects.Container): void {
  fx.scene.tweens.killTweensOf(box);
  fx.scene.tweens.add({ targets: box, alpha: 0, duration: 150, ease: 'Quad.easeIn', onComplete: () => box.destroy(true) });
}
